-- =============================================
-- BeniceAstro - Actualización Premium
-- Ejecutar en Supabase SQL Editor
-- =============================================
-- Este script añade las tablas y políticas que faltan
-- para que ambas apps (Astro + Flutter) funcionen
-- correctamente a nivel premium.
-- =============================================

-- =============================================
-- 1. TABLA: contact_messages
-- Usada por: Astro (api/contact.ts), Flutter (contact_screen.dart)
-- =============================================
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'leido', 'respondido')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para contact_messages
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede enviar un mensaje de contacto (INSERT público)
CREATE POLICY "Cualquiera puede enviar mensaje de contacto"
  ON public.contact_messages FOR INSERT
  TO public
  WITH CHECK (
    name IS NOT NULL AND name != ''
    AND email IS NOT NULL AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND subject IS NOT NULL AND subject != ''
    AND message IS NOT NULL AND message != ''
  );

-- Solo admins pueden leer mensajes de contacto
CREATE POLICY "Admins pueden ver mensajes de contacto"
  ON public.contact_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Solo admins pueden actualizar estado de mensajes
CREATE POLICY "Admins pueden actualizar mensajes de contacto"
  ON public.contact_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Índices
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created ON public.contact_messages(created_at DESC);

-- =============================================
-- 2. COLUMNA: payment_intent_id en orders
-- Usada por: webhook.ts, approve-cancellation.ts
-- Si ya existe (producción), este ALTER no hará nada
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'orders'
    AND column_name = 'payment_intent_id'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN payment_intent_id TEXT;
  END IF;
END $$;

-- =============================================
-- 3. POLÍTICA: Admins pueden ver todos los usuarios
-- Necesaria para: panel admin (Flutter y Astro)
-- =============================================
DROP POLICY IF EXISTS "Admins pueden ver todos los usuarios" ON public.users;
CREATE POLICY "Admins pueden ver todos los usuarios"
  ON public.users FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

-- =============================================
-- 4. POLÍTICA: Service role puede insertar usuarios
-- Necesaria para: webhook.ts (crear usuario invitado en guest checkout)
-- El service role ya bypasea RLS, pero por claridad lo incluimos
-- =============================================
DROP POLICY IF EXISTS "Service role puede insertar usuarios" ON public.users;
CREATE POLICY "Service role puede insertar usuarios"
  ON public.users FOR INSERT
  TO service_role
  WITH CHECK (true);

-- =============================================
-- 5. POLÍTICA: Admins pueden insertar pedidos (para webhook con supabaseAdmin)
-- =============================================
DROP POLICY IF EXISTS "Admins pueden crear pedidos" ON public.orders;
CREATE POLICY "Admins pueden crear pedidos"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- =============================================
-- 6. POLÍTICA: Admins pueden insertar order_items
-- =============================================
DROP POLICY IF EXISTS "Admins pueden crear order_items" ON public.order_items;
CREATE POLICY "Admins pueden crear order_items"
  ON public.order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- =============================================
-- 7. COLUMNAS OPCIONALES en users (para Flutter)
-- city, postal_code, avatar_url para perfil completo
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'city'
  ) THEN
    ALTER TABLE public.users ADD COLUMN city TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'postal_code'
  ) THEN
    ALTER TABLE public.users ADD COLUMN postal_code TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.users ADD COLUMN avatar_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'is_subscribed_newsletter'
  ) THEN
    ALTER TABLE public.users ADD COLUMN is_subscribed_newsletter BOOLEAN DEFAULT false;
  END IF;
END $$;

-- =============================================
-- 8. COLUMNA: rating y reviews_count en products
-- Para cachear las estadísticas de reviews
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'rating'
  ) THEN
    ALTER TABLE public.products ADD COLUMN rating DECIMAL(3,1) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'reviews_count'
  ) THEN
    ALTER TABLE public.products ADD COLUMN reviews_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- =============================================
-- 9. TRIGGER: Actualizar rating/reviews_count al insertar/actualizar/eliminar review
-- =============================================
CREATE OR REPLACE FUNCTION update_product_review_stats()
RETURNS TRIGGER AS $$
DECLARE
  target_product_id UUID;
BEGIN
  -- Determinar el product_id afectado
  IF TG_OP = 'DELETE' THEN
    target_product_id := OLD.product_id;
  ELSE
    target_product_id := NEW.product_id;
  END IF;

  -- Actualizar estadísticas del producto
  UPDATE public.products
  SET 
    rating = COALESCE((
      SELECT ROUND(AVG(rating)::numeric, 1)
      FROM public.product_reviews
      WHERE product_id = target_product_id
    ), 0),
    reviews_count = (
      SELECT COUNT(*)
      FROM public.product_reviews
      WHERE product_id = target_product_id
    )
  WHERE id = target_product_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Crear trigger (si no existe)
DROP TRIGGER IF EXISTS trigger_update_product_review_stats ON public.product_reviews;
CREATE TRIGGER trigger_update_product_review_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_product_review_stats();

-- =============================================
-- 10. Inicializar rating/reviews_count para productos existentes
-- =============================================
UPDATE public.products p
SET 
  rating = COALESCE(sub.avg_rating, 0),
  reviews_count = COALESCE(sub.total_reviews, 0)
FROM (
  SELECT 
    product_id,
    ROUND(AVG(rating)::numeric, 1) as avg_rating,
    COUNT(*) as total_reviews
  FROM public.product_reviews
  GROUP BY product_id
) sub
WHERE p.id = sub.product_id;

-- =============================================
-- FIN DE LA ACTUALIZACIÓN PREMIUM
-- =============================================
