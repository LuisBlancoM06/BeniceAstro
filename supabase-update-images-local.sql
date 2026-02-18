-- =============================================
-- Benice Pet Shop - Actualizar imágenes de productos (RUTAS LOCALES)
-- Ejecutar en Supabase SQL Editor
-- =============================================
-- Reemplaza las URLs de placehold.co con imágenes locales
-- almacenadas en /images/productos/
-- =============================================

-- =============================================
-- PERROS - ALIMENTACIÓN (10)
-- =============================================

UPDATE public.products SET
  image_url = '/images/productos/royal-canin-maxi-adult.jpg',
  images = ARRAY['/images/productos/royal-canin-maxi-adult.jpg']
WHERE slug = 'royal-canin-maxi-adult';

UPDATE public.products SET
  image_url = '/images/productos/acana-pacifica-dog.jpg',
  images = ARRAY['/images/productos/acana-pacifica-dog.jpg']
WHERE slug = 'acana-pacifica-dog';

UPDATE public.products SET
  image_url = '/images/productos/orijen-original-dog.jpg',
  images = ARRAY['/images/productos/orijen-original-dog.jpg']
WHERE slug = 'orijen-original-dog';

UPDATE public.products SET
  image_url = '/images/productos/advance-articular-care-perro.jpg',
  images = ARRAY['/images/productos/advance-articular-care-perro.jpg']
WHERE slug = 'advance-articular-care-perro';

UPDATE public.products SET
  image_url = '/images/productos/royal-canin-mini-puppy.jpg',
  images = ARRAY['/images/productos/royal-canin-mini-puppy.jpg']
WHERE slug = 'royal-canin-mini-puppy';

UPDATE public.products SET
  image_url = '/images/productos/taste-of-the-wild-high-prairie.jpg',
  images = ARRAY['/images/productos/taste-of-the-wild-high-prairie.jpg']
WHERE slug = 'taste-of-the-wild-high-prairie';

UPDATE public.products SET
  image_url = '/images/productos/hills-science-plan-adult-medium-pollo.jpg',
  images = ARRAY['/images/productos/hills-science-plan-adult-medium-pollo.jpg']
WHERE slug = 'hills-science-plan-adult-medium-pollo';

UPDATE public.products SET
  image_url = '/images/productos/eukanuba-adult-large-breed.jpg',
  images = ARRAY['/images/productos/eukanuba-adult-large-breed.jpg']
WHERE slug = 'eukanuba-adult-large-breed';

UPDATE public.products SET
  image_url = '/images/productos/purina-pro-plan-medium-puppy-pollo.jpg',
  images = ARRAY['/images/productos/purina-pro-plan-medium-puppy-pollo.jpg']
WHERE slug = 'purina-pro-plan-medium-puppy-pollo';

UPDATE public.products SET
  image_url = '/images/productos/natural-trainer-sensitive-salmon.jpg',
  images = ARRAY['/images/productos/natural-trainer-sensitive-salmon.jpg']
WHERE slug = 'natural-trainer-sensitive-salmon';

-- =============================================
-- PERROS - HIGIENE (3)
-- =============================================

UPDATE public.products SET
  image_url = '/images/productos/tropiclean-champu-avena-te.jpg',
  images = ARRAY['/images/productos/tropiclean-champu-avena-te.jpg']
WHERE slug = 'tropiclean-champu-avena-te';

UPDATE public.products SET
  image_url = '/images/productos/furminator-deshedding-perro-grande.jpg',
  images = ARRAY['/images/productos/furminator-deshedding-perro-grande.jpg']
WHERE slug = 'furminator-deshedding-perro-grande';

UPDATE public.products SET
  image_url = '/images/productos/beaphar-toallitas-limpiadoras-perro.jpg',
  images = ARRAY['/images/productos/beaphar-toallitas-limpiadoras-perro.jpg']
WHERE slug = 'beaphar-toallitas-limpiadoras-perro';

