-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.cancellation_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  user_id uuid NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pendiente'::text CHECK (status = ANY (ARRAY['pendiente'::text, 'aprobada'::text, 'rechazada'::text])),
  admin_notes text,
  stripe_refund_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cancellation_requests_pkey PRIMARY KEY (id),
  CONSTRAINT cancellation_requests_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT cancellation_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.contact_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pendiente'::text CHECK (status = ANY (ARRAY['pendiente'::text, 'leido'::text, 'respondido'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT contact_messages_pkey PRIMARY KEY (id)
);
CREATE TABLE public.invoices (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL,
  user_id uuid NOT NULL,
  invoice_number text NOT NULL UNIQUE,
  invoice_type text NOT NULL CHECK (invoice_type = ANY (ARRAY['factura'::text, 'abono'::text])),
  subtotal numeric NOT NULL,
  tax_amount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL,
  pdf_url text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT invoices_pkey PRIMARY KEY (id),
  CONSTRAINT invoices_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT invoices_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.newsletters (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  email text NOT NULL UNIQUE,
  promo_code text NOT NULL,
  source text DEFAULT 'footer'::text CHECK (source = ANY (ARRAY['web'::text, 'app'::text, 'footer'::text, 'admin'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT newsletters_pkey PRIMARY KEY (id)
);
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric NOT NULL CHECK (price >= 0::numeric),
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.order_status_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  old_status text,
  new_status text NOT NULL,
  changed_by uuid,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT order_status_history_pkey PRIMARY KEY (id),
  CONSTRAINT order_status_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_status_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.users(id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  total numeric NOT NULL CHECK (total >= 0::numeric),
  status text NOT NULL DEFAULT 'pendiente'::text CHECK (status = ANY (ARRAY['pendiente'::text, 'pagado'::text, 'enviado'::text, 'entregado'::text, 'cancelado'::text])),
  promo_code text,
  discount_amount numeric DEFAULT 0,
  shipping_address text,
  shipping_name text,
  shipping_phone text,
  stripe_session_id text,
  tracking_number text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  payment_intent_id text,
  carrier text,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.product_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  user_id uuid NOT NULL,
  user_name text NOT NULL DEFAULT 'Usuario'::text,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text DEFAULT ''::text CHECK (char_length(comment) <= 1000),
  verified_purchase boolean DEFAULT false,
  helpful_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT product_reviews_pkey PRIMARY KEY (id),
  CONSTRAINT product_reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT product_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text UNIQUE,
  description text,
  price numeric NOT NULL CHECK (price >= 0::numeric),
  sale_price numeric,
  on_sale boolean DEFAULT false,
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url text,
  images ARRAY DEFAULT '{}'::text[],
  brand text DEFAULT 'Benice'::text,
  animal_type text NOT NULL CHECK (animal_type = ANY (ARRAY['perro'::text, 'gato'::text, 'otros'::text])),
  size text NOT NULL CHECK (size = ANY (ARRAY['mini'::text, 'mediano'::text, 'grande'::text])),
  category text NOT NULL CHECK (category = ANY (ARRAY['alimentacion'::text, 'higiene'::text, 'salud'::text, 'accesorios'::text, 'juguetes'::text])),
  age_range text NOT NULL CHECK (age_range = ANY (ARRAY['cachorro'::text, 'adulto'::text, 'senior'::text])),
  created_at timestamp with time zone DEFAULT now(),
  rating numeric DEFAULT 0,
  reviews_count integer DEFAULT 0,
  CONSTRAINT products_pkey PRIMARY KEY (id)
);
CREATE TABLE public.promo_codes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  code text NOT NULL UNIQUE,
  discount_percentage integer NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
  active boolean DEFAULT true,
  max_uses integer,
  current_uses integer DEFAULT 0,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT promo_codes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.returns (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL,
  user_id uuid NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'solicitada'::text CHECK (status = ANY (ARRAY['solicitada'::text, 'aprobada'::text, 'rechazada'::text, 'completada'::text])),
  refund_amount numeric,
  admin_notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT returns_pkey PRIMARY KEY (id),
  CONSTRAINT returns_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT returns_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.review_helpful_votes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT review_helpful_votes_pkey PRIMARY KEY (id),
  CONSTRAINT review_helpful_votes_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.product_reviews(id),
  CONSTRAINT review_helpful_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.site_settings (
  key text NOT NULL,
  value text NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT site_settings_pkey PRIMARY KEY (key)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  full_name text,
  phone text,
  address text,
  role text NOT NULL DEFAULT 'user'::text CHECK (role = ANY (ARRAY['user'::text, 'admin'::text])),
  created_at timestamp with time zone DEFAULT now(),
  city text,
  postal_code text,
  avatar_url text,
  is_subscribed_newsletter boolean DEFAULT false,
  stripe_customer_id text UNIQUE,
  address_line1 text,
  address_line2 text,
  country text DEFAULT 'ES'::text,
  latitude double precision,
  longitude double precision,
  state text,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.visits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  page text NOT NULL,
  user_agent text,
  referer text,
  country text,
  city text,
  user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT visits_pkey PRIMARY KEY (id),
  CONSTRAINT visits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);