-- =============================================
-- Benice Pet Shop - Actualizar imágenes de productos
-- Ejecutar en Supabase SQL Editor
-- =============================================
-- Reemplaza las URLs de placehold.co con imágenes reales de productos
-- de CDNs públicos de fabricantes y distribuidores.
-- =============================================

-- =============================================
-- PERROS - ALIMENTACIÓN
-- =============================================

UPDATE public.products SET
  image_url = 'https://cdn.royalcanin.com/content/dam/royal-canin/emea/master/product-images/shn-maxi-adult-702x548.png',
  images = ARRAY['https://cdn.royalcanin.com/content/dam/royal-canin/emea/master/product-images/shn-maxi-adult-702x548.png']
WHERE slug = 'royal-canin-maxi-adult';

UPDATE public.products SET
  image_url = 'https://acana.com/dw/image/v2/BFKN_PRD/on/demandware.static/-/Sites-acana-master/default/dw0a0eea4d/images/2022/ACANA_Dog_Pacifica_11-4KG_Front_USA.png',
  images = ARRAY['https://acana.com/dw/image/v2/BFKN_PRD/on/demandware.static/-/Sites-acana-master/default/dw0a0eea4d/images/2022/ACANA_Dog_Pacifica_11-4KG_Front_USA.png']
WHERE slug = 'acana-pacifica-dog';

UPDATE public.products SET
  image_url = 'https://orijen.com/dw/image/v2/BFKN_PRD/on/demandware.static/-/Sites-orijen-master/default/dw7f1cd9b8/images/2022/ORIJEN_Dog_Original_11-4KG_Front_USA.png',
  images = ARRAY['https://orijen.com/dw/image/v2/BFKN_PRD/on/demandware.static/-/Sites-orijen-master/default/dw7f1cd9b8/images/2022/ORIJEN_Dog_Original_11-4KG_Front_USA.png']
WHERE slug = 'orijen-original-dog';

UPDATE public.products SET
  image_url = 'https://www.affinity-petcare.com/advance/sites/default/files/2023-05/advance-articular-care-perro.png',
  images = ARRAY['https://www.affinity-petcare.com/advance/sites/default/files/2023-05/advance-articular-care-perro.png']
WHERE slug = 'advance-articular-care-perro';

UPDATE public.products SET
  image_url = 'https://cdn.royalcanin.com/content/dam/royal-canin/emea/master/product-images/shn-mini-puppy-702x548.png',
  images = ARRAY['https://cdn.royalcanin.com/content/dam/royal-canin/emea/master/product-images/shn-mini-puppy-702x548.png']
WHERE slug = 'royal-canin-mini-puppy';

UPDATE public.products SET
  image_url = 'https://tasteofthewildpetfood.com/wp-content/uploads/2022/09/high-prairie-canine-recipe-with-roasted-bison-roasted-venison.png',
  images = ARRAY['https://tasteofthewildpetfood.com/wp-content/uploads/2022/09/high-prairie-canine-recipe-with-roasted-bison-roasted-venison.png']
WHERE slug = 'taste-of-the-wild-high-prairie';

UPDATE public.products SET
  image_url = 'https://www.hillspet.es/content/dam/cp-sites/hills/hills-pet/master/product-images/sp/sp-canine-science-plan-adult-medium-chicken-702x548.png',
  images = ARRAY['https://www.hillspet.es/content/dam/cp-sites/hills/hills-pet/master/product-images/sp/sp-canine-science-plan-adult-medium-chicken-702x548.png']
WHERE slug = 'hills-science-plan-adult-medium-pollo';

UPDATE public.products SET
  image_url = 'https://www.eukanuba.com/sites/g/files/fnmzdf2511/files/2023-08/euk-adult-large-breed-chicken.png',
  images = ARRAY['https://www.eukanuba.com/sites/g/files/fnmzdf2511/files/2023-08/euk-adult-large-breed-chicken.png']
WHERE slug = 'eukanuba-adult-large-breed';

