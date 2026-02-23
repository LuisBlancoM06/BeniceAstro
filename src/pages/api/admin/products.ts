import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';

export const prerender = false;

// Verificar admin usando Bearer token (valida JWT server-side)
async function verifyAdmin(request: Request): Promise<boolean> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return false;

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) return false;

  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  return userData?.role === 'admin';
}

// GET: Obtener todos los productos o uno específico (requiere admin)
export const GET: APIRoute = async ({ url, request }) => {
  const headers = { 'Content-Type': 'application/json' };

  if (!(await verifyAdmin(request))) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers });
  }

  const id = url.searchParams.get('id');

  try {
    if (id) {
      const { data, error } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return new Response(JSON.stringify(data), { status: 200, headers });
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return new Response(JSON.stringify(data), { status: 200, headers });
  } catch (error: any) {
    console.error('Error obteniendo productos:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500, headers });
  }
};

// POST: Crear nuevo producto
export const POST: APIRoute = async ({ request }) => {
  const headers = { 'Content-Type': 'application/json' };

  if (!(await verifyAdmin(request))) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers });
  }

  try {
    const body = await request.json();

    // Validaciones de campos obligatorios
    if (!body.name || !body.price || !body.animal_type || !body.category) {
      return new Response(JSON.stringify({ error: 'Faltan campos obligatorios' }), { status: 400, headers });
    }

    // Validar precio
    const price = parseFloat(body.price);
    if (isNaN(price) || price <= 0 || price > 99999) {
      return new Response(JSON.stringify({ error: 'Precio inválido: debe ser un número positivo (máx 99999)' }), { status: 400, headers });
    }

    // Validar stock
    const stock = parseInt(body.stock) || 0;
    if (stock < 0 || stock > 999999) {
      return new Response(JSON.stringify({ error: 'Stock inválido: debe ser un número no negativo' }), { status: 400, headers });
    }

    // Validar sale_price si existe
    let salePrice: number | null = null;
    if (body.sale_price) {
      salePrice = parseFloat(body.sale_price);
      if (isNaN(salePrice) || salePrice <= 0 || salePrice >= price) {
        return new Response(JSON.stringify({ error: 'Precio de oferta inválido: debe ser positivo y menor que el precio original' }), { status: 400, headers });
      }
    }

    // Validar name length
    if (body.name.length > 200) {
      return new Response(JSON.stringify({ error: 'Nombre demasiado largo (máx 200 caracteres)' }), { status: 400, headers });
    }

    // Generar slug si no existe
    if (!body.slug) {
      body.slug = body.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert([{
        name: body.name,
        description: body.description || '',
        price,
        stock,
        image_url: body.image_url || '',
        images: body.images || [],
        animal_type: body.animal_type,
        size: body.size || 'mediano',
        category: body.category,
        age_range: body.age_range || 'adulto',
        on_sale: body.on_sale || false,
        sale_price: salePrice,
        slug: body.slug
      }])
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, data }), { status: 201, headers });
  } catch (error: any) {
    console.error('Error al crear producto:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500, headers });
  }
};

