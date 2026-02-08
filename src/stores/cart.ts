import { atom, computed } from 'nanostores';

// Tipos
export interface CartItem {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  image: string;
  quantity: number;
}

// Estado del carrito
export const $cartItems = atom<CartItem[]>([]);
export const $isCartOpen = atom(false);

// Computed: Total de items
export const $cartCount = computed($cartItems, (items) => 
  items.reduce((sum, item) => sum + item.quantity, 0)
);

// Computed: Subtotal
export const $cartSubtotal = computed($cartItems, (items) => 
  items.reduce((sum, item) => {
    const price = item.salePrice || item.price;
    return sum + (price * item.quantity);
  }, 0)
);

// Acciones
export function openCart() {
  $isCartOpen.set(true);
  document.body.style.overflow = 'hidden';
}

export function closeCart() {
  $isCartOpen.set(false);
  document.body.style.overflow = '';
}

export function toggleCart() {
  if ($isCartOpen.get()) {
    closeCart();
  } else {
    openCart();
  }
}

export function addToCart(product: Omit<CartItem, 'quantity'>, quantity: number = 1) {
  const items = $cartItems.get();
  const existingIndex = items.findIndex(item => item.id === product.id);

  if (existingIndex > -1) {
    // Actualizar cantidad
    const newItems = [...items];
    newItems[existingIndex] = {
      ...newItems[existingIndex],
      quantity: newItems[existingIndex].quantity + quantity
    };
    $cartItems.set(newItems);
  } else {
    // Añadir nuevo item
    $cartItems.set([...items, { ...product, quantity }]);
  }

  // Guardar en localStorage
  saveCart();
  
  // Abrir carrito
  openCart();
}

export function updateQuantity(productId: string, quantity: number) {
  if (quantity < 1) {
    removeFromCart(productId);
    return;
  }

  const items = $cartItems.get();
  const newItems = items.map(item => 
    item.id === productId ? { ...item, quantity } : item
  );
  $cartItems.set(newItems);
  saveCart();
}

export function removeFromCart(productId: string) {
  const items = $cartItems.get();
  $cartItems.set(items.filter(item => item.id !== productId));
  saveCart();
}

export function clearCart() {
  $cartItems.set([]);
  saveCart();
}

// Persistencia en localStorage
function saveCart() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('cart', JSON.stringify($cartItems.get()));
    // Disparar evento para sincronizar con otras pestañas
    window.dispatchEvent(new CustomEvent('cart-updated'));
  }
}

export function loadCart() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('cart');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migrar datos del formato viejo { product: { id, name, price, image_url }, quantity }
        // al formato nuevo { id, name, price, image, quantity }
        const migrated = parsed.map((item: any) => {
          if (item.product && typeof item.product === 'object') {
            // Formato viejo — convertir
            return {
              id: item.product.id,
              name: item.product.name,
              price: item.product.price || 0,
              salePrice: item.product.salePrice || item.product.sale_price || undefined,
              image: item.product.image_url || item.product.image || '',
              quantity: item.quantity || 1,
            };
          }
          // Formato nuevo — mantener
          return item;
        });
        $cartItems.set(migrated);
        // Guardar en formato nuevo para futuras cargas
        localStorage.setItem('cart', JSON.stringify(migrated));
      } catch (e) {
        console.error('Error loading cart:', e);
        $cartItems.set([]);
      }
    }
  }
}

// Inicializar al cargar
if (typeof window !== 'undefined') {
  loadCart();
  
  // Escuchar cambios en otras pestañas
  window.addEventListener('storage', (e) => {
    if (e.key === 'cart') {
      loadCart();
    }
  });
}
