import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';
import { createServerClient } from '../../../lib/supabase';

export const prerender = false;

async function verifyAdmin(cookies: any): Promise<boolean> {
  const supabase = await createServerClient(cookies);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return false;

  const { data: userData } = await supabaseAdmin
    .from('users').select('role').eq('id', user.id).single();

  return userData?.role === 'admin';
}

// POST: Guardar configuración (upsert múltiples settings)
export const POST: APIRoute = async ({ request, cookies }) => {
  const headers = { 'Content-Type': 'application/json' };

  if (!(await verifyAdmin(cookies))) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers });
  }

  try {
    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return new Response(JSON.stringify({ error: 'Datos inválidos' }), { status: 400, headers });
    }

    // Upsert cada setting
    for (const [key, value] of Object.entries(settings)) {
      if (typeof key !== 'string' || key.length > 100) continue;
      const val = String(value ?? '').slice(0, 1000);

      const { error } = await supabaseAdmin
        .from('settings')
        .upsert({ key, value: val }, { onConflict: 'key' });

      if (error) {
        console.error(`Error guardando setting ${key}:`, error);
        return new Response(JSON.stringify({ error: `Error guardando ${key}` }), { status: 500, headers });
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  } catch (error) {
    console.error('Error en settings:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500, headers });
  }
};
