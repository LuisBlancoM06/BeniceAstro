-- =============================================
-- BeniceAstro — Schema Completo de Base de Datos
-- Consolidado · Alineado con el código
-- =============================================
-- Orden de ejecución seguro (respeta foreign keys).
-- Idempotente: usa IF NOT EXISTS / OR REPLACE.
-- Compatible con Supabase (PostgreSQL 15+).
-- =============================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLA: users (perfil extendido vinculado a auth.users)
-- Usado por: api/profile.ts, api/stripe/customer-data.ts,
--            api/stripe/webhook.ts, admin/*, checkout, perfil
-- =============================================
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT UNIQUE NOT NULL,
  full_name   TEXT,
  phone       TEXT,
  address     TEXT,                          -- dirección legacy (texto plano)
  address_line1 TEXT,                        -- dirección estructurada (Stripe-compatible)
  address_line2 TEXT,
  city        TEXT,
  postal_code TEXT,
  country     TEXT DEFAULT 'ES',
  avatar_url  TEXT,
  is_subscribed_newsletter BOOLEAN DEFAULT false,
  stripe_customer_id TEXT UNIQUE,
  role        TEXT NOT NULL DEFAULT 'user'
              CHECK (role IN ('user', 'admin')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Índices users
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id
  ON public.users(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- RLS users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users pueden ver su propio perfil"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins pueden ver todos los usuarios"
  ON public.users FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "Users pueden actualizar su propio perfil excepto rol"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Users pueden crear su perfil"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id AND role = 'user');

CREATE POLICY "Service role puede insertar usuarios"
  ON public.users FOR INSERT
  TO service_role
  WITH CHECK (true);

-- =============================================
-- TABLA: products
-- Usado por: api/admin/products.ts, api/search.ts,
--            api/stripe/create-checkout-session.ts, productos.astro
-- =============================================
CREATE TABLE IF NOT EXISTS public.products (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE,
  description TEXT,
  price       DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  sale_price  DECIMAL(10,2),
  on_sale     BOOLEAN DEFAULT false,
  stock       INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url   TEXT,
  images      TEXT[] DEFAULT '{}',
  brand       TEXT DEFAULT 'Benice',
  animal_type TEXT NOT NULL CHECK (animal_type IN ('perro', 'gato', 'otros')),
  size        TEXT NOT NULL CHECK (size IN ('mini', 'mediano', 'grande')),
  category    TEXT NOT NULL CHECK (category IN ('alimentacion', 'higiene', 'salud', 'accesorios', 'juguetes')),
  age_range   TEXT NOT NULL CHECK (age_range IN ('cachorro', 'adulto', 'senior')),
  rating      DECIMAL(3,1) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Índices products
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_on_sale ON public.products(on_sale) WHERE on_sale = true;
CREATE INDEX IF NOT EXISTS idx_products_animal_type ON public.products(animal_type);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_size ON public.products(size);
CREATE INDEX IF NOT EXISTS idx_products_age_range ON public.products(age_range);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);

-- RLS products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Productos visibles para todos"
  ON public.products FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins pueden insertar productos"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins pueden actualizar productos"
  ON public.products FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins pueden eliminar productos"
  ON public.products FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- TABLA: orders
-- Usado por: api/create-order.ts, api/cancel-order.ts,
--            api/stripe/webhook.ts, admin/update-order-status.ts
-- =============================================
CREATE TABLE IF NOT EXISTS public.orders (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  total            DECIMAL(10,2) NOT NULL CHECK (total >= 0),
  status           TEXT NOT NULL DEFAULT 'pendiente'
                   CHECK (status IN ('pendiente', 'pagado', 'enviado', 'entregado', 'cancelado')),
  promo_code       TEXT,
  discount_amount  DECIMAL(10,2) DEFAULT 0,
  shipping_address TEXT,
  shipping_name    TEXT,
  shipping_phone   TEXT,
  stripe_session_id TEXT,
  payment_intent_id TEXT,
  tracking_number  TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Índices orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON public.orders(stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

-- RLS orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users pueden ver sus propios pedidos"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users pueden crear pedidos"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users pueden actualizar sus pedidos"
  ON public.orders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins pueden ver todos los pedidos"
  ON public.orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins pueden actualizar todos los pedidos"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins pueden crear pedidos"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- TABLA: order_items
-- Usado por: api/stripe/webhook.ts, api/admin/analytics.ts,
--            RPCs create_order_and_reduce_stock / cancel_order_and_restore_stock
-- NOTA: No tiene created_at — filtrar por fecha vía JOIN con orders.
-- =============================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id   UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity   INTEGER NOT NULL CHECK (quantity > 0),
  price      DECIMAL(10,2) NOT NULL CHECK (price >= 0)
);

-- Índices order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- RLS order_items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users pueden ver items de sus pedidos"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users pueden insertar items en sus pedidos"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins pueden ver todos los items"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins pueden crear order_items"
  ON public.order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- TABLA: invoices (Facturas y Abonos)
-- Usado por: api/stripe/webhook.ts, api/admin/process-return.ts
-- =============================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id      UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_type  TEXT NOT NULL CHECK (invoice_type IN ('factura', 'abono')),
  subtotal      DECIMAL(10,2) NOT NULL,
  tax_amount    DECIMAL(10,2) NOT NULL DEFAULT 0,
  total         DECIMAL(10,2) NOT NULL,
  pdf_url       TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Índices invoices
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON public.invoices(order_id);

-- RLS invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users pueden ver sus propias facturas"
  ON public.invoices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins pueden ver todas las facturas"
  ON public.invoices FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins pueden crear facturas"
  ON public.invoices FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- TABLA: returns (Devoluciones)
-- Usado por: api/returns.ts, api/admin/process-return.ts
-- =============================================
CREATE TABLE IF NOT EXISTS public.returns (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id      UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason        TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'solicitada'
                CHECK (status IN ('solicitada', 'aprobada', 'rechazada', 'completada')),
  refund_amount DECIMAL(10,2),
  admin_notes   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Índices returns
CREATE INDEX IF NOT EXISTS idx_returns_order_id ON public.returns(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_user_id ON public.returns(user_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON public.returns(status);

-- RLS returns
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users pueden ver sus propias devoluciones"
  ON public.returns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users pueden crear devoluciones"
  ON public.returns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins pueden ver todas las devoluciones"
  ON public.returns FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins pueden actualizar devoluciones"
  ON public.returns FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- TABLA: cancellation_requests
-- Usado por: api/cancel-order.ts, api/admin/approve-cancellation.ts
-- =============================================
CREATE TABLE IF NOT EXISTS public.cancellation_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason          TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pendiente'
                  CHECK (status IN ('pendiente', 'aprobada', 'rechazada')),
  admin_notes     TEXT,
  stripe_refund_id TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Índices cancellation_requests
CREATE INDEX IF NOT EXISTS idx_cancel_req_order_id ON public.cancellation_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_cancel_req_user_id ON public.cancellation_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_cancel_req_status ON public.cancellation_requests(status);

-- RLS cancellation_requests
ALTER TABLE public.cancellation_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users pueden ver sus propias cancelaciones"
  ON public.cancellation_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users pueden solicitar cancelación"
  ON public.cancellation_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins pueden ver todas las cancelaciones"
  ON public.cancellation_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins pueden actualizar cancelaciones"
  ON public.cancellation_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- TABLA: product_reviews
-- Usado por: api/reviews.ts, components/ProductReviews.tsx
-- =============================================
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name         TEXT NOT NULL DEFAULT 'Usuario',
  rating            INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment           TEXT DEFAULT '' CHECK (char_length(comment) <= 1000),
  verified_purchase BOOLEAN DEFAULT false,
  helpful_count     INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, user_id)
);

-- Índices product_reviews
CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON public.product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.product_reviews(product_id, rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON public.product_reviews(created_at DESC);

-- RLS product_reviews
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reseñas visibles para todos"
  ON public.product_reviews FOR SELECT
  USING (true);

CREATE POLICY "Usuarios autenticados pueden crear reseñas"
  ON public.product_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Autor puede editar su reseña"
  ON public.product_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Autor o admin puede eliminar reseña"
  ON public.product_reviews FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- TABLA: review_helpful_votes
-- Usado por: api/reviews.ts (POST/DELETE voto útil)
-- =============================================
CREATE TABLE IF NOT EXISTS public.review_helpful_votes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id  UUID NOT NULL REFERENCES public.product_reviews(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

-- Índice review_helpful_votes
CREATE INDEX IF NOT EXISTS idx_helpful_votes_review ON public.review_helpful_votes(review_id);

-- RLS review_helpful_votes
ALTER TABLE public.review_helpful_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Votos visibles para todos"
  ON public.review_helpful_votes FOR SELECT
  USING (true);

CREATE POLICY "Usuarios autenticados pueden votar"
  ON public.review_helpful_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuario puede eliminar su voto"
  ON public.review_helpful_votes FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- TABLA: newsletters
-- Usado por: api/newsletter.ts
-- =============================================
CREATE TABLE IF NOT EXISTS public.newsletters (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email      TEXT UNIQUE NOT NULL,
  promo_code TEXT NOT NULL,
  source     TEXT DEFAULT 'footer'
             CHECK (source IN ('web', 'app', 'footer', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice newsletters
CREATE INDEX IF NOT EXISTS idx_newsletters_email ON public.newsletters(email);

-- RLS newsletters
ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Newsletters INSERT con validación"
  ON public.newsletters FOR INSERT
  TO public
  WITH CHECK (
    email IS NOT NULL
    AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  );

CREATE POLICY "Admins pueden ver newsletters"
  ON public.newsletters FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- TABLA: promo_codes
-- Usado por: api/newsletter.ts, api/stripe/create-checkout-session.ts
-- =============================================
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code                 TEXT UNIQUE NOT NULL,
  discount_percentage  INTEGER NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
  active               BOOLEAN DEFAULT true,
  max_uses             INTEGER,
  current_uses         INTEGER DEFAULT 0,
  expires_at           TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Índice promo_codes
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON public.promo_codes(code);

-- RLS promo_codes
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Códigos promocionales activos visibles para todos"
  ON public.promo_codes FOR SELECT
  TO public
  USING (active = true);

CREATE POLICY "Admins pueden gestionar códigos"
  ON public.promo_codes FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- TABLA: contact_messages
-- Usado por: api/contact.ts, admin (lectura)
-- =============================================
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

-- Índices contact_messages
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created ON public.contact_messages(created_at DESC);

-- RLS contact_messages
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cualquiera puede enviar mensaje de contacto"
  ON public.contact_messages FOR INSERT
  TO public
  WITH CHECK (
    name IS NOT NULL AND name != ''
    AND email IS NOT NULL AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND subject IS NOT NULL AND subject != ''
    AND message IS NOT NULL AND message != ''
  );

CREATE POLICY "Admins pueden ver mensajes de contacto"
  ON public.contact_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins pueden actualizar mensajes de contacto"
  ON public.contact_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- TABLA: site_settings
-- Usado por: api/admin/ofertas-toggle.ts, OfertasToggle.astro
-- =============================================
CREATE TABLE IF NOT EXISTS public.site_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar configuración inicial
INSERT INTO public.site_settings (key, value)
VALUES ('ofertas_flash_active', 'true')
ON CONFLICT (key) DO NOTHING;

-- RLS site_settings
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Settings visibles para todos"
  ON public.site_settings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins pueden actualizar settings"
  ON public.site_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- TABLA: visits (tracking de visitantes — IPs anonimizadas)
-- Usado por: middleware.ts (insert), api/admin/analytics.ts (select)
-- =============================================
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

-- Índices visits
CREATE INDEX IF NOT EXISTS idx_visits_created_at ON public.visits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visits_page ON public.visits(page);

-- RLS visits
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir insertar visitas"
  ON public.visits FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Solo admins leen visitas"
  ON public.visits FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );


-- =============================================================================
-- FUNCIONES
-- =============================================================================

-- ─── updated_at automático ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ─── Generar número de factura (FAC-2026-000001 / ABO-2026-000001) ──────────
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

  SELECT COALESCE(MAX(
    CAST(SUBSTRING(invoice_number FROM '\d{6}$') AS INTEGER)
  ), 0) + 1
  INTO sequence_num
  FROM public.invoices
  WHERE invoice_type = inv_type
  AND invoice_number LIKE prefix || '-' || year_part || '-%';

  result := prefix || '-' || year_part || '-' || LPAD(sequence_num::TEXT, 6, '0');
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ─── Cancelar pedido y restaurar stock ──────────────────────────────────────
CREATE OR REPLACE FUNCTION cancel_order_and_restore_stock(order_uuid UUID)
RETURNS VOID AS $$
DECLARE
  item RECORD;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.orders
    WHERE id = order_uuid AND status = 'pagado'
  ) THEN
    RAISE EXCEPTION 'El pedido no puede ser cancelado';
  END IF;

  FOR item IN
    SELECT product_id, quantity FROM public.order_items WHERE order_id = order_uuid
  LOOP
    UPDATE public.products SET stock = stock + item.quantity WHERE id = item.product_id;
  END LOOP;

  UPDATE public.orders SET status = 'cancelado', updated_at = NOW() WHERE id = order_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ─── Crear pedido atómico (valida stock → insert order+items → reduce stock) ─
CREATE OR REPLACE FUNCTION create_order_and_reduce_stock(
  p_user_id          UUID,
  p_total            DECIMAL,
  p_items            JSONB,
  p_promo_code       TEXT DEFAULT NULL,
  p_discount_amount  DECIMAL DEFAULT 0,
  p_shipping_address TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_order_id UUID;
  item JSONB;
BEGIN
  INSERT INTO public.orders (user_id, total, status, promo_code, discount_amount, shipping_address)
  VALUES (p_user_id, p_total, 'pagado', p_promo_code, p_discount_amount, p_shipping_address)
  RETURNING id INTO new_order_id;

  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.products
      WHERE id = (item->>'product_id')::UUID
      AND stock >= (item->>'quantity')::INTEGER
    ) THEN
      RAISE EXCEPTION 'Stock insuficiente para el producto %', item->>'product_id';
    END IF;

    INSERT INTO public.order_items (order_id, product_id, quantity, price)
    VALUES (
      new_order_id,
      (item->>'product_id')::UUID,
      (item->>'quantity')::INTEGER,
      (item->>'price')::DECIMAL
    );

    UPDATE public.products
    SET stock = stock - (item->>'quantity')::INTEGER
    WHERE id = (item->>'product_id')::UUID;
  END LOOP;

  RETURN new_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ─── Conteo de pedidos por estado ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_order_status_counts()
RETURNS TABLE(status TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT o.status, COUNT(*)::BIGINT FROM public.orders o GROUP BY o.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ─── Estadísticas del dashboard ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE(
  total_orders      BIGINT,
  total_revenue     DECIMAL,
  total_products    BIGINT,
  total_users       BIGINT,
  pending_orders    BIGINT,
  products_low_stock BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.orders)::BIGINT,
    (SELECT COALESCE(SUM(total), 0) FROM public.orders WHERE status != 'cancelado')::DECIMAL,
    (SELECT COUNT(*) FROM public.products)::BIGINT,
    (SELECT COUNT(*) FROM public.users WHERE role = 'user')::BIGINT,
    (SELECT COUNT(*) FROM public.orders WHERE status = 'pendiente')::BIGINT,
    (SELECT COUNT(*) FROM public.products WHERE stock < 10)::BIGINT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ─── Estadísticas de reviews por producto ───────────────────────────────────
CREATE OR REPLACE FUNCTION get_product_review_stats(p_product_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'avg_rating',     COALESCE(ROUND(AVG(rating)::numeric, 1), 0),
    'total_reviews',  COUNT(*),
    'distribution',   json_build_object(
      '5', COUNT(*) FILTER (WHERE rating = 5),
      '4', COUNT(*) FILTER (WHERE rating = 4),
      '3', COUNT(*) FILTER (WHERE rating = 3),
      '2', COUNT(*) FILTER (WHERE rating = 2),
      '1', COUNT(*) FILTER (WHERE rating = 1)
    )
  ) INTO result
  FROM public.product_reviews
  WHERE product_id = p_product_id;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ─── Verificar si un usuario ha comprado un producto ────────────────────────
CREATE OR REPLACE FUNCTION has_purchased_product(p_user_id UUID, p_product_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.orders o
    JOIN public.order_items oi ON o.id = oi.order_id
    WHERE o.user_id = p_user_id
      AND oi.product_id = p_product_id
      AND o.status IN ('pagado', 'enviado', 'entregado')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ─── Actualizar helpful_count de una review ─────────────────────────────────
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

-- ─── Marcar verified_purchase automáticamente ───────────────────────────────
CREATE OR REPLACE FUNCTION check_verified_purchase()
RETURNS TRIGGER AS $$
BEGIN
  NEW.verified_purchase := has_purchased_product(NEW.user_id, NEW.product_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ─── Actualizar rating/reviews_count en products al cambiar reviews ─────────
CREATE OR REPLACE FUNCTION update_product_review_stats()
RETURNS TRIGGER AS $$
DECLARE
  target_product_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_product_id := OLD.product_id;
  ELSE
    target_product_id := NEW.product_id;
  END IF;

  UPDATE public.products
  SET
    rating = COALESCE((
      SELECT ROUND(AVG(r.rating)::numeric, 1) FROM public.product_reviews r WHERE r.product_id = target_product_id
    ), 0),
    reviews_count = (
      SELECT COUNT(*) FROM public.product_reviews r WHERE r.product_id = target_product_id
    )
  WHERE id = target_product_id;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- updated_at automático
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_returns_updated_at
  BEFORE UPDATE ON public.returns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cancellation_requests_updated_at
  BEFORE UPDATE ON public.cancellation_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.product_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Reviews: helpful_count sync
CREATE TRIGGER trigger_helpful_count
  AFTER INSERT OR DELETE ON public.review_helpful_votes
  FOR EACH ROW EXECUTE FUNCTION update_helpful_count();

-- Reviews: verified_purchase check
CREATE TRIGGER trigger_verified_purchase
  BEFORE INSERT ON public.product_reviews
  FOR EACH ROW EXECUTE FUNCTION check_verified_purchase();

-- Reviews: rating/reviews_count cache en products
CREATE TRIGGER trigger_update_product_review_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.product_reviews
  FOR EACH ROW EXECUTE FUNCTION update_product_review_stats();


-- =============================================================================
-- VISTAS (sin exponer IPs / datos sensibles)
-- =============================================================================

CREATE OR REPLACE VIEW public.visits_daily AS
SELECT
  DATE(created_at) AS fecha,
  COUNT(*)         AS total_visitas,
  COUNT(DISTINCT user_id) AS visitantes_unicos,
  COUNT(DISTINCT page)    AS paginas_vistas
FROM public.visits
GROUP BY DATE(created_at)
ORDER BY fecha DESC;

CREATE OR REPLACE VIEW public.visits_top_pages AS
SELECT
  page,
  COUNT(*)         AS total_visitas,
  MAX(created_at)  AS ultima_visita,
  COUNT(DISTINCT user_id) AS usuarios_unicos
FROM public.visits
GROUP BY page
ORDER BY total_visitas DESC;


-- =============================================================================
-- DATOS INICIALES: Productos de ejemplo
-- =============================================================================
INSERT INTO public.products (name, slug, description, price, stock, image_url, animal_type, size, category, age_range, brand)
VALUES
  ('Pienso Premium Perro Adulto',      'pienso-premium-perro-adulto',      'Alimento completo y balanceado para perros adultos de razas medianas',      45.99, 50, '/images/productos/pienso-perro.webp',       'perro', 'mediano', 'alimentacion', 'adulto',  'Royal Canin'),
  ('Champú Hipoalergénico Perro',      'champu-hipoalergenico-perro',      'Champú suave para pieles sensibles',                                        12.50, 30, '/images/productos/champu-perro.webp',       'perro', 'mediano', 'higiene',      'adulto',  'Benice'),
  ('Collar Antiparasitario',            'collar-antiparasitario',            'Protección contra pulgas y garrapatas durante 8 meses',                     22.00, 25, '/images/productos/collar.webp',             'perro', 'grande',  'salud',        'adulto',  'Seresto'),
  ('Correa Extensible 5m',              'correa-extensible-5m',              'Correa retráctil para perros hasta 50kg',                                   18.99, 40, '/images/productos/correa.webp',             'perro', 'grande',  'accesorios',   'adulto',  'Flexi'),
  ('Pelota Kong Resistente',            'pelota-kong-resistente',            'Juguete indestructible para perros activos',                                 15.50, 60, '/images/productos/pelota.webp',             'perro', 'mediano', 'juguetes',     'adulto',  'Kong'),
  ('Pienso Gato Cachorro',              'pienso-gato-cachorro',              'Nutrición completa para gatitos en crecimiento',                            38.50, 45, '/images/productos/pienso-gato.webp',        'gato',  'mini',    'alimentacion', 'cachorro','Purina'),
  ('Arena Aglomerante 10L',             'arena-aglomerante-10l',             'Arena higiénica con control de olores',                                      9.99, 80, '/images/productos/arena.webp',              'gato',  'mini',    'higiene',      'adulto',  'Catsan'),
  ('Antiparasitario Pipetas',           'antiparasitario-pipetas',           'Pack 3 pipetas para gatos',                                                 25.00, 35, '/images/productos/pipetas.webp',            'gato',  'mini',    'salud',        'adulto',  'Frontline'),
  ('Rascador Torre 120cm',              'rascador-torre-120cm',              'Rascador con plataformas y hamaca',                                         65.00, 15, '/images/productos/rascador.webp',           'gato',  'mediano', 'accesorios',   'adulto',  'Benice'),
  ('Ratón con Catnip',                  'raton-con-catnip',                  'Juguete interactivo relleno de hierba gatera',                               4.99,100, '/images/productos/raton.webp',              'gato',  'mini',    'juguetes',     'adulto',  'Benice'),
  ('Heno Premium Conejos',              'heno-premium-conejos',              'Heno de alta calidad para roedores',                                        12.99, 40, '/images/productos/heno.webp',               'otros', 'mini',    'alimentacion', 'adulto',  'Vitakraft'),
  ('Jaula Hamster 2 Pisos',             'jaula-hamster-2-pisos',             'Jaula espaciosa con accesorios incluidos',                                  55.00, 10, '/images/productos/jaula.webp',              'otros', 'mini',    'accesorios',   'adulto',  'Benice'),
  ('Vitaminas Aves',                    'vitaminas-aves',                    'Suplemento vitamínico para pájaros',                                         8.50, 25, '/images/productos/vitaminas.webp',          'otros', 'mini',    'salud',        'adulto',  'Versele-Laga'),
  ('Rueda Ejercicio 20cm',              'rueda-ejercicio-20cm',              'Rueda silenciosa para hámsters y ratones',                                  11.99, 30, '/images/productos/rueda.webp',              'otros', 'mini',    'juguetes',     'adulto',  'Trixie'),
  ('Pienso Senior Perro',               'pienso-senior-perro',               'Fórmula especial para perros mayores de 7 años',                           52.00, 30, '/images/productos/pienso-senior-perro.webp','perro', 'mediano', 'alimentacion', 'senior',  'Hill''s'),
  ('Suplemento Articular Perro',        'suplemento-articular-perro',        'Condroprotector con glucosamina y condroitina',                             35.00, 20, '/images/productos/suplemento.webp',         'perro', 'grande',  'salud',        'senior',  'Artican'),
  ('Pienso Senior Gato',                'pienso-senior-gato',                'Alimento digestivo para gatos mayores',                                     42.50, 25, '/images/productos/pienso-senior-gato.webp', 'gato',  'mini',    'alimentacion', 'senior',  'Royal Canin'),
  ('Pack Ahorro Pienso Perro 15kg',     'pack-ahorro-pienso-perro-15kg',     'Saco grande de pienso premium con 20% descuento',                          59.99, 20, '/images/productos/pack-ahorro.webp',        'perro', 'grande',  'alimentacion', 'adulto',  'Acana'),
  ('Kit Higiene Gato Completo',         'kit-higiene-gato-completo',         'Arena + champú + cepillo con 15% dto',                                     29.99, 15, '/images/productos/kit-higiene.webp',        'gato',  'mini',    'higiene',      'adulto',  'Benice')
ON CONFLICT (slug) DO NOTHING;

-- Marcar ofertas
UPDATE public.products SET on_sale = true, sale_price = 47.99 WHERE slug = 'pack-ahorro-pienso-perro-15kg';
UPDATE public.products SET on_sale = true, sale_price = 25.49 WHERE slug = 'kit-higiene-gato-completo';

-- Códigos promocionales iniciales
INSERT INTO public.promo_codes (code, discount_percentage, active, expires_at, max_uses)
VALUES
  ('BIENVENIDO10',  10, true, NOW() + INTERVAL '365 days', 1000),
  ('VERANO20',      20, true, NOW() + INTERVAL '60 days',   500),
  ('BLACKFRIDAY30', 30, true, NOW() + INTERVAL '30 days',   200),
  ('NEWSLETTER15',  15, true, NOW() + INTERVAL '90 days',  NULL)
ON CONFLICT (code) DO NOTHING;


-- =============================================================================
-- NOTAS DE STORAGE (configurar manualmente en Supabase UI)
-- =============================================================================
-- 1. Crear bucket: product-images (público)
-- 2. Políticas de Storage:
--    - SELECT:  Permitir para todos (public)
--    - INSERT:  Permitir para authenticated
--    - UPDATE:  Permitir para authenticated
--    - DELETE:  Permitir para authenticated

-- =============================================
-- MIGRACIÓN v2: Tracking de pedidos + Geocoding de dirección
-- =============================================

-- 1) Añadir columnas de geolocalización y estado a users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS latitude  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS state     TEXT;  -- Provincia/Comunidad Autónoma

-- Índice espacial simplificado (para futuras búsquedas por proximidad)
CREATE INDEX IF NOT EXISTS idx_users_geo
  ON public.users(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- 2) Añadir columna carrier a orders (transportista)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS carrier TEXT;

-- 3) Tabla de historial de estados de pedido (auditoría completa)
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES public.users(id),  -- admin que hizo el cambio (NULL = sistema)
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order
  ON public.order_status_history(order_id, created_at DESC);

-- RLS order_status_history
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users pueden ver historial de sus pedidos"
  ON public.order_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_status_history.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins pueden ver todo el historial"
  ON public.order_status_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins pueden insertar historial"
  ON public.order_status_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Service role puede insertar (para webhook de Stripe)
CREATE POLICY "Service role puede insertar historial"
  ON public.order_status_history FOR INSERT
  TO service_role
  WITH CHECK (true);

-- =============================================
-- FIN DEL SCHEMA
-- =============================================
