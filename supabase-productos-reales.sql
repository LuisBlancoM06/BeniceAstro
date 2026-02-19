-- =============================================
-- Benice Pet Shop - 50 Productos Reales
-- Marcas conocidas en España · Nombres cortos
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- Limpiar productos anteriores
DELETE FROM public.order_items WHERE product_id IN (SELECT id FROM public.products);
DELETE FROM public.products;

-- =============================================
-- INSERTAR 50 PRODUCTOS REALES
-- =============================================
INSERT INTO public.products (name, slug, description, price, sale_price, on_sale, stock, image_url, images, animal_type, size, category, age_range, brand)
VALUES

-- =============================================
-- PERROS - ALIMENTACIÓN (10 productos)
-- =============================================
(
  'Royal Canin Maxi Adult 15 kg',
  'royal-canin-maxi-adult',
  'Pienso completo para perros adultos de razas grandes (26-44 kg). Fórmula con nutrientes que ayudan a mantener la salud articular y un peso óptimo. Croqueta adaptada para mandíbulas grandes.',
  54.99, 44.99, true, 45,
  '/images/productos/royal-canin-maxi-adult.jpg',
  ARRAY['/images/productos/royal-canin-maxi-adult.jpg'],
  'perro', 'grande', 'alimentacion', 'adulto', 'Royal Canin'
),
(
  'Ultima Adult Medium-Maxi 12 kg',
  'ultima-adult-medium-maxi',
  'Pienso Ultima de Affinity para perros adultos medianos y grandes. Con pollo fresco, arroz integral y cereales. Favorece la digestión y el pelo brillante. Marca líder en supermercados de España.',
  42.99, NULL, false, 50,
  '/images/productos/ultima-adult-medium-maxi.jpg',
  ARRAY['/images/productos/ultima-adult-medium-maxi.jpg'],
  'perro', 'grande', 'alimentacion', 'adulto', 'Ultima'
),
(
  'Pedigree Adult Pollo y Arroz 13 kg',
  'pedigree-adult-pollo-arroz',
  'Pienso completo para perros adultos con pollo y arroz. Refuerza el sistema inmunitario, favorece la digestión saludable y aporta energía. La marca de alimentación canina más conocida del mundo.',
  29.99, NULL, false, 60,
  '/images/productos/pedigree-adult-pollo-arroz.jpg',
  ARRAY['/images/productos/pedigree-adult-pollo-arroz.jpg'],
  'perro', 'grande', 'alimentacion', 'adulto', 'Pedigree'
),
(
  'Advance Articular Care 12 kg',
  'advance-articular-care-perro',
  'Pienso dietético para perros con problemas articulares. Con colágeno, ácido hialurónico y vitamina C para proteger las articulaciones. Marca veterinaria española de Affinity.',
  48.50, 39.99, true, 20,
  '/images/productos/advance-articular-care-perro.jpg',
  ARRAY['/images/productos/advance-articular-care-perro.jpg'],
  'perro', 'mediano', 'alimentacion', 'senior', 'Advance'
),
(
  'Royal Canin Mini Puppy 8 kg',
  'royal-canin-mini-puppy',
  'Alimento completo para cachorros de razas pequeñas (hasta 10 kg) de 2 a 10 meses. Apoya el sistema inmunitario en desarrollo con un complejo de antioxidantes.',
  32.99, NULL, false, 55,
  '/images/productos/royal-canin-mini-puppy.jpg',
  ARRAY['/images/productos/royal-canin-mini-puppy.jpg'],
  'perro', 'mini', 'alimentacion', 'cachorro', 'Royal Canin'
),
(
  'Purina ONE Adult Pollo y Arroz 10 kg',
  'purina-one-adult-pollo',
  'Pienso de alta calidad con pollo como ingrediente principal. Fórmula Bifensis con doble defensa: refuerza las defensas naturales del perro por dentro y por fuera. Nutrición avanzada visible en 30 días.',
  34.99, NULL, false, 55,
  '/images/productos/purina-one-adult-pollo.jpg',
  ARRAY['/images/productos/purina-one-adult-pollo.jpg'],
  'perro', 'mediano', 'alimentacion', 'adulto', 'Purina ONE'
),
(
  'Hill''s Science Plan Adult Medium 14 kg',
  'hills-science-plan-adult-medium-pollo',
  'Nutrición clínicamente probada con pollo como ingrediente principal. Antioxidantes, ácidos grasos omega-6 y vitamina E para piel y pelo brillante.',
  46.99, NULL, false, 40,
  '/images/productos/hills-science-plan-adult-medium-pollo.jpg',
  ARRAY['/images/productos/hills-science-plan-adult-medium-pollo.jpg'],
  'perro', 'mediano', 'alimentacion', 'adulto', 'Hill''s'
),
(
  'Brekkies Excel Adult Buey 20 kg',
  'brekkies-excel-adult-buey',
  'Pienso completo con buey, verduras y cereales integrales. Enriquecido con vitaminas y calcio. Marca Affinity, una de las más vendidas en España. Saco grande de 20 kg.',
  25.99, 21.99, true, 70,
  '/images/productos/brekkies-excel-adult-buey.jpg',
  ARRAY['/images/productos/brekkies-excel-adult-buey.jpg'],
  'perro', 'grande', 'alimentacion', 'adulto', 'Brekkies'
),
(
  'Purina Pro Plan Medium Puppy 12 kg',
  'purina-pro-plan-medium-puppy-pollo',
  'Pienso para cachorros de razas medianas con OPTISTART. Calostro natural para reforzar defensas y DHA procedente de aceite de pescado para el cerebro.',
  38.99, NULL, false, 45,
  '/images/productos/purina-pro-plan-medium-puppy-pollo.jpg',
  ARRAY['/images/productos/purina-pro-plan-medium-puppy-pollo.jpg'],
  'perro', 'mediano', 'alimentacion', 'cachorro', 'Purina Pro Plan'
),
(
  'Friskies Adult Buey y Verduras 10 kg',
  'friskies-adult-buey-verduras',
  'Pienso completo y equilibrado para perros adultos. Con buey, pollo y verduras seleccionadas. Rico en proteínas y con todos los nutrientes esenciales. Marca Purina de confianza.',
  18.99, NULL, false, 65,
  '/images/productos/friskies-adult-buey-verduras.jpg',
  ARRAY['/images/productos/friskies-adult-buey-verduras.jpg'],
  'perro', 'mediano', 'alimentacion', 'adulto', 'Friskies'
),

