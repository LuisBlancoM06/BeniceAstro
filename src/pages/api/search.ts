import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const GET: APIRoute = async ({ url }) => {
  const query = url.searchParams.get('q');

  if (!query || query.length < 2) {
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, price, image_url, slug, on_sale, sale_price')
      .ilike('name', `%${query}%`)
      .limit(5);

    if (error) throw error;

    return new Response(JSON.stringify(products || []), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error en búsqueda:', error);
    return new Response(JSON.stringify({ error: 'Error en la búsqueda' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
