# Ficha Tecnica - Benice Pet Shop

## Datos Generales

| Campo | Valor |
|-------|-------|
| **Nombre** | Benice Pet Shop |
| **Tipo** | E-commerce tienda de mascotas |
| **URL** | https://benicetiendanimal.victoriafp.online |
| **Framework** | Astro 5.x (SSR + Static hybrid) |
| **Lenguaje** | TypeScript (strict mode) |
| **Node.js** | >= 22.0.0 |
| **Despliegue** | Coolify (Docker / Traefik) |
| **Puerto** | 4321 |

---

## Stack Tecnologico

### Frontend
| Tecnologia | Version | Uso |
|------------|---------|-----|
| Astro | ^5.0.0 | Framework principal (SSR + prerender) |
| React | ^19.2.3 | Componentes interactivos (cart, modals, reviews) |
| Tailwind CSS | ^3.4.1 | Estilos utility-first |
| Nanostores | ^1.1.0 | Estado global del carrito |
| Chart.js | ^4.4.1 | Graficas en panel admin |

### Backend / Servicios
| Tecnologia | Version | Uso |
|------------|---------|-----|
| Supabase | ^2.39.3 | Auth (JWT), Base de datos (PostgreSQL), RLS |
| Stripe | ^20.2.0 | Pagos (Checkout Sessions, Webhooks) |
| Resend | ^6.9.2 | Emails transaccionales |
| Google Places API | - | Autocompletado de direcciones |

### Infraestructura
| Tecnologia | Uso |
|------------|-----|
| Docker | Contenedor multi-stage (node:22-alpine) |
| Coolify | Plataforma de despliegue |
| Traefik | Reverse proxy + SSL |
| Cloudinary | Almacenamiento de imagenes de productos |

---

## Arquitectura del Proyecto

```
src/
  components/     15 componentes (10 React + 3 Astro)
  layouts/         3 layouts (Layout, AdminLayout, BlogLayout)
  lib/             7 modulos (supabase, email, stripe, cart, etc.)
  pages/          43 paginas
    api/          24 endpoints REST
    admin/         8 paginas de administracion
    auth/          4 paginas de autenticacion
    cuenta/        4 paginas de cuenta de usuario
    animales/      5 paginas de categorias
    ...           paginas publicas (productos, ofertas, info, legal)
  stores/          2 stores (cart, favorites)
  middleware.ts    Seguridad centralizada
```

---

## Paginas Principales

### Publicas
| Ruta | Descripcion |
|------|-------------|
| `/` | Homepage con productos destacados |
| `/productos` | Catalogo completo con filtros |
| `/ofertas` | Productos en oferta / flash sales |
| `/animales/perros` | Productos para perros |
| `/animales/gatos` | Productos para gatos |
| `/animales/pajaros` | Productos para pajaros |
| `/animales/peces` | Productos para peces |
| `/animales/roedores` | Productos para roedores |
| `/recomendador` | Recomendador de productos interactivo |
| `/carrito` | Carrito de compra |
| `/checkout` | Proceso de pago |
| `/checkout/success` | Confirmacion de pedido exitoso |
| `/checkout/cancel` | Pago cancelado |
| `/info/contacto` | Formulario de contacto |
| `/info/envios` | Politica de envios |
| `/info/faq` | Preguntas frecuentes |
| `/info/sobre-nosotros` | Sobre nosotros |

### Autenticacion
| Ruta | Descripcion |
|------|-------------|
| `/auth/login` | Inicio de sesion |
| `/auth/registro` | Registro de nuevo usuario |
| `/auth/recuperar-contrasena` | Recuperar contrasena |
| `/auth/actualizar-contrasena` | Actualizar contrasena (via email) |

### Cuenta de Usuario
| Ruta | Descripcion |
|------|-------------|
| `/cuenta/perfil` | Datos personales + accesos rapidos |
| `/cuenta/mis-pedidos` | Historial de pedidos |
| `/cuenta/favoritos` | Lista de deseos |
| `/cuenta/devoluciones` | Solicitar devoluciones |

### Panel de Administracion
| Ruta | Descripcion |
|------|-------------|
| `/admin` | Dashboard (ventas, stats, graficas) |
| `/admin/pedidos` | Gestion de pedidos |
| `/admin/pedido/[id]` | Detalle de pedido |
| `/admin/productos` | Listado de productos |
| `/admin/productos/nuevo` | Crear producto |
| `/admin/productos/[id]` | Editar producto |
| `/admin/ofertas` | Gestion de ofertas flash |
| `/admin/ajustes` | Configuracion del sitio |
| `/admin/devoluciones` | Gestion de devoluciones |

