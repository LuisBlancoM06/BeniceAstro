/**
 * POST /api/google/places-autocomplete
 * 
 * Proxy seguro para Google Places Autocomplete (New API).
 * La API Key de Google NUNCA se expone al cliente.
 * 
 * SEGURIDAD:
 * - Rate-limited por middleware general (/api/)
 * - Valida y sanitiza el input del usuario
 * - Solo devuelve los campos necesarios (no toda la respuesta de Google)
 * - Requiere input mínimo de 3 caracteres para evitar queries vacías
 */
import type { APIRoute } from 'astro';

export const prerender = false;

const GOOGLE_PLACES_API_KEY = import.meta.env.GOOGLE_PLACES_API_KEY;

export const POST: APIRoute = async ({ request }) => {
  const headers = { 'Content-Type': 'application/json' };

  if (!GOOGLE_PLACES_API_KEY) {
    console.error('GOOGLE_PLACES_API_KEY no configurada');
    return new Response(
      JSON.stringify({ error: 'Servicio de autocompletado no disponible' }),
      { status: 503, headers }
    );
  }

  try {
    const body = await request.json();
    const { input, sessionToken } = body;

    // Validar input
    if (!input || typeof input !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Input requerido' }),
        { status: 400, headers }
      );
    }

    const sanitizedInput = input.trim().slice(0, 200);
    if (sanitizedInput.length < 3) {
      return new Response(
        JSON.stringify({ predictions: [] }),
        { status: 200, headers }
      );
    }

    // Llamar a Google Places Autocomplete (New API)
    const googleUrl = 'https://places.googleapis.com/v1/places:autocomplete';
    
    const googleBody: Record<string, any> = {
      input: sanitizedInput,
      includedPrimaryTypes: ['street_address', 'subpremise', 'premise', 'route'],
      languageCode: 'es',
    };

    // Session token para agrupar autocomplete + details en una sola sesión de facturación
    if (sessionToken && typeof sessionToken === 'string') {
      googleBody.sessionToken = sessionToken;
    }

    const googleRes = await fetch(googleUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
      },
      body: JSON.stringify(googleBody),
    });

    if (!googleRes.ok) {
      const errorText = await googleRes.text();
      console.error('Google Places Autocomplete error:', googleRes.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Error al buscar direcciones', predictions: [] }),
        { status: 502, headers }
      );
    }

    const data = await googleRes.json();

    // Transformar respuesta: solo devolver lo necesario al frontend
    // NOTA: En la Places API (New), el campo puede ser `placeId` o solo `place`
    // (resource name "places/ChIJ..."). Extraemos el ID puro en ambos casos.
    const predictions = (data.suggestions || [])
      .filter((s: any) => s.placePrediction)
      .map((s: any) => {
        const pp = s.placePrediction;
        const rawId = pp.placeId
          || pp.placeID
          || (pp.place ? pp.place.replace(/^places\//, '') : '');
        return {
          placeId: rawId,
          description: pp.text?.text || '',
          mainText: pp.structuredFormat?.mainText?.text || '',
          secondaryText: pp.structuredFormat?.secondaryText?.text || '',
        };
      })
      .filter((p: any) => p.placeId);

    return new Response(
      JSON.stringify({ predictions }),
      { status: 200, headers }
    );

  } catch (error: any) {
    console.error('Error en places-autocomplete:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno', predictions: [] }),
      { status: 500, headers }
    );
  }
};
