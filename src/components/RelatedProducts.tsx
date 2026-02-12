import { useEffect, useState } from 'react';
import { addToCart } from '../stores/cart';
import { toast } from './Toast';

interface Product {
  id: string;
  name: string;
  price: number;
  sale_price?: number;
  on_sale: boolean;
  image_url: string;
  slug: string;
  animal_type: string;
  category: string;
}

interface RelatedProductsProps {
  currentProductId: string;
  animalType: string;
  category: string;
}

export default function RelatedProducts({ currentProductId, animalType, category }: RelatedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRelatedProducts();
  }, [currentProductId, animalType, category]);

  const fetchRelatedProducts = async () => {
    try {
      // En producción, esto vendría de Supabase
      const response = await fetch(`/api/search?animal=${animalType}&category=${category}&limit=4`);
      const data = await response.json();
      
      // Filtrar el producto actual
      const filtered = data.filter((p: Product) => p.id !== currentProductId).slice(0, 4);
      setProducts(filtered);
    } catch (error) {
      console.error('Error fetching related products:', error);
      // Productos de ejemplo
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.on_sale ? (product.sale_price || product.price) : product.price,
      image: product.image_url,
    }, 1);
    toast.success('Producto añadido al carrito');
  };

  if (loading) {
    return (
      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-6">También te puede interesar</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-xl aspect-square mb-4" />
              <div className="h-4 bg-gray-200 rounded mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="mt-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">También te puede interesar</h2>
        <a 
          href={`/productos?animal=${animalType}&category=${category}`}
          className="text-orange-500 hover:underline font-medium"
        >
          Ver más →
        </a>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((product) => (
          <div 
            key={product.id}
            className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all"
          >
            <a href={`/producto/${product.slug || product.id}`} className="block relative">
              <div className="aspect-square overflow-hidden">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
              {product.on_sale && (
                <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  -{Math.round(((product.price - (product.sale_price || product.price)) / product.price) * 100)}%
                </span>
              )}
            </a>
            
            <div className="p-4">
              <a 
                href={`/producto/${product.slug || product.id}`}
                className="font-medium text-gray-900 hover:text-purple-600 transition-colors line-clamp-2 min-h-[48px]"
              >
                {product.name}
              </a>
              
              <div className="flex items-center gap-2 mt-2 mb-3">
                {product.on_sale ? (
                  <>
                    <span className="text-lg font-bold text-orange-500">{product.sale_price}€</span>
                    <span className="text-sm text-gray-400 line-through">{product.price}€</span>
                  </>
                ) : (
                  <span className="text-lg font-bold text-orange-500">{product.price}€</span>
                )}
              </div>

              <button
                onClick={() => handleAddToCart(product)}
                className="w-full bg-orange-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Añadir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
