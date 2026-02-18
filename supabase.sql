-- =============================================
-- BeniceAstro - Schema Completo de Base de Datos
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLA: users (perfil extendido)
-- =============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver su propio perfil
CREATE POLICY "Users pueden ver su propio perfil"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Los usuarios pueden actualizar su perfil PERO NO el rol
-- El rol solo puede cambiarlo un admin directamente en Supabase
CREATE POLICY "Users pueden actualizar su propio perfil excepto rol"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND (
      -- Si el rol no cambia, permitir
      role = (SELECT role FROM public.users WHERE id = auth.uid())
    )
  );

-- Los usuarios pueden insertar su propio perfil al registrarse
CREATE POLICY "Users pueden crear su perfil"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id AND role = 'user');

-- =============================================
-- TABLA: products
-- =============================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  sale_price DECIMAL(10, 2),
  on_sale BOOLEAN DEFAULT false,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url TEXT,
  images TEXT[] DEFAULT '{}',
  brand TEXT DEFAULT 'Venice',
  animal_type TEXT NOT NULL CHECK (animal_type IN ('perro', 'gato', 'otros')),
  size TEXT NOT NULL CHECK (size IN ('mini', 'mediano', 'grande')),
  category TEXT NOT NULL CHECK (category IN ('alimentacion', 'higiene', 'salud', 'accesorios', 'juguetes')),
  age_range TEXT NOT NULL CHECK (age_range IN ('cachorro', 'adulto', 'senior')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para products (lectura pública)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Productos visibles para todos"
  ON public.products FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins pueden insertar productos"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins pueden actualizar productos"
  ON public.products FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins pueden eliminar productos"
  ON public.products FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Índices para products
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_on_sale ON public.products(on_sale) WHERE on_sale = true;
CREATE INDEX IF NOT EXISTS idx_products_animal_type ON public.products(animal_type);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_size ON public.products(size);
CREATE INDEX IF NOT EXISTS idx_products_age_range ON public.products(age_range);

-- =============================================
-- TABLA: orders
-- =============================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'pagado', 'enviado', 'entregado', 'cancelado')),
  promo_code TEXT,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  shipping_address TEXT,
  shipping_name TEXT,
  shipping_phone TEXT,
  stripe_session_id TEXT,
  tracking_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para orders
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
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins pueden actualizar todos los pedidos"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Índices para orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- =============================================
-- TABLA: order_items
-- =============================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0)
);

-- RLS para order_items
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
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Índice para order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- =============================================
-- TABLA: invoices (Facturas y Abonos)
-- =============================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_type TEXT NOT NULL CHECK (invoice_type IN ('factura', 'abono')),
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users pueden ver sus propias facturas"
  ON public.invoices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins pueden ver todas las facturas"
  ON public.invoices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins pueden crear facturas"
  ON public.invoices FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Índice para invoices
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);

-- =============================================
-- TABLA: returns (Devoluciones)
-- =============================================
CREATE TABLE IF NOT EXISTS public.returns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'solicitada' CHECK (status IN ('solicitada', 'aprobada', 'rechazada', 'completada')),
  refund_amount DECIMAL(10, 2),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para returns
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
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins pueden actualizar devoluciones"
  ON public.returns FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- =============================================
-- TABLA: newsletters
-- =============================================
CREATE TABLE IF NOT EXISTS public.newsletters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  promo_code TEXT NOT NULL,
  source TEXT DEFAULT 'footer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para newsletters
ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede suscribirse al newsletter (solo INSERT, validando email)
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
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- =============================================
-- TABLA: promo_codes
-- =============================================
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  discount_percentage INTEGER NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
  active BOOLEAN DEFAULT true,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para promo_codes
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Códigos promocionales visibles para todos"
  ON public.promo_codes FOR SELECT
  TO public
  USING (active = true);

CREATE POLICY "Admins pueden gestionar códigos"
  ON public.promo_codes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- =============================================