-- =============================================
-- PERROS - HIGIENE (3 productos)
-- =============================================
(
  'TropiClean Champú Avena 592 ml',
  'tropiclean-champu-avena-te',
  'Champú natural de avena coloidal y extracto de árbol del té. Alivia la piel irritada, hidrata en profundidad. Sin parabenos ni colorantes artificiales. pH balanceado.',
  14.99, NULL, false, 60,
  '/images/productos/tropiclean-champu-avena-te.jpg',
  ARRAY['/images/productos/tropiclean-champu-avena-te.jpg'],
  'perro', 'mediano', 'higiene', 'adulto', 'TropiClean'
),
(
  'FURminator Cepillo Perro Grande',
  'furminator-deshedding-perro-grande',
  'Cepillo profesional antipelaje para perros de más de 23 kg. Reduce la caída del pelo hasta un 90%. Botón de liberación de pelo fácil.',
  34.99, 29.99, true, 25,
  '/images/productos/furminator-deshedding-perro-grande.jpg',
  ARRAY['/images/productos/furminator-deshedding-perro-grande.jpg'],
  'perro', 'grande', 'higiene', 'adulto', 'FURminator'
),
(
  'Beaphar Toallitas Limpieza 100 ud',
  'beaphar-toallitas-limpiadoras-perro',
  'Pack de 100 toallitas húmedas para limpieza diaria de ojos, orejas y patas. Con aloe vera y manzanilla. Hipoalergénicas y sin alcohol.',
  8.99, NULL, false, 80,
  '/images/productos/beaphar-toallitas-limpiadoras-perro.jpg',
  ARRAY['/images/productos/beaphar-toallitas-limpiadoras-perro.jpg'],
  'perro', 'mediano', 'higiene', 'adulto', 'Beaphar'
),

