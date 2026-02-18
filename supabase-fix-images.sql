-- =============================================
-- Benice Pet Shop - Arreglar imágenes rotas
-- Ejecutar en Supabase SQL Editor
-- =============================================
-- Este script reemplaza TODAS las URLs de imágenes rotas (miscota.com)
-- con placeholders funcionales de placehold.co que muestran el nombre del producto.
--
-- Para producción, sube imágenes reales a Supabase Storage y actualiza
-- las URLs con las URLs públicas de tu bucket.
-- =============================================

-- Paso 1: Actualizar image_url con placehold.co usando el nombre del producto
UPDATE public.products
SET
  image_url = 'https://placehold.co/400x400/282c34/ffffff?text=' ||
    REPLACE(REPLACE(REPLACE(name, ' ', '+'), '''', ''), '/', '') ||
    '&font=montserrat',
  images = ARRAY[
    'https://placehold.co/400x400/282c34/ffffff?text=' ||
    REPLACE(REPLACE(REPLACE(name, ' ', '+'), '''', ''), '/', '') ||
    '&font=montserrat'
  ]
WHERE image_url LIKE '%static.miscota.com%'
   OR image_url LIKE '%via.placeholder%'
   OR image_url IS NULL
   OR image_url = '';

-- Verificación
SELECT name, image_url
FROM public.products
ORDER BY name
LIMIT 10;
