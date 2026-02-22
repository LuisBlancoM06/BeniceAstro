# 🔒 Informe de Hardening de Seguridad — Benice Tienda Animal

**Fecha:** Junio 2025  
**Dominio:** `benicetiendanimal.victoriafp.online`  
**Stack:** Astro 5.17 + React 19 + Node 22 + Supabase + Stripe  
**Deploy:** Coolify (Docker) + Traefik reverse proxy  

---

## 1. Resumen de cambios realizados

### 1.1 Headers de seguridad (middleware.ts)

| Header | Valor | Explicación |
|--------|-------|-------------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Fuerza HTTPS durante 2 años. `includeSubDomains` protege todos los subdominios. `preload` permite inscripción en la lista HSTS de navegadores. |
| `X-Content-Type-Options` | `nosniff` | Evita que el navegador adivine el MIME type, previniendo ataques de MIME confusion. |
| `X-Frame-Options` | `SAMEORIGIN` | Protege contra clickjacking: solo tu propio dominio puede embeber la página en iframes. |
| `X-XSS-Protection` | **(eliminado)** | Obsoleto. El filtro XSS de IE podía ser explotado como side-channel leak. Los navegadores modernos lo ignoran; CSP es el reemplazo correcto. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Envía referer completo al mismo dominio; solo el origen a dominios externos (sin path ni query). |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(self), payment=(self)` | Deshabilita cámara/micrófono. Permite geolocalización y pagos solo desde el propio dominio. |
| `X-DNS-Prefetch-Control` | `on` | Habilita DNS prefetch para mejorar rendimiento de carga. |
| `Cross-Origin-Opener-Policy` | `same-origin-allow-popups` | Protege contra ataques Spectre cross-origin pero permite popups (necesarios para pagos Stripe). |
| `Cross-Origin-Resource-Policy` | `cross-origin` | Permite que CDN externos (Cloudinary) sirvan recursos al sitio. |
| `Cross-Origin-Embedder-Policy` | `unsafe-none` | Relajado porque usamos imágenes de CDNs que no envían `CORP: cross-origin`. |
| `Content-Security-Policy` | Ver detalle abajo | Política de seguridad de contenido granular. |
| `Server` | `Benice` | Oculta la tecnología real del servidor (no expone `Node.js` ni versión). |

### 1.2 Content Security Policy (CSP) — Detalle

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
img-src 'self' data: blob: https: http:;
font-src 'self' https://fonts.gstatic.com data:;
connect-src 'self' https://*.supabase.co https://api.stripe.com https://res.cloudinary.com https://fonts.googleapis.com https://fonts.gstatic.com;
frame-src 'self' https://js.stripe.com;
frame-ancestors 'self';
object-src 'none';
base-uri 'self';
form-action 'self';
upgrade-insecure-requests
```

**Decisiones:**
- `unsafe-inline` / `unsafe-eval` en `script-src`: necesarios para Astro islands, React hydration y Stripe.js. Alternativa futura: nonces CSP (requiere middleware más complejo).
- `img-src https: http:`: necesario porque los productos usan imágenes de Cloudinary y los usuarios pueden enlazar imágenes externas.
- `frame-src https://js.stripe.com`: Stripe Checkout usa iframes para el formulario de pago seguro.
- `upgrade-insecure-requests`: migra automáticamente peticiones HTTP → HTTPS.

### 1.3 Eliminación de Chart.js CDN (supply-chain fix)

- **Antes:** `<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>` en admin/index.astro y admin/dashboard.astro
- **Después:** `import Chart from 'chart.js/auto'` (bundled desde node_modules)
- **Por qué:** Un CDN externo puede ser comprometido (supply-chain attack). Al hacer bundle local, la integridad del código se garantiza en build time.

### 1.4 Dockerfile hardening

```dockerfile
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 astro && \
    chown -R astro:nodejs /app
USER astro
```

- **Antes:** El contenedor corría como `root`.
- **Después:** Corre como usuario `astro` (UID 1001) sin privilegios.
- **Por qué:** Si un atacante explota una vulnerabilidad de RCE, tendrá permisos mínimos dentro del contenedor.

### 1.5 Redirect 301 con headers de seguridad

