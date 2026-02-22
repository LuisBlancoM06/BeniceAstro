import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { ensureOrderFromStripeSession } from '../../../lib/process-order';

export const prerender = false;

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

  if (!endpointSecret) {
    console.error('[WEBHOOK] STRIPE_WEBHOOK_SECRET no configurado');
    return new Response(JSON.stringify({ error: 'Webhook no configurado' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let event: Stripe.Event;

  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    console.error('[WEBHOOK] Verificación de firma falló:', err.message);
    return new Response(JSON.stringify({ error: 'Error de verificación del webhook' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Manejar el evento
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      try {
        const orderId = await ensureOrderFromStripeSession(session.id);
        if (orderId) {
          console.info(`[WEBHOOK] Pedido ${orderId} procesado para session ${session.id}`);
        } else {
          console.error(`[WEBHOOK] No se pudo crear pedido para session ${session.id}`);
        }
      } catch (error) {
        console.error('[WEBHOOK] Error procesando pago:', error);
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.error('[WEBHOOK] Pago fallido:', paymentIntent.id);
      break;
    }

    default:
      console.info(`[WEBHOOK] Evento no manejado: ${event.type}`);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