-- =============================================
-- PERROS - SALUD (3 productos)
-- =============================================
(
  'Seresto Collar Antiparasitario Perro',
  'seresto-collar-antiparasitario-grande',
  'Collar antiparasitario de larga duración (8 meses) contra pulgas y garrapatas. Perros mayores de 8 kg. Sin olor, resistente al agua, liberación controlada.',
  38.50, 32.99, true, 40,
  '/images/productos/seresto-collar-antiparasitario-grande.jpg',
  ARRAY['/images/productos/seresto-collar-antiparasitario-grande.jpg'],
  'perro', 'grande', 'salud', 'adulto', 'Seresto'
),
(
  'Frontline Tri-Act Pipetas 20-40 kg',
  'frontline-tri-act-perro-20-40kg',
  'Pipetas antiparasitarias spot-on. Triple acción: repele, trata y previene pulgas, garrapatas y mosquitos. Pack de 3 pipetas para 3 meses de protección.',
  32.99, NULL, false, 35,
  '/images/productos/frontline-tri-act-perro-20-40kg.jpg',
  ARRAY['/images/productos/frontline-tri-act-perro-20-40kg.jpg'],
  'perro', 'grande', 'salud', 'adulto', 'Frontline'
),
(
  'Pedigree Dentastix 56 Barritas',
  'pedigree-dentastix',
  'Snacks dentales que reducen la formación de sarro hasta un 80%. Textura especial que limpia hasta la línea de las encías. Para perros medianos. Pack mensual de 56 unidades.',
  12.99, 9.99, true, 70,
  '/images/productos/pedigree-dentastix.jpg',
  ARRAY['/images/productos/pedigree-dentastix.jpg'],
  'perro', 'mediano', 'salud', 'adulto', 'Pedigree'
),

-- =============================================
-- PERROS - ACCESORIOS (4 productos)
-- =============================================
(
  'Flexi New Classic Correa 5 m',
  'flexi-new-classic-correa-5m',
  'Correa retráctil con cinta de 5 metros para perros hasta 50 kg. Sistema de frenado ergonómico fiable. Gancho cromado resistente. Diseño compacto y ligero.',
  22.99, NULL, false, 45,
  '/images/productos/flexi-new-classic-correa-5m.jpg',
  ARRAY['/images/productos/flexi-new-classic-correa-5m.jpg'],
  'perro', 'grande', 'accesorios', 'adulto', 'Flexi'
),
(
  'Trixie Cama Vital Best of All',
  'trixie-cama-vital-best-of-all',
  'Cama ortopédica con relleno de espuma viscoelástica. Funda lavable a máquina, borde acolchado elevado. Fondo antideslizante. Tamaño 80x60 cm.',
  49.99, 42.99, true, 20,
  '/images/productos/trixie-cama-vital-best-of-all.jpg',
  ARRAY['/images/productos/trixie-cama-vital-best-of-all.jpg'],
  'perro', 'grande', 'accesorios', 'adulto', 'Trixie'
),
(
  'Julius-K9 IDC Arnés Perro',
  'julius-k9-idc-powerharness',
  'Arnés profesional con sistema de cierre de seguridad. Etiquetas intercambiables, reflectante, asa superior de agarre. Interior forrado transpirable.',
  39.99, NULL, false, 30,
  '/images/productos/julius-k9-idc-powerharness.jpg',
  ARRAY['/images/productos/julius-k9-idc-powerharness.jpg'],
  'perro', 'grande', 'accesorios', 'adulto', 'Julius-K9'
),
(
  'Trixie Comedero Doble Elevado',
  'trixie-comedero-elevado-acero',
  'Doble comedero de acero inoxidable con soporte elevado regulable en altura. Capacidad 2x1.8 L. Antideslizante. Ideal para perros grandes y articulaciones.',
  27.99, NULL, false, 35,
  '/images/productos/trixie-comedero-elevado-acero.jpg',
  ARRAY['/images/productos/trixie-comedero-elevado-acero.jpg'],
  'perro', 'grande', 'accesorios', 'adulto', 'Trixie'
),