---

## API Endpoints (24)

### Admin (`/api/admin/`)
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET/POST | `/api/admin/ofertas-toggle` | Activar/desactivar ofertas flash |
| GET | `/api/admin/analytics` | Estadisticas del dashboard |
| POST | `/api/admin/update-order-status` | Cambiar estado de pedido |
| POST | `/api/admin/approve-cancellation` | Aprobar/rechazar cancelacion |
| POST | `/api/admin/process-return` | Procesar devolucion |
| GET/POST/PUT/DELETE | `/api/admin/products` | CRUD de productos |
| POST/DELETE | `/api/admin/upload-image` | Subir/eliminar imagenes |

### Autenticacion (`/api/auth/`)
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST/DELETE | `/api/auth/session` | Crear/eliminar sesion (cookies HttpOnly) |
| POST | `/api/auth/ensure-profile` | Auto-crear perfil si no existe |

### Stripe (`/api/stripe/`)
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | `/api/stripe/create-checkout-session` | Crear sesion de pago |
| POST | `/api/stripe/webhook` | Recibir eventos de Stripe |
| GET | `/api/stripe/customer-data` | Datos del cliente Stripe |

### Google (`/api/google/`)
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/api/google/places-autocomplete` | Autocompletado de direcciones |
| GET | `/api/google/place-details` | Detalles de lugar |
| POST | `/api/google/validate-address` | Validar direccion |

### General
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | `/api/create-order` | Crear pedido (alternativo) |
| POST | `/api/cancel-order` | Solicitar cancelacion |
| POST | `/api/returns` | Solicitar devolucion |
| GET/POST | `/api/reviews` | Resenas de productos |
| GET | `/api/search` | Busqueda de productos |
| PUT | `/api/profile` | Actualizar perfil |
| POST | `/api/contact` | Formulario de contacto |
| POST | `/api/newsletter` | Suscripcion newsletter |
| GET | `/api/health` | Health check |

---

## Seguridad

### Cabeceras HTTP (middleware.ts)
| Cabecera | Valor |
|----------|-------|
| Strict-Transport-Security | max-age=63072000; includeSubDomains; preload |
| X-Content-Type-Options | nosniff |
| X-Frame-Options | SAMEORIGIN |
| Referrer-Policy | strict-origin-when-cross-origin |
| Permissions-Policy | camera=(), microphone=(), geolocation=(self), payment=(self) |
| Cross-Origin-Opener-Policy | same-origin-allow-popups |

### Protecciones Implementadas
| Proteccion | Descripcion |
|------------|-------------|
| **CSRF** | Validacion de Origin en POST/PUT/PATCH/DELETE |
| **Rate Limiting** | Limites por IP en endpoints de formulario y busqueda |
| **Body Size** | Maximo 10MB por request |
| **HSTS** | Forzar HTTPS con preload |
| **RLS** | Row Level Security en Supabase (todas las tablas) |
| **HttpOnly Cookies** | Tokens de sesion inaccesibles desde JS |
| **XSS Prevention** | escapeHtml() en todos los emails |
| **IP Anonymization** | GDPR: ultimo octeto eliminado en logs |
| **Bot Detection** | Excluye bots de tracking y rate limiting |

### Autenticacion
| Aspecto | Detalle |
|---------|---------|
| Provider | Supabase Auth (JWT) |
| Cookies | `sb-access-token` + `sb-refresh-token` (HttpOnly, SameSite=Lax) |
| Admin check | Doble verificacion: sesion + `role = 'admin'` en tabla users |
| Contrasena minima | 8 caracteres |

---

## Base de Datos (Supabase PostgreSQL)

### Tablas Principales
| Tabla | Descripcion |
|-------|-------------|
| `users` | Perfiles de usuario (auth + datos personales) |
| `products` | Catalogo de productos |
| `orders` | Pedidos |
| `order_items` | Items de cada pedido |
| `order_status_history` | Historial de cambios de estado |
| `invoices` | Facturas con numeracion secuencial |
| `returns` | Solicitudes de devolucion |
| `cancellation_requests` | Solicitudes de cancelacion |
| `product_reviews` | Resenas de productos |
| `review_helpful_votes` | Votos de utilidad en resenas |
| `promo_codes` | Codigos promocionales |
| `newsletters` | Suscriptores de newsletter |
| `contact_messages` | Mensajes de contacto |
| `site_settings` | Configuracion del sitio (clave-valor) |
| `visits` | Tracking anonimizado de visitas |

### RPCs (Funciones PostgreSQL)
| Funcion | Descripcion |
|---------|-------------|
| `create_order_and_reduce_stock` | Crea pedido + reduce stock atomicamente |
| `cancel_order_and_restore_stock` | Cancela pedido + restaura stock |
| `increment_promo_uses` | Incrementa usos de codigo promo |

---

## Flujo de Pedido

```
1. Usuario llena carrito (localStorage via nanostores)
2. Checkout: formulario de envio + validacion de direccion (Google Places)
3. Click "Pagar" -> POST /api/stripe/create-checkout-session
   - Recalcula precios desde DB (no confia en cliente)
   - Valida stock disponible
   - Aplica codigos promo
   - Crea Stripe Checkout Session
