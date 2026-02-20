// Sistema de Emails Transaccionales con Resend
import { Resend } from 'resend';

const resend = new Resend(import.meta.env.RESEND_API_KEY || '');

const FROM_NAME = 'Benice';
const FROM_EMAIL = 'onboarding@resend.dev';
const SUPPORT_EMAIL = 'lblancom06@gmail.com';

// Helper para escapar HTML y prevenir XSS
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

interface OrderEmailData {
  to: string;
  customerName: string;
  orderId: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  discount?: number;
  total: number;
  shippingAddress?: string;
}

interface WelcomeEmailData {
  to: string;
  name: string;
}

interface ShippingEmailData {
  to: string;
  customerName: string;
  orderId: string;
  trackingNumber: string;
  carrier: string;
}

// Función helper para enviar emails con Resend
async function sendEmail(to: string, subject: string, htmlContent: string, replyTo?: string) {
  const options: any = {
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: [to],
    subject,
    html: htmlContent
  };

  if (replyTo) {
    options.replyTo = replyTo;
  }

  const { data, error } = await resend.emails.send(options);

  if (error) {
    throw new Error(`Resend API error: ${JSON.stringify(error)}`);
  }

  return data;
}

// Template base HTML
const baseTemplate = (content: string, title: string) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #7e22ce 0%, #9333ea 100%); padding: 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .header img { max-width: 150px; margin-bottom: 10px; }
    .content { padding: 30px; }
    .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px; }
    .btn { display: inline-block; padding: 12px 30px; background: #7e22ce; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; }
    .btn:hover { background: #6b21a8; }
    .order-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .order-table th, .order-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    .order-table th { background: #f9fafb; font-weight: 600; }
    .total-row { font-weight: bold; font-size: 18px; color: #7e22ce; }
    .highlight { background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0; }
    .success { background: #d1fae5; border-left-color: #10b981; }
    .icon { font-size: 48px; margin-bottom: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Benice</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Benice. Todos los derechos reservados.</p>
      <p>&iquest;Tienes alguna pregunta? Cont&aacute;ctanos en ${SUPPORT_EMAIL}</p>
      <p>
        <a href="#" style="color: #9ca3af;">Pol&iacute;tica de Privacidad</a> |
        <a href="#" style="color: #9ca3af;">T&eacute;rminos y Condiciones</a>
      </p>
    </div>
  </div>
</body>
</html>
`;

// Email de confirmación de pedido
export async function sendOrderConfirmation(data: OrderEmailData) {
  const itemsHtml = data.items.map(item => `
    <tr>
      <td>${escapeHtml(item.name)}</td>
      <td style="text-align: center;">${item.quantity}</td>
      <td style="text-align: right;">${item.price.toFixed(2)}&euro;</td>
      <td style="text-align: right;">${(item.quantity * item.price).toFixed(2)}&euro;</td>
    </tr>
  `).join('');

  const content = `
    <div class="icon">Confirmado</div>
    <h2>&iexcl;Gracias por tu pedido, ${escapeHtml(data.customerName)}!</h2>
    <p>Tu pedido ha sido confirmado y est&aacute; siendo procesado. Aqu&iacute; tienes el resumen:</p>

    <div class="highlight success">
      <strong>N&uacute;mero de pedido:</strong> #${data.orderId.slice(0, 8).toUpperCase()}
    </div>

    <table class="order-table">
      <thead>
        <tr>
          <th>Producto</th>
          <th style="text-align: center;">Cantidad</th>
          <th style="text-align: right;">Precio</th>
          <th style="text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="text-align: right;">Subtotal:</td>
          <td style="text-align: right;">${data.subtotal.toFixed(2)}&euro;</td>
        </tr>
        ${data.discount ? `
        <tr style="color: #10b981;">
          <td colspan="3" style="text-align: right;">Descuento:</td>
          <td style="text-align: right;">-${data.discount.toFixed(2)}&euro;</td>
        </tr>
        ` : ''}
        <tr>
          <td colspan="3" style="text-align: right;">Env&iacute;o:</td>
          <td style="text-align: right;">GRATIS</td>
        </tr>
        <tr class="total-row">
          <td colspan="3" style="text-align: right;">Total:</td>
          <td style="text-align: right;">${data.total.toFixed(2)}&euro;</td>
        </tr>
      </tfoot>
    </table>

    ${data.shippingAddress ? `
    <h3>Direcci&oacute;n de env&iacute;o</h3>
    <p style="background: #f3f4f6; padding: 15px; border-radius: 8px;">${escapeHtml(data.shippingAddress)}</p>
    ` : ''}

    <h3>&iquest;Qu&eacute; sigue?</h3>
    <ol>
      <li>Estamos preparando tu pedido con mucho cari&ntilde;o</li>
      <li>Te enviaremos un email cuando sea enviado con el n&uacute;mero de seguimiento</li>
      <li>Recibir&aacute;s tu pedido en 24-48 horas laborables</li>
    </ol>

    <p style="margin-top: 30px; color: #6b7280;">
      &iexcl;Gracias por confiar en Benice! Si tienes alguna pregunta sobre tu pedido,
      no dudes en contactarnos.
    </p>
  `;

  try {
    const response = await sendEmail(
      data.to,
      `Pedido confirmado #${data.orderId.slice(0, 8).toUpperCase()}`,
      baseTemplate(content, 'Confirmación de Pedido')
    );
    return { success: true, data: response };
  } catch (error) {
    console.error('Error enviando email de confirmación:', error);
    return { success: false, error };
  }
}

// Email de bienvenida
export async function sendWelcomeEmail(data: WelcomeEmailData) {
  const content = `
    <div class="icon">Bienvenido</div>
    <h2>&iexcl;Bienvenido a Benice, ${escapeHtml(data.name)}!</h2>

    <p>Estamos encantados de tenerte en nuestra familia. En Benice encontrar&aacute;s todo lo que
    necesitas para cuidar de tus mascotas:</p>

    <div style="margin: 25px 0;">
      <div style="display: flex; align-items: center; gap: 15px; background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
        <div>
          <strong>Perros</strong>
          <p style="margin: 5px 0 0; color: #6b7280; font-size: 14px;">Piensos, snacks, juguetes y accesorios</p>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 15px; background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
        <div>
          <strong>Gatos</strong>
          <p style="margin: 5px 0 0; color: #6b7280; font-size: 14px;">Arena, rascadores, comida premium</p>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 15px; background: #f9fafb; padding: 15px; border-radius: 8px;">
        <div>
          <strong>Peque&ntilde;as Mascotas</strong>
          <p style="margin: 5px 0 0; color: #6b7280; font-size: 14px;">Roedores, p&aacute;jaros, peces y m&aacute;s</p>
        </div>
      </div>
    </div>

    <div class="highlight">
      <strong>Regalo de bienvenida</strong><br>
      Usa el c&oacute;digo <strong style="color: #7e22ce; font-size: 18px;">BIENVENIDO10</strong>
      y obt&eacute;n un 10% de descuento en tu primera compra.
    </div>

    <h3>Ventajas de ser parte de Benice:</h3>
    <ul>
      <li>Env&iacute;o gratis en pedidos superiores a 49&euro;</li>
      <li>Devoluciones gratuitas en 30 d&iacute;as</li>
      <li>Atenci&oacute;n al cliente personalizada</li>
      <li>Ofertas exclusivas para miembros</li>
    </ul>

    <p style="color: #6b7280; margin-top: 30px;">
      &iquest;Tienes alguna pregunta? Estamos aqu&iacute; para ayudarte. &iexcl;Escr&iacute;benos cuando quieras!
    </p>
  `;

  try {
    const response = await sendEmail(
      data.to,
      'Bienvenido a Benice',
      baseTemplate(content, 'Bienvenido')
    );
    return { success: true, data: response };
  } catch (error) {
    console.error('Error enviando email de bienvenida:', error);
    return { success: false, error };
  }
}

// Email de envío de pedido
export async function sendShippingNotification(data: ShippingEmailData) {
  const content = `
    <div class="icon">Enviado</div>
    <h2>&iexcl;Tu pedido est&aacute; en camino, ${escapeHtml(data.customerName)}!</h2>

    <p>&iexcl;Buenas noticias! Tu pedido ha sido enviado y est&aacute; de camino a tu direcci&oacute;n.</p>

    <div class="highlight success">
      <strong>N&uacute;mero de seguimiento:</strong> ${escapeHtml(data.trackingNumber)}<br>
      <strong>Transportista:</strong> ${escapeHtml(data.carrier)}
    </div>

    <h3>Fecha estimada de entrega</h3>
    <p style="background: #f3f4f6; padding: 15px; border-radius: 8px; font-size: 18px; text-align: center;">
      <strong>24-48 horas laborables</strong>
    </p>

    <h3>Consejos para la entrega:</h3>
    <ul>
      <li>Aseg&uacute;rate de estar disponible en la direcci&oacute;n indicada</li>
      <li>El repartidor te llamar&aacute; antes de llegar</li>
      <li>Si no est&aacute;s, se dejar&aacute; en un punto de recogida cercano</li>
    </ul>

    <p style="color: #6b7280; margin-top: 30px;">
      &iquest;Alg&uacute;n problema con tu env&iacute;o? Cont&aacute;ctanos y te ayudamos.
    </p>
  `;

  try {
    const response = await sendEmail(
      data.to,
      `Tu pedido #${data.orderId.slice(0, 8).toUpperCase()} está en camino`,
      baseTemplate(content, 'Pedido Enviado')
    );
    return { success: true, data: response };
  } catch (error) {
    console.error('Error enviando email de envío:', error);
    return { success: false, error };
  }
}

// Email de newsletter
export async function sendNewsletterWelcome(email: string, promoCode: string) {
  const content = `
    <div class="icon">Newsletter</div>
    <h2>&iexcl;Gracias por suscribirte!</h2>

    <p>Ya formas parte de la comunidad Benice. Recibir&aacute;s las mejores ofertas,
    novedades y consejos para el cuidado de tus mascotas directamente en tu bandeja de entrada.</p>

    <div class="highlight">
      <strong>Aqu&iacute; tienes tu c&oacute;digo de descuento</strong><br><br>
      <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
        <span style="font-size: 28px; font-weight: bold; color: #7e22ce; letter-spacing: 3px;">
          ${promoCode}
        </span>
        <p style="margin: 10px 0 0; color: #6b7280; font-size: 14px;">15% de descuento en tu pr&oacute;xima compra</p>
      </div>
    </div>

    <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
      Si no quieres recibir m&aacute;s emails, puedes
      <a href="#" style="color: #7e22ce;">darte de baja aqu&iacute;</a>.
    </p>
  `;

  try {
    const response = await sendEmail(
      email,
      'Tu código de descuento exclusivo',
      baseTemplate(content, 'Newsletter')
    );
    return { success: true, data: response };
  } catch (error) {
    console.error('Error enviando email de newsletter:', error);
    return { success: false, error };
  }
}

// Email de cancelación de pedido
export async function sendOrderCancellation(email: string, orderId: string, customerName: string) {
  const content = `
    <div class="icon">Cancelado</div>
    <h2>Pedido cancelado</h2>

    <p>Hola ${escapeHtml(customerName)},</p>
    <p>Tu pedido <strong>#${orderId.slice(0, 8).toUpperCase()}</strong> ha sido cancelado correctamente.</p>

    <div class="highlight">
      <strong>Reembolso</strong><br>
      El importe de tu pedido ser&aacute; reembolsado en un plazo de 3-5 d&iacute;as laborables
      mediante el mismo m&eacute;todo de pago utilizado.
    </div>

    <p>Si tienes alguna pregunta sobre la cancelaci&oacute;n o el reembolso, no dudes en contactarnos.</p>

    <p style="color: #6b7280; margin-top: 30px;">
      Sentimos que hayas tenido que cancelar tu pedido. Esperamos verte pronto de nuevo.
    </p>
  `;

  try {
    const response = await sendEmail(
      email,
      `Pedido #${orderId.slice(0, 8).toUpperCase()} cancelado`,
      baseTemplate(content, 'Pedido Cancelado')
    );
    return { success: true, data: response };
  } catch (error) {
    console.error('Error enviando email de cancelación:', error);
    return { success: false, error };
  }
}

// Email de confirmacion de entrega
export async function sendDeliveryConfirmation(email: string, orderId: string, customerName: string) {
  const content = `
    <div class="icon">Entregado</div>
    <h2>&iexcl;Tu pedido ha sido entregado, ${escapeHtml(customerName)}!</h2>

    <p>Tu pedido <strong>#${orderId.slice(0, 8).toUpperCase()}</strong> ha sido entregado correctamente.</p>

    <div class="highlight success">
      <strong>&iexcl;Gracias por tu compra!</strong><br>
      Si tienes alg&uacute;n problema con tu pedido, puedes solicitar una devoluci&oacute;n desde tu cuenta
      en un plazo de 30 d&iacute;as.
    </div>

    <p>&iquest;Te ha gustado tu experiencia? Nos encantar&iacute;a que dejaras una rese&ntilde;a
    en los productos que compraste.</p>

    <p style="color: #6b7280; margin-top: 30px;">
      &iexcl;Gracias por confiar en Benice!
    </p>
  `;

  try {
    const response = await sendEmail(
      email,
      `Pedido #${orderId.slice(0, 8).toUpperCase()} entregado`,
      baseTemplate(content, 'Pedido Entregado')
    );
    return { success: true, data: response };
  } catch (error) {
    console.error('Error enviando email de entrega:', error);
    return { success: false, error };
  }
}

// Email de cancelacion rechazada
export async function sendCancellationRejected(email: string, orderId: string, customerName: string, adminNotes?: string) {
  const content = `
    <div class="icon">Informaci&oacute;n</div>
    <h2>Solicitud de cancelaci&oacute;n no aprobada</h2>

    <p>Hola ${escapeHtml(customerName)},</p>
    <p>Tu solicitud de cancelaci&oacute;n para el pedido <strong>#${orderId.slice(0, 8).toUpperCase()}</strong>
    no ha podido ser aprobada.</p>

    ${adminNotes ? `
    <div class="highlight">
      <strong>Motivo:</strong><br>
      ${escapeHtml(adminNotes)}
    </div>
    ` : ''}

    <p>Tu pedido seguir&aacute; su curso normal. Si tienes alguna pregunta,
    no dudes en contactarnos.</p>

    <p style="color: #6b7280; margin-top: 30px;">
      Estamos aqu&iacute; para ayudarte en lo que necesites.
    </p>
  `;

  try {
    const response = await sendEmail(
      email,
      `Solicitud de cancelacion - Pedido #${orderId.slice(0, 8).toUpperCase()}`,
      baseTemplate(content, 'Cancelacion no aprobada')
    );
    return { success: true, data: response };
  } catch (error) {
    console.error('Error enviando email de rechazo:', error);
    return { success: false, error };
  }
}

// Email de contacto (para el admin)
export async function sendContactEmail(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
  phone?: string;
}) {
  const safeName = escapeHtml(data.name);
  const safeEmail = escapeHtml(data.email);
  const safeSubject = escapeHtml(data.subject);
  const safeMessage = escapeHtml(data.message);
  const safePhone = data.phone ? escapeHtml(data.phone) : '';

  const content = `
    <h2>Nuevo mensaje de contacto</h2>

    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 10px; background: #f9fafb; width: 120px;"><strong>Nombre:</strong></td>
        <td style="padding: 10px;">${safeName}</td>
      </tr>
      <tr>
        <td style="padding: 10px; background: #f9fafb;"><strong>Email:</strong></td>
        <td style="padding: 10px;"><a href="mailto:${safeEmail}">${safeEmail}</a></td>
      </tr>
      ${data.phone ? `
      <tr>
        <td style="padding: 10px; background: #f9fafb;"><strong>Tel&eacute;fono:</strong></td>
        <td style="padding: 10px;">${safePhone}</td>
      </tr>
      ` : ''}
      <tr>
        <td style="padding: 10px; background: #f9fafb;"><strong>Asunto:</strong></td>
        <td style="padding: 10px;">${safeSubject}</td>
      </tr>
    </table>

    <h3 style="margin-top: 20px;">Mensaje:</h3>
    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; white-space: pre-wrap;">
${safeMessage}
    </div>

    <p style="margin-top: 20px;">
      <a href="mailto:${safeEmail}?subject=Re: ${encodeURIComponent(data.subject)}" class="btn">
        Responder
      </a>
    </p>
  `;

  try {
    const response = await sendEmail(
      SUPPORT_EMAIL,
      `[Contacto] ${safeSubject}`,
      baseTemplate(content, 'Nuevo Contacto'),
      data.email
    );
    return { success: true, data: response };
  } catch (error) {
    console.error('Error enviando email de contacto:', error);
    return { success: false, error };
  }
}
