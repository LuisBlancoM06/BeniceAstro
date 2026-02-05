import { defineMiddleware } from 'astro:middleware';
import { supabase } from './lib/supabase';

export const onRequest = defineMiddleware(async (context, next) => {
  // No trackear rutas de API, assets estáticos, ni favicon
  const path = context.url.pathname;
  if (
    path.startsWith('/api/') ||
    path.startsWith('/_') ||
    path.startsWith('/styles/') ||
    path.startsWith('/images/') ||
    path.endsWith('.css') ||
    path.endsWith('.js') ||
    path.endsWith('.svg') ||
    path.endsWith('.png') ||
    path.endsWith('.jpg') ||
    path.endsWith('.ico')
  ) {
    return next();
  }

  // Obtener IP real del visitante (orden de prioridad por fiabilidad)
  const headers = context.request.headers;
  const ip =
    headers.get('cf-connecting-ip') ||                          // Cloudflare
    headers.get('x-real-ip') ||                                 // Nginx proxy
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||   // Proxy genérico (primera IP = cliente real)
    headers.get('x-client-ip') ||                               // Apache
    headers.get('true-client-ip') ||                            // Akamai / Cloudflare Enterprise
    context.clientAddress ||                                    // Astro Node adapter
    'desconocida';

  const userAgent = context.request.headers.get('user-agent') || '';
  const referer = context.request.headers.get('referer') || '';

  // Registrar visita antes de continuar
  try {
    const { error } = await supabase.from('visits').insert({
      ip_address: ip,
      page: path,
      user_agent: userAgent,
      referer: referer,
    });
    if (error) {
      console.error('Error tracking visit:', error.message, error.details);
    }
  } catch (e) {
    console.error('Error tracking visit:', e);
  }

  return next();
});
