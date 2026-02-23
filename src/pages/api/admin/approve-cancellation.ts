import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { supabaseAdmin } from '../../../lib/supabase';
import { sendOrderCancellation, sendCancellationRejected } from '../../../lib/email';

export const prerender = false;

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || '');

export const POST: APIRoute = async ({ request }) => {
  const headers = { 'Content-Type': 'application/json' };

  try {
    // 1. Verificar admin ANTES de parsear body
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401, headers
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401, headers
      });
    }

    // Verificar rol admin
    const { data: adminUser } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!adminUser || adminUser.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 403, headers
      });
    }

    // 2. Ahora sí parsear body
    const { cancellation_id, action, admin_notes } = await request.json();

    // Validar campos requeridos
    if (!cancellation_id || !action || !['aprobar', 'rechazar'].includes(action)) {
      return new Response(JSON.stringify({ error: 'Datos invalidos' }), {
        status: 400, headers
      });
    }

    // Validar UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(cancellation_id)) {
      return new Response(JSON.stringify({ error: 'ID de cancelación inválido' }), {
        status: 400, headers
      });
    }

    // Obtener solicitud de cancelacion con datos del pedido
    const { data: cancellation } = await supabaseAdmin
      .from('cancellation_requests')
      .select('*')
      .eq('id', cancellation_id)
      .eq('status', 'pendiente')
      .single();

    if (!cancellation) {
      return new Response(JSON.stringify({ error: 'Solicitud no encontrada o ya procesada' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener datos del pedido
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('*, users(email, full_name)')
      .eq('id', cancellation.order_id)
      .single();

    if (!order) {
      return new Response(JSON.stringify({ error: 'Pedido no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const customerEmail = order.users?.email;
    const customerName = order.users?.full_name || 'Cliente';

    if (action === 'aprobar') {
      // Verificar que el pedido sigue en estado cancelable
      if (!['pagado', 'enviado'].includes(order.status)) {
        return new Response(JSON.stringify({ error: 'El pedido ya no se puede cancelar (estado actual: ' + order.status + ')' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Obtener payment_intent_id (con fallback a Stripe)
      let paymentIntentId = order.payment_intent_id;

      if (!paymentIntentId && order.stripe_session_id) {
        try {
          const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
          paymentIntentId = session.payment_intent as string;
          // Guardar para futuro uso
          await supabaseAdmin.from('orders')
            .update({ payment_intent_id: paymentIntentId })
            .eq('id', order.id);
        } catch (stripeErr) {
          console.error('Error recuperando session de Stripe:', stripeErr);
        }
      }

      if (!paymentIntentId) {
        return new Response(JSON.stringify({ error: 'No se puede procesar el reembolso: falta referencia de pago' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Procesar reembolso en Stripe
      let refund;
      try {
        refund = await stripe.refunds.create({
          payment_intent: paymentIntentId,
        });
      } catch (stripeError: any) {
        console.error('Error al crear reembolso en Stripe:', stripeError);
        return new Response(JSON.stringify({ error: 'Error al procesar el reembolso' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Restaurar stock y cambiar estado del pedido
      const { error: rpcError } = await supabaseAdmin.rpc('cancel_order_and_restore_stock', {
        order_uuid: order.id
      });

      if (rpcError) {
        console.error('Error restaurando stock:', rpcError);
        // El reembolso ya se proceso, loguear para revision manual
      }

      // Actualizar solicitud de cancelacion
      await supabaseAdmin
        .from('cancellation_requests')
        .update({
          status: 'aprobada',
          admin_notes: admin_notes || null,
          stripe_refund_id: refund.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', cancellation_id);

      // Enviar email de cancelacion al cliente
      if (customerEmail) {
        try {
          await sendOrderCancellation(customerEmail, order.id, customerName);
        } catch (emailError) {
          console.error('Error enviando email de cancelacion:', emailError);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Cancelacion aprobada. Reembolso procesado.',
        refund_id: refund.id
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } else {
      // Rechazar cancelacion
      await supabaseAdmin
        .from('cancellation_requests')
        .update({
          status: 'rechazada',
          admin_notes: admin_notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', cancellation_id);

      // Enviar email de rechazo al cliente
      if (customerEmail) {
        try {
          await sendCancellationRejected(customerEmail, order.id, customerName, admin_notes);
        } catch (emailError) {
          console.error('Error enviando email de rechazo:', emailError);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Solicitud de cancelacion rechazada.'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error: any) {
    console.error('Error procesando cancelacion:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
