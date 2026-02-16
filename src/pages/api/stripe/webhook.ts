import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { supabaseAdmin } from '../../../lib/supabase';
import { sendOrderConfirmation } from '../../../lib/email';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || '');

const endpointSecret = import.meta.env.STRIPE_WEBHOOK_SECRET || '';

export const POST: APIRoute = async ({ request }) => {
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return new Response(JSON.stringify({ error: 'No signature' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let event: Stripe.Event;

  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response(JSON.stringify({ error: `Webhook Error: ${err.message}` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Manejar el evento
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleSuccessfulPayment(session);
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.error('Payment failed:', paymentIntent.id);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  try {
    let userId = session.metadata?.user_id || null;
    const promoCode = session.metadata?.promo_code;
    const discountPercent = parseInt(session.metadata?.discount_percent || '0');
    const customerEmail = session.customer_details?.email || null;
    const customerName = session.customer_details?.name || 'Cliente';

    // Si no hay user_id pero sí email, buscar si el email pertenece a un usuario registrado
    if (!userId && customerEmail) {
      const { data: existingUsers } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', customerEmail)
        .limit(1);

      if (existingUsers && existingUsers.length > 0) {
        userId = existingUsers[0].id;
      }
    }

    // Obtener detalles de los line items
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

    // Calcular total
    const total = (session.amount_total || 0) / 100;
    const discountAmount = total * (discountPercent / 100);

    // Crear pedido en Supabase
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: userId || null,
        total: total,
        status: 'pagado',
        promo_code: promoCode || null,
        discount_amount: discountAmount,
        stripe_session_id: session.id,
        payment_intent_id: (session.payment_intent as string) || null,
        shipping_address: JSON.stringify((session as any).shipping_details || null)
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return;
    }

    // Crear items del pedido y actualizar stock
    const orderItemsForEmail: Array<{ name: string; quantity: number; price: number }> = [];

    for (const item of lineItems.data) {
      if (item.description === 'Gastos de envío') continue;

      // Buscar producto por nombre (ya que Stripe no guarda el ID original)
      const { data: product } = await supabaseAdmin
        .from('products')
        .select('id, stock')
        .eq('name', item.description)
        .single();

      if (product) {
        const unitPrice = (item.amount_total || 0) / 100 / (item.quantity || 1);

        // Crear order item
        await supabaseAdmin
          .from('order_items')
          .insert({
            order_id: order.id,
            product_id: product.id,
            quantity: item.quantity || 1,
            price: unitPrice
          });

        // Reducir stock
        await supabaseAdmin
          .from('products')
          .update({ stock: Math.max(0, product.stock - (item.quantity || 1)) })
          .eq('id', product.id);

        orderItemsForEmail.push({
          name: item.description || 'Producto',
          quantity: item.quantity || 1,
          price: unitPrice
        });
      }
    }

    // Generar factura
    const invoiceNumber = await generateInvoiceNumber();

    await supabaseAdmin
      .from('invoices')
      .insert({
        order_id: order.id,
        user_id: userId || null,
        invoice_number: invoiceNumber,
        invoice_type: 'factura',
        subtotal: total / 1.21, // Sin IVA
        tax_amount: total - (total / 1.21),
        total: total
      });

    console.log(`Order ${order.id} created successfully with invoice ${invoiceNumber}`);

    // Enviar email de confirmación
    if (customerEmail) {
      try {
        const shippingDetails = (session as any).shipping_details;
        const shippingAddress = shippingDetails?.address
          ? `${shippingDetails.name || ''}, ${shippingDetails.address.line1 || ''} ${shippingDetails.address.line2 || ''}, ${shippingDetails.address.postal_code || ''} ${shippingDetails.address.city || ''}, ${shippingDetails.address.country || ''}`
          : undefined;

        await sendOrderConfirmation({
          to: customerEmail,
          customerName: customerName,
          orderId: order.id,
          items: orderItemsForEmail,
          subtotal: total + discountAmount,
          discount: discountAmount > 0 ? discountAmount : undefined,
          total: total,
          shippingAddress: shippingAddress
        });
        console.log(`Confirmation email sent to ${customerEmail}`);
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
      }
    }

  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
}

async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = 'FAC';
  
  // Obtener último número
  const { data } = await supabaseAdmin
    .from('invoices')
    .select('invoice_number')
    .like('invoice_number', `${prefix}-${year}-%`)
    .order('invoice_number', { ascending: false })
    .limit(1);

  let sequence = 1;
  if (data && data.length > 0) {
    const lastNumber = data[0].invoice_number;
    const match = lastNumber.match(/(\d+)$/);
    if (match) {
      sequence = parseInt(match[1]) + 1;
    }
  }

  return `${prefix}-${year}-${sequence.toString().padStart(6, '0')}`;
}