- **Antes:** La redirección de trailing slash (`/productos/` → `/productos`) devolvía respuesta SIN headers de seguridad.
- **Después:** Todas las redirecciones 301 pasan por `addSecurityHeaders()`.
- **Por qué:** Herramientas de auditoría como SecurityHeaders.com y web-check pueden evaluar cualquier respuesta, no solo las 200.

---

## 2. Protecciones existentes (ya implementadas)

| Protección | Ubicación | Descripción |
|-----------|-----------|-------------|
| Rate limiting | `middleware.ts` + `rate-limiter.ts` | Limita peticiones por IP: API (60/min), auth (5/min), formularios (3/min), webhooks (100/min), búsqueda (30/min) |
| CSRF protection | `middleware.ts` | Verifica `Origin` header en POST/PUT/PATCH/DELETE. Exento: Stripe webhooks |
| Body size limit | `middleware.ts` | Rechaza payloads >10MB con HTTP 413 |
| IP anonymization | `middleware.ts` | Anonimiza IPs (último octeto IPv4, últimos 80 bits IPv6) antes de almacenar — RGPD |
| Bot detection | `middleware.ts` | Excluye bots conocidos del tracking de visitas |
| Supabase RLS | `supabase.sql` | Row Level Security en todas las tablas |
| Auth con Supabase | Supabase Auth | JWT, refresh tokens, signup/signin seguro |
| Stripe webhooks | `api/stripe/webhook.ts` | Verificación de firma HMAC con `stripe.webhooks.constructEvent()` |
| Multi-stage Docker | `Dockerfile` | Build stage separado; solo se copian artifacts y deps de producción |
| Non-root container | `Dockerfile` | USER astro (no root) |
| Healthcheck | `Dockerfile` | `wget -qO- http://localhost:4321/ || exit 1` cada 30s |
| `X-Powered-By` eliminado | `middleware.ts` | No expone tecnología del servidor |

---

## 3. Guía: DNS, DNSSEC y HTTPS/TLS

### 3.1 Verificar HTTPS y HSTS

Tu HSTS header ya está configurado con `max-age=63072000; includeSubDomains; preload`.

**Pasos para activar HSTS Preload:**

1. Verificar que HTTPS funciona correctamente en `https://benicetiendanimal.victoriafp.online`
2. Verificar que HTTP redirige a HTTPS (lo hace Traefik/Coolify automáticamente)
3. Ir a https://hstspreload.org
4. Introducir el dominio y enviar para inclusión en la lista preload
5. **Nota:** El dominio `victoriafp.online` necesita tener HSTS en el apex (raíz) también si usas `includeSubDomains`

### 3.2 Configurar DNSSEC

DNSSEC se configura a nivel de registrador DNS, no en el código de la app. 

**Pasos:**

1. **En el panel del registrador** (donde compraste `victoriafp.online`):
   - Buscar la opción "DNSSEC" o "DNS Security"
   - Activar DNSSEC — el registrador generará un registro DS (Delegation Signer)
   - El registrador subirá el registro DS a la zona del TLD `.online`

2. **Si usas Cloudflare como DNS:**
   - Dashboard → DNS → Settings → Enable DNSSEC
   - Cloudflare te dará un registro DS que debes copiar al registrador

3. **Verificar activación:**
   - https://dnsviz.net → introduce `benicetiendanimal.victoriafp.online`
   - https://dnssec-analyzer.verisignlabs.com

### 3.3 Configuración TLS en Coolify (Traefik)

Coolify normalmente gestiona Let's Encrypt automáticamente. Verifica:

1. **En panel de Coolify → tu servicio → Settings:**
   - HTTPS debe estar habilitado
   - Let's Encrypt como proveedor de certificados
   - "Force HTTPS" activado

2. **Verificar TLS moderno:**
   - https://www.ssllabs.com/ssltest/ → analizar tu dominio
   - Objetivo: calificación A o A+ 
   - TLS 1.2 y 1.3 habilitados; TLS 1.0/1.1 deshabilitados

3. **Si necesitas forzar TLS 1.2+ manualmente** (labels de Traefik en docker-compose o Coolify):
   ```yaml
   labels:
     - "traefik.http.routers.benice.tls.options=modern@file"
   ```
   Y en la config de Traefik:
   ```toml
   [tls.options]
     [tls.options.modern]
       minVersion = "VersionTLS12"
       cipherSuites = [
         "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384",
         "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256",
         "TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384",
         "TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256",
       ]
   ```

