-- =============================================
-- Venice Pet Shop - 50 Productos Reales
-- Ejecutar en Supabase SQL Editor
-- =============================================
-- Primero eliminamos los productos de ejemplo placeholder
DELETE FROM public.order_items WHERE product_id IN (SELECT id FROM public.products WHERE image_url LIKE '%via.placeholder%');
DELETE FROM public.products WHERE image_url LIKE '%via.placeholder%';

-- =============================================
-- INSERTAR 50 PRODUCTOS REALES
-- =============================================
INSERT INTO public.products (name, slug, description, price, sale_price, on_sale, stock, image_url, images, animal_type, size, category, age_range, brand)
VALUES

-- =============================================
-- PERROS - ALIMENTACIÓN (10 productos)
-- =============================================
(
  'Royal Canin Maxi Adult',
  'royal-canin-maxi-adult',
  'Pienso completo para perros adultos de razas grandes (26-44 kg). Fórmula con nutrientes que ayudan a mantener la salud articular y un peso óptimo. Croqueta adaptada para mandíbulas grandes.',
  54.99, 44.99, true, 45,
  'https://static.miscota.com/media/1/photos/products/093627/royal-canin-maxi-adult_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/093627/royal-canin-maxi-adult_1_g.jpeg', 'https://static.miscota.com/media/1/photos/products/093627/royal-canin-maxi-adult_3_g.jpeg'],
  'perro', 'grande', 'alimentacion', 'adulto', 'Royal Canin'
),
(
  'Acana Pacifica Dog',
  'acana-pacifica-dog',
  'Alimento biológicamente apropiado con pescado fresco del Pacífico. Sin cereales, rico en omega-3 para piel y pelaje saludables. 70% ingredientes animales.',
  69.99, NULL, false, 30,
  'https://static.miscota.com/media/1/photos/products/068074/acana-pacifica-dog_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/068074/acana-pacifica-dog_1_g.jpeg'],
  'perro', 'mediano', 'alimentacion', 'adulto', 'Acana'
),
(
  'Orijen Original Dog',
  'orijen-original-dog',
  'Pienso premium con 85% de ingredientes animales frescos y variados. Pollo, pavo y pescado de crianza libre. Grain-free, sin fillers artificiales.',
  79.99, NULL, false, 25,
  'https://static.miscota.com/media/1/photos/products/153044/orijen-original-dog_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/153044/orijen-original-dog_1_g.jpeg'],
  'perro', 'mediano', 'alimentacion', 'adulto', 'Orijen'
),
(
  'Advance Veterinary Diets Articular Care',
  'advance-articular-care-perro',
  'Pienso dietético para perros con problemas articulares. Con colágeno, ácido hialurónico y vitamina C para proteger las articulaciones.',
  48.50, 39.99, true, 20,
  'https://static.miscota.com/media/1/photos/products/124843/advance-veterinary-diets-articular-care_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/124843/advance-veterinary-diets-articular-care_1_g.jpeg'],
  'perro', 'mediano', 'alimentacion', 'senior', 'Advance'
),
(
  'Royal Canin Mini Puppy',
  'royal-canin-mini-puppy',
  'Alimento completo para cachorros de razas pequeñas (hasta 10 kg) de 2 a 10 meses. Apoya el sistema inmunitario en desarrollo con un complejo de antioxidantes.',
  32.99, NULL, false, 55,
  'https://static.miscota.com/media/1/photos/products/093586/royal-canin-mini-puppy_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/093586/royal-canin-mini-puppy_1_g.jpeg'],
  'perro', 'mini', 'alimentacion', 'cachorro', 'Royal Canin'
),
(
  'Taste of the Wild High Prairie',
  'taste-of-the-wild-high-prairie',
  'Pienso sin cereales con bisonte y venado asados. Fórmula inspirada en la dieta ancestral del perro, con frutas y verduras. Probióticos para digestión óptima.',
  59.99, NULL, false, 35,
  'https://static.miscota.com/media/1/photos/products/037410/taste-of-the-wild-high-prairie_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/037410/taste-of-the-wild-high-prairie_1_g.jpeg'],
  'perro', 'grande', 'alimentacion', 'adulto', 'Taste of the Wild'
),
(
  'Hill''s Science Plan Adult Medium con Pollo',
  'hills-science-plan-adult-medium-pollo',
  'Nutrición clínicamente probada con pollo como ingrediente principal. Antioxidantes, ácidos grasos omega-6 y vitamina E para piel y pelo brillante.',
  46.99, NULL, false, 40,
  'https://static.miscota.com/media/1/photos/products/142261/hill-s-science-plan-adult-medium-con-pollo_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/142261/hill-s-science-plan-adult-medium-con-pollo_1_g.jpeg'],
  'perro', 'mediano', 'alimentacion', 'adulto', 'Hill''s'
),
(
  'Eukanuba Adult Large Breed',
  'eukanuba-adult-large-breed',
  'Pienso de alta calidad para perros adultos de razas grandes. Con pollo fresco, DHA para cerebro ágil y L-carnitina para mantener peso ideal.',
  42.99, 36.99, true, 50,
  'https://static.miscota.com/media/1/photos/products/157044/eukanuba-adult-large-breed-pollo_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/157044/eukanuba-adult-large-breed-pollo_1_g.jpeg'],
  'perro', 'grande', 'alimentacion', 'adulto', 'Eukanuba'
),
(
  'Purina Pro Plan Medium Puppy con Pollo',
  'purina-pro-plan-medium-puppy-pollo',
  'Pienso para cachorros de razas medianas con OPTISTART. Calostro natural para reforzar defensas y DHA procedente de aceite de pescado para el cerebro.',
  38.99, NULL, false, 45,
  'https://static.miscota.com/media/1/photos/products/128671/purina-pro-plan-medium-puppy-con-pollo_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/128671/purina-pro-plan-medium-puppy-con-pollo_1_g.jpeg'],
  'perro', 'mediano', 'alimentacion', 'cachorro', 'Purina Pro Plan'
),
(
  'Natural Trainer Sensitive No Gluten Medium/Maxi Salmón',
  'natural-trainer-sensitive-salmon',
  'Pienso sin gluten con salmón fresco para perros sensibles. Extractos naturales de alcachofa y romero. Ideal para intolerancias alimentarias.',
  44.50, NULL, false, 30,
  'https://static.miscota.com/media/1/photos/products/135637/natural-trainer-sensitive-no-gluten-medium-maxi-adulto-salmon_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/135637/natural-trainer-sensitive-no-gluten-medium-maxi-adulto-salmon_1_g.jpeg'],
  'perro', 'mediano', 'alimentacion', 'adulto', 'Natural Trainer'
),

