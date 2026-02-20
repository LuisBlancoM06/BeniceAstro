import type { APIRoute } from 'astro';

export const prerender = false;

// RFC 8615: .well-known/change-password should redirect to the actual password change page
export const GET: APIRoute = async () => {
  return new Response(null, {
    status: 302,
    headers: {
      'Location': '/cuenta/perfil',
    },
  });
};
