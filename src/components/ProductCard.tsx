// Tarjeta de Producto con Favoritos
import { useState } from 'react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  sale_price?: number;
  on_sale?: boolean;
  stock: number;
  image_url: string;
  images?: string[];
  animal_type: string;
  size: string;
  category: string;
  age_range: string;
  slug?: string;
  brand?: string;
}

interface ProductCardProps {
  product: Product;
  'client:load'?: boolean;
  'client:idle'?: boolean;
  'client:visible'?: boolean;
  'client:only'?: string;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isFavorite, setIsFavorite] = useState(() => {
    if (typeof window !== 'undefined') {
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      return wishlist.some((p: any) => p.id === product.id);
    }
    return false;
  });

  // Normalizar on_sale (puede venir como string "true" o boolean true)
  const isOnSale = product.on_sale === true || product.on_sale === 'true';
  const salePrice = product.sale_price ? Number(product.sale_price) : null;
  const regularPrice = Number(product.price);
  
  const finalPrice = isOnSale && salePrice ? salePrice : regularPrice;
  const discount = isOnSale && salePrice 
    ? Math.round((1 - salePrice / regularPrice) * 100)
    : 0;

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    
    if (isFavorite) {
      const newWishlist = wishlist.filter((p: any) => p.id !== product.id);
      localStorage.setItem('wishlist', JSON.stringify(newWishlist));
      setIsFavorite(false);
    } else {
      wishlist.push(product);
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
      setIsFavorite(true);
    }
    
    // Disparar evento para actualizar otros componentes
    window.dispatchEvent(new CustomEvent('wishlistUpdated'));
  };

  const animalLabel = product.animal_type === 'perro' ? 'Perro' : product.animal_type === 'gato' ? 'Gato' : 'Otros';
  
  // Imagen con fallback
  const imageUrl = product.image_url || 'https://via.placeholder.com/400x400?text=Sin+imagen';
  const [imgError, setImgError] = useState(false);

  const productUrl = `/producto/${product.slug || product.id}`;

  return (
    <a 
      href={productUrl}
      className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 block relative"
    >
      {/* Imagen más compacta */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <img
          src={imgError ? 'https://via.placeholder.com/400x400?text=Sin+imagen' : imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={() => setImgError(true)}
        />
        
        {/* Badge descuento */}
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold shadow-lg">
            -{discount}%
          </span>
        )}

        {/* Botón favorito */}
        <button
          onClick={toggleFavorite}
          className={`
            absolute top-2 right-2 p-1.5 rounded-full shadow-lg transition-all duration-300
            ${isFavorite 
              ? 'bg-red-500 text-white scale-110' 
              : 'bg-white text-gray-400 hover:text-red-500 hover:scale-110'
            }
          `}
        >
          <svg 
            className="w-4 h-4" 
            fill={isFavorite ? 'currentColor' : 'none'} 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      {/* Solo nombre y precio */}
      <div className="p-2 flex items-start justify-between gap-1">
        <h3 className="font-semibold text-xs text-gray-900 line-clamp-2 group-hover:text-orange-500 transition-colors">
          {product.name}
        </h3>
        <div className="flex flex-col items-end shrink-0">
          <span className="text-sm font-bold text-orange-500 whitespace-nowrap">
            {finalPrice.toFixed(2)}€
          </span>
          {isOnSale && salePrice && (
            <span className="text-[10px] text-gray-400 line-through whitespace-nowrap">
              {regularPrice.toFixed(2)}€
            </span>
          )}
        </div>
      </div>
    </a>
  );
}
