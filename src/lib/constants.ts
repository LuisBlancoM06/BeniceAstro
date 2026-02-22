/**
 * Constantes centralizadas del negocio.
 * Cambiar aquí actualiza automáticamente la lógica de envío en checkout, carrito y Stripe.
 * Para textos informativos (FAQ, envíos, legal, etc.) se debe actualizar manualmente.
 */

/** Umbral de envío gratis en euros (pedidos ≥ este valor) */
export const FREE_SHIPPING_THRESHOLD = 49;

/** Coste de envío estándar en euros */
export const SHIPPING_COST = 4.99;

/** Coste de envío en céntimos (para Stripe) */
export const SHIPPING_COST_CENTS = 499;