-- =============================================
-- PERROS - HIGIENE (3 productos)
-- =============================================
(
  'Champú TropiClean Avena y Té',
  'tropiclean-champu-avena-te',
  'Champú natural de avena coloidal y extracto de té verde. Alivia la piel irritada, hidrata en profundidad. Sin parabenos ni colorantes artificiales. pH balanceado para perros.',
  14.99, NULL, false, 60,
  'https://static.miscota.com/media/1/photos/products/088803/tropiclean-oatmeal-tea-tree-shampoo_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/088803/tropiclean-oatmeal-tea-tree-shampoo_1_g.jpeg'],
  'perro', 'mediano', 'higiene', 'adulto', 'TropiClean'
),
(
  'FURminator deShedding Tool Perro Grande',
  'furminator-deshedding-perro-grande',
  'Cepillo profesional antipelaje para perros de pelo largo/corto de más de 23 kg. Reduce la caída del pelo hasta un 90%. Botón de liberación de pelo fácil.',
  34.99, 29.99, true, 25,
  'https://static.miscota.com/media/1/photos/products/073087/furminator-deshedding-tool-l-pelo-largo_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/073087/furminator-deshedding-tool-l-pelo-largo_1_g.jpeg'],
  'perro', 'grande', 'higiene', 'adulto', 'FURminator'
),
(
  'Toallitas Limpiadoras Beaphar',
  'beaphar-toallitas-limpiadoras-perro',
  'Pack de 100 toallitas húmedas para limpieza diaria de ojos, orejas y patas. Con aloe vera y manzanilla. Hipoalergénicas y sin alcohol.',
  8.99, NULL, false, 80,
  'https://static.miscota.com/media/1/photos/products/052479/beaphar-multi-fresh-wipes_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/052479/beaphar-multi-fresh-wipes_1_g.jpeg'],
  'perro', 'mediano', 'higiene', 'adulto', 'Beaphar'
),

