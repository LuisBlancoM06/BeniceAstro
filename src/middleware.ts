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

  // Obtener IP del visitante
  const ip =
    context.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    context.request.headers.get('x-real-ip') ||
    context.clientAddress ||
    'desconocida';

  const userAgent = context.request.headers.get('user-agent') || '';
  const referer = context.request.headers.get('referer') || '';

  // No bloquear la respuesta — insertar en background
  try {
    supabase.from('visits').insert({
      ip_address: ip,
      page: path,
      user_agent: userAgent,
      referer: referer,
    }).then(() => {});
  } catch (e) {
    // Silenciar errores de tracking para no afectar la página
    console.error('Error tracking visit:', e);
  }

  return next();
});
