import { createClient } from '@supabase/supabase-js';
import type { AstroCookies } from 'astro';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';

// Cliente básico para uso en cliente
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente admin que bypasea RLS (para webhooks y operaciones de servidor)
const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
}

if (!supabaseServiceRoleKey) {
  console.warn('WARNING: Missing SUPABASE_SERVICE_ROLE_KEY - admin operations will fail');
}

// Cliente admin: FAIL-CLOSED
// Si falta service role key, NO se hace fallback al cliente anónimo para evitar bypass accidental.
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey || 'MISSING_SUPABASE_SERVICE_ROLE_KEY',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  }
);

// Cliente para SSR que lee cookies de Astro
export function createServerClient(cookies: AstroCookies) {
  const accessToken = cookies.get('sb-access-token')?.value;
  const refreshToken = cookies.get('sb-refresh-token')?.value;

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  });

  // Si hay tokens, establecer la sesión
  if (accessToken && refreshToken) {
    client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  return client;
}
