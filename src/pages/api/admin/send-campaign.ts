import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';
import { sendCampaignBatch } from '../../../lib/email';
import { randomBytes } from 'node:crypto';

export const prerender = false;

function generateCampaignCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = randomBytes(6);
  let code = 'PROMO';
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // 1. Auth
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { data: adminUser } = await supabaseAdmin
      .from('users').select('role').eq('id', user.id).single();

    if (!adminUser || adminUser.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Acceso denegado' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Validar body
    const { emails, promoCodeMode, discountPercentage, existingPromoCode, subject } = await request.json();

    if (!Array.isArray(emails) || emails.length === 0) {
      return new Response(JSON.stringify({ error: 'Selecciona al menos un suscriptor' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (promoCodeMode !== 'new' && promoCodeMode !== 'existing') {
      return new Response(JSON.stringify({ error: 'Modo de codigo invalido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Resolver codigo promo
    let promoCode: string;
    let discount: number;

    if (promoCodeMode === 'new') {
      if (!discountPercentage || discountPercentage < 1 || discountPercentage > 100) {
        return new Response(JSON.stringify({ error: 'Porcentaje de descuento invalido' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      promoCode = generateCampaignCode();
      discount = discountPercentage;

      const { error: insertError } = await supabaseAdmin.from('promo_codes').insert({
        code: promoCode,
        discount_percentage: discount,
        active: true,
        max_uses: emails.length,
        current_uses: 0,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });

      if (insertError) {
        console.error('Error creando promo code:', insertError);
        return new Response(JSON.stringify({ error: 'Error al crear codigo promocional' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } else {
      if (!existingPromoCode) {
        return new Response(JSON.stringify({ error: 'Selecciona un codigo promocional' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const { data: existing } = await supabaseAdmin
        .from('promo_codes')
        .select('code, discount_percentage, active')
        .eq('code', existingPromoCode)
        .eq('active', true)
        .single();

      if (!existing) {
        return new Response(JSON.stringify({ error: 'Codigo no encontrado o inactivo' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      promoCode = existing.code;
      discount = existing.discount_percentage;
    }

    // 4. Enviar emails en batch
    const result = await sendCampaignBatch(
      emails,
      promoCode,
      discount,
      subject || 'Oferta exclusiva para suscriptores'
    );

    return new Response(JSON.stringify({
      success: result.success,
      promoCode,
      sent: result.sent,
      failed: result.failed,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error en send-campaign:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
