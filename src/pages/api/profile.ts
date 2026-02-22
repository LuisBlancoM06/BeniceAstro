/**
 * PUT /api/profile
 * 
 * Actualiza el perfil del usuario en Supabase y sincroniza
 * los cambios al Stripe Customer vinculado.
 * 
 * SEGURIDAD:
 * - Requiere autenticación JWT
 * - Solo puede actualizar su propio perfil
 * - No permite cambiar el rol
 * - Sincroniza a Stripe sin exponer la clave secreta al cliente
 */
import type { APIRoute } from 'astro';
import { supabase, supabaseAdmin } from '../../lib/supabase';
import { syncUserToStripeCustomer } from '../../lib/stripe-customer';

export const PUT: APIRoute = async ({ request }) => {
  try {
    // 1. Autenticación
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

    // 2. Validar body
    const body = await request.json();
    const { full_name, phone, address, address_line1, address_line2, city, state, postal_code, country } = body;

    // Validaciones de longitud
    if (full_name && typeof full_name === 'string' && full_name.length > 100) {
      return new Response(JSON.stringify({ error: 'Nombre demasiado largo (máx 100 caracteres)' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }
    if (phone && typeof phone === 'string' && phone.length > 20) {
      return new Response(JSON.stringify({ error: 'Teléfono demasiado largo (máx 20 caracteres)' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Actualizar en Supabase
    const dbUpdates: Record<string, any> = {};
    if (full_name !== undefined) dbUpdates.full_name = full_name;
    if (phone !== undefined) dbUpdates.phone = phone;
    if (address !== undefined) dbUpdates.address = address;
    if (address_line1 !== undefined) dbUpdates.address_line1 = address_line1;
    if (address_line2 !== undefined) dbUpdates.address_line2 = address_line2;
    if (city !== undefined) dbUpdates.city = city;
    if (state !== undefined) dbUpdates.state = state;
    if (postal_code !== undefined) dbUpdates.postal_code = postal_code;
    if (country !== undefined) dbUpdates.country = country;

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update(dbUpdates)
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    // 4. Sincronizar a Stripe Customer (fire-and-forget, no bloquea al usuario)
    try {
      await syncUserToStripeCustomer(user.id, {
        name: full_name || undefined,
        phone: phone || undefined,
        address: (address_line1 || city || postal_code) ? {
          line1: address_line1,
          line2: address_line2,
          city: city,
          state: state,
          postal_code: postal_code,
          country: country || 'ES',
        } : undefined,
      });
    } catch (syncError) {
      // Log pero no bloquear — Stripe se sincronizará en el próximo checkout
      console.error('Error syncing profile to Stripe:', syncError);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error en PUT /api/profile:', error);
    return new Response(JSON.stringify({ error: 'Error al actualizar perfil' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
