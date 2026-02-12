import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { order_id } = await request.json();

    if (!order_id) {
      return new Response(JSON.stringify({ error: 'Datos inválidos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verificar autenticación con JWT
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

    // Verificar que el pedido pertenece al usuario autenticado y está en estado 'pagado'
    const { data: order } = await supabase
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

    // Llamar a la función que cancela y restaura el stock
    const { error } = await supabase.rpc('cancel_order_and_restore_stock', {
      order_uuid: order_id
    });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error al cancelar pedido:', error);
    return new Response(JSON.stringify({ error: error.message || 'Error al cancelar el pedido' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