-- =============================================
-- PERROS - JUGUETES (3 productos)
-- =============================================
(
  'Kong Classic Rojo Grande',
  'kong-classic-rojo-grande',
  'El juguete original de caucho natural KONG. Rebote impredecible que mantiene al perro entretenido. Se puede rellenar con premios. Ultra resistente. Talla L.',
  14.99, NULL, false, 65,
  '/images/productos/kong-classic-rojo-grande.jpg',
  ARRAY['/images/productos/kong-classic-rojo-grande.jpg'],
  'perro', 'grande', 'juguetes', 'adulto', 'Kong'
),
(
  'Nylabone DuraChew Hueso Bacon',
  'nylabone-durachew-hueso-bacon',
  'Hueso masticable de nylon duradero con sabor a bacon real. Para perros de masticación potente (hasta 23 kg). Limpia los dientes mientras juegan.',
  11.99, NULL, false, 50,
  '/images/productos/nylabone-durachew-hueso-bacon.jpg',
  ARRAY['/images/productos/nylabone-durachew-hueso-bacon.jpg'],
  'perro', 'mediano', 'juguetes', 'adulto', 'Nylabone'
),
(
  'Trixie Flip Board Perro',
  'trixie-dog-activity-flip-board',
  'Juego de inteligencia nivel 2 para perros. Diferentes mecanismos de apertura para esconder premios. Estimulación mental, reduce ansiedad y aburrimiento.',
  16.99, 13.99, true, 40,
  '/images/productos/trixie-dog-activity-flip-board.jpg',
  ARRAY['/images/productos/trixie-dog-activity-flip-board.jpg'],
  'perro', 'mediano', 'juguetes', 'adulto', 'Trixie'
),

-- =============================================
-- GATOS - ALIMENTACIÓN (8 productos)
-- =============================================
(
  'Royal Canin Kitten 4 kg',
  'royal-canin-kitten',
  'Alimento completo para gatitos de 4 a 12 meses. Apoya el sistema inmunitario en desarrollo con un complejo antioxidante. Croqueta de textura suave adaptada.',
  35.99, NULL, false, 50,
  '/images/productos/royal-canin-kitten.jpg',
  ARRAY['/images/productos/royal-canin-kitten.jpg'],
  'gato', 'mini', 'alimentacion', 'cachorro', 'Royal Canin'
),
(
  'Royal Canin Indoor 27 10 kg',
  'royal-canin-indoor-27',
  'Pienso para gatos adultos de interior (1-7 años). Fórmula que ayuda a reducir las heces olorosas y controlar el peso. Con L-carnitina y fibras.',
  42.99, NULL, false, 40,
  '/images/productos/royal-canin-indoor-27.jpg',
  ARRAY['/images/productos/royal-canin-indoor-27.jpg'],
  'gato', 'mini', 'alimentacion', 'adulto', 'Royal Canin'
),
(
  'Felix Fantastic Selección Mixta 12 ud',
  'purina-felix-fantastic-seleccion-mixta',
  'Pack de 12 sobres de comida húmeda en gelatina. Variedad de sabores: pollo, ternera, salmón y atún. Trocitos jugosos que encantan a todos los gatos.',
  9.99, 7.99, true, 80,
  '/images/productos/purina-felix-fantastic-seleccion-mixta.jpg',
  ARRAY['/images/productos/purina-felix-fantastic-seleccion-mixta.jpg'],
  'gato', 'mini', 'alimentacion', 'adulto', 'Purina Felix'
),
(
  'Purina ONE Gato Esterilizado 6 kg',
  'purina-one-gato-esterilizado',
  'Pienso de alta calidad para gatos esterilizados. Con salmón como ingrediente principal y sin colorantes artificiales. Fórmula Bifensis para doble defensa inmunitaria.',
  28.99, NULL, false, 45,
  '/images/productos/purina-one-gato-esterilizado.jpg',
  ARRAY['/images/productos/purina-one-gato-esterilizado.jpg'],
  'gato', 'mini', 'alimentacion', 'adulto', 'Purina ONE'
),
(
  'Hill''s Sterilised Cat Pollo 10 kg',
  'hills-sterilised-cat-pollo',
  'Nutrición óptima para gatos esterilizados. Control de peso con L-carnitina, fibras para saciedad y minerales controlados para salud urinaria.',
  39.99, NULL, false, 35,
  '/images/productos/hills-sterilised-cat-pollo.jpg',
  ARRAY['/images/productos/hills-sterilised-cat-pollo.jpg'],
  'gato', 'mini', 'alimentacion', 'adulto', 'Hill''s'
),
(
  'Whiskas Tentaciones Pollo y Queso',
  'whiskas-temptations-pollo-queso',
  'Snacks crujientes por fuera y cremosos por dentro. Irresistibles para tu gato. Solo 2 kcal por unidad. Ideales como recompensa o para entrenamiento.',
  3.49, NULL, false, 100,
  '/images/productos/whiskas-temptations-pollo-queso.jpg',
  ARRAY['/images/productos/whiskas-temptations-pollo-queso.jpg'],
  'gato', 'mini', 'alimentacion', 'adulto', 'Whiskas'
),
(
  'Friskies Gato Salmón y Verduras 4 kg',
  'friskies-gato-salmon-verduras',
  'Comida completa para gatos adultos con salmón y verduras. Receta equilibrada con vitaminas A, D y E. Marca Purina de confianza para el día a día.',
  8.99, NULL, false, 90,
  '/images/productos/friskies-gato-salmon-verduras.jpg',
  ARRAY['/images/productos/friskies-gato-salmon-verduras.jpg'],
  'gato', 'mini', 'alimentacion', 'adulto', 'Friskies'
),
(
  'Royal Canin Ageing 12+ Esterilizado 4 kg',
  'royal-canin-ageing-12-sterilised',
  'Para gatos esterilizados mayores de 12 años. Apoya la función renal, mantiene la masa muscular. Fósforo adaptado y antioxidantes para el envejecimiento.',
  38.50, NULL, false, 25,
  '/images/productos/royal-canin-ageing-12-sterilised.jpg',
  ARRAY['/images/productos/royal-canin-ageing-12-sterilised.jpg'],
  'gato', 'mini', 'alimentacion', 'senior', 'Royal Canin'
),

