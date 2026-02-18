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

// Detectar si una URL es placeholder
function isPlaceholder(url: string): boolean {
  return !url || url.includes('placehold') || url.includes('placeholder') || url === '';
}

// Gradientes por tipo de animal + categoría
function getCategoryGradient(animal: string, category: string): string {
  const gradients: Record<string, Record<string, string>> = {
    perro: {
      alimentacion: 'from-orange-400 to-amber-600',
      higiene: 'from-cyan-400 to-blue-500',
      salud: 'from-green-400 to-emerald-600',
      accesorios: 'from-blue-400 to-indigo-600',
      juguetes: 'from-yellow-400 to-orange-500',
    },
    gato: {
      alimentacion: 'from-purple-400 to-violet-600',
      higiene: 'from-fuchsia-400 to-pink-600',
      salud: 'from-teal-400 to-cyan-600',
      accesorios: 'from-rose-400 to-pink-600',
      juguetes: 'from-indigo-400 to-purple-600',
    },
    otros: {
      alimentacion: 'from-lime-400 to-green-600',
      higiene: 'from-sky-400 to-blue-600',
      salud: 'from-emerald-400 to-teal-600',
      accesorios: 'from-amber-400 to-yellow-600',
      juguetes: 'from-sky-400 to-indigo-500',
    },
  };
  return gradients[animal]?.[category] || 'from-gray-400 to-gray-600';
}

// Icono SVG por tipo de animal
function AnimalIcon({ animal }: { animal: string }) {
  if (animal === 'perro') {
    return (
      <svg className="w-12 h-12 text-white/30" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4.5 12.75l6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18 3c-1 0-2 .5-2 2s1 3 1 3h2s1-1 1-3-1-2-2-2zM6 3C5 3 4 3.5 4 5.5S5 8.5 5 8.5h2S8 7.5 8 5.5 7 3 6 3zM3.5 10C2.1 10 1 11.1 1 12.5V17c0 2.2 1.8 4 4 4h2c1.1 0 2-.9 2-2v-1h6v1c0 1.1.9 2 2 2h2c2.2 0 4-1.8 4-4v-4.5c0-1.4-1.1-2.5-2.5-2.5h-17z"/>
      </svg>
    );
  }
  if (animal === 'gato') {
    return (
      <svg className="w-12 h-12 text-white/30" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14h2v-2h-2v2zm0-4h2V7h-2v5z"/>
        <path d="M2 2l3 5v4l-1.5 3H5L7 10V5L4 1zm20 0l-3 5v4l1.5 3H19l-2-4V5l3-4zM8.5 14a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm7 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM12 17c-1.1 0-2-.4-2.5-1h5c-.5.6-1.4 1-2.5 1z"/>
      </svg>
    );
  }
  return (
    <svg className="w-12 h-12 text-white/30" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>
  );
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

  // Normalizar on_sale (puede venir como boolean o truthy value)
  const isOnSale = Boolean(product.on_sale);
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

  // Imagen con fallback – siempre usar ruta local basada en slug
  const imageUrl = product.slug ? `/images/productos/${product.slug}.jpg` : (product.image_url || '');
  const [imgError, setImgError] = useState(false);
  const showPlaceholder = (!product.slug && isPlaceholder(imageUrl)) || imgError;
  const gradient = getCategoryGradient(product.animal_type, product.category);

  const productUrl = `/producto/${product.slug || product.id}`;

  return (
    <a 
      href={productUrl}
      className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 block relative"
    >
      {/* Imagen más compacta */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {showPlaceholder ? (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center p-4 group-hover:scale-105 transition-transform duration-500`}>
            <AnimalIcon animal={product.animal_type} />
            <span className="text-white font-bold text-sm text-center mt-2 line-clamp-2 drop-shadow-md">
              {product.brand || product.name}
            </span>
            <span className="text-white/70 text-xs text-center mt-1 line-clamp-1">
              {product.category}
            </span>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        )}
        
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