-- =============================================
-- PERROS - SALUD (3 productos)
-- =============================================
(
  'Seresto Collar Antiparasitario Perro Grande',
  'seresto-collar-antiparasitario-grande',
  'Collar antiparasitario de larga duración (8 meses) contra pulgas y garrapatas. Perros mayores de 8 kg. Sin olor, resistente al agua, liberación controlada.',
  38.50, 32.99, true, 40,
  'https://static.miscota.com/media/1/photos/products/133089/seresto-collar-antiparasitario-perro-mas-de-8-kg_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/133089/seresto-collar-antiparasitario-perro-mas-de-8-kg_1_g.jpeg'],
  'perro', 'grande', 'salud', 'adulto', 'Seresto'
),
(
  'Frontline Tri-Act Perro 20-40 kg',
  'frontline-tri-act-perro-20-40kg',
  'Pipetas antiparasitarias spot-on. Triple acción: repele, trata y previene pulgas, garrapatas y mosquitos. Pack de 3 pipetas para 3 meses de protección.',
  32.99, NULL, false, 35,
  'https://static.miscota.com/media/1/photos/products/128694/frontline-tri-act-perro-20-40-kg_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/128694/frontline-tri-act-perro-20-40-kg_1_g.jpeg'],
  'perro', 'grande', 'salud', 'adulto', 'Frontline'
),
(
  'GimDog Dental Snacks',
  'gimdog-dental-snacks',
  'Snacks dentales funcionales que reducen la formación de sarro hasta un 80%. Con forma ergonómica para limpieza profunda. Ayudan al aliento fresco.',
  6.99, NULL, false, 70,
  'https://static.miscota.com/media/1/photos/products/078218/gimdog-dental-care-snacks_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/078218/gimdog-dental-care-snacks_1_g.jpeg'],
  'perro', 'mediano', 'salud', 'adulto', 'GimDog'
),

