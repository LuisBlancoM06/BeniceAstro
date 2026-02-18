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
  'https://placehold.co/400x400/282c34/ffffff?text=Royal+Canin+Maxi+Adult&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Royal+Canin+Maxi+Adult&font=montserrat', 'https://placehold.co/400x400/282c34/ffffff?text=Royal+Canin+Maxi+Adult&font=montserrat'],
  'perro', 'grande', 'alimentacion', 'adulto', 'Royal Canin'
),
(
  'Acana Pacifica Dog',
  'acana-pacifica-dog',
  'Alimento biológicamente apropiado con pescado fresco del Pacífico. Sin cereales, rico en omega-3 para piel y pelaje saludables. 70% ingredientes animales.',
  69.99, NULL, false, 30,
  'https://placehold.co/400x400/282c34/ffffff?text=Acana+Pacifica+Dog&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Acana+Pacifica+Dog&font=montserrat'],
  'perro', 'mediano', 'alimentacion', 'adulto', 'Acana'
),
(
  'Orijen Original Dog',
  'orijen-original-dog',
  'Pienso premium con 85% de ingredientes animales frescos y variados. Pollo, pavo y pescado de crianza libre. Grain-free, sin fillers artificiales.',
  79.99, NULL, false, 25,
  'https://placehold.co/400x400/282c34/ffffff?text=Orijen+Original+Dog&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Orijen+Original+Dog&font=montserrat'],
  'perro', 'mediano', 'alimentacion', 'adulto', 'Orijen'
),
(
  'Advance Veterinary Diets Articular Care',
  'advance-articular-care-perro',
  'Pienso dietético para perros con problemas articulares. Con colágeno, ácido hialurónico y vitamina C para proteger las articulaciones.',
  48.50, 39.99, true, 20,
  'https://placehold.co/400x400/282c34/ffffff?text=Advance+Veterinary+Diets+Articular+Care&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Advance+Veterinary+Diets+Articular+Care&font=montserrat'],
  'perro', 'mediano', 'alimentacion', 'senior', 'Advance'
),
(
  'Royal Canin Mini Puppy',
  'royal-canin-mini-puppy',
  'Alimento completo para cachorros de razas pequeñas (hasta 10 kg) de 2 a 10 meses. Apoya el sistema inmunitario en desarrollo con un complejo de antioxidantes.',
  32.99, NULL, false, 55,
  'https://placehold.co/400x400/282c34/ffffff?text=Royal+Canin+Mini+Puppy&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Royal+Canin+Mini+Puppy&font=montserrat'],
  'perro', 'mini', 'alimentacion', 'cachorro', 'Royal Canin'
),
(
  'Taste of the Wild High Prairie',
  'taste-of-the-wild-high-prairie',
  'Pienso sin cereales con bisonte y venado asados. Fórmula inspirada en la dieta ancestral del perro, con frutas y verduras. Probióticos para digestión óptima.',
  59.99, NULL, false, 35,
  'https://placehold.co/400x400/282c34/ffffff?text=Taste+Of+The+Wild+High+Prairie&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Taste+Of+The+Wild+High+Prairie&font=montserrat'],
  'perro', 'grande', 'alimentacion', 'adulto', 'Taste of the Wild'
),
(
  'Hill''s Science Plan Adult Medium con Pollo',
  'hills-science-plan-adult-medium-pollo',
  'Nutrición clínicamente probada con pollo como ingrediente principal. Antioxidantes, ácidos grasos omega-6 y vitamina E para piel y pelo brillante.',
  46.99, NULL, false, 40,
  'https://placehold.co/400x400/282c34/ffffff?text=Hill+S+Science+Plan+Adult+Medium+Con+Pollo&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Hill+S+Science+Plan+Adult+Medium+Con+Pollo&font=montserrat'],
  'perro', 'mediano', 'alimentacion', 'adulto', 'Hill''s'
),
(
  'Eukanuba Adult Large Breed',
  'eukanuba-adult-large-breed',
  'Pienso de alta calidad para perros adultos de razas grandes. Con pollo fresco, DHA para cerebro ágil y L-carnitina para mantener peso ideal.',
  42.99, 36.99, true, 50,
  'https://placehold.co/400x400/282c34/ffffff?text=Eukanuba+Adult+Large+Breed+Pollo&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Eukanuba+Adult+Large+Breed+Pollo&font=montserrat'],
  'perro', 'grande', 'alimentacion', 'adulto', 'Eukanuba'
),
(
  'Purina Pro Plan Medium Puppy con Pollo',
  'purina-pro-plan-medium-puppy-pollo',
  'Pienso para cachorros de razas medianas con OPTISTART. Calostro natural para reforzar defensas y DHA procedente de aceite de pescado para el cerebro.',
  38.99, NULL, false, 45,
  'https://placehold.co/400x400/282c34/ffffff?text=Purina+Pro+Plan+Medium+Puppy+Con+Pollo&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Purina+Pro+Plan+Medium+Puppy+Con+Pollo&font=montserrat'],
  'perro', 'mediano', 'alimentacion', 'cachorro', 'Purina Pro Plan'
),
(
  'Natural Trainer Sensitive No Gluten Medium/Maxi Salmón',
  'natural-trainer-sensitive-salmon',
  'Pienso sin gluten con salmón fresco para perros sensibles. Extractos naturales de alcachofa y romero. Ideal para intolerancias alimentarias.',
  44.50, NULL, false, 30,
  'https://placehold.co/400x400/282c34/ffffff?text=Natural+Trainer+Sensitive+No+Gluten+Medium+Maxi+Adulto+Salmon&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Natural+Trainer+Sensitive+No+Gluten+Medium+Maxi+Adulto+Salmon&font=montserrat'],
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
  'https://placehold.co/400x400/282c34/ffffff?text=Tropiclean+Oatmeal+Tea+Tree+Shampoo&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Tropiclean+Oatmeal+Tea+Tree+Shampoo&font=montserrat'],
  'perro', 'mediano', 'higiene', 'adulto', 'TropiClean'
),
(
  'FURminator deShedding Tool Perro Grande',
  'furminator-deshedding-perro-grande',
  'Cepillo profesional antipelaje para perros de pelo largo/corto de más de 23 kg. Reduce la caída del pelo hasta un 90%. Botón de liberación de pelo fácil.',
  34.99, 29.99, true, 25,
  'https://placehold.co/400x400/282c34/ffffff?text=Furminator+Deshedding+Tool+L+Pelo+Largo&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Furminator+Deshedding+Tool+L+Pelo+Largo&font=montserrat'],
  'perro', 'grande', 'higiene', 'adulto', 'FURminator'
),
(
  'Toallitas Limpiadoras Beaphar',
  'beaphar-toallitas-limpiadoras-perro',
  'Pack de 100 toallitas húmedas para limpieza diaria de ojos, orejas y patas. Con aloe vera y manzanilla. Hipoalergénicas y sin alcohol.',
  8.99, NULL, false, 80,
  'https://placehold.co/400x400/282c34/ffffff?text=Beaphar+Multi+Fresh+Wipes&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Beaphar+Multi+Fresh+Wipes&font=montserrat'],
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
  'https://placehold.co/400x400/282c34/ffffff?text=Seresto+Collar+Antiparasitario+Perro+Mas+De+8+Kg&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Seresto+Collar+Antiparasitario+Perro+Mas+De+8+Kg&font=montserrat'],
  'perro', 'grande', 'salud', 'adulto', 'Seresto'
),
(
  'Frontline Tri-Act Perro 20-40 kg',
  'frontline-tri-act-perro-20-40kg',
  'Pipetas antiparasitarias spot-on. Triple acción: repele, trata y previene pulgas, garrapatas y mosquitos. Pack de 3 pipetas para 3 meses de protección.',
  32.99, NULL, false, 35,
  'https://placehold.co/400x400/282c34/ffffff?text=Frontline+Tri+Act+Perro+20+40+Kg&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Frontline+Tri+Act+Perro+20+40+Kg&font=montserrat'],
  'perro', 'grande', 'salud', 'adulto', 'Frontline'
),
(
  'GimDog Dental Snacks',
  'gimdog-dental-snacks',
  'Snacks dentales funcionales que reducen la formación de sarro hasta un 80%. Con forma ergonómica para limpieza profunda. Ayudan al aliento fresco.',
  6.99, NULL, false, 70,
  'https://placehold.co/400x400/282c34/ffffff?text=Gimdog+Dental+Care+Snacks&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Gimdog+Dental+Care+Snacks&font=montserrat'],
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
  'https://placehold.co/400x400/282c34/ffffff?text=Flexi+New+Classic+L+Cinta+5M&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Flexi+New+Classic+L+Cinta+5M&font=montserrat'],
  'perro', 'grande', 'accesorios', 'adulto', 'Flexi'
),
(
  'Cama Trixie Vital Best of All',
  'trixie-cama-vital-best-of-all',
  'Cama ortopédica con relleno de espuma viscoelástica. Funda lavable a máquina, borde acolchado elevado. Fondo antideslizante. Tamaño 80x60 cm.',
  49.99, 42.99, true, 20,
  'https://placehold.co/400x400/282c34/ffffff?text=Trixie+Cama+Vital+Best+Of+All&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Trixie+Cama+Vital+Best+Of+All&font=montserrat'],
  'perro', 'grande', 'accesorios', 'adulto', 'Trixie'
),
(
  'Julius-K9 IDC Powerharness',
  'julius-k9-idc-powerharness',
  'Arnés profesional con sistema de cierre de seguridad. Etiquetas intercambiables, reflectante, asa superior de agarre. Interior forrado transpirable.',
  39.99, NULL, false, 30,
  'https://placehold.co/400x400/282c34/ffffff?text=Julius+K9+Idc+Powerharness&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Julius+K9+Idc+Powerharness&font=montserrat'],
  'perro', 'grande', 'accesorios', 'adulto', 'Julius-K9'
),
(
  'Comedero Elevado Trixie Acero Inox',
  'trixie-comedero-elevado-acero',
  'Doble comedero de acero inoxidable con soporte elevado regulable en altura. Capacidad 2x1.8L. Antideslizante. Ideal para perros grandes y articulaciones.',
  27.99, NULL, false, 35,
  'https://placehold.co/400x400/282c34/ffffff?text=Trixie+Comedero+Elevado+Acero+Inoxidable&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Trixie+Comedero+Elevado+Acero+Inoxidable&font=montserrat'],
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
  'https://placehold.co/400x400/282c34/ffffff?text=Kong+Classic+L&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Kong+Classic+L&font=montserrat'],
  'perro', 'grande', 'juguetes', 'adulto', 'Kong'
),
(
  'Nylabone DuraChew Hueso Sabor Bacon',
  'nylabone-durachew-hueso-bacon',
  'Hueso masticable de nylon duradero con sabor a bacon real. Para perros de masticación potente (hasta 23 kg). Limpia los dientes mientras juegan.',
  11.99, NULL, false, 50,
  'https://placehold.co/400x400/282c34/ffffff?text=Nylabone+Durachew+Bacon&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Nylabone+Durachew+Bacon&font=montserrat'],
  'perro', 'mediano', 'juguetes', 'adulto', 'Nylabone'
),
(
  'Trixie Dog Activity Flip Board',
  'trixie-dog-activity-flip-board',
  'Juego de inteligencia nivel 2 para perros. Diferentes mecanismos de apertura para esconder premios. Estimulación mental, reduce ansiedad y aburrimiento.',
  16.99, 13.99, true, 40,
  'https://placehold.co/400x400/282c34/ffffff?text=Trixie+Dog+Activity+Flip+Board&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Trixie+Dog+Activity+Flip+Board&font=montserrat'],
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
  'https://placehold.co/400x400/282c34/ffffff?text=Royal+Canin+Kitten&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Royal+Canin+Kitten&font=montserrat'],
  'gato', 'mini', 'alimentacion', 'cachorro', 'Royal Canin'
),
(
  'Royal Canin Indoor 27',
  'royal-canin-indoor-27',
  'Pienso para gatos adultos de interior (1-7 años). Fórmula que ayuda a reducir las heces olorosas y controlar el peso. Con L-carnitina y fibras.',
  42.99, NULL, false, 40,
  'https://placehold.co/400x400/282c34/ffffff?text=Royal+Canin+Indoor+27&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Royal+Canin+Indoor+27&font=montserrat'],
  'gato', 'mini', 'alimentacion', 'adulto', 'Royal Canin'
),
(
  'Purina Felix Fantastic Selección Mixta',
  'purina-felix-fantastic-seleccion-mixta',
  'Pack de 12 sobres de comida húmeda en gelatina. Variedad de sabores: pollo, ternera, salmón y atún. Trocitos jugosos que encantan a todos los gatos.',
  9.99, 7.99, true, 80,
  'https://placehold.co/400x400/282c34/ffffff?text=Purina+Felix+Fantastic+Seleccion+Mixta+En+Gelatina&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Purina+Felix+Fantastic+Seleccion+Mixta+En+Gelatina&font=montserrat'],
  'gato', 'mini', 'alimentacion', 'adulto', 'Purina Felix'
),
(
  'Orijen Cat & Kitten',
  'orijen-cat-kitten',
  'Pienso premium con 90% de ingredientes animales. Pollo, pavo, pescado y huevos frescos. Sin cereales. Biológicamente apropiado para gatos de todas las edades.',
  59.99, NULL, false, 25,
  'https://placehold.co/400x400/282c34/ffffff?text=Orijen+Cat+Kitten&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Orijen+Cat+Kitten&font=montserrat'],
  'gato', 'mini', 'alimentacion', 'adulto', 'Orijen'
),
(
  'Hill''s Science Plan Sterilised Cat con Pollo',
  'hills-sterilised-cat-pollo',
  'Nutrición óptima para gatos esterilizados. Control de peso con L-carnitina, fibras para saciedad y minerales controlados para salud urinaria.',
  39.99, NULL, false, 35,
  'https://placehold.co/400x400/282c34/ffffff?text=Hill+S+Science+Plan+Sterilised+Cat+Pollo&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Hill+S+Science+Plan+Sterilised+Cat+Pollo&font=montserrat'],
  'gato', 'mini', 'alimentacion', 'adulto', 'Hill''s'
),
(
  'Whiskas Temptations Pollo Queso',
  'whiskas-temptations-pollo-queso',
  'Snacks crujientes por fuera y cremosos por dentro. Irresistibles para tu gato. Solo 2 kcal por unidad. Ideales como recompensa o para entrenamiento.',
  3.49, NULL, false, 100,
  'https://placehold.co/400x400/282c34/ffffff?text=Whiskas+Temptations+Pollo+Queso&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Whiskas+Temptations+Pollo+Queso&font=montserrat'],
  'gato', 'mini', 'alimentacion', 'adulto', 'Whiskas'
),
(
  'Applaws Pechuga de Pollo Natural',
  'applaws-pechuga-pollo-natural',
  'Comida húmeda 100% natural con 75% de pechuga de pollo real. Sin cereales, colorantes ni conservantes artificiales. Caldo nutritivo. Lata de 156g.',
  2.79, NULL, false, 90,
  'https://placehold.co/400x400/282c34/ffffff?text=Applaws+Pechuga+De+Pollo+Natural&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Applaws+Pechuga+De+Pollo+Natural&font=montserrat'],
  'gato', 'mini', 'alimentacion', 'adulto', 'Applaws'
),
(
  'Royal Canin Ageing 12+ Sterilised',
  'royal-canin-ageing-12-sterilised',
  'Para gatos esterilizados mayores de 12 años. Apoya la función renal, mantiene la masa muscular. Fósforo adaptado y antioxidantes para el envejecimiento.',
  38.50, NULL, false, 25,
  'https://placehold.co/400x400/282c34/ffffff?text=Royal+Canin+Ageing+12+Sterilised&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Royal+Canin+Ageing+12+Sterilised&font=montserrat'],
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
  'https://placehold.co/400x400/282c34/ffffff?text=Catsan+Hygiene+Plus&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Catsan+Hygiene+Plus&font=montserrat'],
  'gato', 'mini', 'higiene', 'adulto', 'Catsan'
),
(
  'Ever Clean Extra Strong Clumping',
  'ever-clean-extra-strong-clumping',
  'Arena aglomerante premium con tecnología de control de olor activado por carbón. Aoglomerados duros y compactos. Perfumada. 10 litros.',
  22.99, NULL, false, 40,
  'https://placehold.co/400x400/282c34/ffffff?text=Ever+Clean+Extra+Strong+Clumping&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Ever+Clean+Extra+Strong+Clumping&font=montserrat'],
  'gato', 'mini', 'higiene', 'adulto', 'Ever Clean'
),
(
  'FURminator deShedding Gato Pelo Corto',
  'furminator-deshedding-gato-pelo-corto',
  'Herramienta profesional para reducir la muda de pelo en gatos de pelo corto. Alcanza el subpelo sin dañar la capa superior. Reduce pelo suelto un 90%.',
  24.99, NULL, false, 30,
  'https://placehold.co/400x400/282c34/ffffff?text=Furminator+Deshedding+Tool+Gato+Pelo+Corto&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Furminator+Deshedding+Tool+Gato+Pelo+Corto&font=montserrat'],
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
  'https://placehold.co/400x400/282c34/ffffff?text=Frontline+Combo+Spot+On+Gato&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Frontline+Combo+Spot+On+Gato&font=montserrat'],
  'gato', 'mini', 'salud', 'adulto', 'Frontline'
),
(
  'Feliway Classic Difusor + Recambio 48ml',
  'feliway-classic-difusor-recambio',
  'Difusor de feromonas felinas sintéticas que reduce estrés, marcaje y arañazos. Cubre hasta 70m². Efecto calmante clínicamente probado. Duración 30 días.',
  28.99, 24.99, true, 30,
  'https://placehold.co/400x400/282c34/ffffff?text=Feliway+Classic+Difusor+Recambio+48Ml&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Feliway+Classic+Difusor+Recambio+48Ml&font=montserrat'],
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
  'https://placehold.co/400x400/282c34/ffffff?text=Catit+Vesper+High+Base&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Catit+Vesper+High+Base&font=montserrat'],
  'gato', 'mediano', 'accesorios', 'adulto', 'Catit'
),
(
  'Arenero Autolimpiante PetSafe ScoopFree',
  'petsafe-scoopfree-arenero-autolimpiante',
  'Arenero automático que limpia solo. Bandeja desechable con arena de cristal que absorbe olores. Sensor de movimiento. Sin contacto con residuos.',
  149.99, NULL, false, 10,
  'https://placehold.co/400x400/282c34/ffffff?text=Petsafe+Scoopfree+Arenero+Autolimpiante&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Petsafe+Scoopfree+Arenero+Autolimpiante&font=montserrat'],
  'gato', 'mediano', 'accesorios', 'adulto', 'PetSafe'
),
(
  'Trixie Transportín Capri 2',
  'trixie-transportin-capri-2',
  'Transportín de plástico resistente con puerta metálica con cierre de seguridad. Ventilación lateral, asa ergonómica plegable. Apto para gatos hasta 8 kg.',
  24.99, NULL, false, 25,
  'https://placehold.co/400x400/282c34/ffffff?text=Trixie+Transportin+Capri+2&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Trixie+Transportin+Capri+2&font=montserrat'],
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
  'https://placehold.co/400x400/282c34/ffffff?text=Catit+Design+Senses+Super+Roller+Circuit&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Catit+Design+Senses+Super+Roller+Circuit&font=montserrat'],
  'gato', 'mini', 'juguetes', 'adulto', 'Catit'
),
(
  'Kong Kickeroo Catnip Juguete Gato',
  'kong-kickeroo-catnip-gato',
  'Juguete alargado relleno de hierba gatera premium y papel crujiente. Ideal para patadas traseras. Plumas en los extremos para mayor diversión. Lavable.',
  8.99, NULL, false, 55,
  'https://placehold.co/400x400/282c34/ffffff?text=Kong+Kickeroo+Catnip&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Kong+Kickeroo+Catnip&font=montserrat'],
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
  'https://placehold.co/400x400/282c34/ffffff?text=Versele+Laga+Crispy+Muesli+Conejos&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Versele+Laga+Crispy+Muesli+Conejos&font=montserrat'],
  'otros', 'mini', 'alimentacion', 'adulto', 'Versele-Laga'
),
(
  'Vitakraft Menú Premium Hámster',
  'vitakraft-menu-premium-hamster',
  'Alimento principal para hámsters con cereales, semillas, fruta y proteína animal. Enriquecido con vitaminas y minerales esenciales. Sin conservantes artificiales.',
  4.99, NULL, false, 60,
  'https://placehold.co/400x400/282c34/ffffff?text=Vitakraft+Menu+Vital+Hamster&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Vitakraft+Menu+Vital+Hamster&font=montserrat'],
  'otros', 'mini', 'alimentacion', 'adulto', 'Vitakraft'
),
(
  'Tetra Min Copos Peces Tropicales',
  'tetra-min-copos-peces-tropicales',
  'Alimento en copos para peces tropicales de agua dulce. Fórmula BioActive con prebióticos para mejorar resistencia. Clean & Clear Water formula. 250 ml.',
  7.99, 5.99, true, 70,
  'https://placehold.co/400x400/282c34/ffffff?text=Tetra+Min+Granules&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Tetra+Min+Granules&font=montserrat'],
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
  'https://placehold.co/400x400/282c34/ffffff?text=Ferplast+Jaula+Criceti+15&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Ferplast+Jaula+Criceti+15&font=montserrat'],
  'otros', 'mini', 'accesorios', 'adulto', 'Ferplast'
),
(
  'Trixie Jaula Pájaros San Remo',
  'trixie-jaula-pajaros-san-remo',
  'Jaula para pájaros pequeños como canarios y periquitos. Con 2 comederos, 2 perchas y bandeja extraíble. Fácil limpieza. Dimensiones: 59x33x71 cm.',
  44.99, NULL, false, 20,
  'https://placehold.co/400x400/282c34/ffffff?text=Trixie+Jaula+San+Remo&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Trixie+Jaula+San+Remo&font=montserrat'],
  'otros', 'mini', 'accesorios', 'adulto', 'Trixie'
),
(
  'Tetra AquaArt Acuario LED 60L',
  'tetra-aquaart-acuario-led-60l',
  'Acuario completo con iluminación LED eficiente, filtro EasyCrystal y calentador. Tapa con día/noche. Cristal curvado frontal elegante. Capacidad 60 litros.',
  129.99, 109.99, true, 8,
  'https://placehold.co/400x400/282c34/ffffff?text=Tetra+Aquaart+Led+60L&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Tetra+Aquaart+Led+60L&font=montserrat'],
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
  'https://placehold.co/400x400/282c34/ffffff?text=Beaphar+Care+Vitamina+C&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Beaphar+Care+Vitamina+C&font=montserrat'],
  'otros', 'mini', 'salud', 'adulto', 'Beaphar'
),
(
  'Versele-Laga Oropharma Omni-Vit',
  'versele-laga-oropharma-omni-vit',
  'Suplemento de vitaminas y aminoácidos para aves de jaula. Aumenta la vitalidad y mejora el plumaje. Soluble en agua o mezclable con pasta de cría.',
  12.99, NULL, false, 35,
  'https://placehold.co/400x400/282c34/ffffff?text=Versele+Laga+Oropharma+Omni+Vit&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Versele+Laga+Oropharma+Omni+Vit&font=montserrat'],
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
  'https://placehold.co/400x400/282c34/ffffff?text=Trixie+Rueda+Ejercicio+Silenciosa&font=montserrat',
  ARRAY['https://placehold.co/400x400/282c34/ffffff?text=Trixie+Rueda+Ejercicio+Silenciosa&font=montserrat'],
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
