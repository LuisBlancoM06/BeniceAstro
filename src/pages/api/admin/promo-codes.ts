import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';

export const prerender = false;

async function verifyAdmin(request: Request): Promise<boolean> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return false;

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return false;

  const { data: userData } = await supabaseAdmin
    .from('users').select('role').eq('id', user.id).single();

  return userData?.role === 'admin';
}

// GET: Listar códigos promocionales
export const GET: APIRoute = async ({ request }) => {
  const headers = { 'Content-Type': 'application/json' };

  if (!(await verifyAdmin(request))) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return new Response(JSON.stringify(data || []), { status: 200, headers });
  } catch (error) {
    console.error('Error listando promo codes:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500, headers });
  }
};

// POST: Crear código promocional
export const POST: APIRoute = async ({ request }) => {
  const headers = { 'Content-Type': 'application/json' };

  if (!(await verifyAdmin(request))) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers });
  }

  try {
    const body = await request.json();
    const { code, discount } = body;

    if (!code || typeof code !== 'string' || code.length > 50) {
      return new Response(JSON.stringify({ error: 'Código inválido' }), { status: 400, headers });
    }

    const discountNum = parseInt(discount);
    if (isNaN(discountNum) || discountNum < 1 || discountNum > 100) {
      return new Response(JSON.stringify({ error: 'Descuento inválido (1-100)' }), { status: 400, headers });
    }

    const { data, error } = await supabaseAdmin
      .from('promo_codes')
      .insert({
        code: code.toUpperCase(),
        discount_percentage: discountNum,
        active: true,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return new Response(JSON.stringify({ error: 'Ya existe un código con ese nombre' }), { status: 400, headers });
      }
      throw error;
    }

    return new Response(JSON.stringify({ success: true, data }), { status: 201, headers });
  } catch (error) {
    console.error('Error creando promo code:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500, headers });
  }
};

// DELETE: Eliminar código promocional
export const DELETE: APIRoute = async ({ url, request }) => {
  const headers = { 'Content-Type': 'application/json' };

  if (!(await verifyAdmin(request))) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers });
  }

  try {
    const id = url.searchParams.get('id');
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID requerido' }), { status: 400, headers });
    }

    const { error } = await supabaseAdmin
      .from('promo_codes')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  } catch (error) {
    console.error('Error eliminando promo code:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500, headers });
  }
};
