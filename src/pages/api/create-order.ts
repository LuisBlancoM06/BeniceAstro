import type { APIRoute } from 'astro';
import { supabase, supabaseAdmin } from '../../lib/supabase';
import { sendOrderConfirmation } from '../../lib/email';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { user_id, items, total, promo_code, discount_amount, shipping_address, user_email } = await request.json();

    // Verificar autenticación
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!user_id || !items || items.length === 0) {
      return new Response(JSON.stringify({ error: 'Datos inválidos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Llamar a la función de Supabase para crear el pedido
    const { data, error } = await supabaseAdmin.rpc('create_order_and_reduce_stock', {
      p_user_id: user_id,
      p_total: total,
      p_items: items,
      p_promo_code: promo_code || null,
      p_discount_amount: discount_amount || 0,
      p_shipping_address: shipping_address
        ? JSON.stringify(shipping_address)
        : null
    });

    if (error) throw error;

    const orderId = data;

    // Incrementar current_uses del código promocional si se usó
    if (promo_code) {
      const { data: promoData } = await supabaseAdmin
        .from('promo_codes')
        .select('current_uses')
        .eq('code', promo_code)
        .single();

      if (promoData) {
        await supabaseAdmin
          .from('promo_codes')
          .update({ current_uses: (promoData.current_uses || 0) + 1 })
          .eq('code', promo_code);
      }
    }

    // Enviar email de confirmación
    if (user_email) {
      try {
        await sendOrderConfirmation({
          to: user_email,
          customerName: shipping_address?.name || 'Cliente',
          orderId: orderId.toString(),
          items: items.map((item: any) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          subtotal: total + (discount_amount || 0),
          discount: discount_amount > 0 ? discount_amount : undefined,
          total: total,
          shippingAddress: shipping_address
            ? `${shipping_address.name || ''}, ${shipping_address.line1 || ''} ${shipping_address.line2 || ''}, ${shipping_address.postal_code || ''} ${shipping_address.city || ''}`
            : undefined
        });
      } catch (emailError) {
        console.error('Error al enviar email de confirmación:', emailError);
        // No fallamos el pedido si el email falla
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      order_id: orderId 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error al crear pedido:', error);
    return new Response(JSON.stringify({ error: 'Error al procesar el pedido' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
