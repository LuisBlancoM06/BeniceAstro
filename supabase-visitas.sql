-- ============================================
-- TABLA DE VISITAS / TRACKING DE VISITANTES
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- Tabla principal de visitas
CREATE TABLE IF NOT EXISTS visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  page TEXT NOT NULL,
  user_agent TEXT,
  referer TEXT,
  country TEXT,
  city TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_visits_created_at ON visits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visits_page ON visits(page);

-- RLS: Solo admins pueden leer las visitas
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

-- Política: cualquiera puede insertar (el middleware inserta)
CREATE POLICY "Permitir insertar visitas" ON visits
  FOR INSERT WITH CHECK (true);

-- Política: solo admins pueden leer
CREATE POLICY "Solo admins leen visitas" ON visits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Vista resumen de visitas por día (sin exponer IPs)
CREATE OR REPLACE VIEW visits_daily AS
SELECT 
  DATE(created_at) as fecha,
  COUNT(*) as total_visitas,
  COUNT(DISTINCT user_id) as visitantes_unicos,
  COUNT(DISTINCT page) as paginas_vistas
FROM visits
GROUP BY DATE(created_at)
ORDER BY fecha DESC;

-- Vista de páginas más visitadas (sin IPs)
CREATE OR REPLACE VIEW visits_top_pages AS
SELECT 
  page,
  COUNT(*) as total_visitas,
  MAX(created_at) as ultima_visita,
  COUNT(DISTINCT user_id) as usuarios_unicos
FROM visits
GROUP BY page
ORDER BY total_visitas DESC;
