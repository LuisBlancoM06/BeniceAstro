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
    return new Response(JSON.stringify({ error: 'Error de verificación del webhook' }), {
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
      } else {
        // Crear usuario invitado para cumplir constraint NOT NULL de user_id
        const { data: newUser, error: userError } = await supabaseAdmin
          .from('users')
          .insert({
            email: customerEmail,
            full_name: customerName,
            role: 'user'
          })
          .select('id')
          .single();

        if (newUser && !userError) {
          userId = newUser.id;
        }
      }
    }

    // Si no se pudo resolver el user_id, no podemos crear el pedido (constraint NOT NULL)
    if (!userId) {
      console.error('No se pudo resolver user_id para el pedido. Session:', session.id);
      return;
    }

    // Obtener detalles de los line items (con product expandido para acceder a metadata.product_id)
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
      expand: ['data.price.product']
    });

    // Calcular subtotal descontado (excluyendo envío) y preparar items para el RPC
    let discountedSubtotal = 0;
    const rpcItems: Array<{ product_id: string; quantity: number; price: number; name: string }> = [];

    for (const item of lineItems.data) {
      if (item.description === 'Gastos de envío') continue;

      const quantity = item.quantity || 1;
      const itemTotal = (item.amount_total || 0) / 100;
      const unitPrice = itemTotal / quantity;
      discountedSubtotal += itemTotal;

      // Obtener product_id desde metadata de Stripe (robusto) con fallback por nombre
      let productId: string | null = null;
      const stripeProduct = item.price?.product;
      if (stripeProduct && typeof stripeProduct === 'object' && 'metadata' in stripeProduct) {
        productId = (stripeProduct as any).metadata?.product_id || null;
      }

      // Fallback: buscar por nombre si no hay metadata
      if (!productId) {
        const { data: product } = await supabaseAdmin
          .from('products')
          .select('id')
          .eq('name', item.description)
          .single();
        productId = product?.id || null;
      }

      if (productId) {
        rpcItems.push({
          product_id: productId,
          quantity: quantity,
          price: unitPrice,
          name: item.description || 'Producto'
        });
      } else {
        console.error(`No se encontró producto para: ${item.description}`);
      }
    }

    // Calcular descuento correcto:
    // session.amount_total ya es el monto DESPUÉS del descuento (Stripe aplicó el descuento en unit_amount)
    // Necesitamos el subtotal original (pre-descuento) para calcular el monto real descontado
    const subtotalBeforeDiscount = discountPercent > 0
      ? discountedSubtotal / (1 - discountPercent / 100)
      : discountedSubtotal;
    const discountAmount = Math.round((subtotalBeforeDiscount - discountedSubtotal) * 100) / 100;

    // Total cobrado por Stripe
    const total = (session.amount_total || 0) / 100;

    // Dirección de envío
    const shippingDetails = (session as any).shipping_details;
    const shippingAddressStr = shippingDetails
      ? JSON.stringify(shippingDetails)
      : null;

    // Usar el RPC atómico para crear pedido + items + verificar stock
    // (mismo mecanismo que Flutter y create-order.ts)
    const { data: orderId, error: rpcError } = await supabaseAdmin.rpc('create_order_and_reduce_stock', {
      p_user_id: userId,
      p_total: total,
      p_items: rpcItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price
      })),
      p_promo_code: promoCode || null,
      p_discount_amount: discountAmount,
      p_shipping_address: shippingAddressStr
    });

    if (rpcError) {
      console.error('Error creating order via RPC:', rpcError);
      return;
    }

    // Actualizar el pedido con campos específicos de Stripe
    await supabaseAdmin
      .from('orders')
      .update({
        stripe_session_id: session.id,
        payment_intent_id: (session.payment_intent as string) || null
      })
      .eq('id', orderId);

    // Generar factura
    const invoiceNumber = await generateInvoiceNumber();

    await supabaseAdmin
      .from('invoices')
      .insert({
        order_id: orderId,
        user_id: userId,
        invoice_number: invoiceNumber,
        invoice_type: 'factura',
        subtotal: total / 1.21, // Sin IVA (21%)
        tax_amount: total - (total / 1.21),
        total: total
      });

    console.log(`Order ${orderId} created successfully with invoice ${invoiceNumber}`);

    // Incrementar current_uses del código promocional si se usó
    if (promoCode) {
      const { data: promoData } = await supabaseAdmin
        .from('promo_codes')
        .select('current_uses')
        .eq('code', promoCode)
        .single();

      if (promoData) {
        await supabaseAdmin
          .from('promo_codes')
          .update({ current_uses: (promoData.current_uses || 0) + 1 })
          .eq('code', promoCode);
      }
    }

    // Enviar email de confirmación
    if (customerEmail) {
      try {
        const shippingAddress = shippingDetails?.address
          ? `${shippingDetails.name || ''}, ${shippingDetails.address.line1 || ''} ${shippingDetails.address.line2 || ''}, ${shippingDetails.address.postal_code || ''} ${shippingDetails.address.city || ''}, ${shippingDetails.address.country || ''}`
          : undefined;

        await sendOrderConfirmation({
          to: customerEmail,
          customerName: customerName,
          orderId: orderId,
          items: rpcItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          subtotal: subtotalBeforeDiscount,
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
