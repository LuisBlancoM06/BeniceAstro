import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../lib/supabase';
import { sendContactEmail } from '../../lib/email';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    // Validación básica
    if (!name || !email || !subject || !message) {
      return new Response(JSON.stringify({ error: 'Faltan campos requeridos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validación de longitud máxima para evitar abuso de almacenamiento
    if (name.length > 100 || email.length > 254 || subject.length > 200 || message.length > 5000) {
      return new Response(JSON.stringify({ error: 'Uno o más campos exceden la longitud máxima permitida' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (phone && (typeof phone !== 'string' || phone.length > 20)) {
      return new Response(JSON.stringify({ error: 'Teléfono inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validación de email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'Email inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Guardar mensaje en Supabase
    const { error: dbError } = await supabaseAdmin
      .from('contact_messages')
      .insert({ name, email, phone: phone || null, subject, message });

    if (dbError) {
      console.error('Error guardando mensaje de contacto:', dbError);
      // No fallamos si la tabla no existe aún, seguimos enviando el email
    }

    // Enviar email
    await sendContactEmail({
      name,
      email,
      phone,
      subject,
      message
    });

    return new Response(JSON.stringify({ success: true, message: 'Mensaje enviado correctamente' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error al procesar formulario de contacto:', error);
    return new Response(JSON.stringify({ error: 'Error al enviar el mensaje' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
