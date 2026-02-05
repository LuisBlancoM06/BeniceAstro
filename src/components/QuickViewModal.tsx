// Modal de Vista Rápida de Producto
import { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { atom } from 'nanostores';
import { addToCart } from '../stores/cart';
import { toast } from './Toast';

// Store para controlar el modal
export interface QuickViewProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  sale_price?: number;
  on_sale?: boolean;
  image_url: string;
  images?: string[];
  animal_type: string;
  category: string;
  size: string;
  age_range: string;
  stock: number;
  slug?: string;
  brand?: string;
}

export const quickViewStore = atom<QuickViewProduct | null>(null);

export function openQuickView(product: QuickViewProduct) {
  quickViewStore.set(product);
}

export function closeQuickView() {
  quickViewStore.set(null);
}

export default function QuickViewModal() {
  const product = useStore(quickViewStore);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (product) {
      setQuantity(1);
      setSelectedImage(0);
      // Bloquear scroll del body
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [product]);

  if (!product) return null;

  const images = product.images?.length ? product.images : [product.image_url];
  const finalPrice = product.on_sale && product.sale_price ? product.sale_price : product.price;
  const discount = product.on_sale && product.sale_price 
    ? Math.round((1 - product.sale_price / product.price) * 100)
    : 0;

  const handleAddToCart = async () => {
    setIsAdding(true);
    
    addToCart({
      id: product.id,
      name: product.name,
      price: finalPrice,
      image: product.image_url,
    }, quantity);
    
    // Animación y feedback
    await new Promise(resolve => setTimeout(resolve, 300));
    setIsAdding(false);
    
    toast.success('¡Añadido al carrito!', `${quantity}x ${product.name}`);
    closeQuickView();
  };

  const addToWishlist = () => {
    // Guardar en localStorage o Supabase
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    if (!wishlist.find((p: any) => p.id === product.id)) {
      wishlist.push(product);
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
      toast.success('¡Añadido a favoritos!', 'Puedes verlo en tu lista de deseos');
    } else {
      toast.info('Ya está en favoritos', 'Este producto ya está en tu lista');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeQuickView();
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-scale-in">
        {/* Botón cerrar */}
        <button
          onClick={closeQuickView}
          className="absolute top-4 right-4 z-10 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-all"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="grid md:grid-cols-2 gap-0">
          {/* Galería de imágenes */}
          <div className="bg-gray-100 p-6">
            {/* Imagen principal */}
            <div className="aspect-square rounded-xl overflow-hidden bg-white mb-4 relative">
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {discount > 0 && (
                <span className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  -{discount}%
                </span>
              )}
            </div>
            
            {/* Miniaturas */}
            {images.length > 1 && (
              <div className="flex gap-2 justify-center">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === idx 
                        ? 'border-purple-600 ring-2 ring-purple-300' 
                        : 'border-gray-200 hover:border-purple-400'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Información del producto */}
          <div className="p-6 overflow-y-auto max-h-[80vh]">
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium capitalize">
                {product.animal_type === 'otros' ? 'Otros' : product.animal_type === 'perro' ? 'Perro' : 'Gato'}
              </span>
              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium capitalize">
                {product.category}
              </span>
              {product.brand && (
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                  {product.brand}
                </span>
              )}
            </div>

            {/* Nombre */}
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h2>

            {/* Precio */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl font-bold text-purple-600">
                {finalPrice.toFixed(2)}€
              </span>
              {product.on_sale && product.sale_price && (
                <span className="text-lg text-gray-400 line-through">
                  {product.price.toFixed(2)}€
                </span>
              )}
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2 mb-4">
              {product.stock > 10 ? (
                <>
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span className="text-green-600 font-medium">En stock</span>
                </>
              ) : product.stock > 0 ? (
                <>
                  <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                  <span className="text-yellow-600 font-medium">Últimas {product.stock} unidades</span>
                </>
              ) : (
                <>
                  <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                  <span className="text-red-600 font-medium">Agotado</span>
                </>
              )}
            </div>

            {/* Descripción */}
            <p className="text-gray-600 mb-6 leading-relaxed">{product.description}</p>

            {/* Características */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <span className="block text-sm text-gray-500">Tamaño</span>
                <span className="font-semibold capitalize">{product.size}</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <span className="block text-sm text-gray-500">Edad</span>
                <span className="font-semibold capitalize">{product.age_range}</span>
              </div>
            </div>

            {/* Selector de cantidad */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-gray-700 font-medium">Cantidad:</span>
              <div className="flex items-center border-2 border-gray-200 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 hover:bg-gray-100 transition-colors"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="px-4 py-2 font-semibold min-w-[3rem] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="px-4 py-2 hover:bg-gray-100 transition-colors"
                  disabled={quantity >= product.stock}
                >
                  +
                </button>
              </div>
              <span className="text-gray-500 text-sm">
                Máx: {product.stock}
              </span>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0 || isAdding}
                className={`
                  flex-1 py-4 px-6 rounded-xl font-bold text-white
                  transition-all duration-300 transform
                  ${product.stock === 0 
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'bg-purple-600 hover:bg-purple-700 hover:scale-[1.02] active:scale-[0.98]'
                  }
                  ${isAdding ? 'animate-pulse' : ''}
                `}
              >
                {isAdding ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Añadiendo...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Añadir al carrito
                  </span>
                )}
              </button>
              
              <button
                onClick={addToWishlist}
                className="p-4 border-2 border-gray-200 rounded-xl hover:border-red-300 hover:bg-red-50 transition-all group"
                title="Añadir a favoritos"
              >
                <svg 
                  className="w-6 h-6 text-gray-400 group-hover:text-red-500 transition-colors" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>

            {/* Ver detalles completos */}
            <a
              href={`/producto/${product.slug || product.id}`}
              className="block text-center mt-4 text-purple-600 hover:text-purple-700 font-medium"
            >
              Ver todos los detalles →
            </a>

            {/* Info adicional */}
            <div className="mt-6 pt-6 border-t border-gray-200 space-y-3 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Envío gratis en pedidos +49€
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Devolución gratuita en 30 días
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Entrega en 24-48h
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
