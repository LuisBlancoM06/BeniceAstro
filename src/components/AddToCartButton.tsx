import { addToCart, type CartItem } from '../stores/cart';
import { useState } from 'react';

interface AddToCartButtonProps {
  product: Omit<CartItem, 'quantity'>;
  quantity?: number;
  className?: string;
  showQuantitySelector?: boolean;
}

export default function AddToCartButton({ 
  product, 
  quantity: initialQuantity = 1,
  className = '',
  showQuantitySelector = false
}: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [isAdded, setIsAdded] = useState(false);

  const handleAdd = () => {
    addToCart(product, quantity);
    setIsAdded(true);
    
    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showQuantitySelector && (
        <div className="flex items-center border border-gray-200 rounded-lg bg-white">
          <button 
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-4 py-2 hover:bg-gray-100 transition-colors text-lg font-medium"
          >
            -
          </button>
          <span className="px-4 py-2 border-x border-gray-200 min-w-[50px] text-center font-medium">
            {quantity}
          </span>
          <button 
            onClick={() => setQuantity(quantity + 1)}
            className="px-4 py-2 hover:bg-gray-100 transition-colors text-lg font-medium"
          >
            +
          </button>
        </div>
      )}

      <button 
        onClick={handleAdd}
        disabled={isAdded}
        className={`
          flex-1 flex items-center justify-center gap-2 py-3 px-6 font-bold rounded-xl 
          transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5
          ${isAdded 
            ? 'bg-green-500 text-white' 
            : 'bg-purple-600 text-white hover:bg-orange-500'
          }
        `}
      >
        {isAdded ? (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            ¡Añadido!
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Añadir al carrito
          </>
        )}
      </button>
    </div>
  );
}