-- TABLA: site_settings (configuraciones del sitio)
-- =============================================
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar configuración inicial de ofertas flash
INSERT INTO public.site_settings (key, value) 
VALUES ('ofertas_flash_active', 'true')
ON CONFLICT (key) DO NOTHING;

-- RLS para site_settings
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Settings visibles para todos"
  ON public.site_settings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins pueden actualizar settings"
  ON public.site_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- =============================================
-- FUNCIONES
-- =============================================

-- Función: Generar número de factura
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
    CAST(
      SUBSTRING(invoice_number FROM '\d{6}$') AS INTEGER
    )
  ), 0) + 1
  INTO sequence_num
  FROM public.invoices
  WHERE invoice_type = inv_type
  AND invoice_number LIKE prefix || '-' || year_part || '-%';
  
  result := prefix || '-' || year_part || '-' || LPAD(sequence_num::TEXT, 6, '0');
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Función: Cancelar pedido y restaurar stock
CREATE OR REPLACE FUNCTION cancel_order_and_restore_stock(order_uuid UUID)
RETURNS VOID AS $$
DECLARE
  item RECORD;
BEGIN
  -- Verificar que el pedido esté en estado 'pagado'
  IF NOT EXISTS (
    SELECT 1 FROM public.orders
    WHERE id = order_uuid AND status = 'pagado'
  ) THEN
    RAISE EXCEPTION 'El pedido no puede ser cancelado';
  END IF;

  -- Restaurar stock de cada producto
  FOR item IN
    SELECT product_id, quantity
    FROM public.order_items
    WHERE order_id = order_uuid
  LOOP
    UPDATE public.products
    SET stock = stock + item.quantity
    WHERE id = item.product_id;
  END LOOP;

  -- Cambiar estado del pedido a cancelado
  UPDATE public.orders
  SET status = 'cancelado', updated_at = NOW()
  WHERE id = order_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Función: Crear pedido y reducir stock
