/**
 * Setup global para tests: mock de variables de entorno
 */
import { vi } from 'vitest';

// Mock de import.meta.env para Astro
vi.stubGlobal('import', {
  meta: {
    env: {
      PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
      PUBLIC_SITE_URL: 'https://benicetiendanimal.victoriafp.online',
      STRIPE_SECRET_KEY: 'sk_test_xxx',
    },
  },
});
