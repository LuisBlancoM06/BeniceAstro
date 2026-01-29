-- =============================================
-- BeniceAstro - Actualización de Seguridad
-- Ejecutar en Supabase SQL Editor
-- =============================================
-- Este script:
-- 1. Elimina políticas y funciones antiguas
-- 2. Crea las nuevas con search_path y validaciones
-- =============================================

-- =============================================
-- PASO 1: ELIMINAR POLÍTICAS ANTIGUAS DE USERS
-- =============================================

DROP POLICY IF EXISTS "Users pueden ver su propio perfil" ON public.users;
DROP POLICY IF EXISTS "Users pueden actualizar su propio perfil" ON public.users;
DROP POLICY IF EXISTS "Users pueden actualizar su propio perfil excepto rol" ON public.users;
DROP POLICY IF EXISTS "Users pueden crear su perfil" ON public.users;

-- =============================================
-- PASO 2: CREAR NUEVAS POLÍTICAS DE USERS
-- =============================================

-- Los usuarios pueden ver su propio perfil
CREATE POLICY "Users pueden ver su propio perfil"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Los usuarios pueden actualizar su perfil PERO NO el rol
CREATE POLICY "Users pueden actualizar su propio perfil excepto rol"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND role = (SELECT role FROM public.users WHERE id = auth.uid())
  );

-- Los usuarios pueden insertar su propio perfil al registrarse (solo rol 'user')
CREATE POLICY "Users pueden crear su perfil"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id AND role = 'user');

-- =============================================
-- PASO 3: ELIMINAR POLÍTICAS ANTIGUAS DE NEWSLETTERS
-- =============================================
DROP POLICY IF EXISTS "Newsletters pueden ser creadas por cualquiera" ON public.newsletters;
DROP POLICY IF EXISTS "Newsletters INSERT con validación" ON public.newsletters;

-- =============================================
-- PASO 4: CREAR NUEVAS POLÍTICAS DE NEWSLETTERS
-- =============================================

-- Cualquiera puede suscribirse (validando email)
CREATE POLICY "Newsletters INSERT con validación"
  ON public.newsletters FOR INSERT
  TO public
  WITH CHECK (
    email IS NOT NULL 
    AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  );

-- Admins pueden ver todas las suscripciones
DROP POLICY IF EXISTS "Admins pueden ver newsletters" ON public.newsletters;
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
-- PASO 5: ELIMINAR Y RECREAR FUNCIONES CON SEARCH_PATH
-- =============================================

-- Función: Generar número de factura
DROP FUNCTION IF EXISTS generate_invoice_number(TEXT);
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
DROP FUNCTION IF EXISTS cancel_order_and_restore_stock(UUID);
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
DROP FUNCTION IF EXISTS create_order_and_reduce_stock(UUID, DECIMAL, JSONB, TEXT, DECIMAL);
CREATE OR REPLACE FUNCTION create_order_and_reduce_stock(
  p_user_id UUID,
  p_total DECIMAL,
  p_items JSONB,
  p_promo_code TEXT DEFAULT NULL,
  p_discount_amount DECIMAL DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
  new_order_id UUID;
  item JSONB;
BEGIN
  -- Crear el pedido
  INSERT INTO public.orders (user_id, total, status, promo_code, discount_amount)
  VALUES (p_user_id, p_total, 'pagado', p_promo_code, p_discount_amount)
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
DROP FUNCTION IF EXISTS get_order_status_counts();
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
DROP FUNCTION IF EXISTS get_dashboard_stats();
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

-- Función: Trigger para updated_at
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================
-- PASO 6: RECREAR TRIGGERS
-- =============================================

-- Trigger para orders
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para returns (si existe la tabla)
DROP TRIGGER IF EXISTS update_returns_updated_at ON public.returns;
CREATE TRIGGER update_returns_updated_at
  BEFORE UPDATE ON public.returns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para site_settings (si existe la tabla)
DROP TRIGGER IF EXISTS update_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- VERIFICACIÓN
-- =============================================
-- Ejecuta estas consultas para verificar que todo está correcto:

-- Ver funciones con search_path
-- SELECT proname, prosecdef, proconfig FROM pg_proc WHERE proname IN ('generate_invoice_number', 'cancel_order_and_restore_stock', 'create_order_and_reduce_stock', 'get_order_status_counts', 'get_dashboard_stats', 'update_updated_at_column');

-- Ver políticas de users
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'users';

-- Ver políticas de newsletters
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'newsletters';

-- =============================================
-- FIN DEL SCRIPT
-- =============================================
SELECT 'Actualización de seguridad completada correctamente' AS resultado;
