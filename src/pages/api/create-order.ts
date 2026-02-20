import type { APIRoute } from 'astro';
import { supabase, supabaseAdmin } from '../../lib/supabase';
import { sendOrderConfirmation } from '../../lib/email';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { items, promo_code, shipping_address } = await request.json();

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

    if (!items || !Array.isArray(items) || items.length === 0 || items.length > 50) {
      return new Response(JSON.stringify({ error: 'Datos inválidos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // SEGURIDAD: Usar siempre el ID del usuario autenticado, nunca el del body
    const secureUserId = authUser.id;

    // SEGURIDAD: Recalcular precios desde la base de datos — NUNCA confiar en el cliente
    const productIds = items.map((item: any) => item.product_id || item.id).filter(Boolean);
    const { data: dbProducts, error: dbError } = await supabaseAdmin
      .from('products')
      .select('id, name, price, sale_price, on_sale, stock')
      .in('id', productIds);

    if (dbError || !dbProducts || dbProducts.length === 0) {
      return new Response(JSON.stringify({ error: 'Error al verificar productos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const productMap = new Map(dbProducts.map(p => [p.id, p]));

    // Validar stock y construir items con precios reales
    const verifiedItems: Array<{ product_id: string; quantity: number; price: number; name: string }> = [];
    for (const item of items) {
      const pid = item.product_id || item.id;
      const dbProduct = productMap.get(pid);
      if (!dbProduct) {
        return new Response(JSON.stringify({ error: `Producto no encontrado: ${pid}` }), {
          status: 400, headers: { 'Content-Type': 'application/json' }
        });
      }
      const quantity = Math.max(1, Math.min(parseInt(item.quantity) || 1, 99));
      if (dbProduct.stock < quantity) {
        return new Response(JSON.stringify({ error: `Stock insuficiente: ${dbProduct.name}` }), {
          status: 400, headers: { 'Content-Type': 'application/json' }
        });
      }
      const unitPrice = (dbProduct.on_sale && dbProduct.sale_price) ? dbProduct.sale_price : dbProduct.price;
      verifiedItems.push({ product_id: dbProduct.id, quantity, price: unitPrice, name: dbProduct.name });
    }

    // Calcular total server-side
    let subtotal = verifiedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Validar código promocional server-side
    let discountAmount = 0;
    let verifiedPromoCode: string | null = null;
    if (promo_code && typeof promo_code === 'string') {
      const { data: promo } = await supabaseAdmin
        .from('promo_codes')
        .select('code, discount_percentage, expires_at, max_uses, current_uses')
        .eq('code', promo_code.toUpperCase().trim())
        .eq('active', true)
        .single();

      if (promo) {
        const isExpired = promo.expires_at && new Date(promo.expires_at) < new Date();
        const isMaxedOut = promo.max_uses && (promo.current_uses || 0) >= promo.max_uses;
        if (!isExpired && !isMaxedOut) {
          discountAmount = Math.round(subtotal * promo.discount_percentage / 100 * 100) / 100;
          verifiedPromoCode = promo.code;
        }
      }
    }

    const total = Math.round((subtotal - discountAmount) * 100) / 100;

    // Llamar a la función de Supabase para crear el pedido
    const { data, error } = await supabaseAdmin.rpc('create_order_and_reduce_stock', {
      p_user_id: secureUserId,
      p_total: total,
      p_items: verifiedItems.map(i => ({ product_id: i.product_id, quantity: i.quantity, price: i.price })),
      p_promo_code: verifiedPromoCode,
      p_discount_amount: discountAmount,
      p_shipping_address: shipping_address
        ? JSON.stringify(shipping_address)
        : null
    });

    if (error) throw error;

    const orderId = data;

    // Incrementar current_uses del código promocional atómicamente
    if (verifiedPromoCode) {
      await supabaseAdmin.rpc('increment_promo_uses', { p_code: verifiedPromoCode });
    }

    // SEGURIDAD: Usar email del usuario autenticado, nunca del body
    const secureEmail = authUser.email;
    if (secureEmail) {
      try {
        await sendOrderConfirmation({
          to: secureEmail,
          customerName: shipping_address?.name || 'Cliente',
          orderId: orderId.toString(),
          items: verifiedItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          subtotal,
          discount: discountAmount > 0 ? discountAmount : undefined,
          total,
          shippingAddress: shipping_address
            ? `${shipping_address.name || ''}, ${shipping_address.line1 || ''} ${shipping_address.line2 || ''}, ${shipping_address.postal_code || ''} ${shipping_address.city || ''}`
            : undefined
        });
      } catch (emailError) {
        console.error('Error al enviar email de confirmación:', emailError);
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