-- =============================================
-- PERROS - SALUD (3)
-- =============================================

UPDATE public.products SET
  image_url = '/images/productos/seresto-collar-antiparasitario-grande.jpg',
  images = ARRAY['/images/productos/seresto-collar-antiparasitario-grande.jpg']
WHERE slug = 'seresto-collar-antiparasitario-grande';

UPDATE public.products SET
  image_url = '/images/productos/frontline-tri-act-perro-20-40kg.jpg',
  images = ARRAY['/images/productos/frontline-tri-act-perro-20-40kg.jpg']
WHERE slug = 'frontline-tri-act-perro-20-40kg';

UPDATE public.products SET
  image_url = '/images/productos/gimdog-dental-snacks.jpg',
  images = ARRAY['/images/productos/gimdog-dental-snacks.jpg']
WHERE slug = 'gimdog-dental-snacks';

-- =============================================
-- PERROS - ACCESORIOS (4)
-- =============================================

UPDATE public.products SET
  image_url = '/images/productos/flexi-new-classic-correa-5m.jpg',
  images = ARRAY['/images/productos/flexi-new-classic-correa-5m.jpg']
WHERE slug = 'flexi-new-classic-correa-5m';

UPDATE public.products SET
  image_url = '/images/productos/trixie-cama-vital-best-of-all.jpg',
  images = ARRAY['/images/productos/trixie-cama-vital-best-of-all.jpg']
WHERE slug = 'trixie-cama-vital-best-of-all';

UPDATE public.products SET
  image_url = '/images/productos/julius-k9-idc-powerharness.jpg',
  images = ARRAY['/images/productos/julius-k9-idc-powerharness.jpg']
WHERE slug = 'julius-k9-idc-powerharness';

UPDATE public.products SET
  image_url = '/images/productos/trixie-comedero-elevado-acero.jpg',
  images = ARRAY['/images/productos/trixie-comedero-elevado-acero.jpg']
WHERE slug = 'trixie-comedero-elevado-acero';

-- =============================================
-- PERROS - JUGUETES (3)
-- =============================================

UPDATE public.products SET
  image_url = '/images/productos/kong-classic-rojo-grande.jpg',
  images = ARRAY['/images/productos/kong-classic-rojo-grande.jpg']
WHERE slug = 'kong-classic-rojo-grande';

UPDATE public.products SET
  image_url = '/images/productos/nylabone-durachew-hueso-bacon.jpg',
  images = ARRAY['/images/productos/nylabone-durachew-hueso-bacon.jpg']
WHERE slug = 'nylabone-durachew-hueso-bacon';

UPDATE public.products SET
  image_url = '/images/productos/trixie-dog-activity-flip-board.jpg',
  images = ARRAY['/images/productos/trixie-dog-activity-flip-board.jpg']
WHERE slug = 'trixie-dog-activity-flip-board';

-- =============================================
-- GATOS - ALIMENTACIÓN (8)
-- =============================================

UPDATE public.products SET
  image_url = '/images/productos/royal-canin-kitten.jpg',
  images = ARRAY['/images/productos/royal-canin-kitten.jpg']
WHERE slug = 'royal-canin-kitten';

UPDATE public.products SET
  image_url = '/images/productos/royal-canin-indoor-27.jpg',
  images = ARRAY['/images/productos/royal-canin-indoor-27.jpg']
WHERE slug = 'royal-canin-indoor-27';

UPDATE public.products SET
  image_url = '/images/productos/purina-felix-fantastic-seleccion-mixta.jpg',
  images = ARRAY['/images/productos/purina-felix-fantastic-seleccion-mixta.jpg']
WHERE slug = 'purina-felix-fantastic-seleccion-mixta';

UPDATE public.products SET
  image_url = '/images/productos/orijen-cat-kitten.jpg',
  images = ARRAY['/images/productos/orijen-cat-kitten.jpg']
