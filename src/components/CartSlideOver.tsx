import { useStore } from '@nanostores/react';
import { useState } from 'react';
import { 
  $cartItems, 
  $isCartOpen, 
  $cartCount, 
  $cartSubtotal,
  closeCart,
  updateQuantity,
  removeFromCart,
  clearCart
} from '../stores/cart';

interface Props {
  'client:load'?: boolean;
  'client:idle'?: boolean;
  'client:visible'?: boolean;
  'client:only'?: string;
}

export default function CartSlideOver(_props: Props) {
  const isOpen = useStore($isCartOpen);
  const items = useStore($cartItems);
  const count = useStore($cartCount);
  const subtotal = useStore($cartSubtotal);
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [applyingPromo, setApplyingPromo] = useState(false);

  const applyPromoCode = async () => {
    if (!promoCode.trim()) return;
    setApplyingPromo(true);
    setPromoMessage('');
    
    // Save promo code for checkout validation
    const code = promoCode.trim().toUpperCase();
    localStorage.setItem('promoCode', code);
    setPromoApplied(true);
    setPromoMessage(`Código "${code}" aplicado. Se validará en el checkout.`);
    setApplyingPromo(false);
  };

  const removePromo = () => {
    setPromoCode('');
    setPromoDiscount(0);
    setPromoMessage('');
    setPromoApplied(false);
    localStorage.removeItem('promoCode');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={closeCart}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-xl z-50 flex flex-col animate-slide-in">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            Tu Carrito
            {count > 0 && (
              <span className="bg-orange-500 text-white text-sm px-2 py-0.5 rounded-full">
                {count}
              </span>
            )}
          </h2>
          <button 
            onClick={closeCart}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Tu carrito está vacío</h3>
              <p className="text-gray-500 mb-6">¡Añade algunos productos para tu mascota!</p>
              <button 
                onClick={() => {
                  closeCart();
                  window.location.href = '/productos';
                }}
                className="px-6 py-3 bg-purple-700 text-white font-bold rounded-xl hover:bg-orange-500 transition-colors"
              >
                Explorar productos
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                  {/* Imagen */}
                  <div className="w-20 h-20 bg-white rounded-lg overflow-hidden flex-shrink-0">
                    {item.image && !item.image.includes('placehold.co') && !item.image.includes('via.placeholder') ? (
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          target.parentElement!.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center"><span class="text-white/80 text-[10px] font-semibold text-center px-1">${item.name}</span></div>`;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                        <span className="text-white/80 text-[10px] font-semibold text-center px-1">{item.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-800 truncate">{item.name}</h3>
                    <div className="flex items-baseline gap-2 mt-1">
                      {item.salePrice ? (
                        <>
                          <span className="text-lg font-bold text-red-500">{item.salePrice.toFixed(2)}€</span>
                          <span className="text-sm text-gray-400 line-through">{item.price.toFixed(2)}€</span>
                        </>
                      ) : (
                        <span className="text-lg font-bold text-gray-800">{item.price.toFixed(2)}€</span>
                      )}
                    </div>

                    {/* Controles de cantidad */}
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center border border-gray-200 rounded-lg bg-white">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-3 py-1 hover:bg-gray-100 transition-colors"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 border-x border-gray-200 min-w-[40px] text-center">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-3 py-1 hover:bg-gray-100 transition-colors"
                        >
                          +
                        </button>
                      </div>

                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Vaciar carrito */}
              {items.length > 0 && (
                <button 
                  onClick={clearCart}
                  className="w-full text-center text-gray-500 hover:text-red-500 text-sm py-2 transition-colors"
                >
                  Vaciar carrito
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer con totales */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            {/* Código promocional */}
            <div className="mb-4">
              {promoApplied ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                  <span className="text-green-700 text-sm font-medium">✓ {promoCode.toUpperCase()}</span>
                  <button 
                    onClick={removePromo}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Quitar
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="Código promocional"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyPromoCode()}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    id="promo-code-input"
                  />
                  <button 
                    onClick={applyPromoCode}
                    disabled={applyingPromo || !promoCode.trim()}
                    className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                  >
                    {applyingPromo ? '...' : 'Aplicar'}
                  </button>
                </div>
              )}
              {promoMessage && (
                <p className={`text-xs mt-1 ${promoApplied ? 'text-green-600' : 'text-red-500'}`}>
                  {promoMessage}
                </p>
              )}
            </div>

            {/* Subtotal */}
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">{subtotal.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">Envío</span>
              <span className="text-green-600 font-medium">
                {subtotal >= 49 ? '¡Gratis!' : '4.99€'}
              </span>
            </div>
            
            {subtotal < 49 && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                <p className="text-yellow-800">
                  ¡Añade <strong>{(49 - subtotal).toFixed(2)}€</strong> más para envío GRATIS!
                </p>
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between items-center text-lg font-bold mb-4">
              <span>Total</span>
              <span className="text-orange-500">
                {(subtotal + (subtotal >= 49 ? 0 : 4.99)).toFixed(2)}€
              </span>
            </div>

            {/* Botón de checkout */}
            <button 
              onClick={() => window.location.href = '/checkout'}
              className="w-full py-4 bg-orange-500 text-white font-bold rounded-xl hover:bg-purple-700 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Proceder al pago
            </button>

            {/* Métodos de pago */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500 mb-2">Métodos de pago seguros</p>
              <div className="flex justify-center gap-2">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
