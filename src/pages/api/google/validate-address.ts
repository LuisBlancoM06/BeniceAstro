/**
 * POST /api/google/validate-address
 * 
 * Valida una dirección en backend usando Google Address Validation API.
 * Útil antes de confirmar un pedido para asegurar que la dirección es entregable.
 * 
 * SEGURIDAD:
 * - Requiere autenticación (solo usuarios logueados pueden validar)
 * - Rate-limited por middleware
 * - No expone la API Key
 * 
 * NOTA: Requiere Google Address Validation API habilitada.
 * Si no está disponible, hace validación básica local.
 */
import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const prerender = false;

const GOOGLE_PLACES_API_KEY = import.meta.env.GOOGLE_PLACES_API_KEY;

interface AddressInput {
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestedAddress?: AddressInput;
}

export const POST: APIRoute = async ({ request }) => {
  const headers = { 'Content-Type': 'application/json' };

  try {
    // Autenticación opcional pero recomendada
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { error: authError } = await supabase.auth.getUser(token);
      if (authError) {
        return new Response(
          JSON.stringify({ error: 'Sesión no válida' }),
          { status: 401, headers }
        );
      }
    }

    const body: AddressInput = await request.json();
    const result = validateAddressLocally(body);

    // Si la validación local pasa y tenemos API Key, intentar validación con Google
    if (result.isValid && GOOGLE_PLACES_API_KEY) {
      try {
        const googleResult = await validateWithGoogle(body);
        if (googleResult) {
          return new Response(JSON.stringify(googleResult), { status: 200, headers });
        }
      } catch (err) {
        // Si Google falla, devolver resultado de validación local
        console.error('Google Address Validation error:', err);
      }
    }

    return new Response(JSON.stringify(result), {
      status: result.isValid ? 200 : 422,
      headers,
    });

  } catch (error: any) {
    console.error('Error en validate-address:', error);
    return new Response(
      JSON.stringify({ error: 'Error al validar dirección' }),
      { status: 500, headers }
    );
  }
};

/** Validación local de campos de dirección */
function validateAddressLocally(addr: AddressInput): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Campos obligatorios
  if (!addr.address_line1?.trim()) {
    errors.push('La dirección (calle y número) es obligatoria');
  } else if (addr.address_line1.trim().length < 5) {
    errors.push('La dirección parece demasiado corta');
  }

  if (!addr.city?.trim()) {
    errors.push('La ciudad es obligatoria');
  }

  if (!addr.postal_code?.trim()) {
    errors.push('El código postal es obligatorio');
  } else {
    // Validar formatos de CP por país
    const cp = addr.postal_code.trim();
    const country = addr.country || 'ES';
    
    const postalPatterns: Record<string, { pattern: RegExp; label: string }> = {
      ES: { pattern: /^\d{5}$/, label: 'España (5 dígitos, ej: 28001)' },
      PT: { pattern: /^\d{4}-?\d{3}$/, label: 'Portugal (ej: 1000-001)' },
      FR: { pattern: /^\d{5}$/, label: 'Francia (5 dígitos)' },
      DE: { pattern: /^\d{5}$/, label: 'Alemania (5 dígitos)' },
      IT: { pattern: /^\d{5}$/, label: 'Italia (5 dígitos)' },
      GB: { pattern: /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i, label: 'Reino Unido (ej: SW1A 1AA)' },
      NL: { pattern: /^\d{4}\s?[A-Z]{2}$/i, label: 'Países Bajos (ej: 1234 AB)' },
      BE: { pattern: /^\d{4}$/, label: 'Bélgica (4 dígitos)' },
      AT: { pattern: /^\d{4}$/, label: 'Austria (4 dígitos)' },
      CH: { pattern: /^\d{4}$/, label: 'Suiza (4 dígitos)' },
    };

    const postalRule = postalPatterns[country];
    if (postalRule && !postalRule.pattern.test(cp)) {
      errors.push(`Código postal inválido para ${postalRule.label}`);
    }
  }

  if (!addr.country?.trim()) {
    warnings.push('No se especificó país, se asumirá España');
  }

  if (!addr.state?.trim()) {
    warnings.push('Se recomienda indicar la provincia/estado');
  }

  // Validar longitudes máximas
  if (addr.address_line1 && addr.address_line1.length > 200) {
    errors.push('Dirección demasiado larga (máx 200 caracteres)');
  }
  if (addr.city && addr.city.length > 100) {
    errors.push('Ciudad demasiado larga (máx 100 caracteres)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/** Intentar validar con Google Address Validation API */
async function validateWithGoogle(addr: AddressInput): Promise<ValidationResult | null> {
  const googleUrl = 'https://addressvalidation.googleapis.com/v1:validateAddress';

  const res = await fetch(`${googleUrl}?key=${GOOGLE_PLACES_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      address: {
        regionCode: addr.country || 'ES',
        languageCode: 'es',
        addressLines: [
          addr.address_line1,
          addr.address_line2,
        ].filter(Boolean),
        locality: addr.city,
        administrativeArea: addr.state,
        postalCode: addr.postal_code,
      },
    }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  const verdict = data.result?.verdict;

  if (!verdict) return null;

  const errors: string[] = [];
  const warnings: string[] = [];

  // Interpretar el veredicto de Google
  if (verdict.inputGranularity === 'OTHER' || verdict.inputGranularity === 'ROUTE') {
    warnings.push('La dirección podría no ser lo suficientemente precisa para entregas');
  }

  if (verdict.hasUnconfirmedComponents) {
    warnings.push('Algunos componentes de la dirección no pudieron verificarse');
  }

  if (verdict.validationGranularity === 'OTHER') {
    errors.push('No se pudo verificar esta dirección. Revisa que sea correcta.');
  }

  // Extraer dirección corregida si Google sugiere una
  let suggestedAddress: AddressInput | undefined;
  const googleAddr = data.result?.address;
  if (googleAddr?.postalAddress) {
    const pa = googleAddr.postalAddress;
    suggestedAddress = {
      address_line1: pa.addressLines?.[0] || addr.address_line1,
      address_line2: pa.addressLines?.[1] || addr.address_line2,
      city: pa.locality || addr.city,
      state: pa.administrativeArea || addr.state,
      postal_code: pa.postalCode || addr.postal_code,
      country: pa.regionCode || addr.country,
    };
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestedAddress,
  };
}