-- =============================================
-- PERROS - ACCESORIOS (4 productos)
-- =============================================
(
  'Flexi New Classic Correa Extensible 5m',
  'flexi-new-classic-correa-5m',
  'Correa retráctil con cinta de 5 metros para perros hasta 50 kg. Sistema de frenado ergonómico fiable. Gancho cromado resistente. Diseño compacto y ligero.',
  22.99, NULL, false, 45,
  'https://static.miscota.com/media/1/photos/products/059753/flexi-new-classic-l-cinta-5m_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/059753/flexi-new-classic-l-cinta-5m_1_g.jpeg'],
  'perro', 'grande', 'accesorios', 'adulto', 'Flexi'
),
(
  'Cama Trixie Vital Best of All',
  'trixie-cama-vital-best-of-all',
  'Cama ortopédica con relleno de espuma viscoelástica. Funda lavable a máquina, borde acolchado elevado. Fondo antideslizante. Tamaño 80x60 cm.',
  49.99, 42.99, true, 20,
  'https://static.miscota.com/media/1/photos/products/076073/trixie-cama-vital-best-of-all_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/076073/trixie-cama-vital-best-of-all_1_g.jpeg'],
  'perro', 'grande', 'accesorios', 'adulto', 'Trixie'
),
(
  'Julius-K9 IDC Powerharness',
  'julius-k9-idc-powerharness',
  'Arnés profesional con sistema de cierre de seguridad. Etiquetas intercambiables, reflectante, asa superior de agarre. Interior forrado transpirable.',
  39.99, NULL, false, 30,
  'https://static.miscota.com/media/1/photos/products/060005/julius-k9-idc-powerharness_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/060005/julius-k9-idc-powerharness_1_g.jpeg'],
  'perro', 'grande', 'accesorios', 'adulto', 'Julius-K9'
),
(
  'Comedero Elevado Trixie Acero Inox',
  'trixie-comedero-elevado-acero',
  'Doble comedero de acero inoxidable con soporte elevado regulable en altura. Capacidad 2x1.8L. Antideslizante. Ideal para perros grandes y articulaciones.',
  27.99, NULL, false, 35,
  'https://static.miscota.com/media/1/photos/products/076088/trixie-comedero-elevado-acero-inoxidable_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/076088/trixie-comedero-elevado-acero-inoxidable_1_g.jpeg'],
  'perro', 'grande', 'accesorios', 'adulto', 'Trixie'
),

-- =============================================
-- PERROS - JUGUETES (3 productos)
-- =============================================
(
  'Kong Classic Rojo Grande',
  'kong-classic-rojo-grande',
  'El juguete original de caucho natural KONG. Rebote impredecible que mantiene al perro entretenido. Se puede rellenar con premios. Ultra resistente.',
  14.99, NULL, false, 65,
  'https://static.miscota.com/media/1/photos/products/016005/kong-classic-l_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/016005/kong-classic-l_1_g.jpeg'],
  'perro', 'grande', 'juguetes', 'adulto', 'Kong'
),
(
  'Nylabone DuraChew Hueso Sabor Bacon',
  'nylabone-durachew-hueso-bacon',
  'Hueso masticable de nylon duradero con sabor a bacon real. Para perros de masticación potente (hasta 23 kg). Limpia los dientes mientras juegan.',
  11.99, NULL, false, 50,
  'https://static.miscota.com/media/1/photos/products/083605/nylabone-durachew-bacon_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/083605/nylabone-durachew-bacon_1_g.jpeg'],
  'perro', 'mediano', 'juguetes', 'adulto', 'Nylabone'
),
(
  'Trixie Dog Activity Flip Board',
  'trixie-dog-activity-flip-board',
  'Juego de inteligencia nivel 2 para perros. Diferentes mecanismos de apertura para esconder premios. Estimulación mental, reduce ansiedad y aburrimiento.',
  16.99, 13.99, true, 40,
  'https://static.miscota.com/media/1/photos/products/076032/trixie-dog-activity-flip-board_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/076032/trixie-dog-activity-flip-board_1_g.jpeg'],
  'perro', 'mediano', 'juguetes', 'adulto', 'Trixie'
),

