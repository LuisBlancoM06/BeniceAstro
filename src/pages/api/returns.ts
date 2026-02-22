import type { APIRoute } from 'astro';
import { supabase, supabaseAdmin } from '../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { orderId, reason } = await request.json();

    if (!orderId || !reason) {
      return new Response(JSON.stringify({ error: 'Faltan datos requeridos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validar longitud del motivo
    if (typeof reason !== 'string' || reason.trim().length > 2000) {
      return new Response(JSON.stringify({ error: 'El motivo no puede superar los 2000 caracteres' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verificar autenticación
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

    // Verificar que el pedido pertenece al usuario y está en estado válido
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, status, user_id, total')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: 'Pedido no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Solo se puede devolver si está entregado
    if (order.status !== 'entregado') {
      return new Response(JSON.stringify({ error: 'Solo se pueden devolver pedidos entregados' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verificar que no existe ya una devolución para este pedido
    const { data: existingReturn } = await supabaseAdmin
      .from('returns')
      .select('id')
      .eq('order_id', orderId)
      .single();

    if (existingReturn) {
      return new Response(JSON.stringify({ error: 'Ya existe una solicitud de devolución para este pedido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Crear solicitud de devolución
    const { data: returnData, error: returnError } = await supabaseAdmin
      .from('returns')
      .insert({
        order_id: orderId,
        user_id: user.id,
        reason: reason,
        status: 'solicitada',
        refund_amount: order.total
      })
      .select()
      .single();

    if (returnError) {
      throw returnError;
    }

    return new Response(JSON.stringify({ 
      success: true,
      return: returnData
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error creating return:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