WHERE slug = 'orijen-cat-kitten';

UPDATE public.products SET
  image_url = '/images/productos/hills-sterilised-cat-pollo.jpg',
  images = ARRAY['/images/productos/hills-sterilised-cat-pollo.jpg']
WHERE slug = 'hills-sterilised-cat-pollo';

UPDATE public.products SET
  image_url = '/images/productos/whiskas-temptations-pollo-queso.jpg',
  images = ARRAY['/images/productos/whiskas-temptations-pollo-queso.jpg']
WHERE slug = 'whiskas-temptations-pollo-queso';

UPDATE public.products SET
  image_url = '/images/productos/applaws-pechuga-pollo-natural.jpg',
  images = ARRAY['/images/productos/applaws-pechuga-pollo-natural.jpg']
WHERE slug = 'applaws-pechuga-pollo-natural';

UPDATE public.products SET
  image_url = '/images/productos/royal-canin-ageing-12-sterilised.jpg',
  images = ARRAY['/images/productos/royal-canin-ageing-12-sterilised.jpg']
WHERE slug = 'royal-canin-ageing-12-sterilised';

-- =============================================
-- GATOS - HIGIENE (3)
-- =============================================

UPDATE public.products SET
  image_url = '/images/productos/catsan-hygiene-plus-arena-20l.jpg',
  images = ARRAY['/images/productos/catsan-hygiene-plus-arena-20l.jpg']
WHERE slug = 'catsan-hygiene-plus-arena-20l';

UPDATE public.products SET
  image_url = '/images/productos/ever-clean-extra-strong-clumping.jpg',
  images = ARRAY['/images/productos/ever-clean-extra-strong-clumping.jpg']
WHERE slug = 'ever-clean-extra-strong-clumping';

UPDATE public.products SET
  image_url = '/images/productos/furminator-deshedding-gato-pelo-corto.jpg',
  images = ARRAY['/images/productos/furminator-deshedding-gato-pelo-corto.jpg']
WHERE slug = 'furminator-deshedding-gato-pelo-corto';

-- =============================================
-- GATOS - SALUD (2)
-- =============================================

UPDATE public.products SET
  image_url = '/images/productos/frontline-combo-spot-on-gato.jpg',
  images = ARRAY['/images/productos/frontline-combo-spot-on-gato.jpg']
WHERE slug = 'frontline-combo-spot-on-gato';

UPDATE public.products SET
  image_url = '/images/productos/feliway-classic-difusor-recambio.jpg',
  images = ARRAY['/images/productos/feliway-classic-difusor-recambio.jpg']
WHERE slug = 'feliway-classic-difusor-recambio';

-- =============================================
-- GATOS - ACCESORIOS (3)
-- =============================================

UPDATE public.products SET
  image_url = '/images/productos/catit-vesper-high-base-rascador.jpg',
  images = ARRAY['/images/productos/catit-vesper-high-base-rascador.jpg']
WHERE slug = 'catit-vesper-high-base-rascador';

UPDATE public.products SET
  image_url = '/images/productos/petsafe-scoopfree-arenero-autolimpiante.jpg',
  images = ARRAY['/images/productos/petsafe-scoopfree-arenero-autolimpiante.jpg']
WHERE slug = 'petsafe-scoopfree-arenero-autolimpiante';

UPDATE public.products SET
  image_url = '/images/productos/trixie-transportin-capri-2.jpg',
  images = ARRAY['/images/productos/trixie-transportin-capri-2.jpg']
WHERE slug = 'trixie-transportin-capri-2';

-- =============================================
-- GATOS - JUGUETES (2)
-- =============================================

UPDATE public.products SET
  image_url = '/images/productos/catit-senses-super-roller-circuit.jpg',
  images = ARRAY['/images/productos/catit-senses-super-roller-circuit.jpg']
WHERE slug = 'catit-senses-super-roller-circuit';

