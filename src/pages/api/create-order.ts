import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';
import { sendOrderConfirmation } from '../../lib/email';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { user_id, items, total, promo_code, discount_amount, shipping_address, user_email } = await request.json();

    if (!user_id || !items || items.length === 0) {
      return new Response(JSON.stringify({ error: 'Datos inválidos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Llamar a la función de Supabase para crear el pedido
    const { data, error } = await supabase.rpc('create_order_and_reduce_stock', {
      p_user_id: user_id,
      p_total: total,
      p_items: items,
      p_promo_code: promo_code || null,
      p_discount_amount: discount_amount || 0
    });

    if (error) throw error;

    const orderId = data;

    // Incrementar current_uses del código promocional si se usó
    if (promo_code) {
      const { data: promoData } = await supabase
        .from('promo_codes')
        .select('current_uses')
        .eq('code', promo_code)
        .single();

      if (promoData) {
        await supabase
          .from('promo_codes')
          .update({ current_uses: (promoData.current_uses || 0) + 1 })
          .eq('code', promo_code);
      }
    }

    // Enviar email de confirmación
    if (user_email) {
      try {
        await sendOrderConfirmation({
          orderNumber: orderId.toString(),
          customerEmail: user_email,
          customerName: shipping_address?.name || 'Cliente',
          items: items.map((item: any) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            imageUrl: item.image_url
          })),
          subtotal: total + (discount_amount || 0),
          shipping: total >= 49 ? 0 : 4.99,
          discount: discount_amount || 0,
          total: total,
          shippingAddress: shipping_address || {},
          estimatedDelivery: getEstimatedDelivery()
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
    return new Response(JSON.stringify({ error: error.message || 'Error al procesar el pedido' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Calcular fecha estimada de entrega (2-3 días laborables)
function getEstimatedDelivery(): string {
  const date = new Date();
  let daysToAdd = 2;
  
  while (daysToAdd > 0) {
    date.setDate(date.getDate() + 1);
    // Saltar fines de semana
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      daysToAdd--;
    }
  }
  
  return date.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });
}
