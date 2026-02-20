import type { APIRoute } from 'astro';
import { supabase, supabaseAdmin } from '../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { order_id, reason } = await request.json();

    if (!order_id || !reason || reason.trim() === '') {
      return new Response(JSON.stringify({ error: 'Debes indicar el pedido y el motivo de cancelacion' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validar longitud del motivo
    if (typeof reason !== 'string' || reason.trim().length > 1000) {
      return new Response(JSON.stringify({ error: 'El motivo no puede superar los 1000 caracteres' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verificar autenticacion con JWT
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

    // Verificar que el pedido pertenece al usuario y esta en estado 'pagado'
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('status')
      .eq('id', order_id)
      .eq('user_id', user.id)
      .single();

    if (!order || order.status !== 'pagado') {
      return new Response(JSON.stringify({ error: 'El pedido no puede ser cancelado' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verificar que no exista una solicitud pendiente
    const { data: existingRequest } = await supabaseAdmin
      .from('cancellation_requests')
      .select('id')
      .eq('order_id', order_id)
      .eq('status', 'pendiente')
      .single();

    if (existingRequest) {
      return new Response(JSON.stringify({ error: 'Ya existe una solicitud de cancelacion pendiente para este pedido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Crear solicitud de cancelacion
    const { error } = await supabaseAdmin
      .from('cancellation_requests')
      .insert({
        order_id: order_id,
        user_id: user.id,
        reason: reason.trim(),
        status: 'pendiente'
      });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, message: 'Solicitud de cancelacion enviada. El equipo la revisara pronto.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error al solicitar cancelacion:', error);
    return new Response(JSON.stringify({ error: 'Error al procesar la solicitud' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
