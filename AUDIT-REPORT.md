# AUDITORÍA COMPLETA — BeniceAstro

**Fecha:** Junio 2025  
**Alcance:** Todo el código fuente en `src/`, archivos SQL, y configuración  
**Stack:** Astro 5.0 + React 19 + Supabase + Stripe + Resend + Tailwind CSS

---

## 🔴 ERRORES (Críticos — causan fallos en tiempo de ejecución)

### E1. Tabla `cancellation_requests` no existe en ningún archivo SQL

| Archivo | Líneas |
|---------|--------|
| `src/pages/api/cancel-order.ts` | L52-56, L67-73 |
| `src/pages/api/admin/approve-cancellation.ts` | L57-62 |
| `src/pages/cuenta/mis-pedidos.astro` | L28-33 |

La tabla `cancellation_requests` se usa para crear, consultar y aprobar solicitudes de cancelación, pero **no está definida en ninguno de los 4 archivos SQL** (`supabase.sql`, `supabase-reviews.sql`, `supabase-visitas.sql`, `supabase-update-security.sql`). Toda la funcionalidad de cancelación de pedidos falla.

---

### E2. Tabla `orders` faltan columnas críticas

**Esquema actual** (`supabase.sql` L46-54): solo define `id`, `user_id`, `status`, `total`, `created_at`, `updated_at`.

**Columnas usadas en el código pero NO en el esquema:**

| Columna | Archivos que la usan |
|---------|---------------------|
| `promo_code` | `src/pages/api/stripe/webhook.ts` L91, `src/pages/cuenta/mis-pedidos.astro` L125, función SQL `create_order_and_reduce_stock` |
| `discount_amount` | `src/pages/api/stripe/webhook.ts` L92, `src/pages/cuenta/mis-pedidos.astro` L126, función SQL `create_order_and_reduce_stock` |
| `stripe_session_id` | `src/pages/api/stripe/webhook.ts` L93, `src/pages/api/admin/update-order-status.ts` L99 |
| `payment_intent_id` | `src/pages/api/stripe/webhook.ts` L94, `src/pages/api/admin/approve-cancellation.ts` L98 |
| `shipping_address` | `src/pages/api/stripe/webhook.ts` L95 |
| `tracking_number` | `src/pages/api/admin/update-order-status.ts` L86-87, `src/pages/cuenta/mis-pedidos.astro` L134 |

Los INSERTs a estas columnas inexistentes serán ignorados o causarán error dependiendo de la configuración de PostgreSQL.

---

### E3. Tabla `invoices` faltan columnas

**Esquema actual** (`supabase.sql` L78-85): solo define `id`, `order_id`, `user_id`, `invoice_number`, `total`, `created_at`.

**Columnas usadas pero no definidas:**

| Columna | Archivo |
|---------|---------|
| `invoice_type` | `src/pages/api/stripe/webhook.ts` L151 |
| `subtotal` | `src/pages/api/stripe/webhook.ts` L152 |
| `tax_amount` | `src/pages/api/stripe/webhook.ts` L153 |

---

### E4. Restricción `NOT NULL` en `user_id` viola para usuarios invitados

- `src/pages/api/stripe/webhook.ts` L87: `user_id: userId || null` — la tabla `orders` tiene `user_id UUID NOT NULL` (`supabase.sql` L48). Para compras de invitados sin cuenta, `userId` es `null` y el INSERT **falla**.
- `src/pages/api/stripe/webhook.ts` L150: mismo problema en `invoices` (`user_id UUID NOT NULL`, `supabase.sql` L81).
- **Impacto:** Los pagos procesados por Stripe para usuarios no registrados **no generan pedido ni factura**, pero el dinero sí se cobra.

---

### E5. Firma incompatible de `sendOrderConfirmation` en `create-order.ts`

- `src/pages/api/create-order.ts` L48-63: llama a `sendOrderConfirmation` con propiedades que **no existen** en la interfaz `OrderEmailData`:
  ```
  Enviado:     orderNumber, customerEmail, shipping, estimatedDelivery, items.imageUrl, shippingAddress (Object)
  Esperado:    to, orderId, subtotal, discount, total, shippingAddress (string)
  ```
