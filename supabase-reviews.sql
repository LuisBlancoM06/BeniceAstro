-- ============================================
-- SISTEMA DE VALORACIONES Y RESEÑAS
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- Tabla de reseñas de productos
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL DEFAULT 'Usuario',
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '' CHECK (char_length(comment) <= 1000),
  verified_purchase BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Un usuario solo puede dejar una reseña por producto
  UNIQUE(product_id, user_id)
);

-- Tabla para votos "útil" (evitar votos duplicados)
CREATE TABLE IF NOT EXISTS review_helpful_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(review_id, user_id)
);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON product_reviews(product_id, rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON product_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_helpful_votes_review ON review_helpful_votes(review_id);

-- Vista materializada para estadísticas de reviews por producto
CREATE OR REPLACE FUNCTION get_product_review_stats(p_product_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'avg_rating', COALESCE(ROUND(AVG(rating)::numeric, 1), 0),
    'total_reviews', COUNT(*),
    'distribution', json_build_object(
      '5', COUNT(*) FILTER (WHERE rating = 5),
      '4', COUNT(*) FILTER (WHERE rating = 4),
      '3', COUNT(*) FILTER (WHERE rating = 3),
      '2', COUNT(*) FILTER (WHERE rating = 2),
      '1', COUNT(*) FILTER (WHERE rating = 1)
    )
  ) INTO result
  FROM product_reviews
  WHERE product_id = p_product_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un usuario ha comprado un producto
CREATE OR REPLACE FUNCTION has_purchased_product(p_user_id UUID, p_product_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    WHERE o.user_id = p_user_id 
      AND oi.product_id = p_product_id
      AND o.status IN ('pagado', 'enviado', 'entregado')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_helpful_votes ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede leer reseñas
CREATE POLICY "Reseñas visibles para todos" ON product_reviews
  FOR SELECT USING (true);

-- Solo usuarios autenticados pueden crear reseñas
CREATE POLICY "Usuarios autenticados pueden crear reseñas" ON product_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Solo el autor puede editar su reseña
CREATE POLICY "Autor puede editar su reseña" ON product_reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- Solo el autor o admin pueden eliminar
CREATE POLICY "Autor o admin puede eliminar reseña" ON product_reviews
  FOR DELETE USING (
    auth.uid() = user_id 
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Votos helpful
CREATE POLICY "Votos visibles para todos" ON review_helpful_votes
  FOR SELECT USING (true);

CREATE POLICY "Usuarios autenticados pueden votar" ON review_helpful_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuario puede eliminar su voto" ON review_helpful_votes
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger para actualizar helpful_count automáticamente
CREATE OR REPLACE FUNCTION update_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE product_reviews 
    SET helpful_count = helpful_count + 1 
    WHERE id = NEW.review_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE product_reviews 
    SET helpful_count = helpful_count - 1 
    WHERE id = OLD.review_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_helpful_count
  AFTER INSERT OR DELETE ON review_helpful_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_helpful_count();

-- Trigger para marcar compra verificada automáticamente
CREATE OR REPLACE FUNCTION check_verified_purchase()
RETURNS TRIGGER AS $$
BEGIN
  NEW.verified_purchase := has_purchased_product(NEW.user_id, NEW.product_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_verified_purchase
  BEFORE INSERT ON product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION check_verified_purchase();
