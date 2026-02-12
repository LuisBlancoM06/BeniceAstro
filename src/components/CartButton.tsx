import { useStore } from '@nanostores/react';
import { $cartCount, toggleCart, loadCart } from '../stores/cart';
import { useEffect } from 'react';

interface Props {
  'client:load'?: boolean;
  'client:idle'?: boolean;
  'client:visible'?: boolean;
  'client:only'?: string;
}

export default function CartButton(_props: Props) {
  const count = useStore($cartCount);

  useEffect(() => {
    // Cargar carrito al montar
    loadCart();
    
    // Escuchar actualizaciones del carrito
    const handleUpdate = () => loadCart();
    window.addEventListener('cart-updated', handleUpdate);
    
    return () => window.removeEventListener('cart-updated', handleUpdate);
  }, []);

  return (
    <button 
      onClick={toggleCart}
      className="relative text-gray-700 hover:text-orange-500 transition-colors p-2"
      aria-label="Abrir carrito"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" 
        />
      </svg>
      
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce-once">
          {count > 99 ? '99+' : count}
        </span>
      )}

      <style>{`
        @keyframes bounce-once {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        .animate-bounce-once {
          animation: bounce-once 0.3s ease-out;
        }
      `}</style>
    </button>
  );
}