- `src/lib/email.ts` L10-22: La interfaz `OrderEmailData` requiere `to` (string) y `orderId` (string), pero `create-order.ts` envía `customerEmail` y `orderNumber`.
- **Resultado:** Error de TypeScript en compilación; en ejecución el email se envía sin destinatario ni datos correctos.

> Nota: `src/pages/api/stripe/webhook.ts` L167-176 sí llama a `sendOrderConfirmation` con la firma correcta.

---

### E6. Columna `active` no existe en la tabla `products`

La tabla `products` (`supabase.sql` L56-73) **no tiene columna `active`**. Sin embargo, se consulta `.eq('active', true)` en **4 archivos**:

| Archivo | Línea |
|---------|-------|
| `src/pages/sitemap.xml.ts` | L36 |
| `src/pages/api/stripe/create-checkout-session.ts` | L36 |
| `src/pages/checkout.astro` | L421 |
| `src/pages/carrito.astro` | L187 |

Supabase rechazará estas queries con error `column products.active does not exist`, rompiendo el sitemap, la validación del checkout, y la vista del carrito.

---

### E7. `RelatedProducts.tsx` llama a parámetros API inexistentes

- `src/components/RelatedProducts.tsx` L34: `fetch(\`/api/search?animal=${animalType}&category=${category}&limit=4\`)`
- `src/pages/api/search.ts` solo soporta el parámetro `?q=` (L8: `url.searchParams.get('q')`); ignora `animal`, `category` y `limit`.
- **Resultado:** El componente de productos relacionados siempre muestra `"No se encontraron productos relacionados"`.

---

### E8. Valor de filtro `"otro"` no coincide con el esquema `"otros"`

- `src/pages/index.astro` L108: `data-value="otro"` (singular)
- `supabase.sql` L63: `animal_type IN ('perro', 'gato', 'otros')` (plural)
- El filtro "Otros animales" en la página principal **nunca muestra resultados**.

---

### E9. Dashboard admin no envía token de autenticación

- `src/pages/admin/index.astro` L162: `fetch('/api/admin/analytics')` — sin header `Authorization`
- `src/pages/admin/dashboard.astro` L232: mismo problema
- `src/pages/api/admin/analytics.ts` L7-8: Devuelve 401 si no hay `Authorization` header.
- **Resultado:** Los KPIs, gráficos y datos del dashboard nunca se cargan.

---

### E10. Dashboard duplicado

- `src/pages/admin/index.astro` (usa `AdminLayout`) y `src/pages/admin/dashboard.astro` (usa `Layout` genérico) contienen código casi idéntico.
- `dashboard.astro` implementa su propia verificación de admin (L6-20), mientras `index.astro` depende de `AdminLayout`.
- Genera confusión sobre cuál es la página real del dashboard; ambas fallan por E9.

---

## 🟠 SEGURIDAD (Vulnerabilidades)

### S1. `create-order.ts` — Sin verificación de autenticación

- `src/pages/api/create-order.ts` L5-18: Acepta `user_id` del body del request sin ninguna verificación de identidad.
- **Cualquier persona** puede crear pedidos para cualquier `user_id` arbitrario.
- No hay header Authorization ni verificación de sesión.

---

### S2. Patrón de RLS bypass generalizado (cliente anon + getUser)

Múltiples endpoints verifican al usuario con `supabase.auth.getUser(token)` pero después usan el **cliente anónimo** (`supabase`) para operaciones de base de datos. Como `auth.uid()` es `null` con el cliente anon, las políticas RLS **no protegen nada**.

| Archivo | Operaciones afectadas |
|---------|----------------------|
| `src/pages/api/returns.ts` | SELECT, INSERT en `orders` y `returns` (L37-85) |
| `src/pages/api/cancel-order.ts` | SELECT en `orders`, INSERT en `cancellation_requests` (L37-73) |
| `src/pages/api/admin/analytics.ts` | SELECT en `orders`, `users`, `order_items` (L48-100) |
| `src/pages/api/admin/ofertas-toggle.ts` | UPSERT en `site_settings` (L71-79) |
| `src/pages/api/create-order.ts` | RPC `create_order_and_reduce_stock` (L19-25) |

