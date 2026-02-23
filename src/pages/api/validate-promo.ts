import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../lib/supabase';

export const prerender = false;

// POST: Validar codigo promocional (publico, no requiere auth)
export const POST: APIRoute = async ({ request }) => {
  const headers = { 'Content-Type': 'application/json' };

  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return new Response(JSON.stringify({ valid: false, error: 'Codigo requerido' }), { status: 400, headers });
    }

    const { data: promo, error } = await supabaseAdmin
      .from('promo_codes')
      .select('discount_percentage, expires_at, max_uses, current_uses')
      .eq('code', code.toUpperCase())
      .eq('active', true)
      .single();

    if (error || !promo) {
      return new Response(JSON.stringify({ valid: false, error: 'Codigo no valido' }), { status: 200, headers });
    }

    // Verificar expiracion
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      return new Response(JSON.stringify({ valid: false, error: 'El codigo ha expirado' }), { status: 200, headers });
    }

    // Verificar usos maximos
    if (promo.max_uses && (promo.current_uses || 0) >= promo.max_uses) {
      return new Response(JSON.stringify({ valid: false, error: 'El codigo ha alcanzado su limite de usos' }), { status: 200, headers });
    }

    return new Response(JSON.stringify({
      valid: true,
      discount_percentage: promo.discount_percentage,
    }), { status: 200, headers });

  } catch (error) {
    console.error('Error validando promo:', error);
    return new Response(JSON.stringify({ valid: false, error: 'Error al validar' }), { status: 500, headers });
  }
};
