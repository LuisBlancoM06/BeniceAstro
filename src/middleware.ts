import { defineMiddleware } from 'astro:middleware';
import { supabaseAdmin } from './lib/supabase';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from './lib/rate-limiter';

// Security headers aplicados a TODAS las respuestas
const securityHeaders: Record<string, string> = {
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  // X-XSS-Protection omitido intencionalmente: obsoleto y puede causar side-channel leaks.
  // Los navegadores modernos usan CSP en su lugar.
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self), payment=(self)',
  'X-DNS-Prefetch-Control': 'on',
  // Relajamos COOP para permitir que herramientas externas (web-check, Lighthouse) puedan
  // hacer screenshots. 'same-origin-allow-popups' mantiene protección pero sin bloquear.
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
  // cross-site permite que las imágenes de CDN (Cloudinary, Unsplash) se carguen correctamente
  'Cross-Origin-Resource-Policy': 'cross-origin',
  'Cross-Origin-Embedder-Policy': 'unsafe-none',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https: http:",
    "font-src 'self' https://fonts.gstatic.com data:",
    "connect-src 'self' https://*.supabase.co https://api.stripe.com https://res.cloudinary.com https://fonts.googleapis.com https://fonts.gstatic.com",
    "frame-src 'self' https://js.stripe.com",
    "frame-ancestors 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; '),
};

/** Mapa de rutas a su configuración de rate-limit */
const rateLimitMap: Array<{ pattern: string | RegExp; config: typeof RATE_LIMITS[keyof typeof RATE_LIMITS] }> = [
  { pattern: '/api/contact', config: RATE_LIMITS.form },
  { pattern: '/api/newsletter', config: RATE_LIMITS.form },
  { pattern: '/api/returns', config: RATE_LIMITS.form },
  { pattern: '/api/cancel-order', config: RATE_LIMITS.form },
  { pattern: '/api/search', config: RATE_LIMITS.search },
  { pattern: '/api/stripe/webhook', config: RATE_LIMITS.webhook },
  { pattern: /^\/api\//, config: RATE_LIMITS.api },
];

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
  const path = context.url.pathname;
  const method = context.request.method.toUpperCase();

  // Redirect trailing slashes to non-trailing (SEO: evita duplicados)
  // Excepto la raíz "/" y rutas de API
  if (path !== '/' && path.endsWith('/') && !path.startsWith('/api/')) {
    const cleanUrl = path.replace(/\/+$/, '') + context.url.search;
    return addSecurityHeaders(new Response(null, {
      status: 301,
      headers: { 'Location': cleanUrl },
    }));
  }

  // --- Rate Limiting ---
  if (path.startsWith('/api/')) {
    // SEGURIDAD: Limitar tamaño del body para prevenir ataques de denegación de servicio
    const contentLength = context.request.headers.get('content-length');
    const MAX_BODY_SIZE = 10 * 1024 * 1024; // 10 MB (por uploads de imágenes)
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
      return addSecurityHeaders(new Response(JSON.stringify({ error: 'Payload demasiado grande' }), {
        status: 413,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      }));
    }

    let clientAddr: string;
    try {
      clientAddr = context.clientAddress || 'unknown';
    } catch {
      clientAddr = 'unknown';
    }

    // Buscar configuración de rate-limit para esta ruta
    const rlMatch = rateLimitMap.find(r =>
      typeof r.pattern === 'string' ? path === r.pattern : r.pattern.test(path)
    );
    if (rlMatch) {
      const key = getRateLimitKey(context.request, path, clientAddr);
      const blocked = checkRateLimit(key, rlMatch.config);
      if (blocked) return addSecurityHeaders(blocked);
    }
  }

  // Protección CSRF/origin para endpoints mutadores
  if (path.startsWith('/api/') && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfExemptPaths = new Set<string>([
      '/api/stripe/webhook',
      '/api/auth/session',
    ]);

    // Los proxies de Google Places y auth son endpoints que ya están protegidos
    // por sus propios mecanismos. Exentos de CSRF para evitar falsos positivos
    // por mismatch de Origin detrás de reverse proxies (Coolify/Traefik/Docker).
    const csrfExemptPrefixes = ['/api/google/', '/api/auth/'];
    const isCsrfExemptByPrefix = csrfExemptPrefixes.some(p => path.startsWith(p));

    if (!csrfExemptPaths.has(path) && !isCsrfExemptByPrefix) {
      const origin = context.request.headers.get('origin');
      const authHeader = context.request.headers.get('authorization');
      const expectedOrigin = context.url.origin;

      // Detrás de un reverse proxy (Coolify/Traefik/Docker), context.url.origin
      // puede ser interno (http://0.0.0.0:4321) mientras el navegador envía el
      // Origin público (https://dominio.com). Aceptamos ambos.
      const publicSiteUrl = (import.meta.env.PUBLIC_SITE_URL || '').replace(/\/$/, '');
      const allowedOrigins = new Set<string>([expectedOrigin]);
      if (publicSiteUrl) {
        allowedOrigins.add(publicSiteUrl);
        // Aceptar también con/sin www
        try {
          const parsed = new URL(publicSiteUrl);
          if (parsed.hostname.startsWith('www.')) {
            allowedOrigins.add(publicSiteUrl.replace('://www.', '://'));
          } else {
            allowedOrigins.add(publicSiteUrl.replace('://', '://www.'));
          }
        } catch { /* URL inválida, ignorar */ }
      }

      if (origin && !allowedOrigins.has(origin)) {
        console.warn(`[CSRF] Origin bloqueado: ${origin} (esperados: ${[...allowedOrigins].join(', ')})`);
        return addSecurityHeaders(new Response(JSON.stringify({ error: 'CSRF blocked: origin inválido' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        }));
      }

      // Si no hay Origin, exigir al menos Authorization para evitar POSTs ciegos.
      if (!origin && !authHeader) {
        return addSecurityHeaders(new Response(JSON.stringify({ error: 'CSRF blocked: origen no verificable' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        }));
      }
    }
  }

  // No trackear rutas de API, assets estáticos, ni favicon
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