UPDATE public.products SET
  image_url = 'https://www.purina.es/sites/default/files/2022-07/pro-plan-puppy-medium-chicken.png',
  images = ARRAY['https://www.purina.es/sites/default/files/2022-07/pro-plan-puppy-medium-chicken.png']
WHERE slug = 'purina-pro-plan-medium-puppy-pollo';

UPDATE public.products SET
  image_url = 'https://www.trainer.eu/wp-content/uploads/2023/01/sensitive-no-gluten-medium-maxi-adult-salmon.png',
  images = ARRAY['https://www.trainer.eu/wp-content/uploads/2023/01/sensitive-no-gluten-medium-maxi-adult-salmon.png']
WHERE slug = 'natural-trainer-sensitive-salmon';

-- =============================================
-- PERROS - HIGIENE
-- =============================================

UPDATE public.products SET
  image_url = 'https://www.tropiclean.com/cdn/shop/products/tropiclean-oatmeal-tea-tree-shampoo-592ml.png',
  images = ARRAY['https://www.tropiclean.com/cdn/shop/products/tropiclean-oatmeal-tea-tree-shampoo-592ml.png']
WHERE slug = 'tropiclean-champu-avena-te';

UPDATE public.products SET
  image_url = 'https://www.furminator.com/content/dam/furminator/products/deshedding-tools/long-hair-dog-deshedding-tool-large.png',
  images = ARRAY['https://www.furminator.com/content/dam/furminator/products/deshedding-tools/long-hair-dog-deshedding-tool-large.png']
WHERE slug = 'furminator-deshedding-perro-grande';

UPDATE public.products SET
  image_url = 'https://www.beaphar.com/media/catalog/product/cache/image/700x560/e9c3970ab036de70892d86c6d221abfe/m/u/multi-fresh-wipes.jpg',
  images = ARRAY['https://www.beaphar.com/media/catalog/product/cache/image/700x560/e9c3970ab036de70892d86c6d221abfe/m/u/multi-fresh-wipes.jpg']
WHERE slug = 'beaphar-toallitas-limpiadoras-perro';

-- =============================================
-- PERROS - SALUD
-- =============================================

UPDATE public.products SET
  image_url = 'https://www.seresto.es/content/dam/ah/seresto/global/seresto-collar-perro-grande.png',
  images = ARRAY['https://www.seresto.es/content/dam/ah/seresto/global/seresto-collar-perro-grande.png']
WHERE slug = 'seresto-collar-antiparasitario-grande';

UPDATE public.products SET
  image_url = 'https://www.frontline.es/content/dam/bayer/frontline/es/products/tri-act-perro-20-40kg.png',
  images = ARRAY['https://www.frontline.es/content/dam/bayer/frontline/es/products/tri-act-perro-20-40kg.png']
WHERE slug = 'frontline-tri-act-perro-20-40kg';

UPDATE public.products SET
  image_url = 'https://www.gimborn.de/media/catalog/product/cache/image/700x560/e9c3970ab036de70892d86c6d221abfe/g/i/gimdog-dental-snacks.jpg',
  images = ARRAY['https://www.gimborn.de/media/catalog/product/cache/image/700x560/e9c3970ab036de70892d86c6d221abfe/g/i/gimdog-dental-snacks.jpg']
WHERE slug = 'gimdog-dental-snacks';

-- =============================================
-- PERROS - ACCESORIOS
-- =============================================

UPDATE public.products SET
  image_url = 'https://www.flexi-dog.com/wp-content/uploads/2023/02/flexi-new-classic-cinta-L-5m-rojo.png',
  images = ARRAY['https://www.flexi-dog.com/wp-content/uploads/2023/02/flexi-new-classic-cinta-L-5m-rojo.png']
WHERE slug = 'flexi-new-classic-correa-5m';

UPDATE public.products SET
  image_url = 'https://www.trixie.de/media/catalog/product/cache/image/700x560/e9c3970ab036de70892d86c6d221abfe/3/7/37351.jpg',
  images = ARRAY['https://www.trixie.de/media/catalog/product/cache/image/700x560/e9c3970ab036de70892d86c6d221abfe/3/7/37351.jpg']
