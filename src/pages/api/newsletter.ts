import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

const BREVO_API_KEY = import.meta.env.BREVO_API_KEY;

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

    // Enviar email con Brevo (API REST simple)
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'BeniceAstro', email: 'lblancom06@gmail.com' },
        to: [{ email }],
        subject: '¡Bienvenido a BeniceAstro! Tu código de descuento',
        htmlContent: `
          <div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4F46E5;">¡Gracias por suscribirte!</h1>
            <p>Tu código de descuento del 10%:</p>
            <h2 style="color: #4F46E5; background: #F3F4F6; padding: 20px; text-align: center; border-radius: 10px;">${promoCode}</h2>
            <p style="color: #666; font-size: 12px;">Válido por 30 días - El equipo de BeniceAstro</p>
          </div>
        `
      })
    });

    return new Response(JSON.stringify({ success: true, promoCode }), { status: 200 });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Error al procesar' }), { status: 500 });
  }
};
