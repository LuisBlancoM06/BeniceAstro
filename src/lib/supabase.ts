import { createClient } from '@supabase/supabase-js';
import type { AstroCookies } from 'astro';

// ── Env vars ────────────────────────────────────────────────────────────
// En CI / build-time las variables pueden no existir.
// Usamos placeholders válidos para que createClient no falle en módulo-level
// (supabase-js valida URL con `new URL()` y key con truthiness check).
// Las operaciones reales fallarán si se intentan con placeholders, lo cual
// es el comportamiento deseado: fail-fast en runtime, no en build.
const PLACEHOLDER_URL = 'https://placeholder.supabase.co';
const PLACEHOLDER_KEY = 'placeholder-key';

const supabaseUrl  = import.meta.env.PUBLIC_SUPABASE_URL  || PLACEHOLDER_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || PLACEHOLDER_KEY;
const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || '';

const isMissingCreds = supabaseUrl === PLACEHOLDER_URL || supabaseAnonKey === PLACEHOLDER_KEY;

if (isMissingCreds) {
  console.warn('[supabase] Using placeholder credentials – OK during build/CI, NOT for runtime.');
}
if (!supabaseServiceRoleKey) {
  console.warn('[supabase] Missing SUPABASE_SERVICE_ROLE_KEY – admin operations will fail.');
}

// ── Cliente básico (browser / anon) ─────────────────────────────────────
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Cliente admin: FAIL-CLOSED ──────────────────────────────────────────
// Si falta service role key, NO se hace fallback al cliente anónimo
// para evitar bypass accidental de RLS.
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey || PLACEHOLDER_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  }
);

// ── Cliente SSR (lee cookies de Astro) ──────────────────────────────────
export function createServerClient(cookies: AstroCookies) {
  const accessToken  = cookies.get('sb-access-token')?.value;
  const refreshToken = cookies.get('sb-refresh-token')?.value;

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  });

  if (accessToken && refreshToken) {
    client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  return client;
}