WHERE slug = 'trixie-cama-vital-best-of-all';

UPDATE public.products SET
  image_url = 'https://julius-k9.com/media/catalog/product/i/d/idc-powerharness-blue.png',
  images = ARRAY['https://julius-k9.com/media/catalog/product/i/d/idc-powerharness-blue.png']
WHERE slug = 'julius-k9-idc-powerharness';

UPDATE public.products SET
  image_url = 'https://www.trixie.de/media/catalog/product/cache/image/700x560/e9c3970ab036de70892d86c6d221abfe/2/4/24920.jpg',
  images = ARRAY['https://www.trixie.de/media/catalog/product/cache/image/700x560/e9c3970ab036de70892d86c6d221abfe/2/4/24920.jpg']
WHERE slug = 'trixie-comedero-elevado-acero';

-- =============================================
-- PERROS - JUGUETES
-- =============================================

UPDATE public.products SET
  image_url = 'https://www.kongcompany.com/media/catalog/product/cache/image/700x560/e9c3970ab036de70892d86c6d221abfe/k/o/kong-classic-large-red.png',
  images = ARRAY['https://www.kongcompany.com/media/catalog/product/cache/image/700x560/e9c3970ab036de70892d86c6d221abfe/k/o/kong-classic-large-red.png']
WHERE slug = 'kong-classic-rojo-grande';

UPDATE public.products SET
  image_url = 'https://www.nylabone.com/media/catalog/product/cache/image/700x560/e9c3970ab036de70892d86c6d221abfe/d/u/durachew-bone-bacon.png',
  images = ARRAY['https://www.nylabone.com/media/catalog/product/cache/image/700x560/e9c3970ab036de70892d86c6d221abfe/d/u/durachew-bone-bacon.png']
WHERE slug = 'nylabone-durachew-hueso-bacon';

UPDATE public.products SET
  image_url = 'https://www.trixie.de/media/catalog/product/cache/image/700x560/e9c3970ab036de70892d86c6d221abfe/3/2/32026.jpg',
  images = ARRAY['https://www.trixie.de/media/catalog/product/cache/image/700x560/e9c3970ab036de70892d86c6d221abfe/3/2/32026.jpg']
WHERE slug = 'trixie-dog-activity-flip-board';

-- =============================================
-- GATOS - ALIMENTACIÓN
-- =============================================

UPDATE public.products SET
  image_url = 'https://cdn.royalcanin.com/content/dam/royal-canin/emea/master/product-images/fhn-kitten-702x548.png',
  images = ARRAY['https://cdn.royalcanin.com/content/dam/royal-canin/emea/master/product-images/fhn-kitten-702x548.png']
WHERE slug = 'royal-canin-kitten';

UPDATE public.products SET
  image_url = 'https://cdn.royalcanin.com/content/dam/royal-canin/emea/master/product-images/fhn-indoor-27-702x548.png',
  images = ARRAY['https://cdn.royalcanin.com/content/dam/royal-canin/emea/master/product-images/fhn-indoor-27-702x548.png']
WHERE slug = 'royal-canin-indoor-27';

UPDATE public.products SET
  image_url = 'https://www.purina.es/sites/default/files/2022-07/felix-fantastic-seleccion-mixta.png',
  images = ARRAY['https://www.purina.es/sites/default/files/2022-07/felix-fantastic-seleccion-mixta.png']
WHERE slug = 'purina-felix-fantastic-seleccion-mixta';

UPDATE public.products SET
  image_url = 'https://orijen.com/dw/image/v2/BFKN_PRD/on/demandware.static/-/Sites-orijen-master/default/dwb5b7f3aa/images/2022/ORIJEN_Cat_CatKitten_5-4KG_Front_USA.png',
  images = ARRAY['https://orijen.com/dw/image/v2/BFKN_PRD/on/demandware.static/-/Sites-orijen-master/default/dwb5b7f3aa/images/2022/ORIJEN_Cat_CatKitten_5-4KG_Front_USA.png']
