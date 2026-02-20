/**
 * Rate Limiter en memoria para proteger endpoints sensibles.
 * Usa la técnica de sliding window counter.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Limpiar entradas expiradas cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /** Número máximo de peticiones permitidas en la ventana */
  maxRequests: number;
  /** Duración de la ventana en milisegundos */
  windowMs: number;
}

/** Configuraciones predefinidas por tipo de endpoint */
export const RATE_LIMITS = {
  /** Formularios públicos: contacto, newsletter */
  form: { maxRequests: 5, windowMs: 60_000 } as RateLimitConfig,
  /** Auth: login, session */
  auth: { maxRequests: 10, windowMs: 60_000 } as RateLimitConfig,
  /** Búsqueda */
  search: { maxRequests: 30, windowMs: 60_000 } as RateLimitConfig,
  /** APIs generales autenticadas */
  api: { maxRequests: 60, windowMs: 60_000 } as RateLimitConfig,
  /** Stripe webhooks (más permisivo) */
  webhook: { maxRequests: 100, windowMs: 60_000 } as RateLimitConfig,
} as const;

/**
 * Verifica si una petición excede el rate limit.
 * @returns `null` si está dentro del límite, o un Response 429 si lo excede.
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Response | null {
  const now = Date.now();
  const key = identifier;
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return null;
  }

  entry.count++;

  if (entry.count > config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return new Response(
      JSON.stringify({
        error: 'Demasiadas peticiones. Inténtalo de nuevo más tarde.',
        retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(entry.resetAt / 1000).toString(),
        },
      }
    );
  }

  return null;
}

/**
 * Extrae un identificador de rate-limit de una request (IP o IP + path).
 */
export function getRateLimitKey(request: Request, path: string, clientAddress?: string): string {
  const ip =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    clientAddress ||
    'unknown';
  return `${ip}:${path}`;
}
