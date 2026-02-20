import type { APIRoute } from 'astro';
import { supabase, supabaseAdmin } from '../../../lib/supabase';

// GET: Obtener estado actual de las ofertas flash
export const GET: APIRoute = async () => {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'ofertas_flash_active')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw error;
    }

    return new Response(JSON.stringify({
      active: data?.value === 'true'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error en ofertas-toggle GET:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST: Activar/Desactivar ofertas flash
export const POST: APIRoute = async ({ request }) => {
  try {
    // Verificar que el usuario es admin
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

    // Verificar rol de admin en la base de datos
    const { data: userData } = await supabase
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

    const body = await request.json();
    const { active } = body;

    // Upsert la configuración
    const { data, error } = await supabase
      .from('site_settings')
      .upsert({ 
        key: 'ofertas_flash_active', 
        value: active.toString(),
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'key' 
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({
      success: true,
      active: data.value === 'true'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error en ofertas-toggle POST:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