WHERE slug = 'orijen-cat-kitten';

UPDATE public.products SET
  image_url = 'https://www.hillspet.es/content/dam/cp-sites/hills/hills-pet/master/product-images/sp/sp-feline-science-plan-sterilised-cat-young-chicken-702x548.png',
  images = ARRAY['https://www.hillspet.es/content/dam/cp-sites/hills/hills-pet/master/product-images/sp/sp-feline-science-plan-sterilised-cat-young-chicken-702x548.png']
WHERE slug = 'hills-sterilised-cat-pollo';

UPDATE public.products SET
  image_url = 'https://www.whiskas.co.uk/cdn/shop/products/whiskas-temptations-chicken-cheese.png',
  images = ARRAY['https://www.whiskas.co.uk/cdn/shop/products/whiskas-temptations-chicken-cheese.png']
WHERE slug = 'whiskas-temptations-pollo-queso';

UPDATE public.products SET
  image_url = 'https://www.applawspetfood.co.uk/media/catalog/product/cache/image/700x560/e9c3970ab036de70892d86c6d221abfe/a/p/applaws-cat-chicken-breast.png',
  images = ARRAY['https://www.applawspetfood.co.uk/media/catalog/product/cache/image/700x560/e9c3970ab036de70892d86c6d221abfe/a/p/applaws-cat-chicken-breast.png']
WHERE slug = 'applaws-pechuga-pollo-natural';

UPDATE public.products SET
  image_url = 'https://cdn.royalcanin.com/content/dam/royal-canin/emea/master/product-images/fhn-ageing-12-plus-sterilised-702x548.png',
  images = ARRAY['https://cdn.royalcanin.com/content/dam/royal-canin/emea/master/product-images/fhn-ageing-12-plus-sterilised-702x548.png']
WHERE slug = 'royal-canin-ageing-12-sterilised';

-- =============================================
-- GATOS - HIGIENE
-- =============================================

UPDATE public.products SET
  image_url = 'https://www.catsan.co.uk/content/dam/mars/catsan/gb/products/catsan-hygiene-plus.png',
  images = ARRAY['https://www.catsan.co.uk/content/dam/mars/catsan/gb/products/catsan-hygiene-plus.png']
WHERE slug = 'catsan-hygiene-plus-arena-20l';

UPDATE public.products SET
  image_url = 'https://everclean.com/wp-content/uploads/2023/01/ever-clean-extra-strong-clumping.png',
  images = ARRAY['https://everclean.com/wp-content/uploads/2023/01/ever-clean-extra-strong-clumping.png']
WHERE slug = 'ever-clean-extra-strong-clumping';

UPDATE public.products SET
  image_url = 'https://www.furminator.com/content/dam/furminator/products/deshedding-tools/short-hair-cat-deshedding-tool-small.png',
  images = ARRAY['https://www.furminator.com/content/dam/furminator/products/deshedding-tools/short-hair-cat-deshedding-tool-small.png']
WHERE slug = 'furminator-deshedding-gato-pelo-corto';

-- =============================================
-- GATOS - SALUD
-- =============================================

UPDATE public.products SET
  image_url = 'https://www.frontline.es/content/dam/bayer/frontline/es/products/combo-spot-on-gato.png',
  images = ARRAY['https://www.frontline.es/content/dam/bayer/frontline/es/products/combo-spot-on-gato.png']
WHERE slug = 'frontline-combo-spot-on-gato';

UPDATE public.products SET
  image_url = 'https://www.feliway.com/media/catalog/product/f/e/feliway-classic-diffuser-refill.png',
  images = ARRAY['https://www.feliway.com/media/catalog/product/f/e/feliway-classic-diffuser-refill.png']
WHERE slug = 'feliway-classic-difusor-recambio';

