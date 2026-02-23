/**
 * Módulo compartido para procesar pedidos tras un pago exitoso en Stripe.
 *
 * Se invoca desde DOS puntos para garantizar que el pedido SIEMPRE se crea:
 *   1. Stripe webhook (checkout.session.completed) — canal principal
 *   2. Success page (server-side) — fallback si el webhook falla o se retrasa
 *
 * La función es IDEMPOTENTE: si el pedido ya existe (por stripe_session_id),
 * simplemente devuelve su ID sin hacer nada más.
 */
import Stripe from 'stripe';
import { supabaseAdmin } from './supabase';
import { sendOrderConfirmation } from './email';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || '');

/**
 * Garantiza que existe un pedido para la sesión de Stripe dada.
 * Si ya existe, devuelve su ID. Si no, lo crea atómicamente.
 *
 * @returns El orderId (UUID) si todo fue bien, o null si falló.
 */
export async function ensureOrderFromStripeSession(sessionId: string): Promise<string | null> {
  // ── IDEMPOTENCIA ──────────────────────────────────────────
  const { data: existingOrder } = await supabaseAdmin
    .from('orders')
    .select('id')
    .eq('stripe_session_id', sessionId)
    .limit(1);

  if (existingOrder && existingOrder.length > 0) {
    return existingOrder[0].id;
  }

  // ── OBTENER SESIÓN COMPLETA DE STRIPE ─────────────────────
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== 'paid') {
    console.error(`[PROCESS-ORDER] Session ${sessionId} no pagada: ${session.payment_status}`);
    return null;
  }

  // ── RESOLVER USUARIO ──────────────────────────────────────
  let userId = session.metadata?.user_id || null;
  const promoCode = session.metadata?.promo_code || null;
  const discountPercent = parseInt(session.metadata?.discount_percent || '0');
  const customerEmail = session.customer_details?.email || null;
  const customerName = session.customer_details?.name || 'Cliente';

  if (!userId && customerEmail) {
    const { data: existingUsers } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', customerEmail)
      .limit(1);

    if (existingUsers && existingUsers.length > 0) {
      userId = existingUsers[0].id;
    } else {
      // Crear usuario invitado (constraint NOT NULL en orders.user_id)
      const { data: newUser, error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          email: customerEmail,
          full_name: customerName,
          role: 'user',
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (newUser && !userError) {
        userId = newUser.id;
      }
    }
  }

  if (!userId) {
    console.error(`[PROCESS-ORDER] No se pudo resolver user_id para session ${sessionId}`);
    return null;
  }

  // ── OBTENER LINE ITEMS ────────────────────────────────────
  const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, {
    expand: ['data.price.product']
  });

  let discountedSubtotal = 0;
  const rpcItems: Array<{ product_id: string; quantity: number; price: number; name: string }> = [];

  for (const item of lineItems.data) {
    if (item.description === 'Gastos de envío') continue;

    const quantity = item.quantity || 1;
    const itemTotal = (item.amount_total || 0) / 100;
    const unitPrice = itemTotal / quantity;
    discountedSubtotal += itemTotal;

    // Resolver product_id desde metadata de Stripe
    let productId: string | null = null;
    const stripeProduct = item.price?.product;
    if (stripeProduct && typeof stripeProduct === 'object' && 'metadata' in stripeProduct) {
      productId = (stripeProduct as any).metadata?.product_id || null;
    }

    // Fallback: buscar por nombre
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
        quantity,
        price: unitPrice,
        name: item.description || 'Producto'
      });
    } else {
      console.error(`[PROCESS-ORDER] Producto no resuelto: ${item.description}`);
    }
  }

  // ── VALIDAR ITEMS ─────────────────────────────────────────
  if (rpcItems.length === 0) {
    console.error(`[PROCESS-ORDER] Sin items resueltos para session ${sessionId}`);
    try {
      const paymentIntentId = session.payment_intent as string;
      if (paymentIntentId) {
        await stripe.refunds.create({ payment_intent: paymentIntentId });
        console.error(`[PROCESS-ORDER] Refund emitido para ${paymentIntentId}: sin items`);
      }
    } catch (refundError) {
      console.error('[PROCESS-ORDER] CRITICO: Refund fallido:', refundError);
    }
    return null;
  }

  // ── CALCULAR DESCUENTO ────────────────────────────────────
  const subtotalBeforeDiscount = discountPercent > 0
    ? discountedSubtotal / (1 - discountPercent / 100)
    : discountedSubtotal;
  const discountAmount = Math.round((subtotalBeforeDiscount - discountedSubtotal) * 100) / 100;
  const total = (session.amount_total || 0) / 100;

  // ── DIRECCIÓN DE ENVÍO ────────────────────────────────────
  const shippingDetails = (session as any).shipping_details;
  const shippingAddressStr = shippingDetails ? JSON.stringify(shippingDetails) : null;

  // ── CREAR PEDIDO (ATÓMICO: pedido + items + stock) ────────
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
    console.error('[PROCESS-ORDER] RPC error:', rpcError);
    // Reembolsar si el pago ya se cobró pero el pedido no se pudo crear
    try {
      const paymentIntentId = session.payment_intent as string;
      if (paymentIntentId) {
        await stripe.refunds.create({ payment_intent: paymentIntentId });
        console.info(`[PROCESS-ORDER] Refund emitido por fallo en creación de pedido`);
      }
    } catch (refundError) {
      console.error('[PROCESS-ORDER] CRITICO: Refund fallido:', refundError);
    }
    return null;
  }

  // ── ACTUALIZAR CAMPOS STRIPE ──────────────────────────────
  await supabaseAdmin
    .from('orders')
    .update({
      stripe_session_id: session.id,
      payment_intent_id: (session.payment_intent as string) || null
    })
    .eq('id', orderId);

  // ── GENERAR FACTURA ───────────────────────────────────────
  try {
    const invoiceNumber = await generateInvoiceNumber();
    await supabaseAdmin
      .from('invoices')
      .insert({
        order_id: orderId,
        user_id: userId,
        invoice_number: invoiceNumber,
        invoice_type: 'factura',
        subtotal: total / 1.21,
        tax_amount: total - (total / 1.21),
        total: total
      });
  } catch (e) {
    console.error('[PROCESS-ORDER] Error generando factura:', e);
  }

  // ── INCREMENTAR USOS DEL CÓDIGO PROMO ─────────────────────
  if (promoCode) {
    try {
      await supabaseAdmin.rpc('increment_promo_uses', { p_code: promoCode });
    } catch {}
  }

  // ── ENVIAR EMAIL DE CONFIRMACIÓN ──────────────────────────
  if (customerEmail) {
    try {
      const shippingAddress = shippingDetails?.address
        ? `${shippingDetails.name || ''}, ${shippingDetails.address.line1 || ''} ${shippingDetails.address.line2 || ''}, ${shippingDetails.address.postal_code || ''} ${shippingDetails.address.city || ''}, ${shippingDetails.address.country || ''}`
        : undefined;

      await sendOrderConfirmation({
        to: customerEmail,
        customerName,
        orderId,
        items: rpcItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        subtotal: subtotalBeforeDiscount,
        discount: discountAmount > 0 ? discountAmount : undefined,
        total,
        shippingAddress
      });
      console.info(`[PROCESS-ORDER] Email enviado a ${customerEmail}`);
    } catch (e) {
      console.error('[PROCESS-ORDER] Error enviando email:', e);
    }
  }

  // ── SINCRONIZAR STRIPE CUSTOMER ───────────────────────────
  try {
    const { syncCheckoutToCustomer } = await import('./stripe-customer');
    const stripeCustomerId = typeof session.customer === 'string'
      ? session.customer
      : (session.customer as Stripe.Customer)?.id;

    if (stripeCustomerId) {
      await syncCheckoutToCustomer(stripeCustomerId, session);
    }
  } catch (syncError) {
    console.error('[PROCESS-ORDER] Sync error:', syncError);
  }

  console.info(`[PROCESS-ORDER] Pedido ${orderId} creado para session ${sessionId}`);
  return orderId;
}

async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = 'FAC';

  for (let attempt = 0; attempt < 5; attempt++) {
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

    const candidate = `${prefix}-${year}-${(sequence + attempt).toString().padStart(6, '0')}`;

    const { data: existing } = await supabaseAdmin
      .from('invoices')
      .select('invoice_number')
      .eq('invoice_number', candidate)
      .limit(1);

    if (!existing || existing.length === 0) {
      return candidate;
    }
  }

  return `${prefix}-${year}-T${Date.now()}`;
}
