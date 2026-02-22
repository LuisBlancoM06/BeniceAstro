# Integración Google Places Autocomplete — Benice Pet Shop

## Índice
1. [Configurar Google Cloud](#1-configurar-google-cloud)
2. [Arquitectura del sistema](#2-arquitectura)
3. [Componentes implementados](#3-componentes)
4. [Mapeo de campos](#4-mapeo-de-campos)
5. [Validación](#5-validación)
6. [Seguridad](#6-seguridad)
7. [Manejo de errores](#7-manejo-de-errores)
8. [Costes y optimización](#8-costes)

---

## 1. Configurar Google Cloud

### Paso 1: Crear proyecto
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Clic en "Seleccionar proyecto" → "Nuevo proyecto"
3. Nombre: `benice-pet-shop` → Crear
4. Selecciona el proyecto creado

### Paso 2: Activar las APIs necesarias
1. Ve a **APIs y servicios → Biblioteca**
2. Busca y activa estas APIs:
   - **Places API (New)** — Autocompletado de direcciones
   - **Address Validation API** — Validación de dirección (opcional, tiene coste adicional)

### Paso 3: Crear API Key
1. Ve a **APIs y servicios → Credenciales**
2. Clic en **Crear credenciales → Clave de API**
3. Copia la clave generada

### Paso 4: Restringir la clave (OBLIGATORIO para producción)
1. Clic en "Editar la clave de API"
2. **Nombre**: `Benice Backend - Places API`
3. **Restricciones de aplicación**: 
   - Selecciona **"Direcciones IP de servidor"** (NO restricción HTTP referrer, porque la clave se usa server-side)
   - Añade la IP del servidor de producción (Coolify/VPS)
4. **Restricciones de API**:
   - Selecciona **"Restringir clave"**
   - Marca solo: `Places API (New)` y `Address Validation API`
5. Guardar

### Paso 5: Configurar variable de entorno
```bash
# En tu .env (NUNCA commitear al repo)
GOOGLE_PLACES_API_KEY=AIzaSy...tu_clave_aqui
```

En **Coolify** (o tu PaaS):
- Ve a la configuración del servicio → Variables de entorno
- Añade `GOOGLE_PLACES_API_KEY` con la clave

---

## 2. Arquitectura

```
┌─────────────────────────┐     ┌──────────────────────────────┐     ┌───────────────────┐
│   Frontend (Browser)    │     │       Backend (Astro SSR)      │     │   Google APIs     │
│                         │     │                                │     │                   │
│  AddressAutocomplete    │────▶│  POST /api/google/             │────▶│  Places API (New) │
│  (componente React)     │     │       places-autocomplete      │     │  Autocomplete     │
│                         │     │                                │     │                   │
│  Usuario selecciona ───▶│────▶│  POST /api/google/             │────▶│  Place Details    │
│                         │     │       place-details            │     │                   │
│  Validar antes ────────▶│────▶│  POST /api/google/             │────▶│  Address          │
│  de pago                │     │       validate-address         │     │  Validation API   │
└─────────────────────────┘     └──────────────────────────────────┘     └───────────────────┘
                                        ▲
                                        │ API Key SOLO aquí
                                        │ (nunca en el cliente)
```

**Decisión de diseño**: Se usa un **proxy backend** en lugar de cargar el Google Maps JS SDK en el cliente. Razones:
- La API Key **nunca** se expone al navegador
- No se carga un script externo pesado (~200KB del Maps SDK)
- Control total sobre rate-limiting y logs
- Cumple con RGPD (los datos pasan por nuestro servidor, no directamente a Google)

---

## 3. Componentes implementados

### Backend (3 endpoints)

| Endpoint | Método | Propósito |
|----------|--------|-----------|
| `/api/google/places-autocomplete` | POST | Proxy para buscar sugerencias de dirección |
| `/api/google/place-details` | POST | Proxy para obtener componentes de una dirección |
| `/api/google/validate-address` | POST | Validar dirección antes del checkout |

### Frontend

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| `AddressAutocomplete` | `src/components/AddressAutocomplete.tsx` | Input con dropdown de sugerencias |

### Uso en checkout.astro
```astro
<AddressAutocomplete
  client:load
  id="ship-address-search"
  placeholder="Escribe tu dirección para autocompletar..."
  fieldIds={{
    line1: 'ship-line1',
    line2: 'ship-line2',
    city: 'ship-city',
    state: 'ship-state',
    postalCode: 'ship-postal',
    country: 'ship-country',
  }}
/>
```

---

## 4. Mapeo de campos

### Google → Nuestros campos del formulario

| Componente Google (`types`) | Campo del formulario | Ejemplo |
|---|---|---|
| `route` + `street_number` | `address_line1` (Calle y número) | "Calle Gran Vía, 28" |
| `subpremise` | `address_line2` (Piso, puerta) | "4ºB" |
| `locality` | `city` (Ciudad) | "Madrid" |
| `administrative_area_level_2` | `state` (Provincia) | "Madrid" |
| `administrative_area_level_1` | `state` (fallback: CA) | "Comunidad de Madrid" |
| `postal_code` | `postal_code` (Código postal) | "28013" |
| `country` (short) | `country` (código ISO) | "ES" |
| `formattedAddress` | Dirección completa | "Calle Gran Vía, 28, 28013 Madrid, España" |

### Lógica de parsing (en `place-details.ts`)
```typescript
// Prioridad para "Provincia/Estado":
// 1. administrative_area_level_2 (Provincia en España)
// 2. administrative_area_level_1 (Comunidad Autónoma / Estado en otros países)

// Prioridad para "Ciudad":
// 1. locality (la mayoría de casos)
// 2. sublocality_level_1 (barrios grandes en ciudades como Barcelona)
```

---

## 5. Validación

### Validación frontend (en `AddressAutocomplete.tsx`)
- Input mínimo de 3 caracteres antes de buscar
- Debounce de 300ms para no hacer llamadas excesivas
- Feedback visual cuando se rellenan campos (highlight verde)

### Validación backend (en `validate-address.ts`)

**Nivel 1 — Validación local** (siempre activa, sin coste):
- Campos obligatorios: `address_line1`, `city`, `postal_code`
- Formato de código postal por país:
  - España: 5 dígitos (ej: `28001`)
  - Portugal: `1234-567`
  - UK: `SW1A 1AA`
  - etc.
- Longitudes máximas

**Nivel 2 — Google Address Validation** (opcional, con coste):
- Verifica si la dirección es entregable
- Sugiere correcciones
- Detecta componentes no confirmados

### Ejemplo de uso antes del checkout
```javascript
const res = await fetch('/api/google/validate-address', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    address_line1: 'Calle Gran Vía 28',
    city: 'Madrid',
    postal_code: '28013',
    country: 'ES'
  })
});
const result = await res.json();
// { isValid: true, errors: [], warnings: [], suggestedAddress: {...} }
```

---

## 6. Seguridad

### ✅ Implementado

| Medida | Detalle |
|--------|---------|
| **API Key server-side** | La clave NUNCA llega al navegador. Solo se usa en los endpoints `/api/google/*` |
| **Restricciones de clave** | Por IP de servidor + APIs específicas (Places, Address Validation) |
| **Rate limiting** | Los endpoints `/api/*` están protegidos por el middleware existente |
| **Input sanitization** | Se trunca a 200 chars, se valida el formato del placeId |
| **Session tokens** | Se usan para agrupar autocomplete + details (reduce coste Google) |
| **CSP** | Las llamadas a Google son server-to-server, no necesitan CSP |
| **No tracking** | Como no cargamos el Maps JS SDK, Google no trackea a los usuarios |
| **Validación backend** | Antes de confirmar pedido, se valida la dirección server-side |

### ⚠️ Recomendaciones adicionales

1. **Monitorizar uso**: Configura alertas de quota en Google Cloud Console
2. **Budget alerts**: Establece un límite de gasto mensual ($10-50)
3. **Logs**: Los errores se logean server-side sin exponer datos al cliente
4. **Rotación de claves**: Rota la API Key cada 90 días

---

## 7. Manejo de errores

| Escenario | Comportamiento |
|-----------|---------------|
| **API Key no configurada** | Endpoint devuelve 503. El input funciona como texto libre normal |
| **Google no responde** | Se muestra "Error de conexión. Escribe la dirección manualmente." |
| **Sin resultados** | Se muestra "No se encontraron direcciones. Puedes escribirla manualmente." |
| **Detalles fallidos** | Se muestra warning. Los campos quedan editables para escritura manual |
| **Quota excedida** | Google devuelve 429. El proxy devuelve 502 y el usuario escribe manual |
| **Red caída** | El fetch falla, se muestra error, el formulario sigue funcional |

**Principio**: El autocompletado es una **mejora progresiva**. Si falla, el usuario siempre puede escribir manualmente. Los campos nunca se bloquean.

---

## 8. Costes y optimización

### Precios (Google Maps Platform, feb 2026)
- **Autocomplete (New)**: ~$2.83 por 1000 sesiones
- **Place Details**: Incluido en la sesión si se usa Session Token
- **Address Validation**: ~$5 por 1000 validaciones

### Optimizaciones implementadas
1. **Session Tokens**: Agrupan autocomplete + details en una sola facturación
2. **Debounce 300ms**: Reduce llamadas en ~70% vs sin debounce
3. **Mínimo 3 chars**: Evita queries vacías/cortas sin resultados
4. **FieldMask mínimo**: Solo pedimos `addressComponents,formattedAddress,location`
5. **Sin Maps SDK**: No cargamos el script de 200KB+ del cliente

### Estimación mensual
| Tráfico | Autocomplete | Validation | Coste aprox |
|---------|-------------|------------|-------------|
| 100 checkouts/mes | ~100 sesiones | ~100 validaciones | ~$0.78 |
| 1,000 checkouts/mes | ~1,000 sesiones | ~1,000 validaciones | ~$7.83 |
| 10,000 checkouts/mes | ~10,000 sesiones | ~10,000 validaciones | ~$78.30 |

---

## Archivos modificados/creados

### Nuevos
- `src/pages/api/google/places-autocomplete.ts` — Proxy autocomplete
- `src/pages/api/google/place-details.ts` — Proxy detalles
- `src/pages/api/google/validate-address.ts` — Validación de dirección
- `src/components/AddressAutocomplete.tsx` — Componente React

### Modificados
- `src/pages/checkout.astro` — Integración del componente + campo Provincia
- `src/pages/api/profile.ts` — Acepta campo `state`
- `src/lib/stripe-customer.ts` — Sincroniza `state` con Stripe
- `src/types/index.ts` — Añadido `state` al tipo `User`
- `.env.example` — Documentada `GOOGLE_PLACES_API_KEY`