UPDATE public.products SET
  image_url = '/images/productos/kong-kickeroo-catnip-gato.jpg',
  images = ARRAY['/images/productos/kong-kickeroo-catnip-gato.jpg']
WHERE slug = 'kong-kickeroo-catnip-gato';

-- =============================================
-- OTROS ANIMALES - ALIMENTACIÓN (3)
-- =============================================

UPDATE public.products SET
  image_url = '/images/productos/versele-laga-crispy-muesli-conejos.jpg',
  images = ARRAY['/images/productos/versele-laga-crispy-muesli-conejos.jpg']
WHERE slug = 'versele-laga-crispy-muesli-conejos';

UPDATE public.products SET
  image_url = '/images/productos/vitakraft-menu-premium-hamster.jpg',
  images = ARRAY['/images/productos/vitakraft-menu-premium-hamster.jpg']
WHERE slug = 'vitakraft-menu-premium-hamster';

UPDATE public.products SET
  image_url = '/images/productos/tetra-min-copos-peces-tropicales.jpg',
  images = ARRAY['/images/productos/tetra-min-copos-peces-tropicales.jpg']
WHERE slug = 'tetra-min-copos-peces-tropicales';

-- =============================================
-- OTROS ANIMALES - ACCESORIOS (3)
-- =============================================

UPDATE public.products SET
  image_url = '/images/productos/ferplast-jaula-criceti-15-hamster.jpg',
  images = ARRAY['/images/productos/ferplast-jaula-criceti-15-hamster.jpg']
WHERE slug = 'ferplast-jaula-criceti-15-hamster';

UPDATE public.products SET
  image_url = '/images/productos/trixie-jaula-pajaros-san-remo.jpg',
  images = ARRAY['/images/productos/trixie-jaula-pajaros-san-remo.jpg']
WHERE slug = 'trixie-jaula-pajaros-san-remo';

UPDATE public.products SET
  image_url = '/images/productos/tetra-aquaart-acuario-led-60l.jpg',
  images = ARRAY['/images/productos/tetra-aquaart-acuario-led-60l.jpg']
WHERE slug = 'tetra-aquaart-acuario-led-60l';

-- =============================================
-- OTROS ANIMALES - SALUD (2)
-- =============================================

UPDATE public.products SET
  image_url = '/images/productos/beaphar-care-vitamina-c-cobayas.jpg',
  images = ARRAY['/images/productos/beaphar-care-vitamina-c-cobayas.jpg']
WHERE slug = 'beaphar-care-vitamina-c-cobayas';

UPDATE public.products SET
  image_url = '/images/productos/versele-laga-oropharma-omni-vit.jpg',
  images = ARRAY['/images/productos/versele-laga-oropharma-omni-vit.jpg']
WHERE slug = 'versele-laga-oropharma-omni-vit';

-- =============================================
-- OTROS ANIMALES - JUGUETES (1)
-- =============================================

UPDATE public.products SET
  image_url = '/images/productos/trixie-rueda-ejercicio-silenciosa-28cm.jpg',
  images = ARRAY['/images/productos/trixie-rueda-ejercicio-silenciosa-28cm.jpg']
WHERE slug = 'trixie-rueda-ejercicio-silenciosa-28cm';

-- =============================================
-- FALLBACK: Cualquier producto que aún tenga placehold.co
-- =============================================

UPDATE public.products SET
  image_url = '/images/productos/' || slug || '.jpg',
  images = ARRAY['/images/productos/' || slug || '.jpg']
WHERE image_url LIKE '%placehold.co%';

-- =============================================
-- VERIFICACIÓN
-- =============================================

SELECT slug, image_url, 
  CASE 
    WHEN image_url LIKE '/images/productos/%' THEN '✅ LOCAL'
    WHEN image_url LIKE '%placehold.co%' THEN '❌ PLACEHOLDER'
    ELSE '⚠️ EXTERNO'
  END as estado
FROM public.products
ORDER BY slug;
