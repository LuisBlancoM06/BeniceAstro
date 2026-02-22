import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const prerender = false;

let cachedVersion: string | null = null;
function getVersion(): string {
  if (cachedVersion) return cachedVersion;
  try {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf-8'));
    cachedVersion = pkg.version || '0.0.0';
  } catch {
    cachedVersion = process.env.APP_VERSION || '0.0.0';
  }
  return cachedVersion!;
}

export const GET: APIRoute = async () => {
    const checks: Record<string, string> = {};
    let healthy = true;

    // Supabase connectivity check
    try {
      const { error } = await supabase.from('products').select('id').limit(1);
      checks.database = error ? 'degraded' : 'ok';
      if (error) healthy = false;
    } catch {
      checks.database = 'down';
      healthy = false;
    }

    return new Response(JSON.stringify({
        status: healthy ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
        version: getVersion(),
        service: 'Benice Pet Shop',
        checks,
    }), {
        status: healthy ? 200 : 503,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
    });
};
