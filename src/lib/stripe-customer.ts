/**
 * Stripe Customer Management
 * 
 * Gestiona la creación, vinculación y consulta de Stripe Customers
 * de forma segura y desacoplada. NUNCA maneja datos de tarjeta.
 * 
 * PCI Scope: SAQ-A (delegación completa a Stripe Checkout/Elements)
 */
import Stripe from 'stripe';
import { supabaseAdmin } from './supabase';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || '');

/** Datos seguros del cliente (sin datos de pago) */
export interface StripeCustomerData {
  name: string | null;
  email: string | null;
  phone: string | null;
  address: {
    line1: string | null;
    line2: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country: string | null;
  } | null;
}

/**
 * Obtiene o crea un Stripe Customer para un usuario autenticado.
 * 
 * Flujo:
 * 1. Busca stripe_customer_id en la tabla users
 * 2. Si existe, verifica que sigue activo en Stripe
 * 3. Si no existe, crea uno nuevo y persiste el ID
 * 
 * @param userId - UUID del usuario en Supabase
 * @returns stripe_customer_id
 * @throws Error si el usuario no existe
 */
export async function getOrCreateStripeCustomer(userId: string): Promise<string> {
  // 1. Obtener perfil del usuario
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, email, full_name, phone, stripe_customer_id, address_line1, address_line2, city, postal_code, country')
    .eq('id', userId)
    .single();

  if (error || !user) {
    throw new Error('Usuario no encontrado');
  }

  // 2. Si ya tiene stripe_customer_id, verificar que existe en Stripe
  if (user.stripe_customer_id) {
    try {
      const existing = await stripe.customers.retrieve(user.stripe_customer_id);
      if (!(existing as Stripe.DeletedCustomer).deleted) {
        return user.stripe_customer_id;
      }
    } catch {
      // Customer eliminado o inválido — limpiar referencia y recrear
      console.warn(`Stripe Customer ${user.stripe_customer_id} no encontrado, recreando...`);
      await supabaseAdmin
        .from('users')
        .update({ stripe_customer_id: null })
        .eq('id', userId);
    }
  }

  // 3. Crear nuevo Stripe Customer
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.full_name || undefined,
    phone: user.phone || undefined,
    address: user.address_line1 ? {
      line1: user.address_line1,
      line2: user.address_line2 || undefined,
      city: user.city || undefined,
      postal_code: user.postal_code || undefined,
      country: user.country || 'ES',
    } : undefined,
    metadata: {
      supabase_user_id: userId,
    },
  });

  // 4. Persistir stripe_customer_id en la BD
  await supabaseAdmin
    .from('users')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId);

  return customer.id;
}

/**
 * Obtiene datos del cliente desde Stripe (sin datos de pago).
 * 
 * Retorna SOLO: name, email, phone, address.
 * NUNCA retorna: sources, payment_methods, default_source, etc.
 * 
 * @param stripeCustomerId - ID del customer en Stripe (cus_xxx)
 * @returns Datos seguros del cliente
 */
export async function getStripeCustomerData(stripeCustomerId: string): Promise<StripeCustomerData> {
  const customer = await stripe.customers.retrieve(stripeCustomerId);

  if ((customer as Stripe.DeletedCustomer).deleted) {
    throw new Error('Customer eliminado en Stripe');
  }

  const c = customer as Stripe.Customer;

  return {
    name: c.name || null,
    email: c.email || null,
    phone: c.phone || null,
    address: c.address ? {
      line1: c.address.line1 || null,
      line2: c.address.line2 || null,
      city: c.address.city || null,
      state: c.address.state || null,
      postal_code: c.address.postal_code || null,
      country: c.address.country || null,
    } : null,
  };
}

/**
 * Sincroniza los datos del perfil del usuario hacia Stripe Customer.
 * Se llama cuando el usuario actualiza su perfil.
 * 
 * Solo actualiza campos no-sensibles. NUNCA toca payment methods.
 * 
 * @param userId - UUID del usuario en Supabase
 * @param updates - Campos a sincronizar
 */
export async function syncUserToStripeCustomer(
  userId: string,
  updates: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    };
  }
): Promise<void> {
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (!user?.stripe_customer_id) return;

  const updateParams: Stripe.CustomerUpdateParams = {};

  if (updates.name !== undefined) updateParams.name = updates.name;
  if (updates.email !== undefined) updateParams.email = updates.email;
  if (updates.phone !== undefined) updateParams.phone = updates.phone;
  if (updates.address) {
    updateParams.address = {
      line1: updates.address.line1 || '',
      line2: updates.address.line2 || undefined,
      city: updates.address.city || undefined,
      state: updates.address.state || undefined,
      postal_code: updates.address.postal_code || undefined,
      country: updates.address.country || 'ES',
    };
  }

  await stripe.customers.update(user.stripe_customer_id, updateParams);
}

/**
 * Actualiza el Stripe Customer con los datos de envío de una sesión completada.
 * Se llama desde el webhook para mantener sincronizado.
 */
export async function syncCheckoutToCustomer(
  stripeCustomerId: string,
  session: Stripe.Checkout.Session
): Promise<void> {
  const updateParams: Stripe.CustomerUpdateParams = {};

  if (session.customer_details?.name) {
    updateParams.name = session.customer_details.name;
  }
  if (session.customer_details?.phone) {
    updateParams.phone = session.customer_details.phone;
  }

  const shipping = (session as any).shipping_details;
  if (shipping?.address) {
    updateParams.address = {
      line1: shipping.address.line1 || '',
      line2: shipping.address.line2 || undefined,
      city: shipping.address.city || undefined,
      postal_code: shipping.address.postal_code || undefined,
      country: shipping.address.country || 'ES',
    };
  }

  if (Object.keys(updateParams).length > 0) {
    await stripe.customers.update(stripeCustomerId, updateParams);
  }

  // También sincronizar a la BD local
  if (shipping?.address || session.customer_details?.name || session.customer_details?.phone) {
    const dbUpdates: Record<string, any> = {};
    if (session.customer_details?.name) dbUpdates.full_name = session.customer_details.name;
    if (session.customer_details?.phone) dbUpdates.phone = session.customer_details.phone;
    if (shipping?.address) {
      dbUpdates.address_line1 = shipping.address.line1 || null;
      dbUpdates.address_line2 = shipping.address.line2 || null;
      dbUpdates.city = shipping.address.city || null;
      dbUpdates.postal_code = shipping.address.postal_code || null;
      dbUpdates.country = shipping.address.country || 'ES';
    }

    // Buscar user_id por stripe_customer_id
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('stripe_customer_id', stripeCustomerId)
      .single();

    if (user) {
      await supabaseAdmin.from('users').update(dbUpdates).eq('id', user.id);
    }
  }
}
