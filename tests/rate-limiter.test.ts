/**
 * Tests del Rate Limiter
 */
import { describe, it, expect } from 'vitest';
import { checkRateLimit, type RateLimitConfig } from '../src/lib/rate-limiter';

describe('Rate Limiter', () => {
  const config: RateLimitConfig = {
    maxRequests: 3,
    windowMs: 1000,
  };

  it('permite peticiones dentro del límite', () => {
    const key = `test-allow-${Date.now()}`;
    expect(checkRateLimit(key, config)).toBeNull();
    expect(checkRateLimit(key, config)).toBeNull();
    expect(checkRateLimit(key, config)).toBeNull();
  });

  it('bloquea la 4ª petición cuando max es 3', () => {
    const key = `test-block-${Date.now()}`;
    checkRateLimit(key, config);
    checkRateLimit(key, config);
    checkRateLimit(key, config);
    const blocked = checkRateLimit(key, config);
    expect(blocked).not.toBeNull();
    expect(blocked!.status).toBe(429);
  });

  it('devuelve headers correctos en respuesta 429', async () => {
    const key = `test-headers-${Date.now()}`;
    for (let i = 0; i < 3; i++) checkRateLimit(key, config);
    const blocked = checkRateLimit(key, config)!;
    
    expect(blocked.headers.get('Retry-After')).toBeTruthy();
    expect(blocked.headers.get('X-RateLimit-Limit')).toBe('3');
    expect(blocked.headers.get('X-RateLimit-Remaining')).toBe('0');
    
    const body = await blocked.json();
    expect(body.error).toContain('Demasiadas peticiones');
    expect(body.retryAfter).toBeGreaterThan(0);
  });

  it('permite peticiones con claves diferentes', () => {
    const key1 = `test-diff-a-${Date.now()}`;
    const key2 = `test-diff-b-${Date.now()}`;
    
    for (let i = 0; i < 3; i++) checkRateLimit(key1, config);
    // key1 bloqueada
    expect(checkRateLimit(key1, config)).not.toBeNull();
    // key2 sigue libre
    expect(checkRateLimit(key2, config)).toBeNull();
  });

  it('resetea después de que la ventana expire', async () => {
    const shortConfig: RateLimitConfig = { maxRequests: 1, windowMs: 100 };
    const key = `test-reset-${Date.now()}`;
    
    checkRateLimit(key, shortConfig);
    expect(checkRateLimit(key, shortConfig)).not.toBeNull(); // bloqueada
    
    await new Promise(resolve => setTimeout(resolve, 150));
    expect(checkRateLimit(key, shortConfig)).toBeNull(); // reseteada
  });
});