-- =============================================
-- GATOS - ALIMENTACIÓN (8 productos)
-- =============================================
(
  'Royal Canin Kitten',
  'royal-canin-kitten',
  'Alimento completo para gatitos de 4 a 12 meses. Apoya el sistema inmunitario en desarrollo con un complejo antioxidante. Croqueta de textura suave adaptada.',
  35.99, NULL, false, 50,
  'https://static.miscota.com/media/1/photos/products/093674/royal-canin-kitten_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/093674/royal-canin-kitten_1_g.jpeg'],
  'gato', 'mini', 'alimentacion', 'cachorro', 'Royal Canin'
),
(
  'Royal Canin Indoor 27',
  'royal-canin-indoor-27',
  'Pienso para gatos adultos de interior (1-7 años). Fórmula que ayuda a reducir las heces olorosas y controlar el peso. Con L-carnitina y fibras.',
  42.99, NULL, false, 40,
  'https://static.miscota.com/media/1/photos/products/093659/royal-canin-indoor-27_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/093659/royal-canin-indoor-27_1_g.jpeg'],
  'gato', 'mini', 'alimentacion', 'adulto', 'Royal Canin'
),
(
  'Purina Felix Fantastic Selección Mixta',
  'purina-felix-fantastic-seleccion-mixta',
  'Pack de 12 sobres de comida húmeda en gelatina. Variedad de sabores: pollo, ternera, salmón y atún. Trocitos jugosos que encantan a todos los gatos.',
  9.99, 7.99, true, 80,
  'https://static.miscota.com/media/1/photos/products/141982/purina-felix-fantastic-seleccion-mixta-en-gelatina_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/141982/purina-felix-fantastic-seleccion-mixta-en-gelatina_1_g.jpeg'],
  'gato', 'mini', 'alimentacion', 'adulto', 'Purina Felix'
),
(
  'Orijen Cat & Kitten',
  'orijen-cat-kitten',
  'Pienso premium con 90% de ingredientes animales. Pollo, pavo, pescado y huevos frescos. Sin cereales. Biológicamente apropiado para gatos de todas las edades.',
  59.99, NULL, false, 25,
  'https://static.miscota.com/media/1/photos/products/153073/orijen-cat-kitten_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/153073/orijen-cat-kitten_1_g.jpeg'],
  'gato', 'mini', 'alimentacion', 'adulto', 'Orijen'
),
(
  'Hill''s Science Plan Sterilised Cat con Pollo',
  'hills-sterilised-cat-pollo',
  'Nutrición óptima para gatos esterilizados. Control de peso con L-carnitina, fibras para saciedad y minerales controlados para salud urinaria.',
  39.99, NULL, false, 35,
  'https://static.miscota.com/media/1/photos/products/142276/hill-s-science-plan-sterilised-cat-pollo_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/142276/hill-s-science-plan-sterilised-cat-pollo_1_g.jpeg'],
  'gato', 'mini', 'alimentacion', 'adulto', 'Hill''s'
),
(
  'Whiskas Temptations Pollo Queso',
  'whiskas-temptations-pollo-queso',
  'Snacks crujientes por fuera y cremosos por dentro. Irresistibles para tu gato. Solo 2 kcal por unidad. Ideales como recompensa o para entrenamiento.',
  3.49, NULL, false, 100,
  'https://static.miscota.com/media/1/photos/products/146814/whiskas-temptations-pollo-queso_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/146814/whiskas-temptations-pollo-queso_1_g.jpeg'],
  'gato', 'mini', 'alimentacion', 'adulto', 'Whiskas'
),
(
  'Applaws Pechuga de Pollo Natural',
  'applaws-pechuga-pollo-natural',
  'Comida húmeda 100% natural con 75% de pechuga de pollo real. Sin cereales, colorantes ni conservantes artificiales. Caldo nutritivo. Lata de 156g.',
  2.79, NULL, false, 90,
  'https://static.miscota.com/media/1/photos/products/080424/applaws-pechuga-de-pollo-natural_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/080424/applaws-pechuga-de-pollo-natural_1_g.jpeg'],
  'gato', 'mini', 'alimentacion', 'adulto', 'Applaws'
),
(
  'Royal Canin Ageing 12+ Sterilised',
  'royal-canin-ageing-12-sterilised',
  'Para gatos esterilizados mayores de 12 años. Apoya la función renal, mantiene la masa muscular. Fósforo adaptado y antioxidantes para el envejecimiento.',
  38.50, NULL, false, 25,
  'https://static.miscota.com/media/1/photos/products/093701/royal-canin-ageing-12-sterilised_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/093701/royal-canin-ageing-12-sterilised_1_g.jpeg'],
  'gato', 'mini', 'alimentacion', 'senior', 'Royal Canin'
),

