import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';

export const prerender = false;

/**
 * POST /api/auth/ensure-profile
 *
 * Garantiza que existe un perfil en la tabla `users` para el usuario autenticado.
 * Si no existe, lo crea con role='user' usando supabaseAdmin (service_role).
 *
 * Esto soluciona el problema de perfiles faltantes cuando:
 * - El insert en registro falló silenciosamente
 * - El usuario fue creado desde auth.users pero no tiene fila en public.users
 * - El usuario se registró desde otro flujo (Flutter, etc.)
 *
 * Retorna: { role: string }
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Buscar perfil existente
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile) {
      return new Response(JSON.stringify({ role: profile.role }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Perfil no existe — crearlo con service_role (bypassa RLS)
    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || '',
        role: 'user',
      });

    if (insertError) {
      // Race condition: otro request ya lo creó — leer de nuevo
      const { data: retryProfile } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      return new Response(JSON.stringify({ role: retryProfile?.role || 'user' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.info(`[ENSURE-PROFILE] Perfil creado para ${user.email} (${user.id})`);

    return new Response(JSON.stringify({ role: 'user' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[ENSURE-PROFILE] Error:', error?.message || error);
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
