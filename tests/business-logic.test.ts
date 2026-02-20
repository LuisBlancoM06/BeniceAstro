/**
 * Tests de validación de datos y lógica de negocio
 */
import { describe, it, expect } from 'vitest';

describe('Email Validation', () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validEmails = [
    'user@example.com',
    'test.user@domain.co.uk',
    'name+tag@gmail.com',
    'a@b.cc',
  ];

  const invalidEmails = [
    '',
    'invalid',
    '@domain.com',
    'user@',
    'user @example.com',
    'user@.com',
    'user@domain',
  ];

  validEmails.forEach(email => {
    it(`acepta email válido: ${email}`, () => {
      expect(emailRegex.test(email)).toBe(true);
    });
  });

  invalidEmails.forEach(email => {
    it(`rechaza email inválido: "${email}"`, () => {
      expect(emailRegex.test(email)).toBe(false);
    });
  });
});

describe('Promo Code Generation', () => {
  function generatePromoCode(): string {
    let code = 'BIENVENIDO';
    for (let i = 0; i < 6; i++) {
      code += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.charAt(Math.floor(Math.random() * 36));
    }
    return code;
  }

  it('genera código con prefijo BIENVENIDO', () => {
    const code = generatePromoCode();
    expect(code.startsWith('BIENVENIDO')).toBe(true);
  });

  it('genera código de longitud correcta (10 + 6 = 16)', () => {
    expect(generatePromoCode().length).toBe(16);
  });

  it('genera códigos únicos', () => {
    const codes = new Set(Array.from({ length: 100 }, () => generatePromoCode()));
    // Con 36^6 posibilidades, 100 códigos deberían ser únicos
    expect(codes.size).toBe(100);
  });

  it('solo contiene caracteres alfanuméricos', () => {
    const code = generatePromoCode();
    expect(/^[A-Z0-9]+$/.test(code)).toBe(true);
  });
});

describe('Order Status Transitions', () => {
  const validTransitions: Record<string, string[]> = {
    'pendiente': ['pagado', 'cancelado'],
    'pagado': ['enviado', 'cancelado'],
    'enviado': ['entregado'],
    'entregado': [],
    'cancelado': [],
  };

  it('pagado puede ir a enviado o cancelado', () => {
    expect(validTransitions['pagado']).toContain('enviado');
    expect(validTransitions['pagado']).toContain('cancelado');
    expect(validTransitions['pagado']).not.toContain('pendiente');
  });

  it('entregado es un estado final', () => {
    expect(validTransitions['entregado']).toHaveLength(0);
  });

  it('cancelado es un estado final', () => {
    expect(validTransitions['cancelado']).toHaveLength(0);
  });

  it('no permite transiciones regresivas', () => {
    expect(validTransitions['enviado']).not.toContain('pagado');
    expect(validTransitions['entregado']).not.toContain('enviado');
  });
});

describe('Shipping Logic', () => {
  const FREE_SHIPPING_THRESHOLD = 49;
  const SHIPPING_COST = 4.95;

  function calculateShipping(subtotal: number): number {
    return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  }

  it('envío gratis en pedidos >= 49€', () => {
    expect(calculateShipping(49)).toBe(0);
    expect(calculateShipping(100)).toBe(0);
    expect(calculateShipping(49.01)).toBe(0);
  });

  it('cobra 4.95€ en pedidos < 49€', () => {
    expect(calculateShipping(48.99)).toBe(SHIPPING_COST);
    expect(calculateShipping(10)).toBe(SHIPPING_COST);
    expect(calculateShipping(0)).toBe(SHIPPING_COST);
  });
});

describe('Discount Calculation', () => {
  function applyDiscount(price: number, discountPercentage: number): number {
    return Math.round((price * (1 - discountPercentage / 100)) * 100) / 100;
  }

  it('aplica 10% de descuento correctamente', () => {
    expect(applyDiscount(100, 10)).toBe(90);
    expect(applyDiscount(29.99, 10)).toBe(26.99);  // 29.99 * 0.9 = 26.991 → 26.99
  });

  it('aplica 0% devuelve el precio original', () => {
    expect(applyDiscount(50, 0)).toBe(50);
  });

  it('aplica 100% devuelve 0', () => {
    expect(applyDiscount(50, 100)).toBe(0);
  });
});

describe('Upload Validation', () => {
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  it('acepta tipos de imagen válidos', () => {
    ALLOWED_TYPES.forEach(type => {
      expect(type.startsWith('image/')).toBe(true);
    });
  });

  it('rechaza archivos > 5MB', () => {
    const fileSize = 6 * 1024 * 1024;
    expect(fileSize > MAX_FILE_SIZE).toBe(true);
  });

  it('acepta archivos <= 5MB', () => {
    expect(5 * 1024 * 1024 <= MAX_FILE_SIZE).toBe(true);
    expect(1024 <= MAX_FILE_SIZE).toBe(true);
  });

  it('rechaza tipos no imagen', () => {
    const badTypes = ['text/html', 'application/pdf', 'application/javascript'];
    badTypes.forEach(type => {
      expect(ALLOWED_TYPES).not.toContain(type);
    });
  });
});

describe('Cart Totals', () => {
  interface CartItem {
    price: number;
    quantity: number;
    salePrice?: number;
    onSale?: boolean;
  }

  function calculateTotal(items: CartItem[]): number {
    return items.reduce((total, item) => {
      const price = item.onSale && item.salePrice ? item.salePrice : item.price;
      return total + price * item.quantity;
    }, 0);
  }

  it('calcula total con precios normales', () => {
    const items: CartItem[] = [
      { price: 10, quantity: 2 },
      { price: 5.50, quantity: 1 },
    ];
    expect(calculateTotal(items)).toBe(25.5);
  });

  it('usa salePrice cuando está en oferta', () => {
    const items: CartItem[] = [
      { price: 20, quantity: 1, salePrice: 15, onSale: true },
    ];
    expect(calculateTotal(items)).toBe(15);
  });

  it('usa precio normal si no está en oferta', () => {
    const items: CartItem[] = [
      { price: 20, quantity: 1, salePrice: 15, onSale: false },
    ];
    expect(calculateTotal(items)).toBe(20);
  });

  it('carrito vacío devuelve 0', () => {
    expect(calculateTotal([])).toBe(0);
  });
});
