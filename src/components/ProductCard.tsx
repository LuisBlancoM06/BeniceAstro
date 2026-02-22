// Tarjeta de Producto con Favoritos, Quick View y Accesibilidad
import { useState, useCallback } from 'react';
import { getCategoryGradient, getAnimalEmoji, isPlaceholder } from '../lib/product-utils';

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

// Icono SVG por tipo de animal
function AnimalIcon({ animal }: { animal: string }) {
  if (animal === 'perro') {
    return (
      <svg className="w-14 h-14 text-white/40 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4.5 12.75l6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18 3c-1 0-2 .5-2 2s1 3 1 3h2s1-1 1-3-1-2-2-2zM6 3C5 3 4 3.5 4 5.5S5 8.5 5 8.5h2S8 7.5 8 5.5 7 3 6 3zM3.5 10C2.1 10 1 11.1 1 12.5V17c0 2.2 1.8 4 4 4h2c1.1 0 2-.9 2-2v-1h6v1c0 1.1.9 2 2 2h2c2.2 0 4-1.8 4-4v-4.5c0-1.4-1.1-2.5-2.5-2.5h-17z"/>
      </svg>
    );
  }
  if (animal === 'gato') {
    return (
      <svg className="w-14 h-14 text-white/40 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14h2v-2h-2v2zm0-4h2V7h-2v5z"/>
        <path d="M2 2l3 5v4l-1.5 3H5L7 10V5L4 1zm20 0l-3 5v4l1.5 3H19l-2-4V5l3-4zM8.5 14a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm7 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM12 17c-1.1 0-2-.4-2.5-1h5c-.5.6-1.4 1-2.5 1z"/>
      </svg>
    );
  }
  return (
    <svg className="w-14 h-14 text-white/40 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
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
      try {
        const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        return Array.isArray(wishlist) && wishlist.some((p: any) => p.id === product.id);
      } catch {
        return false;
      }
    }
    return false;
  });
  const [justToggled, setJustToggled] = useState(false);

  // Normalizar on_sale (puede venir como boolean o truthy value)
  const isOnSale = Boolean(product.on_sale);
  const salePrice = product.sale_price ? Number(product.sale_price) : null;
  const regularPrice = Number(product.price);
  
  const finalPrice = isOnSale && salePrice ? salePrice : regularPrice;
  const discount = isOnSale && salePrice 
    ? Math.round((1 - salePrice / regularPrice) * 100)
    : 0;

  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isOutOfStock = product.stock === 0;

  const toggleFavorite = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');

      if (isFavorite) {
        const newWishlist = wishlist.filter((p: any) => p.id !== product.id);
        localStorage.setItem('wishlist', JSON.stringify(newWishlist));
        setIsFavorite(false);
      } else {
        wishlist.push(product);
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
        setIsFavorite(true);
        // Animación heartbeat
        setJustToggled(true);
        setTimeout(() => setJustToggled(false), 600);
      }
    } catch {
      // localStorage not available
    }
    
    // Disparar evento para actualizar otros componentes
    window.dispatchEvent(new CustomEvent('wishlistUpdated'));
  }, [isFavorite, product]);

  // Imagen desde Cloudinary (image_url en la base de datos)
  const imageUrl = product.image_url || '';
  const [imgError, setImgError] = useState(false);
  const showPlaceholder = (!product.slug && isPlaceholder(imageUrl)) || imgError;
  const gradient = getCategoryGradient(product.animal_type, product.category);

  const productUrl = `/producto/${product.slug || product.id}`;
  const animalLabel = product.animal_type === 'perro' ? 'Perro' : product.animal_type === 'gato' ? 'Gato' : 'Otros';

  return (
    <article 
      className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-purple-200"
      itemScope
      itemType="https://schema.org/Product"
    >
      <a 
        href={productUrl}
        className="block"
        aria-label={`Ver ${product.name} - ${finalPrice.toFixed(2)}€`}
      >
        {/* Imagen */}
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          {showPlaceholder ? (
            <div className={`w-full h-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center p-4 group-hover:scale-110 transition-transform duration-700 ease-out`}>
              <AnimalIcon animal={product.animal_type} />
              <span className="text-white font-bold text-sm text-center mt-3 line-clamp-2 drop-shadow-md">
                {product.brand || product.name}
              </span>
              <span className="text-white/70 text-xs text-center mt-1 capitalize">
                {product.category}
              </span>
            </div>
          ) : (
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              loading="lazy"
              decoding="async"
              itemProp="image"
              onError={() => setImgError(true)}
            />
          )}
          
          {/* Overlay con acciones al hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Badges superiores */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {discount > 0 && (
              <span className="bg-red-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-lg animate-fade-in flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/></svg>
                -{discount}%
              </span>
            )}
            {isLowStock && (
              <span className="bg-amber-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-lg">
                ¡Últimas {product.stock}!
              </span>
            )}
            {isOutOfStock && (
              <span className="bg-gray-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-lg">
                Agotado
              </span>
            )}
          </div>

          {/* Badge tipo animal */}
          <span className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-gray-700 px-2 py-1 rounded-lg text-xs font-medium shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
            {getAnimalEmoji(product.animal_type)} {animalLabel}
          </span>
        </div>

        {/* Info del producto */}
        <div className="p-3.5">
          {/* Categoría */}
          <span className="text-xs font-medium text-purple-600 uppercase tracking-wider">
            {product.category}
          </span>

          {/* Nombre */}
          <h3 
            className="font-semibold text-sm text-gray-900 line-clamp-2 mt-1 mb-2 group-hover:text-purple-700 transition-colors min-h-[2.5rem] leading-tight"
            itemProp="name"
          >
            {product.name}
          </h3>

          {/* Precio */}
          <div className="flex items-baseline gap-2" itemProp="offers" itemScope itemType="https://schema.org/Offer">
            <meta itemProp="priceCurrency" content="EUR" />
            <span 
              className={`text-lg font-bold ${isOnSale ? 'text-red-600' : 'text-gray-900'}`}
              itemProp="price"
              content={finalPrice.toFixed(2)}
            >
              {finalPrice.toFixed(2)}€
            </span>
            {isOnSale && salePrice && (
              <span className="text-xs text-gray-400 line-through">
                {regularPrice.toFixed(2)}€
              </span>
            )}
            <meta itemProp="availability" content={isOutOfStock ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock'} />
          </div>

          {/* Barra de stock bajo */}
          {isLowStock && (
            <div className="mt-2">
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.max(10, (product.stock / 10) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </a>

      {/* Botón favorito (fuera del <a> para accesibilidad) */}
      <button
        onClick={toggleFavorite}
        aria-label={isFavorite ? `Quitar ${product.name} de favoritos` : `Añadir ${product.name} a favoritos`}
        aria-pressed={isFavorite}
        className={`
          absolute top-3 right-3 p-2 rounded-full shadow-lg transition-all duration-300 z-10
          ${isFavorite 
            ? 'bg-red-500 text-white scale-100' 
            : 'bg-white/90 backdrop-blur-sm text-gray-400 hover:text-red-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 translate-y-0 sm:translate-y-1 sm:group-hover:translate-y-0'
          }
          ${justToggled ? 'animate-heartbeat' : ''}
          ${isFavorite ? 'opacity-100' : ''}
        `}
      >
        <svg 
          className="w-4 h-4" 
          fill={isFavorite ? 'currentColor' : 'none'} 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>
    </article>
  );
}
