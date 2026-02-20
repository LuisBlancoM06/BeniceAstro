import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';

// Crear cliente autenticado con el token del usuario para que RLS funcione
function createAuthClient(token: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

// GET - Obtener reseñas de un producto
export const GET: APIRoute = async ({ url }) => {
  try {
    const productId = url.searchParams.get('productId');
    const sort = url.searchParams.get('sort') || 'recent';
    const filterRating = parseInt(url.searchParams.get('rating') || '0');

    if (!productId) {
      return new Response(JSON.stringify({ error: 'productId requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Obtener estadísticas
    const { data: stats } = await supabase.rpc('get_product_review_stats', {
      p_product_id: productId,
    });

    // Obtener reseñas
    let query = supabase
      .from('product_reviews')
      .select('*')
      .eq('product_id', productId);

    if (filterRating > 0) {
      query = query.eq('rating', filterRating);
    }

    switch (sort) {
      case 'helpful':
        query = query.order('helpful_count', { ascending: false });
        break;
      case 'highest':
        query = query.order('rating', { ascending: false });
        break;
      case 'lowest':
        query = query.order('rating', { ascending: true });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    const { data: reviews, error } = await query;

    if (error) {
      console.error('Error obteniendo reseñas:', error);
      return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        reviews: reviews || [],
        stats: stats || { avg_rating: 0, total_reviews: 0, distribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 } },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST - Crear una reseña
export const POST: APIRoute = async ({ request }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Debes iniciar sesión para dejar una reseña' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Sesión no válida' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Cliente autenticado para operaciones con RLS
    const authClient = createAuthClient(token);

    const body = await request.json();
    const { productId, rating, comment } = body;

    // Validaciones
    if (!productId || !rating) {
      return new Response(JSON.stringify({ error: 'El producto y la puntuación son obligatorios' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // SEGURIDAD: Validar que rating es un entero entre 1 y 5
    const parsedRating = parseInt(rating, 10);
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return new Response(JSON.stringify({ error: 'La puntuación debe ser un número entero entre 1 y 5' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (comment && comment.length > 1000) {
      return new Response(JSON.stringify({ error: 'El comentario no puede superar los 1000 caracteres' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Obtener nombre del usuario
    const { data: userData } = await authClient
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const userName = userData?.full_name || user.email?.split('@')[0] || 'Usuario';

    // Verificar si ya tiene reseña para este producto
    const { data: existing } = await authClient
      .from('product_reviews')
      .select('id')
      .eq('product_id', productId)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      // Actualizar reseña existente
      const { data: updated, error: updateError } = await authClient
        .from('product_reviews')
        .update({
          rating: parsedRating,
          comment: comment || '',
          user_name: userName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error actualizando reseña:', updateError);
        return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ review: updated, updated: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Crear nueva reseña
    const { data: review, error: insertError } = await authClient
      .from('product_reviews')
      .insert({
        product_id: productId,
        user_id: user.id,
        user_name: userName,
        rating: parsedRating,
        comment: comment || '',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creando reseña:', insertError);
      return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ review, created: true }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// DELETE - Eliminar una reseña
export const DELETE: APIRoute = async ({ request, url }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Sesión no válida' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Cliente autenticado para operaciones con RLS
    const authClient = createAuthClient(token);

    const reviewId = url.searchParams.get('reviewId');
    if (!reviewId) {
      return new Response(JSON.stringify({ error: 'reviewId requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verificar que es el autor o admin
    const { data: review } = await authClient
      .from('product_reviews')
      .select('user_id')
      .eq('id', reviewId)
      .single();

    if (!review) {
      return new Response(JSON.stringify({ error: 'Reseña no encontrada' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data: userData } = await authClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (review.user_id !== user.id && userData?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'No tienes permisos para eliminar esta reseña' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { error: deleteError } = await authClient
      .from('product_reviews')
      .delete()
      .eq('id', reviewId);

    if (deleteError) {
      console.error('Error eliminando reseña:', deleteError);
      return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
