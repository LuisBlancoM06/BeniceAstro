-- =============================================
-- Migración: Añadir stripe_customer_id a users
-- =============================================

-- 1. Añadir columna stripe_customer_id
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- 2. Índice para búsqueda rápida por stripe_customer_id
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id
  ON public.users(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- 3. Añadir columnas de dirección estructurada si no existen
-- (La tabla actual tiene 'address' como TEXT plano)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS address_line2 TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'ES';

-- 4. Asegurar que la política de UPDATE sigue protegiendo el rol
-- pero permite actualizar stripe_customer_id y campos de dirección
-- (No se necesita cambio: la policy existente ya permite UPDATE de cualquier
--  columna excepto 'role', que está protegido por WITH CHECK)