-- =============================================
-- GATOS - HIGIENE (3 productos)
-- =============================================
(
  'Catsan Hygiene Plus Arena 20L',
  'catsan-hygiene-plus-arena-20l',
  'Arena higiénica no aglomerante con gránulos minerales blancos. Control de olores hasta 5 días. Extra absorbente. Sin polvo. Bolsa de 20 litros.',
  15.99, 12.99, true, 60,
  'https://static.miscota.com/media/1/photos/products/038028/catsan-hygiene-plus_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/038028/catsan-hygiene-plus_1_g.jpeg'],
  'gato', 'mini', 'higiene', 'adulto', 'Catsan'
),
(
  'Ever Clean Extra Strong Clumping',
  'ever-clean-extra-strong-clumping',
  'Arena aglomerante premium con tecnología de control de olor activado por carbón. Aoglomerados duros y compactos. Perfumada. 10 litros.',
  22.99, NULL, false, 40,
  'https://static.miscota.com/media/1/photos/products/022655/ever-clean-extra-strong-clumping_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/022655/ever-clean-extra-strong-clumping_1_g.jpeg'],
  'gato', 'mini', 'higiene', 'adulto', 'Ever Clean'
),
(
  'FURminator deShedding Gato Pelo Corto',
  'furminator-deshedding-gato-pelo-corto',
  'Herramienta profesional para reducir la muda de pelo en gatos de pelo corto. Alcanza el subpelo sin dañar la capa superior. Reduce pelo suelto un 90%.',
  24.99, NULL, false, 30,
  'https://static.miscota.com/media/1/photos/products/073080/furminator-deshedding-tool-gato-pelo-corto_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/073080/furminator-deshedding-tool-gato-pelo-corto_1_g.jpeg'],
  'gato', 'mini', 'higiene', 'adulto', 'FURminator'
),

-- =============================================
-- GATOS - SALUD (2 productos)
-- =============================================
(
  'Frontline Combo Spot-On Gato',
  'frontline-combo-spot-on-gato',
  'Pipetas antiparasitarias para gatos. Doble acción: elimina pulgas adultas y sus huevos/larvas del entorno. También eficaz contra garrapatas. Pack de 3.',
  24.99, NULL, false, 45,
  'https://static.miscota.com/media/1/photos/products/128690/frontline-combo-spot-on-gato_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/128690/frontline-combo-spot-on-gato_1_g.jpeg'],
  'gato', 'mini', 'salud', 'adulto', 'Frontline'
),
(
  'Feliway Classic Difusor + Recambio 48ml',
  'feliway-classic-difusor-recambio',
  'Difusor de feromonas felinas sintéticas que reduce estrés, marcaje y arañazos. Cubre hasta 70m². Efecto calmante clínicamente probado. Duración 30 días.',
  28.99, 24.99, true, 30,
  'https://static.miscota.com/media/1/photos/products/024044/feliway-classic-difusor-recambio-48ml_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/024044/feliway-classic-difusor-recambio-48ml_1_g.jpeg'],
  'gato', 'mini', 'salud', 'adulto', 'Feliway'
),

