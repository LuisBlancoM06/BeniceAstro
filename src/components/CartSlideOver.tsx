import { useStore } from '@nanostores/react';
import { useState, useEffect, useRef, useCallback } from 'react';
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
import { FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from '../lib/constants';

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
  const [isClosing, setIsClosing] = useState(false);
  const [removingItem, setRemovingItem] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Bloquear scroll del body cuando está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Focus al botón de cerrar para accesibilidad
      setTimeout(() => closeButtonRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Animación de cierre
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      closeCart();
    }, 280);
  }, []);

  const applyPromoCode = async () => {
    if (!promoCode.trim()) return;
    setApplyingPromo(true);
    setPromoMessage('');
    
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

  // Eliminar con animación
  const handleRemoveItem = (id: string) => {
    setRemovingItem(id);
    setTimeout(() => {
      removeFromCart(id);
      setRemovingItem(null);
    }, 300);
  };

  if (!isOpen && !isClosing) return null;

  const shippingProgress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const total = subtotal + (freeShipping ? 0 : SHIPPING_COST);

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-[2px] z-40 transition-opacity duration-300 ${
          isClosing ? 'opacity-0' : 'opacity-100 animate-fade-in'
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div 
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
        className={`fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl z-50 flex flex-col ${
          isClosing ? 'animate-slide-out-right' : 'animate-slide-in'
        }`}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <span>Tu Carrito</span>
            {count > 0 && (
              <span className="bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full min-w-[24px] text-center">
                {count}
              </span>
            )}
          </h2>
          <button 
            ref={closeButtonRef}
            onClick={handleClose}
            aria-label="Cerrar carrito"
            className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Barra de envío gratis */}
        {items.length > 0 && (
          <div className="px-6 py-3 bg-gradient-to-r from-purple-50 to-orange-50 border-b border-gray-100">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-gray-600 font-medium">
                {freeShipping ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    ¡Envío GRATIS desbloqueado!
                  </span>
                ) : (
                  <>🚛 Te faltan <strong className="text-purple-700">{(FREE_SHIPPING_THRESHOLD - subtotal).toFixed(2)}€</strong> para envío gratis</>
                )}
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  freeShipping 
                    ? 'bg-gradient-to-r from-green-400 to-green-500' 
                    : 'bg-gradient-to-r from-purple-500 to-orange-500'
                }`}
                style={{ width: `${shippingProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12 animate-fade-in">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Tu carrito está vacío</h3>
              <p className="text-gray-500 mb-8 max-w-[250px]">¡Descubre productos increíbles para tu mascota!</p>
              <button 
                onClick={() => {
                  handleClose();
                  setTimeout(() => { window.location.href = '/productos'; }, 300);
                }}
                className="px-8 py-3 bg-purple-700 text-white font-bold rounded-xl hover:bg-purple-800 transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
              >
                🐾 Explorar productos
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div 
                  key={item.id} 
                  className={`flex gap-4 p-4 bg-gray-50 rounded-xl transition-all duration-300 hover:bg-gray-100 ${
                    removingItem === item.id 
                      ? 'opacity-0 translate-x-full scale-95' 
                      : 'opacity-100 translate-x-0'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Imagen */}
                  <div className="w-20 h-20 bg-white rounded-xl overflow-hidden flex-shrink-0 shadow-sm border border-gray-100">
                    {item.image && !item.image.includes('placehold.co') && !item.image.includes('via.placeholder') ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const fallback = document.createElement('div');
                          fallback.className = 'w-full h-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center';
                          const span = document.createElement('span');
                          span.className = 'text-white/80 text-[10px] font-semibold text-center px-1';
                          span.textContent = item.name;
                          fallback.appendChild(span);
                          target.parentElement?.appendChild(fallback);
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
                    <h3 className="font-semibold text-gray-800 text-sm truncate">{item.name}</h3>
                    <div className="flex items-baseline gap-2 mt-1">
                      {item.salePrice ? (
                        <>
                          <span className="text-base font-bold text-red-500">{item.salePrice.toFixed(2)}€</span>
                          <span className="text-xs text-gray-400 line-through">{item.price.toFixed(2)}€</span>
                        </>
                      ) : (
                        <span className="text-base font-bold text-gray-800">{item.price.toFixed(2)}€</span>
                      )}
                    </div>

                    {/* Controles de cantidad */}
                    <div className="flex items-center gap-3 mt-2.5">
                      <div className="flex items-center border border-gray-200 rounded-lg bg-white shadow-sm">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          aria-label={`Reducir cantidad de ${item.name}`}
                          className="px-3 py-1.5 hover:bg-gray-100 transition-colors text-gray-600 font-medium rounded-l-lg"
                        >
                          −
                        </button>
                        <span className="px-3 py-1.5 border-x border-gray-200 min-w-[40px] text-center font-semibold text-sm" aria-label={`Cantidad: ${item.quantity}`}>
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          aria-label={`Aumentar cantidad de ${item.name}`}
                          className="px-3 py-1.5 hover:bg-gray-100 transition-colors text-gray-600 font-medium rounded-r-lg"
                        >
                          +
                        </button>
                      </div>

                      <button 
                        onClick={() => handleRemoveItem(item.id)}
                        aria-label={`Eliminar ${item.name} del carrito`}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Subtotal del item */}
                  <div className="flex flex-col justify-center items-end">
                    <span className="text-sm font-bold text-gray-700">
                      {((item.salePrice || item.price) * item.quantity).toFixed(2)}€
                    </span>
                  </div>
                </div>
              ))}

              {/* Vaciar carrito */}
              {items.length > 0 && (
                <button 
                  onClick={clearCart}
                  className="w-full text-center text-gray-400 hover:text-red-500 text-xs py-2 transition-colors flex items-center justify-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Vaciar carrito
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer con totales */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 px-6 py-5 bg-gradient-to-b from-gray-50 to-white">
            {/* Código promocional */}
            <div className="mb-4">
              {promoApplied ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
                  <span className="text-green-700 text-sm font-medium flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    {promoCode.toUpperCase()}
                  </span>
                  <button 
                    onClick={removePromo}
                    className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
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
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    id="promo-code-input"
                    aria-label="Código promocional"
                  />
                  <button 
                    onClick={applyPromoCode}
                    disabled={applyingPromo || !promoCode.trim()}
                    className="px-4 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm"
                  >
                    {applyingPromo ? '...' : 'Aplicar'}
                  </button>
                </div>
              )}
              {promoMessage && (
                <p className={`text-xs mt-1.5 ${promoApplied ? 'text-green-600' : 'text-red-500'}`}>
                  {promoMessage}
                </p>
              )}
            </div>

            {/* Desglose */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Subtotal ({count} {count === 1 ? 'producto' : 'productos'})</span>
                <span className="font-medium text-gray-700">{subtotal.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Envío</span>
                <span className={`font-semibold ${freeShipping ? 'text-green-600' : 'text-gray-700'}`}>
                  {freeShipping ? '¡GRATIS! 🎉' : `${SHIPPING_COST.toFixed(2)}€`}
                </span>
              </div>
            </div>

            {/* Separador */}
            <div className="border-t border-gray-200 pt-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-xl font-bold text-purple-700">
                  {total.toFixed(2)}€
                </span>
              </div>
            </div>

            {/* Botón de checkout */}
            <button 
              onClick={() => {
                handleClose();
                setTimeout(() => { window.location.href = '/checkout'; }, 300);
              }}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Pagar de forma segura
            </button>

            {/* Trust badges */}
            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                Pago seguro
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                Visa / Mastercard
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" /></svg>
                30 días devolución
              </span>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes slide-out-right {
          from { transform: translateX(0); }
          to { transform: translateX(100%); }
        }
        .animate-slide-in {
          animation: slide-in 0.3s cubic-bezier(0.32, 0.72, 0, 1);
        }
        .animate-slide-out-right {
          animation: slide-out-right 0.28s cubic-bezier(0.32, 0.72, 0, 1) forwards;
        }
      `}</style>
    </>
  );
}