**En el caso de `analytics.ts:`** el admin se verifica correctamente, pero las queries posteriores usan el cliente anon. Los SELECT sobre `orders` solo devolverán datos donde `auth.uid() = user_id` (que es null), resultando en **datos vacíos** para el admin.

---

### S3. `upload-image.ts` — Autenticación incompleta y sin verificación admin

- `src/pages/api/admin/upload-image.ts` L10-14: El fallback de cookies está **vacío** (comentario sin código):
  ```typescript
  if (!token) {
    const cookies = request.headers.get('cookie');
    // Buscar token en cookies de Supabase
  }
  ```
- L4-81: Nunca verifica que el usuario sea administrador.
- **Cualquier usuario autenticado puede subir archivos** al bucket de Storage.

---

### S4. `upload-image.ts` DELETE — Sin autenticación

- `src/pages/api/admin/upload-image.ts` L95-123: El handler DELETE no verifica ni token ni rol.
- **Cualquier persona puede eliminar cualquier imagen** del bucket de Supabase Storage.

---

### S5. Newsletter genera códigos promocionales que nunca se crean

- `src/pages/api/newsletter.ts`: Usa el cliente anon para insertar en `promo_codes`.
- La tabla `promo_codes` solo tiene policy `FOR ALL` para admins y `FOR SELECT` para público (`supabase.sql`).
- El INSERT falla silenciosamente → el usuario recibe un código promocional por email **que no existe en la base de datos**.

---

### S6. Tokens de sesión en cookies sin flags de seguridad

