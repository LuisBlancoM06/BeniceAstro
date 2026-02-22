import type { APIRoute } from 'astro';
import { supabase, supabaseAdmin } from '../../../lib/supabase';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    // Verificar autenticación de administrador
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

    // Verificar rol de admin
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'No tienes permisos de administrador' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener fecha del inicio del mes actual
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Ventas totales del mes
    const { data: salesData } = await supabaseAdmin
      .from('orders')
      .select('total')
      .in('status', ['pagado', 'enviado', 'entregado'])
      .gte('created_at', startOfMonth);

    const totalSalesMonth = salesData?.reduce((sum, order) => sum + parseFloat(order.total), 0) || 0;

    // 2. Pedidos pendientes
    const { count: pendingOrders } = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pendiente');

    // 3. Total de pedidos del mes
    const { count: totalOrdersMonth } = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth);

    // 4. Nuevos clientes del mes
    const { count: newCustomersMonth } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth);

    // 5. Producto más vendido (del mes)
    const { data: orderItems } = await supabaseAdmin
      .from('order_items')
      .select(`
        product_id,
        quantity,
        products (name)
      `)
      .gte('created_at', startOfMonth);

    // Agrupar por producto
    const productSales: Record<string, { name: string; quantity: number }> = {};
    orderItems?.forEach(item => {
      const productId = item.product_id;
      const productName = (item.products as any)?.name || 'Desconocido';
      if (!productSales[productId]) {
        productSales[productId] = { name: productName, quantity: 0 };
      }
      productSales[productId].quantity += item.quantity;
    });

    const topProduct = Object.values(productSales).sort((a, b) => b.quantity - a.quantity)[0] || null;

    // 6. Ventas de los últimos 7 días para el gráfico
    const { data: weeklyOrders } = await supabaseAdmin
      .from('orders')
      .select('total, created_at')
      .in('status', ['pagado', 'enviado', 'entregado'])
      .gte('created_at', startOfWeek)
      .order('created_at', { ascending: true });

    // Agrupar por día
    const salesByDay: Record<string, number> = {};
    const labels: string[] = [];
    
    // Inicializar los últimos 7 días con 0
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayLabel = date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
      salesByDay[dateStr] = 0;
      labels.push(dayLabel);
    }

    // Rellenar con datos reales
    weeklyOrders?.forEach(order => {
      const dateStr = order.created_at.split('T')[0];
      if (salesByDay.hasOwnProperty(dateStr)) {
        salesByDay[dateStr] += parseFloat(order.total);
      }
    });

    const chartData = Object.values(salesByDay);

    // 7. Stock bajo (menos de 10 unidades)
    const { data: lowStockProducts, count: lowStockCount } = await supabaseAdmin
      .from('products')
      .select('id, name, stock', { count: 'exact' })
      .lt('stock', 10)
      .order('stock', { ascending: true })
      .limit(5);

    // 8. Últimos pedidos
    const { data: recentOrders } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        total,
        status,
        created_at,
        users (email, full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    return new Response(JSON.stringify({
      kpis: {
        totalSalesMonth: totalSalesMonth.toFixed(2),
        pendingOrders: pendingOrders || 0,
        totalOrdersMonth: totalOrdersMonth || 0,
        newCustomersMonth: newCustomersMonth || 0,
        topProduct: topProduct,
        lowStockCount: lowStockCount || 0
      },
      chart: {
        labels,
        data: chartData
      },
      lowStockProducts: lowStockProducts || [],
      recentOrders: recentOrders || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error en analytics:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