-- =============================================
-- GATOS - HIGIENE (3 productos)
-- =============================================
(
  'Catsan Hygiene Plus Arena 20 L',
  'catsan-hygiene-plus-arena-20l',
  'Arena higiénica no aglomerante con gránulos minerales blancos. Control de olores hasta 5 días. Extra absorbente. Sin polvo.',
  15.99, 12.99, true, 60,
  '/images/productos/catsan-hygiene-plus-arena-20l.jpg',
  ARRAY['/images/productos/catsan-hygiene-plus-arena-20l.jpg'],
  'gato', 'mini', 'higiene', 'adulto', 'Catsan'
),
(
  'Ever Clean Extra Strong 10 L',
  'ever-clean-extra-strong-clumping',
  'Arena aglomerante premium con tecnología de control de olor activado por carbón. Aglomerados duros y compactos. Perfumada.',
  22.99, NULL, false, 40,
  '/images/productos/ever-clean-extra-strong-clumping.jpg',
  ARRAY['/images/productos/ever-clean-extra-strong-clumping.jpg'],
  'gato', 'mini', 'higiene', 'adulto', 'Ever Clean'
),
(
  'FURminator Cepillo Gato Pelo Corto',
  'furminator-deshedding-gato-pelo-corto',
  'Herramienta profesional para reducir la muda de pelo en gatos de pelo corto. Alcanza el subpelo sin dañar la capa superior. Reduce pelo suelto un 90%.',
  24.99, NULL, false, 30,
  '/images/productos/furminator-deshedding-gato-pelo-corto.jpg',
  ARRAY['/images/productos/furminator-deshedding-gato-pelo-corto.jpg'],
  'gato', 'mini', 'higiene', 'adulto', 'FURminator'
),

-- =============================================
-- GATOS - SALUD (2 productos)
-- =============================================
(
  'Frontline Combo Gato 3 Pipetas',
  'frontline-combo-spot-on-gato',
  'Pipetas antiparasitarias para gatos. Doble acción: elimina pulgas adultas y sus huevos/larvas del entorno. También eficaz contra garrapatas.',
  24.99, NULL, false, 45,
  '/images/productos/frontline-combo-spot-on-gato.jpg',
  ARRAY['/images/productos/frontline-combo-spot-on-gato.jpg'],
  'gato', 'mini', 'salud', 'adulto', 'Frontline'
),
(
  'Feliway Classic Difusor',
  'feliway-classic-difusor-recambio',
  'Difusor de feromonas felinas sintéticas que reduce estrés, marcaje y arañazos. Cubre hasta 70 m². Efecto calmante clínicamente probado. Duración 30 días.',
  28.99, 24.99, true, 30,
  '/images/productos/feliway-classic-difusor-recambio.jpg',
  ARRAY['/images/productos/feliway-classic-difusor-recambio.jpg'],
  'gato', 'mini', 'salud', 'adulto', 'Feliway'
),

