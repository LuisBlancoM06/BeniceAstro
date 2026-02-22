import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { access_token, refresh_token } = await request.json();

    if (!access_token || !refresh_token) {
      return new Response(JSON.stringify({ error: 'Tokens requeridos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validar formato básico de JWT (3 partes base64 separadas por punto)
    const jwtRegex = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
    if (!jwtRegex.test(access_token) || !jwtRegex.test(refresh_token)) {
      return new Response(JSON.stringify({ error: 'Formato de token inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verificar que el access_token es válido consultando a Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(access_token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token de acceso inválido o expirado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const maxAge = 60 * 60 * 24 * 7; // 7 días

    cookies.set('sb-access-token', access_token, {
      path: '/',
      maxAge,
      sameSite: 'lax',
      secure: true,
      httpOnly: true,
    });

    cookies.set('sb-refresh-token', refresh_token, {
      path: '/',
      maxAge,
      sameSite: 'lax',
      secure: true,
      httpOnly: true,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error en sesión:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// DELETE: Logout - eliminar cookies
export const DELETE: APIRoute = async ({ cookies }) => {
  cookies.delete('sb-access-token', { path: '/' });
  cookies.delete('sb-refresh-token', { path: '/' });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
