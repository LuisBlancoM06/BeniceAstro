import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { supabaseAdmin } from '../../../lib/supabase';
import { sendShippingNotification, sendDeliveryConfirmation } from '../../../lib/email';

export const prerender = false;

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || '');

const VALID_STATUSES = ['pagado', 'enviado', 'entregado', 'cancelado'];

// Máquina de estados: transiciones permitidas
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pendiente: ['pagado', 'cancelado'],
  pagado: ['enviado', 'cancelado'],
  enviado: ['entregado'],
  entregado: [],
  cancelado: [],
};

export const POST: APIRoute = async ({ request }) => {
  try {
    // 1. Autenticación PRIMERO
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { data: adminUser } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!adminUser || adminUser.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Parsear y validar body
    const { order_id, new_status, tracking_number, carrier } = await request.json();

    if (!order_id || !new_status || !VALID_STATUSES.includes(new_status)) {
      return new Response(JSON.stringify({ error: 'Datos invalidos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validar UUID
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (typeof order_id !== 'string' || !UUID_RE.test(order_id)) {
      return new Response(JSON.stringify({ error: 'ID de pedido inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // tracking_number y carrier son opcionales
    if (tracking_number && (typeof tracking_number !== 'string' || tracking_number.length > 100)) {
      return new Response(JSON.stringify({ error: 'Número de seguimiento inválido (máx 100 caracteres)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (carrier && (typeof carrier !== 'string' || carrier.length > 50)) {
      return new Response(JSON.stringify({ error: 'Transportista inválido (máx 50 caracteres)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener pedido con datos del usuario
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('*, users(email, full_name)')
      .eq('id', order_id)
      .single();

    if (!order) {
      return new Response(JSON.stringify({ error: 'Pedido no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validar transición de estado permitida
    const allowedNext = ALLOWED_TRANSITIONS[order.status] || [];
    if (!allowedNext.includes(new_status)) {
      return new Response(JSON.stringify({ 
        error: `No se puede cambiar de "${order.status}" a "${new_status}". Transiciones permitidas: ${allowedNext.join(', ') || 'ninguna'}` 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Actualizar estado
    const updateData: any = {
      status: new_status,
      updated_at: new Date().toISOString()
    };

    if (tracking_number) {
      updateData.tracking_number = tracking_number;
    }
    if (carrier) {
      updateData.carrier = carrier;
    }

    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', order_id);

    if (updateError) throw updateError;

    // Registrar en historial de estados
    await supabaseAdmin.from('order_status_history').insert({
      order_id,
      old_status: order.status,
      new_status,
      changed_by: user.id,
      notes: tracking_number ? `Tracking: ${tracking_number}` : null,
    });

    // Obtener email del cliente
    let customerEmail: string | null = order.users?.email || null;
    let customerName = order.users?.full_name || 'Cliente';

    // Fallback para pedidos sin usuario (invitados)
    if (!customerEmail && order.stripe_session_id) {
      try {
        const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
        customerEmail = session.customer_details?.email || null;
        customerName = session.customer_details?.name || 'Cliente';
      } catch (e) {
        console.error('Error recuperando datos de Stripe:', e);
      }
    }

    // Enviar email segun el cambio de estado
    if (customerEmail) {
      try {
        if (new_status === 'enviado') {
          await sendShippingNotification({
            to: customerEmail,
            customerName,
            orderId: order.id,
            trackingNumber: tracking_number || 'Pendiente',
            carrier: carrier || 'Pendiente'
          });
        } else if (new_status === 'entregado') {
          await sendDeliveryConfirmation(customerEmail, order.id, customerName);
        }
      } catch (emailError) {
        console.error('Error enviando email de estado:', emailError);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Estado actualizado a "${new_status}"`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error actualizando estado:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