### 3.4 HTTP → HTTPS redirect

Traefik/Coolify debería forzar esto automáticamente. Verificar:

```bash
curl -I http://benicetiendanimal.victoriafp.online
# Debe devolver 301/302 con Location: https://...
```

Si no redirige, en Coolify → Settings → habilitar "Force HTTPS" o añadir label Traefik:
```yaml
labels:
  - "traefik.http.middlewares.redirect-https.redirectscheme.scheme=https"
  - "traefik.http.middlewares.redirect-https.redirectscheme.permanent=true"
```

---

## 4. Mejoras futuras recomendadas (no críticas)

| Prioridad | Mejora | Detalle |
|-----------|--------|---------|
| Media | CSP con nonces | Reemplazar `unsafe-inline` por nonces dinámicos. Requiere generar un nonce por request y pasarlo a todos los `<script>` y `<style>`. |
| Media | Subresource Integrity (SRI) | Añadir `integrity` a scripts/styles externos si se reintroducen CDNs. |
| Baja | `report-uri` o `report-to` en CSP | Recibir reportes de violaciones CSP para detectar ataques o errores de configuración. |
| Baja | Dependabot / Renovate | Automatizar actualizaciones de dependencias para parches de seguridad. |
| Baja | WAF (Web Application Firewall) | Cloudflare WAF o similar delante de Traefik. |

---

## 5. Checklist final de seguridad ✅

### Headers y CSP
- [x] HSTS con max-age ≥ 1 año, includeSubDomains, preload
- [x] X-Content-Type-Options: nosniff
- [x] X-Frame-Options: SAMEORIGIN
- [x] X-XSS-Protection eliminado (obsoleto)
- [x] Referrer-Policy configurado
- [x] Permissions-Policy restrictivo
- [x] CSP con directivas granulares
- [x] upgrade-insecure-requests en CSP
- [x] Server header oculta tecnología real
- [x] X-Powered-By eliminado
- [x] COOP/CORP/COEP configurados

### Protección de APIs
- [x] Rate limiting por IP en todos los endpoints
- [x] CSRF con verificación de Origin
- [x] Body size limit (413 para payloads >10MB)
- [x] Stripe webhook con verificación de firma HMAC
- [x] Supabase con Row Level Security (RLS)

### Privacidad (RGPD)
- [x] IP anonimizada antes de almacenamiento
- [x] Bots excluidos del tracking
- [x] Banner de cookies implementado
- [x] Páginas legal/privacidad y legal/cookies disponibles

### Docker / Deployment
- [x] Multi-stage build (imagen mínima)
- [x] Solo dependencias de producción en runtime
- [x] Non-root user (USER astro, UID 1001)
- [x] Healthcheck configurado
- [x] NODE_ENV=production
- [x] `npm cache clean --force` (reduce superficie)

### Supply Chain
- [x] Chart.js bundled localmente (no CDN)
- [x] CSP `script-src` no permite CDNs abiertos
- [x] `npm ci` (instalación reproducible desde lockfile)

### DNS / TLS (acción del usuario)
- [ ] DNSSEC activado en registrador
- [ ] HSTS preload enviado a hstspreload.org
- [ ] SSL Labs calificación A/A+
- [ ] HTTP → HTTPS redirect verificado
- [ ] TLS 1.0/1.1 deshabilitados

---

## 6. Herramientas de verificación

| Herramienta | URL | Qué verifica |
|-------------|-----|--------------|
| Security Headers | https://securityheaders.com | Headers HTTP de seguridad |
| SSL Labs | https://www.ssllabs.com/ssltest/ | Configuración TLS/certificados |
| HSTS Preload | https://hstspreload.org | Elegibilidad para HSTS preload |
| CSP Evaluator | https://csp-evaluator.withgoogle.com | Evalúa la política CSP |
| DNS Viz | https://dnsviz.net | Visualiza cadena DNSSEC |
| Mozilla Observatory | https://observatory.mozilla.org | Auditoría general de seguridad web |
| web-check.xyz | https://web-check.xyz | Análisis completo del sitio |
