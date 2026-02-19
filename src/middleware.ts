import { defineMiddleware } from 'astro:middleware';
import { supabaseAdmin } from './lib/supabase';

// Security headers aplicados a TODAS las respuestas
const securityHeaders: Record<string, string> = {
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self), payment=(self)',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://res.cloudinary.com https://*.supabase.co https://media.zooplus.com",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co https://api.stripe.com https://res.cloudinary.com",
    "frame-src 'self' https://js.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; '),
};

/**
 * Anonimiza una dirección IP eliminando el último octeto (IPv4)
 * o los últimos 80 bits (IPv6) para cumplir con la RGPD.
 */
function anonymizeIP(ip: string): string {
  if (!ip || ip === 'desconocida') return 'anonima';
  // IPv4: reemplazar último octeto por 0
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
    return ip.replace(/\.\d{1,3}$/, '.0');
  }
  // IPv6: truncar los últimos segmentos
  if (ip.includes(':')) {
    const parts = ip.split(':');
    if (parts.length > 4) {
      return parts.slice(0, 4).join(':') + '::0';
    }
  }
  return 'anonima';
}

function addSecurityHeaders(response: Response): Response {
  const newHeaders = new Headers(response.headers);
  for (const [key, value] of Object.entries(securityHeaders)) {
    newHeaders.set(key, value);
  }
  // Eliminar headers que exponen información del servidor
  newHeaders.delete('X-Powered-By');
  newHeaders.delete('Server');
  newHeaders.set('Server', 'Benice');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

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
    const response = await next();
    return addSecurityHeaders(response);
  }

  // En páginas prerendered (build time), clientAddress y request.headers no están disponibles.
  // Detectamos esto antes de acceder a cualquier header para evitar warnings.
  let clientAddr: string;
  try {
    clientAddr = context.clientAddress || 'desconocida';
  } catch {
    // Prerender — omitir tracking
    const response = await next();
    return addSecurityHeaders(response);
  }

  // Obtener IP del visitante y anonimizarla inmediatamente (RGPD)
  const headers = context.request.headers;
  const rawIp =
    headers.get('cf-connecting-ip') ||
    headers.get('x-real-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-client-ip') ||
    headers.get('true-client-ip') ||
    clientAddr;

  // Anonimizar la IP antes de cualquier almacenamiento
  const ip = anonymizeIP(rawIp);

  const userAgent = headers.get('user-agent') || '';
  const referer = headers.get('referer') || '';

  // No trackear bots conocidos
  const botPattern = /bot|crawl|spider|slurp|mediapartners|feedfetcher/i;
  if (botPattern.test(userAgent)) {
    const response = await next();
    return addSecurityHeaders(response);
  }

  // Registrar visita antes de continuar (usar supabaseAdmin para bypass RLS)
  try {
    const { error } = await supabaseAdmin.from('visits').insert({
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

  const response = await next();
  return addSecurityHeaders(response);
});
