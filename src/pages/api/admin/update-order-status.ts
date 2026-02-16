import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { supabase, supabaseAdmin } from '../../../lib/supabase';
import { sendShippingNotification, sendDeliveryConfirmation } from '../../../lib/email';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || '');

const VALID_STATUSES = ['pagado', 'enviado', 'entregado', 'cancelado'];

export const POST: APIRoute = async ({ request }) => {
  try {
    const { order_id, new_status, tracking_number, carrier } = await request.json();

    if (!order_id || !new_status || !VALID_STATUSES.includes(new_status)) {
      return new Response(JSON.stringify({ error: 'Datos invalidos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verificar admin
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

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

    // Si cambia a enviado, requiere tracking_number
    if (new_status === 'enviado' && !tracking_number) {
      return new Response(JSON.stringify({ error: 'Se requiere numero de seguimiento para marcar como enviado' }), {
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

    // Actualizar estado
    const updateData: any = {
      status: new_status,
      updated_at: new Date().toISOString()
    };

    if (tracking_number) {
      updateData.tracking_number = tracking_number;
    }

    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', order_id);

    if (updateError) throw updateError;

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
            trackingNumber: tracking_number,
            carrier: carrier || 'Correos Express'
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
    return new Response(JSON.stringify({ error: error.message || 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
