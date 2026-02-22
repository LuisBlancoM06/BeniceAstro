import type { APIRoute } from 'astro';
import { createServerClient, supabase } from '../../../lib/supabase';
import type { AstroCookies } from 'astro';

export const prerender = false;

// Función helper para verificar si es admin usando cookies (validando JWT server-side)
async function isAdmin(cookies: AstroCookies): Promise<{ isAdmin: boolean; supabaseClient: ReturnType<typeof createServerClient> }> {
  const supabaseClient = createServerClient(cookies);
  // Usar getUser() que valida el JWT contra el servidor de Supabase (no getSession)
  const { data: { user }, error } = await supabaseClient.auth.getUser();

  if (error || !user) {
    return { isAdmin: false, supabaseClient };
  }

  const { data: userData } = await supabaseClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  return { isAdmin: userData?.role === 'admin', supabaseClient };
}

// GET: Obtener todos los productos o uno específico (requiere admin)
export const GET: APIRoute = async ({ url, cookies }) => {
  const { isAdmin: isAdminUser, supabaseClient } = await isAdmin(cookies);
  if (!isAdminUser) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const id = url.searchParams.get('id');

  try {
    if (id) {
      const { data, error } = await supabaseClient
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { data, error } = await supabaseClient
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error obteniendo productos:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST: Crear nuevo producto
export const POST: APIRoute = async ({ request, cookies }) => {
  // Verificar autenticación admin
  const { isAdmin: isAdminUser, supabaseClient } = await isAdmin(cookies);
  if (!isAdminUser) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    
    // Validaciones de campos obligatorios
    if (!body.name || !body.price || !body.animal_type || !body.category) {
      return new Response(JSON.stringify({ error: 'Faltan campos obligatorios' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validar precio
    const price = parseFloat(body.price);
    if (isNaN(price) || price <= 0 || price > 99999) {
      return new Response(JSON.stringify({ error: 'Precio inválido: debe ser un número positivo (máx 99999)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validar stock
    const stock = parseInt(body.stock) || 0;
    if (stock < 0 || stock > 999999) {
      return new Response(JSON.stringify({ error: 'Stock inválido: debe ser un número no negativo' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validar sale_price si existe
    let salePrice: number | null = null;
    if (body.sale_price) {
      salePrice = parseFloat(body.sale_price);
      if (isNaN(salePrice) || salePrice <= 0 || salePrice >= price) {
        return new Response(JSON.stringify({ error: 'Precio de oferta inválido: debe ser positivo y menor que el precio original' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Validar name length
    if (body.name.length > 200) {
      return new Response(JSON.stringify({ error: 'Nombre demasiado largo (máx 200 caracteres)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
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

    const { data, error } = await supabaseClient
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

    return new Response(JSON.stringify({ success: true, data }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error al crear producto:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PUT: Actualizar producto
export const PUT: APIRoute = async ({ request, cookies }) => {
  const { isAdmin: isAdminUser, supabaseClient } = await isAdmin(cookies);
  if (!isAdminUser) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    
    if (!body.id) {
      return new Response(JSON.stringify({ error: 'ID de producto requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const updateData: Record<string, unknown> = {};
    
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.length > 200) {
        return new Response(JSON.stringify({ error: 'Nombre inválido' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      updateData.name = body.name;
    }
    if (body.description !== undefined) updateData.description = body.description;
    if (body.price !== undefined) {
      const price = parseFloat(body.price);
      if (isNaN(price) || price <= 0 || price > 99999) {
        return new Response(JSON.stringify({ error: 'Precio inválido' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      updateData.price = price;
    }
    if (body.stock !== undefined) {
      const stock = parseInt(body.stock);
      if (isNaN(stock) || stock < 0 || stock > 999999) {
        return new Response(JSON.stringify({ error: 'Stock inválido' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
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
          return new Response(JSON.stringify({ error: 'Precio de oferta inválido' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        updateData.sale_price = sp;
      } else {
        updateData.sale_price = null;
      }
    }
    if (body.slug !== undefined) updateData.slug = body.slug;

    const { data, error } = await supabaseClient
      .from('products')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error al actualizar producto:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE: Eliminar producto
export const DELETE: APIRoute = async ({ url, cookies }) => {
  const { isAdmin: isAdminUser, supabaseClient } = await isAdmin(cookies);
  if (!isAdminUser) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const id = url.searchParams.get('id');
    
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID de producto requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { error } = await supabaseClient
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error al eliminar producto:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