-- =============================================
-- GATOS - ACCESORIOS (3 productos)
-- =============================================
(
  'Catit Vesper High Base Rascador',
  'catit-vesper-high-base-rascador',
  'Rascador y mueble para gatos con plataforma elevada acolchada, cueva interior y postes de sisal natural. Diseño moderno en madera de nogal. Altura 56 cm.',
  69.99, 59.99, true, 15,
  'https://static.miscota.com/media/1/photos/products/147605/catit-vesper-high-base_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/147605/catit-vesper-high-base_1_g.jpeg'],
  'gato', 'mediano', 'accesorios', 'adulto', 'Catit'
),
(
  'Arenero Autolimpiante PetSafe ScoopFree',
  'petsafe-scoopfree-arenero-autolimpiante',
  'Arenero automático que limpia solo. Bandeja desechable con arena de cristal que absorbe olores. Sensor de movimiento. Sin contacto con residuos.',
  149.99, NULL, false, 10,
  'https://static.miscota.com/media/1/photos/products/114620/petsafe-scoopfree-arenero-autolimpiante_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/114620/petsafe-scoopfree-arenero-autolimpiante_1_g.jpeg'],
  'gato', 'mediano', 'accesorios', 'adulto', 'PetSafe'
),
(
  'Trixie Transportín Capri 2',
  'trixie-transportin-capri-2',
  'Transportín de plástico resistente con puerta metálica con cierre de seguridad. Ventilación lateral, asa ergonómica plegable. Apto para gatos hasta 8 kg.',
  24.99, NULL, false, 25,
  'https://static.miscota.com/media/1/photos/products/076159/trixie-transportin-capri-2_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/076159/trixie-transportin-capri-2_1_g.jpeg'],
  'gato', 'mini', 'accesorios', 'adulto', 'Trixie'
),

-- =============================================
-- GATOS - JUGUETES (2 productos)
-- =============================================
(
  'Catit Design Senses Super Roller Circuit',
  'catit-senses-super-roller-circuit',
  'Circuito de juego interactivo con pelota iluminada. Diseño modular que permite crear diferentes recorridos. Estimula el instinto cazador, incluye hierba gatera.',
  19.99, NULL, false, 35,
  'https://static.miscota.com/media/1/photos/products/076459/catit-design-senses-super-roller-circuit_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/076459/catit-design-senses-super-roller-circuit_1_g.jpeg'],
  'gato', 'mini', 'juguetes', 'adulto', 'Catit'
),
(
  'Kong Kickeroo Catnip Juguete Gato',
  'kong-kickeroo-catnip-gato',
  'Juguete alargado relleno de hierba gatera premium y papel crujiente. Ideal para patadas traseras. Plumas en los extremos para mayor diversión. Lavable.',
  8.99, NULL, false, 55,
  'https://static.miscota.com/media/1/photos/products/016033/kong-kickeroo-catnip_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/016033/kong-kickeroo-catnip_1_g.jpeg'],
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
  'https://static.miscota.com/media/1/photos/products/033024/versele-laga-crispy-muesli-conejos_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/033024/versele-laga-crispy-muesli-conejos_1_g.jpeg'],
  'otros', 'mini', 'alimentacion', 'adulto', 'Versele-Laga'
),
(
  'Vitakraft Menú Premium Hámster',
  'vitakraft-menu-premium-hamster',
  'Alimento principal para hámsters con cereales, semillas, fruta y proteína animal. Enriquecido con vitaminas y minerales esenciales. Sin conservantes artificiales.',
  4.99, NULL, false, 60,
  'https://static.miscota.com/media/1/photos/products/034043/vitakraft-menu-vital-hamster_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/034043/vitakraft-menu-vital-hamster_1_g.jpeg'],
  'otros', 'mini', 'alimentacion', 'adulto', 'Vitakraft'
),
(
  'Tetra Min Copos Peces Tropicales',
  'tetra-min-copos-peces-tropicales',
  'Alimento en copos para peces tropicales de agua dulce. Fórmula BioActive con prebióticos para mejorar resistencia. Clean & Clear Water formula. 250 ml.',
  7.99, 5.99, true, 70,
  'https://static.miscota.com/media/1/photos/products/001116/tetra-min-granules_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/001116/tetra-min-granules_1_g.jpeg'],
  'otros', 'mini', 'alimentacion', 'adulto', 'Tetra'
),

