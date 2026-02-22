-- ============================================================
-- MIGRACION PENDIENTE - Benice Pet Shop
-- Ejecutar TODO este archivo en Supabase SQL Editor
-- https://supabase.com/dashboard → SQL Editor → New Query → Pegar → Run
-- ============================================================

-- ============================================================
-- 1. create_order_and_reduce_stock
--    Crea un pedido + items + reduce stock atomicamente.
--    Llamado desde: process-order.ts, create-order.ts
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_order_and_reduce_stock(
  p_user_id UUID,
  p_total NUMERIC,
  p_items JSONB,
  p_promo_code TEXT DEFAULT NULL,
  p_discount_amount NUMERIC DEFAULT 0,
  p_shipping_address TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_order_id UUID;
  item JSONB;
  product_stock INTEGER;
BEGIN
  -- Crear el pedido con estado 'pagado' (el pago ya fue verificado por Stripe)
  INSERT INTO public.orders (user_id, total, status, promo_code, discount_amount, shipping_address)
  VALUES (p_user_id, p_total, 'pagado', p_promo_code, p_discount_amount, p_shipping_address)
  RETURNING id INTO new_order_id;

  -- Procesar cada item
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Bloquear fila del producto para evitar race conditions
    SELECT stock INTO product_stock
    FROM public.products
    WHERE id = (item->>'product_id')::UUID
    FOR UPDATE;

    IF product_stock IS NULL THEN
      RAISE EXCEPTION 'Producto no encontrado: %', item->>'product_id';
    END IF;

    IF product_stock < (item->>'quantity')::INTEGER THEN
      RAISE EXCEPTION 'Stock insuficiente para producto: %', item->>'product_id';
    END IF;

    -- Insertar item del pedido
    INSERT INTO public.order_items (order_id, product_id, quantity, price)
    VALUES (
      new_order_id,
      (item->>'product_id')::UUID,
      (item->>'quantity')::INTEGER,
      (item->>'price')::NUMERIC
    );

    -- Reducir stock
    UPDATE public.products
    SET stock = stock - (item->>'quantity')::INTEGER
    WHERE id = (item->>'product_id')::UUID;
  END LOOP;

  RETURN new_order_id;
END;
$$;

-- ============================================================
-- 2. cancel_order_and_restore_stock
--    Cancela un pedido y restaura el stock de cada item.
--    Llamado desde: approve-cancellation.ts
-- ============================================================
CREATE OR REPLACE FUNCTION public.cancel_order_and_restore_stock(
  order_uuid UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Cambiar estado del pedido a cancelado
  UPDATE public.orders
  SET status = 'cancelado', updated_at = NOW()
  WHERE id = order_uuid;

  -- Restaurar stock de cada item del pedido
  UPDATE public.products p
  SET stock = p.stock + oi.quantity
  FROM public.order_items oi
  WHERE oi.order_id = order_uuid
    AND p.id = oi.product_id;
END;
$$;

-- ============================================================
-- 3. increment_promo_uses
--    Incrementa el contador de usos de un codigo promocional.
--    Llamado desde: process-order.ts, create-order.ts
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_promo_uses(
  p_code TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.promo_codes
  SET current_uses = COALESCE(current_uses, 0) + 1
  WHERE code = p_code;
END;
$$;

-- ============================================================
-- 4. get_order_status_counts
--    Devuelve conteos de pedidos agrupados por estado.
--    Llamado desde: admin/pedidos.astro
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_order_status_counts()
RETURNS TABLE(status TEXT, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT o.status, COUNT(*)::BIGINT
  FROM public.orders o
  GROUP BY o.status;
END;
$$;

-- ============================================================
-- 5. generate_invoice_number
--    Genera numeros de factura secuenciales (FAC-2026-000001
--    o ABO-2026-000001 para abonos).
--    Llamado desde: process-return.ts
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_invoice_number(
  inv_type TEXT DEFAULT 'factura'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  prefix TEXT;
  year_str TEXT;
  last_number TEXT;
  seq INTEGER;
  candidate TEXT;
BEGIN
  IF inv_type = 'abono' THEN
    prefix := 'ABO';
  ELSE
    prefix := 'FAC';
  END IF;

  year_str := EXTRACT(YEAR FROM NOW())::TEXT;

  -- Obtener el ultimo numero de factura con este prefijo y anio
  SELECT invoice_number INTO last_number
  FROM public.invoices
  WHERE invoice_number LIKE prefix || '-' || year_str || '-%'
  ORDER BY invoice_number DESC
  LIMIT 1;

  IF last_number IS NULL THEN
    seq := 1;
  ELSE
    seq := COALESCE(
      CAST(SUBSTRING(last_number FROM '\d+$') AS INTEGER),
      0
    ) + 1;
  END IF;

  candidate := prefix || '-' || year_str || '-' || LPAD(seq::TEXT, 6, '0');

  RETURN candidate;
END;
$$;