// PUT: Actualizar producto
export const PUT: APIRoute = async ({ request }) => {
  const headers = { 'Content-Type': 'application/json' };

  if (!(await verifyAdmin(request))) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers });
  }

  try {
    const body = await request.json();

    if (!body.id) {
      return new Response(JSON.stringify({ error: 'ID de producto requerido' }), { status: 400, headers });
    }

    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.length > 200) {
        return new Response(JSON.stringify({ error: 'Nombre inválido' }), { status: 400, headers });
      }
      updateData.name = body.name;
    }
    if (body.description !== undefined) updateData.description = body.description;
    if (body.price !== undefined) {
      const price = parseFloat(body.price);
      if (isNaN(price) || price <= 0 || price > 99999) {
        return new Response(JSON.stringify({ error: 'Precio inválido' }), { status: 400, headers });
      }
      updateData.price = price;
    }
    if (body.stock !== undefined) {
      const stock = parseInt(body.stock);
      if (isNaN(stock) || stock < 0 || stock > 999999) {
        return new Response(JSON.stringify({ error: 'Stock inválido' }), { status: 400, headers });
      }
      updateData.stock = stock;
    }
    if (body.image_url !== undefined) updateData.image_url = body.image_url;
    if (body.images !== undefined) updateData.images = body.images;
    if (body.animal_type !== undefined) updateData.animal_type = body.animal_type;
    if (body.size !== undefined) updateData.size = body.size;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.age_range !== undefined) updateData.age_range = body.age_range;
    if (body.on_sale !== undefined) updateData.on_sale = body.on_sale;
    if (body.sale_price !== undefined) {
      if (body.sale_price) {
        const sp = parseFloat(body.sale_price);
        if (isNaN(sp) || sp <= 0) {
          return new Response(JSON.stringify({ error: 'Precio de oferta inválido' }), { status: 400, headers });
        }
        updateData.sale_price = sp;
      } else {
        updateData.sale_price = null;
      }
    }
    if (body.slug !== undefined) updateData.slug = body.slug;

    const { data, error } = await supabaseAdmin
      .from('products')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, data }), { status: 200, headers });
  } catch (error: any) {
    console.error('Error al actualizar producto:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500, headers });
  }
};

// DELETE: Eliminar producto
export const DELETE: APIRoute = async ({ url, request }) => {
  const headers = { 'Content-Type': 'application/json; charset=utf-8' };

  try {
    if (!(await verifyAdmin(request))) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers });
    }

    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID de producto requerido' }), { status: 400, headers });
    }

    console.log(`[DELETE PRODUCT] Intentando eliminar producto ID: ${id}`);

    // Primero verificar si el producto existe
    const { data: product, error: checkError } = await supabaseAdmin
      .from('products')
      .select('id, name')
      .eq('id', id)
      .single();

    if (checkError) {
      console.error('[DELETE PRODUCT] Error verificando producto:', checkError);
      return new Response(JSON.stringify({ error: 'Producto no encontrado' }), { status: 404, headers });
    }

    console.log(`[DELETE PRODUCT] Producto encontrado: ${product.name}`);

    // Desvincular referencias en order_items para no perder historial de pedidos
    // (el frontend ya muestra "Producto eliminado" si products es null)
    console.log('[DELETE PRODUCT] Desvinculando order_items...');
    const { error: orderItemsError } = await supabaseAdmin
      .from('order_items')
      .update({ product_id: null })
      .eq('product_id', id);

    if (orderItemsError) {
      console.error('[DELETE PRODUCT] Error desvinculando order_items:', orderItemsError);
      // Continuamos con la eliminación aunque falle esto
    }

    // Eliminar referencias en tablas secundarias (favorites, reviews, etc.)
    console.log('[DELETE PRODUCT] Eliminando favorites...');
    try { 
      const { error: favError } = await supabaseAdmin.from('favorites').delete().eq('product_id', id);
      if (favError) console.error('[DELETE PRODUCT] Error eliminando favorites:', favError);
    } catch (e) {
      console.error('[DELETE PRODUCT] Excepción eliminando favorites:', e);
    }

    console.log('[DELETE PRODUCT] Eliminando reviews...');
    try { 
      const { error: revError } = await supabaseAdmin.from('reviews').delete().eq('product_id', id);
      if (revError) console.error('[DELETE PRODUCT] Error eliminando reviews:', revError);
    } catch (e) {
      console.error('[DELETE PRODUCT] Excepción eliminando reviews:', e);
    }

    console.log('[DELETE PRODUCT] Eliminando producto...');
    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[DELETE PRODUCT] Error eliminando producto:', error);
      return new Response(JSON.stringify({ 
        error: `Error al eliminar producto: ${error.message}`,
        details: error
      }), { status: 500, headers });
    }

    console.log('[DELETE PRODUCT] Producto eliminado exitosamente');
    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  } catch (error: any) {
    console.error('[DELETE PRODUCT] Error general:', error);
    // Asegurarnos de siempre retornar JSON válido
    const errorMessage = error?.message || 'Error al eliminar producto';
    return new Response(JSON.stringify({ 
      error: errorMessage,
      timestamp: new Date().toISOString()
    }), { status: 500, headers });
  }
};