4. Redireccion a Stripe Checkout (pago seguro)
5. DUAL GUARANTEE de creacion de pedido:
   a. Webhook: POST /api/stripe/webhook (checkout.session.completed)
   b. Fallback: /checkout/success (server-side, idempotente)
6. ensureOrderFromStripeSession():
   - Idempotencia via stripe_session_id
   - Crea pedido + reduce stock (RPC atomico)
   - Genera factura con numeracion secuencial
   - Incrementa usos de promo code
   - Envia email de confirmacion
   - Sincroniza datos de Stripe Customer
   - Auto-refund si falla creacion del pedido
```

---

## Emails Transaccionales (Resend)
| Email | Trigger |
|-------|---------|
| Confirmacion de pedido | Pago completado |
| Bienvenida | Registro de usuario |
| Pedido enviado | Admin cambia estado a "enviado" |
| Pedido entregado | Admin cambia estado a "entregado" |
| Cancelacion confirmada | Admin aprueba cancelacion |
| Cancelacion rechazada | Admin rechaza cancelacion |
| Newsletter + codigo promo | Suscripcion a newsletter |
| Mensaje de contacto | Formulario de contacto (al admin) |

---

## Variables de Entorno

### Requeridas
| Variable | Descripcion |
|----------|-------------|
| `PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `PUBLIC_SUPABASE_ANON_KEY` | Clave publica Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave admin Supabase (server-only) |
| `STRIPE_SECRET_KEY` | Clave secreta de Stripe |
| `STRIPE_WEBHOOK_SECRET` | Secreto del webhook de Stripe |
| `RESEND_API_KEY` | API key de Resend |
| `FROM_EMAIL` | Email remitente (verificado en Resend) |
| `PUBLIC_SITE_URL` | URL publica del sitio |
| `GOOGLE_PLACES_API_KEY` | API key de Google Places |

### Opcionales
| Variable | Descripcion |
|----------|-------------|
| `PUBLIC_GOOGLE_SITE_VERIFICATION` | Verificacion Google Search Console |
| `HOST` | Host del servidor (default: 0.0.0.0) |
| `PORT` | Puerto del servidor (default: 4321) |
| `APP_VERSION` | Version para /api/health |

---

## Docker

```dockerfile
# Multi-stage build
FROM node:22-alpine AS build    # Compilacion
FROM node:22-alpine AS runtime  # Produccion (solo dist + deps prod)

# Usuario sin privilegios: astro (uid 1001)
# Healthcheck: cada 30s a http://localhost:4321/
# Puerto expuesto: 4321
```

---

## Testing

| Herramienta | Configuracion |
|-------------|---------------|
| Vitest | ^4.0.18 |
| Coverage | @vitest/coverage-v8 |
| Scope | src/lib/**, src/pages/api/** |
| Entorno | Node |

---

## Rendimiento

| Metrica | Valor |
|---------|-------|
| Build time | ~6-8 segundos |
| Paginas pre-renderizadas | 24 (estaticas) |
| Paginas SSR | 19 (dinamicas) |
| Bundle JS mas grande | 211 KB (pagina principal) |
| Supabase SDK | 171 KB |
| Envio gratis | Pedidos >= 49 EUR |
| Coste envio | 4.99 EUR |

---

## Paleta de Colores

| Color | Hex | Uso |
|-------|-----|-----|
| Primary (Purple) | #7e22ce | Botones, enlaces, marca |
| Secondary (Orange) | #f97316 | Acentos, ofertas |
| Success (Green) | #10b981 | Confirmaciones |
| Error (Red) | #ef4444 | Errores, eliminar |
| Warning (Yellow) | #f59e0b | Avisos |

---

*Generado el 22/02/2026 - Benice Pet Shop v1.0.0*
