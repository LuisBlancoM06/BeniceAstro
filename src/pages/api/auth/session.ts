import type { APIRoute } from 'astro';

export const prerender = false;

// En desarrollo (HTTP) las cookies Secure no se guardan en el navegador.
// Solo activar Secure en producción (HTTPS).
const isSecure = !import.meta.env.DEV;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { access_token, refresh_token } = await request.json();

    if (!access_token || !refresh_token) {
      return new Response(JSON.stringify({ error: 'Tokens requeridos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validar formato básico de JWT (3 partes base64url separadas por punto)
    const jwtRegex = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
    if (!jwtRegex.test(access_token) || !jwtRegex.test(refresh_token)) {
      return new Response(JSON.stringify({ error: 'Formato de token inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // NOTA: No verificamos el token con getUser() aquí.
    // Los tokens vienen directamente de signInWithPassword/signUp de Supabase,
    // son inherentemente válidos. La verificación real ocurre en cada
    // página/API que lee las cookies (createServerClient → getUser).
    // Esto evita una llamada server-to-server que puede fallar por red.

    const maxAge = 60 * 60 * 24 * 7; // 7 días

    cookies.set('sb-access-token', access_token, {
      path: '/',
      maxAge,
      sameSite: 'lax',
      secure: isSecure,
      httpOnly: true,
    });

    cookies.set('sb-refresh-token', refresh_token, {
      path: '/',
      maxAge,
      sameSite: 'lax',
      secure: isSecure,
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