CREATE OR REPLACE FUNCTION create_order_and_reduce_stock(
  p_user_id UUID,
  p_total DECIMAL,
  p_items JSONB,
  p_promo_code TEXT DEFAULT NULL,
  p_discount_amount DECIMAL DEFAULT 0,
  p_shipping_address TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_order_id UUID;
  item JSONB;
BEGIN
  -- Crear el pedido
  INSERT INTO public.orders (user_id, total, status, promo_code, discount_amount, shipping_address)
  VALUES (p_user_id, p_total, 'pagado', p_promo_code, p_discount_amount, p_shipping_address)
  RETURNING id INTO new_order_id;

  -- Procesar cada item
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Verificar stock disponible
    IF NOT EXISTS (
      SELECT 1 FROM public.products
      WHERE id = (item->>'product_id')::UUID
      AND stock >= (item->>'quantity')::INTEGER
    ) THEN
      RAISE EXCEPTION 'Stock insuficiente para el producto %', item->>'product_id';
    END IF;

    -- Crear order_item
    INSERT INTO public.order_items (order_id, product_id, quantity, price)
    VALUES (
      new_order_id,
      (item->>'product_id')::UUID,
      (item->>'quantity')::INTEGER,
      (item->>'price')::DECIMAL
    );

    -- Reducir stock
    UPDATE public.products
    SET stock = stock - (item->>'quantity')::INTEGER
    WHERE id = (item->>'product_id')::UUID;
  END LOOP;

  RETURN new_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Función: Contar pedidos por estado
CREATE OR REPLACE FUNCTION get_order_status_counts()
RETURNS TABLE(status TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.status,
    COUNT(*)::BIGINT
  FROM public.orders o
  GROUP BY o.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Función: Obtener estadísticas del dashboard
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE(
  total_orders BIGINT,
  total_revenue DECIMAL,
  total_products BIGINT,
  total_users BIGINT,
  pending_orders BIGINT,
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

-- =============================================
-- DATOS DE EJEMPLO: Productos
-- =============================================
INSERT INTO public.products (name, slug, description, price, stock, image_url, animal_type, size, category, age_range, brand)
VALUES
  -- Perros
  ('Pienso Premium Perro Adulto', 'pienso-premium-perro-adulto', 'Alimento completo y balanceado para perros adultos de razas medianas', 45.99, 50, 'https://via.placeholder.com/400x300/3b82f6/ffffff?text=Pienso+Perro', 'perro', 'mediano', 'alimentacion', 'adulto', 'Royal Canin'),
  ('Champú Hipoalergénico Perro', 'champu-hipoalergenico-perro', 'Champú suave para pieles sensibles', 12.50, 30, 'https://via.placeholder.com/400x300/8b5cf6/ffffff?text=Champu+Perro', 'perro', 'mediano', 'higiene', 'adulto', 'Venice'),
  ('Collar Antiparasitario', 'collar-antiparasitario', 'Protección contra pulgas y garrapatas durante 8 meses', 22.00, 25, 'https://via.placeholder.com/400x300/10b981/ffffff?text=Collar', 'perro', 'grande', 'salud', 'adulto', 'Seresto'),
  ('Correa Extensible 5m', 'correa-extensible-5m', 'Correa retráctil para perros hasta 50kg', 18.99, 40, 'https://via.placeholder.com/400x300/f59e0b/ffffff?text=Correa', 'perro', 'grande', 'accesorios', 'adulto', 'Flexi'),
  ('Pelota Kong Resistente', 'pelota-kong-resistente', 'Juguete indestructible para perros activos', 15.50, 60, 'https://via.placeholder.com/400x300/ef4444/ffffff?text=Pelota', 'perro', 'mediano', 'juguetes', 'adulto', 'Kong'),
  
  -- Gatos
  ('Pienso Gato Cachorro', 'pienso-gato-cachorro', 'Nutrición completa para gatitos en crecimiento', 38.50, 45, 'https://via.placeholder.com/400x300/3b82f6/ffffff?text=Pienso+Gato', 'gato', 'mini', 'alimentacion', 'cachorro', 'Purina'),
  ('Arena Aglomerante 10L', 'arena-aglomerante-10l', 'Arena higiénica con control de olores', 9.99, 80, 'https://via.placeholder.com/400x300/8b5cf6/ffffff?text=Arena', 'gato', 'mini', 'higiene', 'adulto', 'Catsan'),
  ('Antiparasitario Pipetas', 'antiparasitario-pipetas', 'Pack 3 pipetas para gatos', 25.00, 35, 'https://via.placeholder.com/400x300/10b981/ffffff?text=Pipetas', 'gato', 'mini', 'salud', 'adulto', 'Frontline'),
  ('Rascador Torre 120cm', 'rascador-torre-120cm', 'Rascador con plataformas y hamaca', 65.00, 15, 'https://via.placeholder.com/400x300/f59e0b/ffffff?text=Rascador', 'gato', 'mediano', 'accesorios', 'adulto', 'Venice'),
  ('Ratón con Catnip', 'raton-con-catnip', 'Juguete interactivo relleno de hierba gatera', 4.99, 100, 'https://via.placeholder.com/400x300/ef4444/ffffff?text=Juguete', 'gato', 'mini', 'juguetes', 'adulto', 'Venice'),
  
  -- Otros animales
  ('Heno Premium Conejos', 'heno-premium-conejos', 'Heno de alta calidad para roedores', 12.99, 40, 'https://via.placeholder.com/400x300/3b82f6/ffffff?text=Heno', 'otros', 'mini', 'alimentacion', 'adulto', 'Vitakraft'),
  ('Jaula Hamster 2 Pisos', 'jaula-hamster-2-pisos', 'Jaula espaciosa con accesorios incluidos', 55.00, 10, 'https://via.placeholder.com/400x300/8b5cf6/ffffff?text=Jaula', 'otros', 'mini', 'accesorios', 'adulto', 'Venice'),
  ('Vitaminas Aves', 'vitaminas-aves', 'Suplemento vitamínico para pájaros', 8.50, 25, 'https://via.placeholder.com/400x300/10b981/ffffff?text=Vitaminas', 'otros', 'mini', 'salud', 'adulto', 'Versele-Laga'),
  ('Rueda Ejercicio 20cm', 'rueda-ejercicio-20cm', 'Rueda silenciosa para hámsters y ratones', 11.99, 30, 'https://via.placeholder.com/400x300/f59e0b/ffffff?text=Rueda', 'otros', 'mini', 'juguetes', 'adulto', 'Trixie'),
  
  -- Productos Senior
  ('Pienso Senior Perro', 'pienso-senior-perro', 'Fórmula especial para perros mayores de 7 años', 52.00, 30, 'https://via.placeholder.com/400x300/ef4444/ffffff?text=Pienso+Senior', 'perro', 'mediano', 'alimentacion', 'senior', 'Hill''s'),
  ('Suplemento Articular Perro', 'suplemento-articular-perro', 'Condroprotector con glucosamina y condroitina', 35.00, 20, 'https://via.placeholder.com/400x300/3b82f6/ffffff?text=Suplemento', 'perro', 'grande', 'salud', 'senior', 'Artican'),
  ('Pienso Senior Gato', 'pienso-senior-gato', 'Alimento digestivo para gatos mayores', 42.50, 25, 'https://via.placeholder.com/400x300/8b5cf6/ffffff?text=Pienso+Senior+Gato', 'gato', 'mini', 'alimentacion', 'senior', 'Royal Canin'),
  
  -- Ofertas Flash
  ('Pack Ahorro Pienso Perro 15kg', 'pack-ahorro-pienso-perro-15kg', 'Saco grande de pienso premium con 20% descuento', 59.99, 20, 'https://via.placeholder.com/400x300/dc2626/ffffff?text=OFERTA', 'perro', 'grande', 'alimentacion', 'adulto', 'Acana'),
  ('Kit Higiene Gato Completo', 'kit-higiene-gato-completo', 'Arena + champú + cepillo con 15% dto', 29.99, 15, 'https://via.placeholder.com/400x300/dc2626/ffffff?text=OFERTA', 'gato', 'mini', 'higiene', 'adulto', 'Venice')
ON CONFLICT (slug) DO NOTHING;

-- Marcar productos en oferta
UPDATE public.products SET on_sale = true, sale_price = 47.99 WHERE slug = 'pack-ahorro-pienso-perro-15kg';
UPDATE public.products SET on_sale = true, sale_price = 25.49 WHERE slug = 'kit-higiene-gato-completo';

-- =============================================
-- DATOS DE EJEMPLO: Códigos Promocionales
-- =============================================
INSERT INTO public.promo_codes (code, discount_percentage, active, expires_at, max_uses)
VALUES
  ('BIENVENIDO10', 10, true, NOW() + INTERVAL '365 days', 1000),
  ('VERANO20', 20, true, NOW() + INTERVAL '60 days', 500),
  ('BLACKFRIDAY30', 30, true, NOW() + INTERVAL '30 days', 200),
  ('NEWSLETTER15', 15, true, NOW() + INTERVAL '90 days', NULL)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- STORAGE: Bucket para imágenes de productos
-- =============================================
-- NOTA: Crear manualmente desde la UI de Supabase > Storage:
-- 1. Crear bucket: product-images
-- 2. Marcar como público
-- 3. Añadir políticas:
--    - SELECT: Permitir para todos (public)
--    - INSERT: Permitir para authenticated users
--    - UPDATE: Permitir para authenticated users
--    - DELETE: Permitir para authenticated users

-- =============================================
-- TRIGGER: Actualizar updated_at automáticamente
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_returns_updated_at
  BEFORE UPDATE ON public.returns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FIN DEL SCHEMA
-- =============================================