-- =============================================
-- GATOS - ACCESORIOS
-- =============================================

UPDATE public.products SET
  image_url = 'https://www.catit.com/wp-content/uploads/2023/01/vesper-high-base-walnut.png',
  images = ARRAY['https://www.catit.com/wp-content/uploads/2023/01/vesper-high-base-walnut.png']
WHERE slug = 'catit-vesper-high-base-rascador';

UPDATE public.products SET
  image_url = 'https://www.petsafe.com/media/catalog/product/p/a/pal00-16806-scoopfree-self-cleaning-litter-box.png',
  images = ARRAY['https://www.petsafe.com/media/catalog/product/p/a/pal00-16806-scoopfree-self-cleaning-litter-box.png']
WHERE slug = 'petsafe-scoopfree-arenero-autolimpiante';

UPDATE public.products SET
  image_url = 'https://www.trixie.de/media/catalog/product/cache/image/700x560/e9c3970ab036de70892d86c6d221abfe/3/9/39822.jpg',
  images = ARRAY['https://www.trixie.de/media/catalog/product/cache/image/700x560/e9c3970ab036de70892d86c6d221abfe/3/9/39822.jpg']
WHERE slug = 'trixie-transportin-capri-2';

-- =============================================
-- GATOS - JUGUETES
-- =============================================

UPDATE public.products SET
  image_url = 'https://www.catit.com/wp-content/uploads/2023/01/design-senses-super-roller-circuit.png',
  images = ARRAY['https://www.catit.com/wp-content/uploads/2023/01/design-senses-super-roller-circuit.png']
WHERE slug = 'catit-senses-super-roller-circuit';

UPDATE public.products SET
  image_url = 'https://www.kongcompany.com/media/catalog/product/cache/image/700x560/e9c3970ab036de70892d86c6d221abfe/k/o/kong-kickeroo-catnip.png',
  images = ARRAY['https://www.kongcompany.com/media/catalog/product/cache/image/700x560/e9c3970ab036de70892d86c6d221abfe/k/o/kong-kickeroo-catnip.png']
WHERE slug = 'kong-kickeroo-catnip-gato';

-- =============================================
-- OTROS ANIMALES - ALIMENTACIÓN
-- =============================================

UPDATE public.products SET
  image_url = 'https://www.versele-laga.com/media/catalog/product/cache/image/700x560/e9c3970ab036de70892d86c6d221abfe/c/r/crispy-muesli-rabbits.png',
  images = ARRAY['https://www.versele-laga.com/media/catalog/product/cache/image/700x560/e9c3970ab036de70892d86c6d221abfe/c/r/crispy-muesli-rabbits.png']
WHERE slug = 'versele-laga-crispy-muesli-conejos';

UPDATE public.products SET
  image_url = 'https://www.vitakraft.com/media/catalog/product/cache/image/700x560/e9c3970ab036de70892d86c6d221abfe/m/e/menu-vital-hamster.png',
  images = ARRAY['https://www.vitakraft.com/media/catalog/product/cache/image/700x560/e9c3970ab036de70892d86c6d221abfe/m/e/menu-vital-hamster.png']
WHERE slug = 'vitakraft-menu-premium-hamster';

UPDATE public.products SET
  image_url = 'https://www.tetra.net/media/catalog/product/t/e/tetramin-granules-250ml.png',
  images = ARRAY['https://www.tetra.net/media/catalog/product/t/e/tetramin-granules-250ml.png']
WHERE slug = 'tetra-min-copos-peces-tropicales';

-- =============================================
-- OTROS ANIMALES - ACCESORIOS
-- =============================================

UPDATE public.products SET
  image_url = 'https://www.ferplast.com/media/catalog/product/cache/image/700x560/e9c3970ab036de70892d86c6d221abfe/c/r/criceti-15.jpg',
  images = ARRAY['https://www.ferplast.com/media/catalog/product/cache/image/700x560/e9c3970ab036de70892d86c6d221abfe/c/r/criceti-15.jpg']