-- =============================================
-- GATOS - ACCESORIOS (3 productos)
-- =============================================
(
  'Catit Vesper Rascador con Cueva',
  'catit-vesper-high-base-rascador',
  'Rascador y mueble para gatos con plataforma elevada acolchada, cueva interior y postes de sisal natural. Diseño moderno en madera de nogal. Altura 56 cm.',
  69.99, 59.99, true, 15,
  '/images/productos/catit-vesper-high-base-rascador.jpg',
  ARRAY['/images/productos/catit-vesper-high-base-rascador.jpg'],
  'gato', 'mediano', 'accesorios', 'adulto', 'Catit'
),
(
  'PetSafe ScoopFree Arenero Auto',
  'petsafe-scoopfree-arenero-autolimpiante',
  'Arenero automático que limpia solo. Bandeja desechable con arena de cristal que absorbe olores. Sensor de movimiento. Sin contacto con residuos.',
  149.99, NULL, false, 10,
  '/images/productos/petsafe-scoopfree-arenero-autolimpiante.jpg',
  ARRAY['/images/productos/petsafe-scoopfree-arenero-autolimpiante.jpg'],
  'gato', 'mediano', 'accesorios', 'adulto', 'PetSafe'
),
(
  'Trixie Transportín Capri 2',
  'trixie-transportin-capri-2',
  'Transportín de plástico resistente con puerta metálica con cierre de seguridad. Ventilación lateral, asa ergonómica plegable. Apto para gatos hasta 8 kg.',
  24.99, NULL, false, 25,
  '/images/productos/trixie-transportin-capri-2.jpg',
  ARRAY['/images/productos/trixie-transportin-capri-2.jpg'],
  'gato', 'mini', 'accesorios', 'adulto', 'Trixie'
),

-- =============================================
-- GATOS - JUGUETES (2 productos)
-- =============================================
(
  'Catit Senses Circuito Roller',
  'catit-senses-super-roller-circuit',
  'Circuito de juego interactivo con pelota iluminada. Diseño modular que permite crear diferentes recorridos. Estimula el instinto cazador, incluye hierba gatera.',
  19.99, NULL, false, 35,
  '/images/productos/catit-senses-super-roller-circuit.jpg',
  ARRAY['/images/productos/catit-senses-super-roller-circuit.jpg'],
  'gato', 'mini', 'juguetes', 'adulto', 'Catit'
),
(
  'Kong Kickeroo Hierba Gatera',
  'kong-kickeroo-catnip-gato',
  'Juguete alargado relleno de hierba gatera premium y papel crujiente. Ideal para patadas traseras. Plumas en los extremos para mayor diversión. Lavable.',
  8.99, NULL, false, 55,
  '/images/productos/kong-kickeroo-catnip-gato.jpg',
  ARRAY['/images/productos/kong-kickeroo-catnip-gato.jpg'],
  'gato', 'mini', 'juguetes', 'adulto', 'Kong'
),

-- =============================================
-- OTROS ANIMALES - ALIMENTACIÓN (3 productos)
-- =============================================
(
  'Versele-Laga Crispy Muesli Conejos',
  'versele-laga-crispy-muesli-conejos',
  'Alimento completo y variado para conejos enanos. Mezcla rica en fibra con verduras, cereales y hierbas aromáticas. Con vitamina A y D3 añadidas. 2.75 kg.',
  9.99, NULL, false, 50,
  '/images/productos/versele-laga-crispy-muesli-conejos.jpg',
  ARRAY['/images/productos/versele-laga-crispy-muesli-conejos.jpg'],
  'otros', 'mini', 'alimentacion', 'adulto', 'Versele-Laga'
),
(
  'Vitakraft Menú Premium Hámster',
  'vitakraft-menu-premium-hamster',
  'Alimento principal para hámsters con cereales, semillas, fruta y proteína animal. Enriquecido con vitaminas y minerales esenciales. Sin conservantes artificiales.',
  4.99, NULL, false, 60,
  '/images/productos/vitakraft-menu-premium-hamster.jpg',
  ARRAY['/images/productos/vitakraft-menu-premium-hamster.jpg'],
  'otros', 'mini', 'alimentacion', 'adulto', 'Vitakraft'
),
(
  'Tetra Min Copos Peces 250 ml',
  'tetra-min-copos-peces-tropicales',
  'Alimento en copos para peces tropicales de agua dulce. Fórmula BioActive con prebióticos para mejorar resistencia. Clean & Clear Water formula.',
  7.99, 5.99, true, 70,
  '/images/productos/tetra-min-copos-peces-tropicales.jpg',
  ARRAY['/images/productos/tetra-min-copos-peces-tropicales.jpg'],
  'otros', 'mini', 'alimentacion', 'adulto', 'Tetra'
),

