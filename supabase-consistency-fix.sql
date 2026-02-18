-- =============================================
-- BeniceAstro + BeniceFlutter - Fixes de Consistencia
-- Ejecutar en Supabase SQL Editor DESPUÉS de supabase-update-premium.sql
-- =============================================

-- =============================================
-- 1. ACTUALIZAR RPC create_order_and_reduce_stock 
--    para aceptar y guardar shipping_address
-- =============================================
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
  -- Crear el pedido (ahora con shipping_address)
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

-- =============================================
-- 2. ACTUALIZAR brand DEFAULT de 'Venice' a 'Benice' 
--    (alinear nombre real de la marca)
-- =============================================
ALTER TABLE public.products ALTER COLUMN brand SET DEFAULT 'Benice';

-- Actualizar productos existentes con brand='Venice' a 'Benice'
UPDATE public.products SET brand = 'Benice' WHERE brand = 'Venice';
UPDATE public.products SET brand = 'Benice' WHERE brand = 'BeniceAstro';

-- =============================================
-- 3. Agregar CHECK constraint a newsletter source
--    para evitar valores inconsistentes
-- =============================================
DO $$
BEGIN
  -- Solo agregar si no existe ya
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'newsletters_source_check'
  ) THEN
    ALTER TABLE public.newsletters
      ADD CONSTRAINT newsletters_source_check
      CHECK (source IN ('web', 'app', 'footer', 'admin'));
  END IF;
END $$;

-- =============================================
-- FIN DE LOS FIXES DE CONSISTENCIA
-- =============================================