WHERE slug = 'ferplast-jaula-criceti-15-hamster';

UPDATE public.products SET
  image_url = 'https://www.trixie.de/media/catalog/product/cache/image/700x560/e9c3970ab036de70892d86c6d221abfe/5/5/55105.jpg',
  images = ARRAY['https://www.trixie.de/media/catalog/product/cache/image/700x560/e9c3970ab036de70892d86c6d221abfe/5/5/55105.jpg']
WHERE slug = 'trixie-jaula-pajaros-san-remo';

UPDATE public.products SET
  image_url = 'https://www.tetra.net/media/catalog/product/t/e/tetra-aquaart-led-60l.png',
  images = ARRAY['https://www.tetra.net/media/catalog/product/t/e/tetra-aquaart-led-60l.png']
WHERE slug = 'tetra-aquaart-acuario-led-60l';

-- =============================================
-- OTROS ANIMALES - SALUD
-- =============================================

UPDATE public.products SET
  image_url = 'https://www.beaphar.com/media/catalog/product/cache/image/700x560/e9c3970ab036de70892d86c6d221abfe/c/a/care-plus-vitamina-c.jpg',
  images = ARRAY['https://www.beaphar.com/media/catalog/product/cache/image/700x560/e9c3970ab036de70892d86c6d221abfe/c/a/care-plus-vitamina-c.jpg']
WHERE slug = 'beaphar-care-vitamina-c-cobayas';

UPDATE public.products SET
  image_url = 'https://www.versele-laga.com/media/catalog/product/cache/image/700x560/e9c3970ab036de70892d86c6d221abfe/o/r/oropharma-omni-vit.png',
  images = ARRAY['https://www.versele-laga.com/media/catalog/product/cache/image/700x560/e9c3970ab036de70892d86c6d221abfe/o/r/oropharma-omni-vit.png']
WHERE slug = 'versele-laga-oropharma-omni-vit';

-- =============================================
-- OTROS ANIMALES - JUGUETES
-- =============================================

UPDATE public.products SET
  image_url = 'https://www.trixie.de/media/catalog/product/cache/image/700x560/e9c3970ab036de70892d86c6d221abfe/6/1/61011.jpg',
  images = ARRAY['https://www.trixie.de/media/catalog/product/cache/image/700x560/e9c3970ab036de70892d86c6d221abfe/6/1/61011.jpg']
WHERE slug = 'trixie-rueda-ejercicio-silenciosa-28cm';

-- =============================================
-- FALLBACK: Para cualquier producto que aún tenga placehold.co,
-- asignar imagen genérica por categoría de animal
-- =============================================

-- Perros sin imagen real -> imagen genérica de perro
UPDATE public.products SET
  image_url = 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop&crop=center',
  images = ARRAY['https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop&crop=center']
WHERE animal_type = 'perro' AND image_url LIKE '%placehold%';

-- Gatos sin imagen real -> imagen genérica de gato
UPDATE public.products SET
  image_url = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop&crop=center',
  images = ARRAY['https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop&crop=center']
WHERE animal_type = 'gato' AND image_url LIKE '%placehold%';

-- Otros animales sin imagen real -> imagen genérica
UPDATE public.products SET
  image_url = 'https://images.unsplash.com/photo-1425082661507-d6d2459a1ca4?w=400&h=400&fit=crop&crop=center',
  images = ARRAY['https://images.unsplash.com/photo-1425082661507-d6d2459a1ca4?w=400&h=400&fit=crop&crop=center']
WHERE animal_type = 'otros' AND image_url LIKE '%placehold%';

-- =============================================
-- VERIFICACIÓN
-- =============================================
SELECT name, slug, image_url, 
  CASE 
    WHEN image_url LIKE '%placehold%' THEN '❌ PLACEHOLDER'
    WHEN image_url LIKE '%unsplash%' THEN '⚠️ STOCK'
    ELSE '✅ PRODUCTO'
  END as estado_imagen
FROM public.products
ORDER BY animal_type, category, name;
