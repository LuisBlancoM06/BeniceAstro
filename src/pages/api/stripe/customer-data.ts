/**
 * GET /api/stripe/customer-data
 * 
 * Recupera datos del Stripe Customer del usuario autenticado
 * para autocompletar el formulario de checkout.
 * 
 * SEGURIDAD:
 * - Requiere autenticación JWT válida
 * - Solo devuelve datos del propio usuario (no acepta customer_id del cliente)
 * - NUNCA devuelve datos de tarjeta, payment methods ni tokens
 * - El stripe_customer_id se resuelve internamente desde el JWT
 * 
 * PCI Scope: SAQ-A — ningún dato de tarjeta pasa por este endpoint
 */
import type { APIRoute } from 'astro';
import { supabase, supabaseAdmin } from '../../../lib/supabase';
import { getOrCreateStripeCustomer, getStripeCustomerData } from '../../../lib/stripe-customer';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    // 1. Autenticación obligatoria
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Sesión no válida' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Obtener o crear Stripe Customer
    let stripeCustomerId: string;
    try {
      stripeCustomerId = await getOrCreateStripeCustomer(user.id);
    } catch (err: any) {
      console.error('Error getOrCreateStripeCustomer:', err.message);
      return new Response(JSON.stringify({ error: 'Error al vincular con Stripe' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Obtener datos del Customer (sin datos de pago)
    const customerData = await getStripeCustomerData(stripeCustomerId);

    // 4. Si Stripe no tiene datos completos, complementar con BD local
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('full_name, email, phone, address_line1, address_line2, city, postal_code, country')
      .eq('id', user.id)
      .single();

    // Merge: prioridad Stripe > BD local (Stripe tiene datos más recientes del último checkout)
    const mergedData = {
      name: customerData.name || profile?.full_name || null,
      email: customerData.email || profile?.email || user.email || null,
      phone: customerData.phone || profile?.phone || null,
      address: {
        line1: customerData.address?.line1 || profile?.address_line1 || null,
        line2: customerData.address?.line2 || profile?.address_line2 || null,
        city: customerData.address?.city || profile?.city || null,
        postal_code: customerData.address?.postal_code || profile?.postal_code || null,
        country: customerData.address?.country || profile?.country || 'ES',
      },
    };

    return new Response(JSON.stringify(mergedData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // No cachear datos personales
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
      },
    });

  } catch (error: any) {
    console.error('Error en /api/stripe/customer-data:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