- `src/pages/auth/login.astro` L77-78:
  ```javascript
  document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=${maxAge}; SameSite=Lax`;
  ```
- Falta `Secure` (transmisión solo por HTTPS) y `HttpOnly` (inaccesible desde JavaScript).
- Los tokens son vulnerables a XSS (robo via `document.cookie`) y MITM en HTTP.

---

### S7. XSS en emails de contacto

- `src/lib/email.ts` L455-486 (`sendContactEmail`): Inyecta `data.name`, `data.email`, `data.subject` y `data.message` directamente en HTML sin escapar.
- Un atacante puede inyectar HTML/JS malicioso vía el formulario de contacto, que se renderizará en el email del administrador.

---

### S8. Sin protección CSRF en endpoints de estado

- Ningún endpoint POST/PUT/DELETE implementa tokens CSRF.
- Los endpoints de admin (`update-order-status`, `approve-cancellation`, `ofertas-toggle`, `products`) son vulnerables a CSRF.

---

### S9. Email FROM usa dominio de test

- `src/lib/email.ts` L7: `FROM_EMAIL = 'onboarding@resend.dev'`
- Este es el dominio de prueba de Resend, no un dominio propio.
- Los emails serán **bloqueados por filtros de spam** en producción. Confirmaciones de pedido, newsletters y notificaciones nunca llegarán de forma fiable.

---

### S10. GDPR: Consentimiento de cookies en localStorage

- `src/components/CookieBanner.tsx`: Almacena el consentimiento GDPR en `localStorage`, no en una cookie.
- El servidor no puede verificar el consentimiento antes de establecer cookies de seguimiento.
- Incumple los requisitos de la normativa RGPD/ePrivacy.

---

## 🟡 ADVERTENCIAS (Problemas funcionales no críticos)

### W1. Middleware bloquea la respuesta para tracking

- `src/middleware.ts` L47-54: `await supabase.from('visits').insert({...})` se ejecuta con `await` antes de `return next()`.
- Cada carga de página espera a que se complete el INSERT en Supabase antes de servir la respuesta.
- **Impacto:** Latencia adicional de 50-200ms por cada request de página.

---

### W2. Middleware usa cliente anon para visits

- `src/middleware.ts` L2: Importa `supabase` (anon client), pero la tabla `visits` tiene política RLS `FOR INSERT` con `WITH CHECK (true)`, lo cual permite inserts anónimos.
- Funciona, pero depende de que la política RLS se mantenga exactamente así.

---

### W3. Tipos TypeScript desincronizados con el esquema SQL

- `src/types/index.ts`:

| Tipo | Campos que faltan (usados en el código) |
|------|----------------------------------------|
| `Product` | `brand`, `slug`, `images`, `age_range`, `on_sale`, `sale_price`, `updated_at` |
| `User` | `phone`, `address`, `updated_at` |
| `Order` | `promo_code`, `discount_amount`, `tracking_number`, `stripe_session_id`, `payment_intent_id`, `shipping_address`, `updated_at` |

Esto causa que `any` se use frecuentemente en vez de tipos estrictos, anulando los beneficios de TypeScript.

---

### W4. `RichTextEditor.tsx` usa API deprecada

- `src/components/RichTextEditor.tsx`: Usa `document.execCommand()` que está deprecado en todos los navegadores.
- Podría dejar de funcionar en futuras versiones de Chrome/Firefox.

---

### W5. Dos rutas de creación de pedidos

- **Ruta A:** `src/pages/api/stripe/webhook.ts` → crea pedido al recibir webhook de Stripe
- **Ruta B:** `src/pages/api/create-order.ts` → crea pedido directamente vía API
- Riesgo de pedidos duplicados si ambas rutas se activan para el mismo checkout.
- `webhook.ts` crea el pedido correctamente; `create-order.ts` tiene la firma de email incorrecta (E5).

---

### W6. Chart.js cargado desde CDN externo

- `src/pages/admin/index.astro` L181: `<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>`
- `chart.js` ya está en `package.json` como dependencia. Se debería importar localmente.
- Sin Subresource Integrity (SRI) hash, vulnerable a compromiso del CDN.
- No funciona offline.

---

### W7. Search sin paginación ni límite

- `src/pages/api/search.ts`: Devuelve **todos** los resultados que coincidan sin `.limit()` ni paginación.
- Con muchos productos, las respuestas serán pesadas e ineficientes.

---

### W8. Race condition en registro

- `src/pages/auth/registro.astro` L116-130: Tras `signUp`, inserta inmediatamente en la tabla `users`.
- Si la confirmación por email está activada, `auth.uid()` puede no estar establecido aún, y el INSERT fallará por la política RLS `auth.uid() = id`.
- El usuario quedaría con cuenta de auth pero **sin fila en `users`**, causando errores en perfil y pedidos.

---

### W9. Función SQL `create_order_and_reduce_stock` inserta columnas inexistentes

- `supabase.sql` L127-133: La función inserta `promo_code` y `discount_amount` en la tabla `orders`, pero estas columnas no existen en la definición `CREATE TABLE orders` (L46-54).
- La función SQL **no se puede crear** correctamente.

---

### W10. Blog sin contenido dinámico

- `src/pages/blog/[slug].astro`: Las páginas de blog existen pero no hay tabla de blog en el esquema SQL.
- El blog probablemente use contenido estático o esté inacabado.

---

## 🔵 MEJORAS (Recomendaciones)

### Rendimiento

| ID | Mejora | Archivo(s) |
|----|--------|------------|
| I1 | Usar `fire-and-forget` para tracking de visitas (no await) | `src/middleware.ts` L47 |
| I2 | Añadir `.limit()` al endpoint de búsqueda | `src/pages/api/search.ts` |
| I3 | Importar Chart.js desde `node_modules` en vez de CDN | `src/pages/admin/index.astro` L181 |
| I4 | Usar `Astro.Image` para optimización automática de imágenes | Todos los componentes con `<img>` |
| I5 | Añadir cache headers para productos (SSR) | `src/pages/productos.astro`, `src/pages/producto/[slug].astro` |

### Seguridad

| ID | Mejora | Descripción |
|----|--------|-------------|
| I6 | Añadir Content Security Policy (CSP) headers | Prevenir XSS e inyección de scripts |
| I7 | Implementar CSRF tokens | Para todos los endpoints POST/PUT/DELETE |
| I8 | Usar `supabaseAdmin` o crear cliente autenticado en API routes | Resolver el patrón de bypass RLS (S2) |
| I9 | Sanitizar inputs HTML en emails | Escapar `<`, `>`, `&`, `"` antes de inyectar en templates |
| I10 | Añadir rate limiting | Especialmente en auth, search, y contact |
| I11 | Migrar cookies de auth a `HttpOnly; Secure; SameSite=Strict` | `src/pages/auth/login.astro` |

