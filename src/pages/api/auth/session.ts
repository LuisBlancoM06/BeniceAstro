import type { APIRoute } from 'astro';

export const prerender = false;

// En desarrollo (HTTP) las cookies Secure no se guardan en el navegador.
// Solo activar Secure en producción (HTTPS).
const isSecure = !import.meta.env.DEV;

export const POST: APIRoute = async ({ request, cookies }) => {
  console.log('🟣 [SESSION] POST /api/auth/session recibido');
  console.log('🟣 [SESSION] isSecure (cookies Secure flag):', isSecure);
  console.log('🟣 [SESSION] DEV mode:', import.meta.env.DEV);
  try {
    const { access_token, refresh_token } = await request.json();

    console.log('🟣 [SESSION] access_token recibido:', !!access_token, '- length:', access_token?.length);
    console.log('🟣 [SESSION] refresh_token recibido:', !!refresh_token, '- length:', refresh_token?.length);

    if (!access_token || !refresh_token) {
      console.error('❌ [SESSION] Tokens vacíos — access:', !!access_token, 'refresh:', !!refresh_token);
      return new Response(JSON.stringify({ error: 'Tokens requeridos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validar formato básico de JWT (3 partes base64url separadas por punto)
    const jwtRegex = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
    const accessValid = jwtRegex.test(access_token);
    const refreshValid = jwtRegex.test(refresh_token);
    console.log('🟣 [SESSION] JWT format valid — access:', accessValid, 'refresh:', refreshValid);

    if (!accessValid || !refreshValid) {
      console.error('❌ [SESSION] Formato JWT inválido');
      return new Response(JSON.stringify({ error: 'Formato de token inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const maxAge = 60 * 60 * 24 * 7; // 7 días

    console.log('🟣 [SESSION] Guardando cookies con: secure=%s, httpOnly=true, sameSite=lax, maxAge=%d', isSecure, maxAge);

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

    console.log('✅ [SESSION] Cookies guardadas correctamente');
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('❌ [SESSION] ERROR:', error?.message || error);
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
