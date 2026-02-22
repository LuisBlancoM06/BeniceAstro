-- =============================================
-- MIGRACIÓN PENDIENTE — Ejecutar en Supabase SQL Editor
-- https://supabase.com/dashboard → SQL Editor → New Query → Pegar → Run
-- Es SEGURO ejecutar varias veces (idempotente)
-- =============================================

-- 1) Columnas que puede que falten en la tabla users
-- (El registro necesita estas columnas para guardar la dirección)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address_line1 TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address_line2 TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'ES';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_subscribed_newsletter BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- 2) Columnas que puede que falten en orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS carrier TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_intent_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3) Constraint UNIQUE que puede faltar en stripe_customer_id
-- (No se puede usar IF NOT EXISTS para constraints, hay que verificar)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_stripe_customer_id_key'
  ) THEN
    BEGIN
      ALTER TABLE public.users ADD CONSTRAINT users_stripe_customer_id_key UNIQUE (stripe_customer_id);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- 4) Índices que pueden faltar
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id
  ON public.users(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_geo
  ON public.users(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON public.orders(stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- 5) Tablas que pueden no existir aún
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID NOT NULL REFERENCES public.orders(id),
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES public.users(id),
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order
  ON public.order_status_history(order_id, created_at DESC);

ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- Políticas de order_status_history (DROP + CREATE para evitar errores de duplicado)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users pueden ver historial de sus pedidos" ON public.order_status_history;
  CREATE POLICY "Users pueden ver historial de sus pedidos"
    ON public.order_status_history FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_status_history.order_id AND orders.user_id = auth.uid()));
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins pueden ver todo el historial" ON public.order_status_history;
  CREATE POLICY "Admins pueden ver todo el historial"
    ON public.order_status_history FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins pueden insertar historial" ON public.order_status_history;
  CREATE POLICY "Admins pueden insertar historial"
    ON public.order_status_history FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Service role puede insertar historial" ON public.order_status_history;
  CREATE POLICY "Service role puede insertar historial"
    ON public.order_status_history FOR INSERT TO service_role WITH CHECK (true);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.invoices (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id      UUID NOT NULL REFERENCES public.orders(id),
  user_id       UUID NOT NULL REFERENCES public.users(id),
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_type  TEXT NOT NULL CHECK (invoice_type IN ('factura', 'abono')),
  subtotal      NUMERIC NOT NULL,
  tax_amount    NUMERIC NOT NULL DEFAULT 0,
  total         NUMERIC NOT NULL,
  pdf_url       TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.returns (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id      UUID NOT NULL REFERENCES public.orders(id),
  user_id       UUID NOT NULL REFERENCES public.users(id),
  reason        TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'solicitada'
                CHECK (status IN ('solicitada', 'aprobada', 'rechazada', 'completada')),
  refund_amount NUMERIC,
  admin_notes   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cancellation_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES public.orders(id),
  user_id         UUID NOT NULL REFERENCES public.users(id),
  reason          TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pendiente'
                  CHECK (status IN ('pendiente', 'aprobada', 'rechazada')),
  admin_notes     TEXT,
  stripe_refund_id TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.product_reviews (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        UUID NOT NULL REFERENCES public.products(id),
  user_id           UUID NOT NULL REFERENCES auth.users(id),
  user_name         TEXT NOT NULL DEFAULT 'Usuario',
  rating            INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment           TEXT DEFAULT '' CHECK (char_length(comment) <= 1000),
  verified_purchase BOOLEAN DEFAULT false,
  helpful_count     INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.review_helpful_votes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id  UUID NOT NULL REFERENCES public.product_reviews(id),
  user_id    UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name      TEXT NOT NULL,
  email     TEXT NOT NULL,
  phone     TEXT,
  subject   TEXT NOT NULL,
  message   TEXT NOT NULL,
  status    TEXT NOT NULL DEFAULT 'pendiente'
            CHECK (status IN ('pendiente', 'leido', 'respondido')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.site_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.site_settings (key, value)
VALUES ('ofertas_flash_active', 'true')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.visits (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  page       TEXT NOT NULL,
  user_agent TEXT,
  referer    TEXT,
  country    TEXT,
  city       TEXT,
  user_id    UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6) Funciones necesarias
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION generate_invoice_number(inv_type TEXT)
RETURNS TEXT AS $$
DECLARE
  prefix TEXT;
  year_part TEXT;
  sequence_num INTEGER;
  result TEXT;
BEGIN
  prefix := CASE inv_type WHEN 'factura' THEN 'FAC' ELSE 'ABO' END;
  year_part := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '\d{6}$') AS INTEGER)), 0) + 1
  INTO sequence_num FROM public.invoices
  WHERE invoice_type = inv_type AND invoice_number LIKE prefix || '-' || year_part || '-%';
  result := prefix || '-' || year_part || '-' || LPAD(sequence_num::TEXT, 6, '0');
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION cancel_order_and_restore_stock(order_uuid UUID)
RETURNS VOID AS $$
DECLARE item RECORD;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.orders WHERE id = order_uuid AND status = 'pagado') THEN
    RAISE EXCEPTION 'El pedido no puede ser cancelado';
  END IF;
  FOR item IN SELECT product_id, quantity FROM public.order_items WHERE order_id = order_uuid LOOP
    UPDATE public.products SET stock = stock + item.quantity WHERE id = item.product_id;
  END LOOP;
  UPDATE public.orders SET status = 'cancelado', updated_at = NOW() WHERE id = order_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION create_order_and_reduce_stock(
  p_user_id UUID, p_total NUMERIC, p_items JSONB,
  p_promo_code TEXT DEFAULT NULL, p_discount_amount NUMERIC DEFAULT 0,
  p_shipping_address TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE new_order_id UUID; item JSONB;
BEGIN
  INSERT INTO public.orders (user_id, total, status, promo_code, discount_amount, shipping_address)
  VALUES (p_user_id, p_total, 'pagado', p_promo_code, p_discount_amount, p_shipping_address)
  RETURNING id INTO new_order_id;
  FOR item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    IF NOT EXISTS (SELECT 1 FROM public.products WHERE id = (item->>'product_id')::UUID AND stock >= (item->>'quantity')::INTEGER) THEN
      RAISE EXCEPTION 'Stock insuficiente para el producto %', item->>'product_id';
    END IF;
    INSERT INTO public.order_items (order_id, product_id, quantity, price)
    VALUES (new_order_id, (item->>'product_id')::UUID, (item->>'quantity')::INTEGER, (item->>'price')::NUMERIC);
    UPDATE public.products SET stock = stock - (item->>'quantity')::INTEGER WHERE id = (item->>'product_id')::UUID;
  END LOOP;
  RETURN new_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_order_status_counts()
RETURNS TABLE(status TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY SELECT o.status, COUNT(*)::BIGINT FROM public.orders o GROUP BY o.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE(total_orders BIGINT, total_revenue NUMERIC, total_products BIGINT, total_users BIGINT, pending_orders BIGINT, products_low_stock BIGINT) AS $$
BEGIN
  RETURN QUERY SELECT
    (SELECT COUNT(*) FROM public.orders)::BIGINT,
    (SELECT COALESCE(SUM(total), 0) FROM public.orders WHERE status != 'cancelado')::NUMERIC,
    (SELECT COUNT(*) FROM public.products)::BIGINT,
    (SELECT COUNT(*) FROM public.users WHERE role = 'user')::BIGINT,
    (SELECT COUNT(*) FROM public.orders WHERE status = 'pendiente')::BIGINT,
    (SELECT COUNT(*) FROM public.products WHERE stock < 10)::BIGINT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_product_review_stats(p_product_id UUID)
RETURNS JSON AS $$
DECLARE result JSON;
BEGIN
  SELECT json_build_object(
    'avg_rating', COALESCE(ROUND(AVG(rating)::numeric, 1), 0),
    'total_reviews', COUNT(*),
    'distribution', json_build_object(
      '5', COUNT(*) FILTER (WHERE rating = 5), '4', COUNT(*) FILTER (WHERE rating = 4),
      '3', COUNT(*) FILTER (WHERE rating = 3), '2', COUNT(*) FILTER (WHERE rating = 2),
      '1', COUNT(*) FILTER (WHERE rating = 1))
  ) INTO result FROM public.product_reviews WHERE product_id = p_product_id;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION has_purchased_product(p_user_id UUID, p_product_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.orders o JOIN public.order_items oi ON o.id = oi.order_id
    WHERE o.user_id = p_user_id AND oi.product_id = p_product_id AND o.status IN ('pagado', 'enviado', 'entregado')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION update_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.product_reviews SET helpful_count = helpful_count + 1 WHERE id = NEW.review_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.product_reviews SET helpful_count = helpful_count - 1 WHERE id = OLD.review_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION check_verified_purchase()
RETURNS TRIGGER AS $$
BEGIN
  NEW.verified_purchase := has_purchased_product(NEW.user_id, NEW.product_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION update_product_review_stats()
RETURNS TRIGGER AS $$
DECLARE target_product_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN target_product_id := OLD.product_id;
  ELSE target_product_id := NEW.product_id; END IF;
  UPDATE public.products SET
    rating = COALESCE((SELECT ROUND(AVG(r.rating)::numeric, 1) FROM public.product_reviews r WHERE r.product_id = target_product_id), 0),
    reviews_count = (SELECT COUNT(*) FROM public.product_reviews r WHERE r.product_id = target_product_id)
  WHERE id = target_product_id;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7) Triggers (DROP IF EXISTS + CREATE para evitar errores)
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_returns_updated_at ON public.returns;
CREATE TRIGGER update_returns_updated_at
  BEFORE UPDATE ON public.returns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cancellation_requests_updated_at ON public.cancellation_requests;
CREATE TRIGGER update_cancellation_requests_updated_at
  BEFORE UPDATE ON public.cancellation_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON public.product_reviews;
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.product_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_helpful_count ON public.review_helpful_votes;
CREATE TRIGGER trigger_helpful_count
  AFTER INSERT OR DELETE ON public.review_helpful_votes FOR EACH ROW EXECUTE FUNCTION update_helpful_count();

DROP TRIGGER IF EXISTS trigger_verified_purchase ON public.product_reviews;
CREATE TRIGGER trigger_verified_purchase
  BEFORE INSERT ON public.product_reviews FOR EACH ROW EXECUTE FUNCTION check_verified_purchase();

DROP TRIGGER IF EXISTS trigger_update_product_review_stats ON public.product_reviews;
CREATE TRIGGER trigger_update_product_review_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.product_reviews FOR EACH ROW EXECUTE FUNCTION update_product_review_stats();

-- 8) Vistas
CREATE OR REPLACE VIEW public.visits_daily AS
SELECT DATE(created_at) AS fecha, COUNT(*) AS total_visitas,
  COUNT(DISTINCT user_id) AS visitantes_unicos, COUNT(DISTINCT page) AS paginas_vistas
FROM public.visits GROUP BY DATE(created_at) ORDER BY fecha DESC;

CREATE OR REPLACE VIEW public.visits_top_pages AS
SELECT page, COUNT(*) AS total_visitas, MAX(created_at) AS ultima_visita,
  COUNT(DISTINCT user_id) AS usuarios_unicos
FROM public.visits GROUP BY page ORDER BY total_visitas DESC;

-- 9) Función increment_promo_uses (usada por webhook y create-order)
-- Incrementa atómicamente el campo current_uses de un código promocional.
CREATE OR REPLACE FUNCTION increment_promo_uses(p_code TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.promo_codes
  SET current_uses = COALESCE(current_uses, 0) + 1
  WHERE code = p_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================
-- MIGRACIÓN COMPLETADA
-- Si no hay errores rojos arriba, tu BD está sincronizada con el código.
-- =============================================
