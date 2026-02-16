import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';
import { sendNewsletterWelcome } from '../../lib/email';

function generatePromoCode(): string {
  let code = 'BIENVENIDO';
  for (let i = 0; i < 6; i++) {
    code += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.charAt(Math.floor(Math.random() * 36));
  }
  return code;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Email inválido' }), { status: 400 });
    }

    // Verificar si ya está suscrito
    const { data: existing } = await supabase
      .from('newsletters')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return new Response(JSON.stringify({ error: 'Email ya suscrito' }), { status: 400 });
    }

    const promoCode = generatePromoCode();

    // Guardar código y suscripción
    await supabase.from('promo_codes').insert({
      code: promoCode,
      discount_percentage: 10,
      active: true,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });

    await supabase.from('newsletters').insert({ email, promo_code: promoCode });

    // Enviar email con Resend
    await sendNewsletterWelcome(email, promoCode);

    return new Response(JSON.stringify({ success: true, promoCode }), { status: 200 });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Error al procesar' }), { status: 500 });
  }
};