-- =============================================
-- OTROS ANIMALES - ACCESORIOS (3 productos)
-- =============================================
(
  'Ferplast Jaula Criceti 15 Hámster',
  'ferplast-jaula-criceti-15-hamster',
  'Jaula completa para hámsters con bebedero, comedero, rueda y casita incluidos. Base de plástico profunda, parte superior de rejilla con puerta. 78x48x39 cm.',
  59.99, NULL, false, 15,
  'https://static.miscota.com/media/1/photos/products/059140/ferplast-jaula-criceti-15_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/059140/ferplast-jaula-criceti-15_1_g.jpeg'],
  'otros', 'mini', 'accesorios', 'adulto', 'Ferplast'
),
(
  'Trixie Jaula Pájaros San Remo',
  'trixie-jaula-pajaros-san-remo',
  'Jaula para pájaros pequeños como canarios y periquitos. Con 2 comederos, 2 perchas y bandeja extraíble. Fácil limpieza. Dimensiones: 59x33x71 cm.',
  44.99, NULL, false, 20,
  'https://static.miscota.com/media/1/photos/products/076167/trixie-jaula-san-remo_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/076167/trixie-jaula-san-remo_1_g.jpeg'],
  'otros', 'mini', 'accesorios', 'adulto', 'Trixie'
),
(
  'Tetra AquaArt Acuario LED 60L',
  'tetra-aquaart-acuario-led-60l',
  'Acuario completo con iluminación LED eficiente, filtro EasyCrystal y calentador. Tapa con día/noche. Cristal curvado frontal elegante. Capacidad 60 litros.',
  129.99, 109.99, true, 8,
  'https://static.miscota.com/media/1/photos/products/001206/tetra-aquaart-led-60l_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/001206/tetra-aquaart-led-60l_1_g.jpeg'],
  'otros', 'mini', 'accesorios', 'adulto', 'Tetra'
),

-- =============================================
-- OTROS ANIMALES - SALUD (2 productos)
-- =============================================
(
  'Beaphar Care+ Vitamina C para Cobayas',
  'beaphar-care-vitamina-c-cobayas',
  'Suplemento líquido de vitamina C esencial para cobayas (no la sintetizan). Fácil de añadir al agua. Previene escorbuto y refuerza sistema inmune. 100 ml.',
  8.99, NULL, false, 40,
  'https://static.miscota.com/media/1/photos/products/052559/beaphar-care-vitamina-c_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/052559/beaphar-care-vitamina-c_1_g.jpeg'],
  'otros', 'mini', 'salud', 'adulto', 'Beaphar'
),
(
  'Versele-Laga Oropharma Omni-Vit',
  'versele-laga-oropharma-omni-vit',
  'Suplemento de vitaminas y aminoácidos para aves de jaula. Aumenta la vitalidad y mejora el plumaje. Soluble en agua o mezclable con pasta de cría.',
  12.99, NULL, false, 35,
  'https://static.miscota.com/media/1/photos/products/033108/versele-laga-oropharma-omni-vit_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/033108/versele-laga-oropharma-omni-vit_1_g.jpeg'],
  'otros', 'mini', 'salud', 'adulto', 'Versele-Laga'
),

-- =============================================
-- OTROS ANIMALES - JUGUETES (1 producto)
-- =============================================
(
  'Trixie Rueda Ejercicio Silenciosa 28cm',
  'trixie-rueda-ejercicio-silenciosa-28cm',
  'Rueda de ejercicio ultra silenciosa para hámsters sirios y jerbos. Superficie cerrada sin barrotes para proteger patitas. Rodamiento de bolas. Diámetro 28 cm.',
  14.99, NULL, false, 30,
  'https://static.miscota.com/media/1/photos/products/076129/trixie-rueda-ejercicio-silenciosa_1_g.jpeg',
  ARRAY['https://static.miscota.com/media/1/photos/products/076129/trixie-rueda-ejercicio-silenciosa_1_g.jpeg'],
  'otros', 'mini', 'juguetes', 'adulto', 'Trixie'
)

ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- VERIFICACIÓN
-- =============================================
-- SELECT count(*) as total_productos, animal_type, category 
-- FROM public.products 
-- GROUP BY animal_type, category 
-- ORDER BY animal_type, category;
