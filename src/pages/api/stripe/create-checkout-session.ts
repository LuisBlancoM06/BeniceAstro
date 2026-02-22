import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { supabase, supabaseAdmin } from '../../../lib/supabase';
import { getOrCreateStripeCustomer } from '../../../lib/stripe-customer';
import { FREE_SHIPPING_THRESHOLD, SHIPPING_COST_CENTS } from '../../../lib/constants';

export const prerender = false;

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || '');

export const POST: APIRoute = async ({ request }) => {
  try {
    const { items, promoCode } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: 'El carrito está vacío' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // SEGURIDAD: Verificar autenticación JWT del usuario (NUNCA confiar en userId del body)
    let userId: string | null = null;
    let stripeCustomerId: string | undefined;
    let customerEmail: string | undefined;

    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (!authError && user) {
        userId = user.id;
        try {
          stripeCustomerId = await getOrCreateStripeCustomer(userId);
        } catch {
          // Fallback: usar solo email si falla la creación del Customer
          const { data: profile } = await supabaseAdmin
            .from('users')
            .select('email')
            .eq('id', userId)
            .single();
          customerEmail = profile?.email || undefined;
        }
      }
    }

    // Validar precios y stock contra la base de datos (NUNCA confiar en el cliente)
    const productIds = items.map((item: any) => item.id);
    const { data: dbProducts, error: dbError } = await supabaseAdmin
      .from('products')
      .select('id, name, price, sale_price, on_sale, stock, image_url')
      .in('id', productIds);

    if (dbError || !dbProducts) {
      return new Response(JSON.stringify({ error: 'Error al verificar productos' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Crear mapa de productos de la DB para acceso rápido
    const productMap = new Map(dbProducts.map(p => [p.id, p]));

    // Verificar que todos los productos existen y tienen stock
    for (const item of items) {
      const dbProduct = productMap.get(item.id);
      if (!dbProduct) {
        return new Response(JSON.stringify({ error: `Producto no encontrado: ${item.id}` }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      const qty = Math.min(Math.max(Math.floor(item.quantity || 1), 1), 99);
      item.quantity = qty; // Normalizar cantidad
      if (dbProduct.stock < qty) {
        return new Response(JSON.stringify({ error: `Stock insuficiente para: ${dbProduct.name}` }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Calcular descuento si hay código promocional - validar completamente
    let discountPercent = 0;
    if (promoCode) {
      const { data: promo } = await supabaseAdmin
        .from('promo_codes')
        .select('discount_percentage, expires_at, max_uses, current_uses')
        .eq('code', promoCode.toUpperCase())
        .eq('active', true)
        .single();

      if (promo) {
        // Verificar expiración
        if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
          return new Response(JSON.stringify({ error: 'El código promocional ha expirado' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        // Verificar usos máximos
        if (promo.max_uses && (promo.current_uses || 0) >= promo.max_uses) {
          return new Response(JSON.stringify({ error: 'El código promocional ha alcanzado su límite de usos' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        discountPercent = promo.discount_percentage;
      }
    }

    // Crear line items usando precios de la BASE DE DATOS (no del cliente)
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item: any) => {
      const dbProduct = productMap.get(item.id)!;
      let unitPrice = (dbProduct.on_sale && dbProduct.sale_price) ? dbProduct.sale_price : dbProduct.price;

      // Aplicar descuento si existe
      if (discountPercent > 0) {
        unitPrice = unitPrice * (1 - discountPercent / 100);
      }

      return {
        price_data: {
          currency: 'eur',
          product_data: {
            name: dbProduct.name,
            images: dbProduct.image_url ? [dbProduct.image_url] : [],
            metadata: {
              product_id: dbProduct.id
            }
          },
          unit_amount: Math.round(unitPrice * 100)
        },
        quantity: item.quantity || 1
      };
    });

    // Calcular subtotal para envío usando precios de la DB
    const subtotal = items.reduce((sum: number, item: any) => {
      const dbProduct = productMap.get(item.id)!;
      const price = (dbProduct.on_sale && dbProduct.sale_price) ? dbProduct.sale_price : dbProduct.price;
      return sum + (price * (item.quantity || 1));
    }, 0);

    // Añadir envío si subtotal < umbral
    if (subtotal < FREE_SHIPPING_THRESHOLD) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Gastos de envío'
          },
          unit_amount: SHIPPING_COST_CENTS
        },
        quantity: 1
      });
    }

    // Crear sesión de checkout
    // Si hay Stripe Customer vinculado, usarlo para pre-rellenar TODOS los datos
    // (nombre, email, teléfono, dirección). Si no, fallback a customer_email.
    // NOTA: 'customer' y 'customer_email' son mutuamente excluyentes en la API de Stripe.
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${import.meta.env.PUBLIC_SITE_URL || request.headers.get('origin') || 'https://benicetiendanimal.victoriafp.online'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${import.meta.env.PUBLIC_SITE_URL || request.headers.get('origin') || 'https://benicetiendanimal.victoriafp.online'}/checkout/cancel`,
      metadata: {
        user_id: userId || '',
        promo_code: promoCode || '',
        discount_percent: discountPercent.toString()
      },
      shipping_address_collection: {
        allowed_countries: ['ES', 'PT', 'FR', 'DE', 'IT']
      },
      billing_address_collection: 'required',
      locale: 'es',
    };

    if (stripeCustomerId) {
      // Customer vinculado: Stripe pre-rellena email, nombre, teléfono y dirección
      sessionParams.customer = stripeCustomerId;
      sessionParams.customer_update = {
        // Permitir que el usuario modifique sus datos en Stripe Checkout
        // y que se guarden automáticamente en el Customer para futuras compras
        name: 'auto',
        address: 'auto',
        shipping: 'auto',
      };
    } else if (customerEmail) {
      // Fallback: solo pre-rellenar email
      sessionParams.customer_email = customerEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(JSON.stringify({ 
      sessionId: session.id,
      url: session.url
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
