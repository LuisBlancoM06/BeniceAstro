// Tarjeta de Producto con Quick View y Favoritos
import { useState } from 'react';
import { addToCart } from '../stores/cart';
import { openQuickView, type QuickViewProduct } from './QuickViewModal';
import { toast } from './Toast';

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
  showQuickActions?: boolean;
}

export default function ProductCard({ product, showQuickActions = true }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
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

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (product.stock === 0) return;
    
    setIsAddingToCart(true);
    
    // Pasar precio original y precio de oferta si aplica
    const cartItem: any = {
      id: product.id,
      name: product.name,
      price: regularPrice,
      image: product.image_url,
    };
    
    // Si está en oferta, agregar el precio de oferta
    if (isOnSale && salePrice) {
      cartItem.salePrice = salePrice;
    }
    
    addToCart(cartItem, 1);
    
    await new Promise(resolve => setTimeout(resolve, 400));
    setIsAddingToCart(false);
    
    toast.success('¡Añadido al carrito!', product.name);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openQuickView(product as QuickViewProduct);
  };

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    
    if (isFavorite) {
      const newWishlist = wishlist.filter((p: any) => p.id !== product.id);
      localStorage.setItem('wishlist', JSON.stringify(newWishlist));
      setIsFavorite(false);
      toast.info('Eliminado de favoritos');
    } else {
      wishlist.push(product);
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
      setIsFavorite(true);
      toast.success('¡Añadido a favoritos!');
    }
    
    // Disparar evento para actualizar otros componentes
    window.dispatchEvent(new CustomEvent('wishlistUpdated'));
  };

  const animalLabel = product.animal_type === 'perro' ? 'Perro' : product.animal_type === 'gato' ? 'Gato' : 'Otros';
  
  // Imagen con fallback
  const imageUrl = product.image_url || 'https://via.placeholder.com/400x400?text=Sin+imagen';
  const [imgError, setImgError] = useState(false);

  return (
    <div 
      className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Imagen */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <a href={`/producto/${product.slug || product.id}`}>
          <img
            src={imgError ? 'https://via.placeholder.com/400x400?text=Sin+imagen' : imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        </a>
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {discount > 0 && (
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg animate-pulse">
              -{discount}%
            </span>
          )}
          {product.stock <= 5 && product.stock > 0 && (
            <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold">
              ¡Últimas unidades!
            </span>
          )}
          {product.stock === 0 && (
            <span className="bg-gray-800 text-white px-3 py-1 rounded-full text-xs font-bold">
              Agotado
            </span>
          )}
        </div>

        {/* Botón favorito */}
        <button
          onClick={toggleFavorite}
          className={`
            absolute top-3 right-3 p-2 rounded-full shadow-lg transition-all duration-300
            ${isFavorite 
              ? 'bg-red-500 text-white scale-110' 
              : 'bg-white text-gray-400 hover:text-red-500 hover:scale-110'
            }
          `}
        >
          <svg 
            className="w-5 h-5" 
            fill={isFavorite ? 'currentColor' : 'none'} 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* Acciones rápidas */}
        {showQuickActions && (
          <div className={`
            absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent
            p-4 flex gap-2 justify-center
            transform transition-all duration-300
            ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
          `}>
            <button
              onClick={handleQuickView}
              className="flex-1 bg-white text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Vista rápida
            </button>
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0 || isAddingToCart}
              className={`
                flex-1 py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2
                ${product.stock === 0 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-purple-600 text-white hover:bg-purple-700'
                }
                ${isAddingToCart ? 'animate-pulse' : ''}
              `}
            >
              {isAddingToCart ? (
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Añadir
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Info del producto */}
      <div className="p-4">
        {/* Tipo de animal */}
        <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
          {animalLabel}
        </span>
        
        {/* Nombre */}
        <a href={`/producto/${product.slug || product.id}`}>
          <h3 className="font-semibold text-gray-900 mt-2 line-clamp-2 hover:text-purple-600 transition-colors">
            {product.name}
          </h3>
        </a>

        {/* Categoría */}
        <p className="text-sm text-gray-500 capitalize mt-1">{product.category}</p>

        {/* Precio */}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xl font-bold text-purple-600">
            {finalPrice.toFixed(2)}€
          </span>
          {isOnSale && salePrice && (
            <span className="text-sm text-gray-400 line-through">
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
    </div>
  );
}
