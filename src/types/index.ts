export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string;
  images?: string[];
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
  created_at: string;
}

export interface PromoCode {
  id: string;
  code: string;
  discount_percentage: number;
  active: boolean;
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

export interface CartItem {
  product: Product;
  quantity: number;
}