### Accesibilidad

| ID | Mejora | Archivo(s) |
|----|--------|------------|
| I12 | Añadir `aria-label` a botones de icono | `CartButton.tsx`, `AddToCartButton.tsx`, `src/pages/producto/[slug].astro` (botones ±) |
| I13 | Añadir link "Saltar al contenido" | `src/layouts/Layout.astro` |
| I14 | Usar `role="alert"` y `aria-live="polite"` en Toast | `src/components/Toast.tsx` |
| I15 | Asegurar focus trap en modales | `QuickViewModal.tsx`, `CartSlideOver.tsx`, `mis-pedidos.astro` modal |
| I16 | Mejorar contraste de color en textos grises (`text-gray-400`) | Múltiples archivos |

### SEO

| ID | Mejora | Archivo(s) |
|----|--------|------------|
| I17 | Añadir JSON-LD (Product schema) en páginas de producto | `src/pages/producto/[slug].astro` |
| I18 | Añadir OpenGraph y Twitter Card meta tags | `src/layouts/Layout.astro` |
| I19 | Añadir URLs canónicas | `src/layouts/Layout.astro` |
| I20 | Corregir sitemap (E6) y añadir páginas estáticas | `src/pages/sitemap.xml.ts` |
| I21 | Añadir `meta description` únicas por página | Páginas de producto, categoría, y blog |

### Código

| ID | Mejora | Descripción |
|----|--------|-------------|
| I22 | Sincronizar `src/types/index.ts` con esquema SQL real | Añadir todos los campos faltantes (W3) |
| I23 | Eliminar `dashboard.astro` duplicado | Mantener solo `admin/index.astro` |
| I24 | Sustituir `document.execCommand` por librería moderna (Tiptap, Lexical) | `src/components/RichTextEditor.tsx` |
| I25 | Crear SQL migration para tabla `cancellation_requests` | Incluir columnas: `id`, `order_id`, `user_id`, `reason`, `status`, `admin_notes`, `created_at` |
| I26 | Añadir columna `active` a products o eliminar las queries que la usan | 4 archivos afectados |
| I27 | Añadir error boundaries React | Envolver componentes interactivos |

---

## 📊 REFERENCIAS CRUZADAS

### Tablas Supabase: esperadas vs. definidas

| Tabla | Definida en SQL | Usada en código | Estado |
|-------|:-:|:-:|--------|
| `users` | ✅ | ✅ | OK (faltan columnas en types) |
| `products` | ✅ | ✅ | OK (falta columna `active`) |
| `orders` | ✅ | ✅ | ⚠️ Faltan 6+ columnas |
| `order_items` | ✅ | ✅ | OK |
| `invoices` | ✅ | ✅ | ⚠️ Faltan 3 columnas |
| `returns` | ✅ | ✅ | OK |
| `newsletters` | ✅ | ✅ | OK |
| `promo_codes` | ✅ | ✅ | ⚠️ RLS bloquea INSERT público |
| `site_settings` | ✅ | ✅ | OK |
| `visits` | ✅ | ✅ | OK |
| `product_reviews` | ✅ | ✅ | OK |
| `review_helpful_votes` | ✅ | ✅ | OK |
| **`cancellation_requests`** | ❌ | ✅ | 🔴 **NO EXISTE** |

### Endpoints API: referenciados vs. existentes

