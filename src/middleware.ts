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

  // En páginas prerendered (build time), clientAddress y request.headers no están disponibles.
  // Detectamos esto antes de acceder a cualquier header para evitar warnings.
  let clientAddr: string;
  try {
    clientAddr = context.clientAddress || 'desconocida';
  } catch {
    // Prerender — omitir tracking
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
    clientAddr;

  const userAgent = headers.get('user-agent') || '';
  const referer = headers.get('referer') || '';

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
