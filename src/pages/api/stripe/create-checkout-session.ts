import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { supabase } from '../../../lib/supabase';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || '');

export const POST: APIRoute = async ({ request }) => {
  try {
    const { items, userId, promoCode } = await request.json();

    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ error: 'El carrito está vacío' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Calcular descuento si hay código promocional
    let discountPercent = 0;
    if (promoCode) {
      const { data: promo } = await supabase
        .from('promo_codes')
        .select('discount_percentage')
        .eq('code', promoCode.toUpperCase())
        .eq('active', true)
        .single();

      if (promo) {
        discountPercent = promo.discount_percentage;
      }
    }

    // Crear line items para Stripe
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item: any) => {
      let unitPrice = item.salePrice || item.price;
      
      // Aplicar descuento si existe
      if (discountPercent > 0) {
        unitPrice = unitPrice * (1 - discountPercent / 100);
      }

      return {
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.name,
            images: item.image ? [item.image] : [],
            metadata: {
              product_id: item.id
            }
          },
          unit_amount: Math.round(unitPrice * 100) // Stripe usa centavos
        },
        quantity: item.quantity
      };
    });

    // Calcular subtotal para envío
    const subtotal = items.reduce((sum: number, item: any) => {
      const price = item.salePrice || item.price;
      return sum + (price * item.quantity);
    }, 0);

    // Añadir envío si subtotal < 49€
    if (subtotal < 49) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Gastos de envío'
          },
          unit_amount: 499 // 4.99€
        },
        quantity: 1
      });
    }

    // Crear sesión de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${request.headers.get('origin')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}/checkout/cancel`,
      customer_email: userId ? undefined : undefined, // Si hay usuario logueado, usar su email
      metadata: {
        user_id: userId || '',
        promo_code: promoCode || '',
        discount_percent: discountPercent.toString()
      },
      shipping_address_collection: {
        allowed_countries: ['ES', 'PT', 'FR', 'DE', 'IT']
      },
      billing_address_collection: 'required',
      locale: 'es'
    });

    return new Response(JSON.stringify({ 
      sessionId: session.id,
      url: session.url
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
