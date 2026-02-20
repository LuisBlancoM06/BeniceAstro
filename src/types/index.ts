export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string;
  images?: string[];
  brand?: string;
  animal_type: 'perro' | 'gato' | 'otros';
  size: 'mini' | 'mediano' | 'grande';
  category: 'alimentacion' | 'higiene' | 'salud' | 'accesorios' | 'juguetes';
  age_range: 'cachorro' | 'adulto' | 'senior';
  on_sale?: boolean;
  sale_price?: number;
  slug?: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  avatar_url?: string;
  is_subscribed_newsletter?: boolean;
  role?: 'user' | 'admin';
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  total: number;
  status: 'pendiente' | 'pagado' | 'enviado' | 'entregado' | 'cancelado';
  promo_code?: string;
  discount_amount?: number;
  shipping_address?: string;
  shipping_name?: string;
  shipping_phone?: string;
  stripe_session_id?: string;
  payment_intent_id?: string;
  tracking_number?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
}

export interface Newsletter {
  id: string;
  email: string;
  promo_code: string;
  source?: string;
  created_at: string;
}

export interface PromoCode {
  id: string;
  code: string;
  discount_percentage: number;
  active: boolean;
  max_uses?: number;
  current_uses?: number;
  expires_at?: string;
  created_at: string;
}

export interface ProductReview {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

export interface ReviewHelpfulVote {
  id: string;
  review_id: string;
  user_id: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  order_id: string;
  user_id: string;
  invoice_number: string;
  invoice_type: 'factura' | 'abono';
  subtotal: number;
  tax_amount: number;
  total: number;
  pdf_url?: string;
  created_at: string;
}

export interface Return {
  id: string;
  order_id: string;
  user_id: string;
  reason: string;
  status: 'solicitada' | 'aprobada' | 'rechazada' | 'completada';
  refund_amount?: number;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CancellationRequest {
  id: string;
  order_id: string;
  user_id: string;
  reason: string;
  status: 'pendiente' | 'aprobada' | 'rechazada';
  admin_notes?: string;
  stripe_refund_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Visit {
  id: string;
  ip_address: string;
  page: string;
  user_agent?: string;
  referer?: string;
  country?: string;
  city?: string;
  user_id?: string;
  created_at: string;
}

export interface SiteSettings {
  key: string;
  value: string;
  updated_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  read?: boolean;
  created_at: string;
}

/** @deprecated Legacy cart item shape (nested product). The active CartItem used by the cart store
 *  lives in stores/cart.ts with a flattened structure (id, name, price, image, quantity).
 *  Kept here for backward-compatibility with any code that still references it. */
export interface CartItem {
  product: Product;
  quantity: number;
}