-- =============================================
-- OTROS ANIMALES - ACCESORIOS (3 productos)
-- =============================================
(
  'Ferplast Jaula Criceti Hámster',
  'ferplast-jaula-criceti-15-hamster',
  'Jaula completa para hámsters con bebedero, comedero, rueda y casita incluidos. Base de plástico profunda, parte superior de rejilla con puerta. 78x48x39 cm.',
  59.99, NULL, false, 15,
  '/images/productos/ferplast-jaula-criceti-15-hamster.jpg',
  ARRAY['/images/productos/ferplast-jaula-criceti-15-hamster.jpg'],
  'otros', 'mini', 'accesorios', 'adulto', 'Ferplast'
),
(
  'Trixie Jaula Pájaros San Remo',
  'trixie-jaula-pajaros-san-remo',
  'Jaula para pájaros pequeños como canarios y periquitos. Con 2 comederos, 2 perchas y bandeja extraíble. Fácil limpieza. 59x33x71 cm.',
  44.99, NULL, false, 20,
  '/images/productos/trixie-jaula-pajaros-san-remo.jpg',
  ARRAY['/images/productos/trixie-jaula-pajaros-san-remo.jpg'],
  'otros', 'mini', 'accesorios', 'adulto', 'Trixie'
),
(
  'Tetra AquaArt Acuario LED 60 L',
  'tetra-aquaart-acuario-led-60l',
  'Acuario completo con iluminación LED eficiente, filtro EasyCrystal y calentador. Tapa con modo día/noche. Cristal curvado frontal elegante.',
  129.99, 109.99, true, 8,
  '/images/productos/tetra-aquaart-acuario-led-60l.jpg',
  ARRAY['/images/productos/tetra-aquaart-acuario-led-60l.jpg'],
  'otros', 'mini', 'accesorios', 'adulto', 'Tetra'
),

-- =============================================
-- OTROS ANIMALES - SALUD (2 productos)
-- =============================================
(
  'Beaphar Vitamina C Cobayas 100 ml',
  'beaphar-care-vitamina-c-cobayas',
  'Suplemento líquido de vitamina C esencial para cobayas (no la sintetizan). Fácil de añadir al agua. Previene escorbuto y refuerza sistema inmune.',
  8.99, NULL, false, 40,
  '/images/productos/beaphar-care-vitamina-c-cobayas.jpg',
  ARRAY['/images/productos/beaphar-care-vitamina-c-cobayas.jpg'],
  'otros', 'mini', 'salud', 'adulto', 'Beaphar'
),
(
  'Versele-Laga Omni-Vit Vitaminas Aves',
  'versele-laga-oropharma-omni-vit',
  'Suplemento de vitaminas y aminoácidos para aves de jaula. Aumenta la vitalidad y mejora el plumaje. Soluble en agua o mezclable con pasta de cría.',
  12.99, NULL, false, 35,
  '/images/productos/versele-laga-oropharma-omni-vit.jpg',
  ARRAY['/images/productos/versele-laga-oropharma-omni-vit.jpg'],
  'otros', 'mini', 'salud', 'adulto', 'Versele-Laga'
),

-- =============================================
-- OTROS ANIMALES - JUGUETES (1 producto)
-- =============================================
(
  'Trixie Rueda Silenciosa Hámster 28 cm',
  'trixie-rueda-ejercicio-silenciosa-28cm',
  'Rueda de ejercicio ultra silenciosa para hámsters sirios y jerbos. Superficie cerrada sin barrotes para proteger las patitas. Rodamiento de bolas.',
  14.99, NULL, false, 30,
  '/images/productos/trixie-rueda-ejercicio-silenciosa-28cm.jpg',
  ARRAY['/images/productos/trixie-rueda-ejercicio-silenciosa-28cm.jpg'],
  'otros', 'mini', 'juguetes', 'adulto', 'Trixie'
)

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  sale_price = EXCLUDED.sale_price,
  on_sale = EXCLUDED.on_sale,
  stock = EXCLUDED.stock,
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  animal_type = EXCLUDED.animal_type,
  size = EXCLUDED.size,
  category = EXCLUDED.category,
  age_range = EXCLUDED.age_range,
  brand = EXCLUDED.brand;

-- =============================================
-- VERIFICACIÓN
-- =============================================
SELECT count(*) as total_productos, animal_type, category 
FROM public.products 
GROUP BY animal_type, category 
ORDER BY animal_type, category;