| Endpoint | Existe | Referenciado desde |
|----------|:-:|-------------------|
| `GET /api/search?q=` | ✅ | `RelatedProducts.tsx` (con params incorrectos) |
| `POST /api/create-order` | ✅ | `checkout.astro` |
| `POST /api/cancel-order` | ✅ | `mis-pedidos.astro` |
| `POST /api/returns` | ✅ | `mis-pedidos.astro` |
| `POST /api/reviews` | ✅ | `ProductReviews.tsx` |
| `POST /api/newsletter` | ✅ | `NewsletterPopup.astro` |
| `POST /api/contact` | ✅ | `info/contacto.astro` |
| `POST /api/stripe/create-checkout-session` | ✅ | `checkout.astro` |
| `POST /api/stripe/webhook` | ✅ | Stripe (externo) |
| `GET /api/admin/analytics` | ✅ | `admin/index.astro`, `admin/dashboard.astro` (sin auth header) |
| `POST /api/admin/update-order-status` | ✅ | `admin/pedido/[id].astro` |
| `POST /api/admin/approve-cancellation` | ✅ | `admin/devoluciones.astro` |
| `POST /api/admin/products` | ✅ | `admin/productos/nuevo.astro` |
| `POST /api/admin/upload-image` | ✅ | `ImageUploader.tsx` |
| `POST /api/admin/ofertas-toggle` | ✅ | `OfertasToggle.astro` |

### Rutas de navegación: enlaces vs. páginas existentes

| Ruta | Existe | Enlazada desde |
|------|:-:|---------------|
| `/productos` | ✅ | Layout nav |
| `/animales/perros` | ✅ | Layout nav |
| `/animales/gatos` | ✅ | Layout nav |
| `/animales/pajaros` | ✅ | Layout nav (móvil) |
| `/animales/peces` | ✅ | Layout nav (móvil) |
| `/animales/roedores` | ✅ | Layout nav (móvil) |
| `/ofertas` | ✅ | Layout nav |
| `/cuenta/favoritos` | ✅ | Layout nav |
| `/cuenta/perfil` | ✅ | Layout nav |
| `/cuenta/mis-pedidos` | ✅ | Layout nav |
| `/admin` | ✅ | Layout nav |
| `/admin/pedidos` | ✅ | AdminLayout nav |
| `/admin/facturas` | ✅ | AdminLayout nav |
| `/admin/devoluciones` | ✅ | AdminLayout nav |
| `/admin/productos` | ✅ | AdminLayout nav |
| `/admin/productos/nuevo` | ✅ | AdminLayout nav |
| `/admin/ofertas` | ✅ | AdminLayout nav |
| `/admin/newsletter` | ✅ | AdminLayout nav |
| `/admin/visitas` | ✅ | AdminLayout nav |
| `/admin/ajustes` | ✅ | AdminLayout nav |
| `/info/contacto` | ✅ | Layout footer |
| `/auth/login` | ✅ | Layout nav |
| `/auth/registro` | ✅ | login.astro |
| `/checkout/success` | ✅ | Stripe redirect |
| `/checkout/cancel` | ✅ | Stripe redirect |
| `/blog` | ✅ | Layout footer |

**Todas las rutas enlazadas tienen página correspondiente.**

---

## 📋 RESUMEN POR PRIORIDAD

| Prioridad | Categoría | Cantidad | IDs |
|-----------|----------|:--------:|-----|
| 🔴 Crítica | Errores | 10 | E1–E10 |
| 🟠 Alta | Seguridad | 10 | S1–S10 |
| 🟡 Media | Advertencias | 10 | W1–W10 |
| 🔵 Baja | Mejoras | 27 | I1–I27 |

### Top 5 acciones inmediatas:

1. **Crear tabla `cancellation_requests`** con columnas y políticas RLS (E1)
2. **Añadir columnas faltantes** a `orders` e `invoices` en SQL, o sincronizar el código (E2, E3)
3. **Permitir `user_id NULL`** en `orders` e `invoices` para compras de invitados, o requerir registro (E4)
4. **Corregir la firma de `sendOrderConfirmation`** en `create-order.ts` (E5)
5. **Añadir autenticación** a `create-order.ts` y `upload-image.ts DELETE` (S1, S3, S4)
