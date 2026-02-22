/**
 * POST /api/google/place-details
 * 
 * Proxy seguro para Google Places Details (New API).
 * Dado un placeId, devuelve los componentes de dirección desglosados.
 * 
 * SEGURIDAD:
 * - La API Key nunca se expone al cliente
 * - Solo solicita los campos de dirección (FieldMask), minimizando coste
 * - Valida el placeId antes de llamar a Google
 */
import type { APIRoute } from 'astro';

export const prerender = false;

const GOOGLE_PLACES_API_KEY = import.meta.env.GOOGLE_PLACES_API_KEY;

/** Mapeo de tipos de componente de Google → campos de nuestro formulario */
interface ParsedAddress {
  street_number: string;
  route: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  country_code: string;
  formatted_address: string;
  latitude: number | null;
  longitude: number | null;
}

export const POST: APIRoute = async ({ request }) => {
  const headers = { 'Content-Type': 'application/json' };

  if (!GOOGLE_PLACES_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'Servicio no disponible' }),
      { status: 503, headers }
    );
  }

  try {
    const body = await request.json();
    const { placeId, sessionToken } = body;

    // Validar placeId (formato: ChIJ seguido de alfanuméricos y guiones bajos)
    if (!placeId || typeof placeId !== 'string' || !/^[A-Za-z0-9_-]{20,300}$/.test(placeId)) {
      return new Response(
        JSON.stringify({ error: 'placeId inválido' }),
        { status: 400, headers }
      );
    }

    // Llamar a Google Place Details (New API)
    // Solo solicitamos addressComponents y formattedAddress para minimizar coste
    const fieldMask = 'addressComponents,formattedAddress,location';
    const googleUrl = `https://places.googleapis.com/v1/places/${placeId}`;

    const googleHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
      'X-Goog-FieldMask': fieldMask,
    };

    // Session token completa la sesión de facturación
    if (sessionToken && typeof sessionToken === 'string') {
      googleHeaders['X-Goog-SessionToken'] = sessionToken;
    }

    const googleRes = await fetch(googleUrl, {
      method: 'GET',
      headers: googleHeaders,
    });

    if (!googleRes.ok) {
      const errorText = await googleRes.text();
      console.error('Google Place Details error:', googleRes.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Error al obtener detalles de dirección' }),
        { status: 502, headers }
      );
    }

    const data = await googleRes.json();

    // Parsear componentes de dirección + coordenadas
    const parsed = parseAddressComponents(
      data.addressComponents || [],
      data.formattedAddress || '',
      data.location || null
    );

    return new Response(
      JSON.stringify({ address: parsed }),
      { status: 200, headers }
    );

  } catch (error: any) {
    console.error('Error en place-details:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno' }),
      { status: 500, headers }
    );
  }
};

/**
 * Extrae los campos de dirección del array addressComponents de Google.
 * 
 * Google devuelve componentes con "types" como:
 * - "street_number" → Número
 * - "route" → Calle
 * - "locality" → Ciudad
 * - "administrative_area_level_1" → Comunidad Autónoma (España) / Estado
 * - "administrative_area_level_2" → Provincia
 * - "postal_code" → Código postal
 * - "country" → País
 * - "subpremise" → Piso, puerta, etc.
 */
function parseAddressComponents(components: any[], formattedAddress: string, location: { latitude?: number; longitude?: number } | null): ParsedAddress {
  const get = (type: string): { long: string; short: string } => {
    const comp = components.find((c: any) => 
      c.types?.includes(type)
    );
    return {
      long: comp?.longText || comp?.long_name || '',
      short: comp?.shortText || comp?.short_name || '',
    };
  };

  const streetNumber = get('street_number');
  const route = get('route');
  const subpremise = get('subpremise');
  const locality = get('locality');
  const sublocalityLevel1 = get('sublocality_level_1');
  const adminArea1 = get('administrative_area_level_1'); // Comunidad Autónoma
  const adminArea2 = get('administrative_area_level_2'); // Provincia
  const postalCode = get('postal_code');
  const country = get('country');

  // Construir dirección línea 1: "Calle Nombre, 123"
  let line1 = '';
  if (route.long && streetNumber.long) {
    line1 = `${route.long}, ${streetNumber.long}`;
  } else if (route.long) {
    line1 = route.long;
  }

  // Línea 2: subpremise (piso, puerta, etc.)
  const line2 = subpremise.long;

  // Ciudad: locality o sublocality
  const city = locality.long || sublocalityLevel1.long;

  // Provincia/estado: administrative_area_level_2 (Provincia) o level_1 (CA)
  const state = adminArea2.long || adminArea1.long;

  return {
    street_number: streetNumber.long,
    route: route.long,
    address_line1: line1,
    address_line2: line2,
    city,
    state,
    postal_code: postalCode.long,
    country: country.long,
    country_code: country.short, // "ES", "PT", "FR", etc.
    formatted_address: formattedAddress,
    latitude: location?.latitude ?? null,
    longitude: location?.longitude ?? null,
  };
}
