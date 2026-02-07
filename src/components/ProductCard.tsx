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
      className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 block"
    >
      {/* Imagen */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={imgError ? 'https://via.placeholder.com/400x400?text=Sin+imagen' : imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
          onError={() => setImgError(true)}
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {discount > 0 && (
            <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold shadow-lg animate-pulse">
              -{discount}%
            </span>
          )}
          {product.stock <= 5 && product.stock > 0 && (
            <span className="bg-yellow-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
              ¡Últimas!
            </span>
          )}
          {product.stock === 0 && (
            <span className="bg-gray-800 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
              Agotado
            </span>
          )}
        </div>

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

      {/* Info del producto */}
      <div className="p-3">
        {/* Tipo de animal */}
        <span className="text-[10px] font-medium text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full">
          {animalLabel}
        </span>
        
        {/* Nombre */}
        <h3 className="font-semibold text-sm text-gray-900 mt-1.5 line-clamp-2 group-hover:text-purple-600 transition-colors">
          {product.name}
        </h3>

        {/* Categoría */}
        <p className="text-xs text-gray-500 capitalize mt-0.5">{product.category}</p>

        {/* Precio */}
        <div className="flex items-center gap-1.5 mt-2">
          <span className="text-base font-bold text-purple-600">
            {finalPrice.toFixed(2)}€
          </span>
          {isOnSale && salePrice && (
            <span className="text-xs text-gray-400 line-through">
              {regularPrice.toFixed(2)}€
            </span>
          )}
        </div>

        {/* Barra de stock bajo */}
        {product.stock <= 10 && product.stock > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-orange-600 font-medium">¡Date prisa!</span>
              <span className="text-gray-500">Quedan {product.stock}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-orange-500 h-1.5 rounded-full transition-all"
                style={{ width: `${(product.stock / 10) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </a>
  );
}
