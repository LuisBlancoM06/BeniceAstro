# 🔍 Auditoría Completa Web-Check — Benice Pet Shop

**Dominio:** `benicetiendanimal.victoriafp.online`  
**Stack:** Astro 5 SSR + Node 22 (Docker Alpine) → Coolify → Traefik → Cloudflare Proxy  
**Fecha:** 2026-02-21  
**Autor:** Distinguished Engineer Audit  

---

## Resumen Ejecutivo

| Categoría | Checks Afectados | ¿Arreglo posible? |
|---|---|---|
| **DNS / Red** | get-ip, dns, dns-server, hosts, trace-route, location | Cloudflare + Panel DNS |
| **TLS/SSL** | tls-cipher-suites, tls-security-config, tls-client-support | Cloudflare SSL settings |
| **Email** | mail-config, txt-records | Registros DNS (SPF/DKIM/DMARC) |
| **Infra** | server-info, ports, tech-stack | Traefik/Docker/Cloudflare |
| **Aplicación** | sitemap, features, quality, screenshot, carbon | Código (ya arreglado) |
| **Skipped** | cookies, archives, rank | No son errores reales |

---

## Arquitectura de Red (Contexto Crítico)

```
[Cliente] → [Cloudflare CDN/WAF] → [VPS Coolify] → [Traefik Proxy] → [Docker Container :4321]
                ↑                          ↑
         IPs: 188.114.96.5          IP real del VPS
         188.114.97.5               (oculta por CF Proxy)
         NS: nash.ns.cloudflare.com
```

Cloudflare actúa como **reverse proxy** (modo "Proxied" ☁️ naranja). Esto afecta directamente a múltiples checks porque el escáner ve Cloudflare, NO tu servidor real.

---

## 1. ❌ GET-IP (error)

### Qué significa
El escáner intenta resolver la IP real del servidor detrás del dominio.

### Por qué falla
Cloudflare en modo **Proxied** (nube naranja) oculta la IP real del VPS. Las IPs que se ven son:
- `188.114.96.5` / `188.114.97.5` (Cloudflare IPv4)
- `2a06:98c1:3121::5` / `2a06:98c1:3120::5` (Cloudflare IPv6)

### Diagnóstico
```bash
# Desde Linux/Mac:
dig +short benicetiendanimal.victoriafp.online @8.8.8.8
# Resultado: 188.114.96.5, 188.114.97.5 → Son IPs de Cloudflare

# Verificar que NO expone IP real:
dig +short benicetiendanimal.victoriafp.online @8.8.8.8 | grep -v "188.114"
# Si no devuelve nada → Correcto, IP protegida
```

```powershell
# Windows:
nslookup benicetiendanimal.victoriafp.online 8.8.8.8
```

### Solución
**NO hacer nada.** Esto es comportamiento DESEADO. La IP real del VPS debe estar oculta. Si web-check marca esto como "error", es porque la herramienta no puede determinar la IP de origen — eso es exactamente lo que queremos.

### Impacto: 🟢 Ninguno (es una FEATURE, no un bug)
### Prioridad: ✅ Ignorar


---

## 2. ⏱️ LOCATION (timed-out)

### Qué significa
El escáner intenta geolocalizar el servidor a partir de su IP.

### Por qué falla
Con Cloudflare Proxy activo, la IP que ve es de un datacenter Cloudflare (Madrid MAD, según el header `CF-RAY: ...d983-MAD`). No puede geolocalizar tu servidor real.

### Solución
**NO hacer nada.** El timeout es porque Cloudflare no permite esta consulta inversa. Tu servidor está protegido.

### Impacto: 🟢 Ninguno
### Prioridad: ✅ Ignorar


---

## 3. ❌ QUALITY (error)

### Qué significa
Analiza la calidad general del sitio: velocidad de carga, buenas prácticas, accesibilidad, y métricas de rendimiento.

### Causas probables
1. **Tiempo de respuesta alto:** El middleware registra cada visita en Supabase (insert) antes de servir la página, añadiendo ~100-300ms de latencia.
2. **Imágenes de hero sin optimización:** `/images/hero/perros.jpg` etc. se sirven sin `width/height` explícitos.
3. **JavaScript bundle grande:** React + Astro + Stripe + Supabase en cliente.

### Diagnóstico
```bash
# Medir TTFB:
curl -o /dev/null -s -w "TTFB: %{time_starttransfer}s\nTotal: %{time_total}s\n" https://benicetiendanimal.victoriafp.online/

# Lighthouse desde CLI:
npx lighthouse https://benicetiendanimal.victoriafp.online/ --output=json --quiet
```

### Solución (código - aplicable)
1. **Hacer el tracking de visitas asíncrono** (no bloquear la respuesta):
   - En `middleware.ts`, mover el `supabaseAdmin.from('visits').insert(...)` DESPUÉS de `await next()`, o usar `waitUntil()` si disponible.
2. **Añadir `width` y `height`** a las imágenes del hero para evitar CLS.
3. **Lazy-load componentes React** que no son above-the-fold.

### Impacto: 🟡 Medio (SEO, UX)
### Prioridad: 🔶 Media


---

## 4. ❌ TECH-STACK (error)

### Qué significa
Detecta las tecnologías usadas (frameworks, CMS, servidores...) a través de headers, meta tags, y fingerprints.

### Por qué falla
1. Cloudflare sobrescribe `Server: cloudflare` eliminando nuestro `Server: Benice`.
2. Astro no genera un `X-Powered-By` (lo eliminamos en middleware, correcto).
3. Sin meta generator visible.

### Diagnóstico (verificado en producción)
```
Server: cloudflare                        ← Cloudflare sobrescribe
x-content-type-options: nosniff           ✅
x-frame-options: SAMEORIGIN               ✅
x-xss-protection: 1; mode=block           ✅
```
No hay `X-Powered-By` (correcto). No hay `X-Generator` (correcto). El escáner no puede identificar el stack.

### Solución
**NO hacer nada.** No exponer el tech stack es una **buena práctica de seguridad**. El escáner reporta "error" simplemente porque no puede detectarlo. Si quisieras que lo detecte:
```typescript
// NO RECOMENDADO - solo si quieres que web-check lo reconozca:
newHeaders.set('X-Powered-By', 'Astro');
```

### Impacto: 🟢 Ninguno (es una FEATURE de seguridad)
### Prioridad: ✅ Ignorar


---

## 5. ⏱️ SERVER-INFO (timed-out)

### Qué significa
Intenta obtener información del servidor (versión de software, OS, etc.).

### Por qué falla
Cloudflare proxy intercepta y devuelve `Server: cloudflare`. No hay manera de obtener info del servidor real.

### Solución
**NO hacer nada.** Tu middleware ya elimina `X-Powered-By` y sustituye `Server`. Cloudflare añade una capa más de ocultación.

### Impacto: 🟢 Ninguno
### Prioridad: ✅ Ignorar


---

## 6. ❌ DNS (error)

### Qué significa
Verifica la configuración DNS: registros A, AAAA, CNAME, SOA, etc.

### Diagnóstico real
```powershell
nslookup benicetiendanimal.victoriafp.online 8.8.8.8
# Respuesta:
# Addresses: 2a06:98c1:3121::5, 2a06:98c1:3120::5
#            188.114.96.5, 188.114.97.5
```

Los registros A y AAAA existen y apuntan a Cloudflare. El error probable es que el escáner:
1. Intenta hacer AXFR (transferencia de zona) y Cloudflare lo bloquea → correcto
2. Intenta resolver registros que no existen (DNSKEY, CAA, etc.)

### Solución — Registros DNS recomendados en Cloudflare

Entra en **Cloudflare Dashboard → DNS → Records** y verifica/añade:

| Tipo | Nombre | Contenido | Proxy |
|---|---|---|---|
| A | `benicetiendanimal` | `IP_REAL_VPS` | ☁️ Proxied |
| AAAA | `benicetiendanimal` | `IPv6_VPS` (si tiene) | ☁️ Proxied |
| CAA | `victoriafp.online` | `0 issue "letsencrypt.org"` | DNS only |
| CAA | `victoriafp.online` | `0 issue "digicert.com"` | DNS only |
| CAA | `victoriafp.online` | `0 issuewild "letsencrypt.org"` | DNS only |

El registro **CAA** es importante para indicar qué CAs pueden emitir certificados para tu dominio.

### Impacto: 🟡 Medio (seguridad DNS)
### Prioridad: 🔶 Media


---

## 7. ❌ DNS-SERVER (error)

### Qué significa
Verifica que los nameservers del dominio están configurados correctamente y responden.

### Estado real
```
victoriafp.online nameserver = nash.ns.cloudflare.com
```

Solo se ve UN nameserver en la respuesta truncada. Cloudflare siempre asigna DOS:
- `nash.ns.cloudflare.com`
- `(segundo NS asignado por Cloudflare)`

### Diagnóstico
```bash
dig NS victoriafp.online @8.8.8.8
```

### Solución
Verificar en el **registrador del dominio** (donde compraste `victoriafp.online`) que ambos nameservers de Cloudflare están configurados. Ve a Cloudflare Dashboard → Overview → verás algo como:
```
nash.ns.cloudflare.com
xxx.ns.cloudflare.com
```
Ambos deben estar configurados en tu registrador.

### Impacto: 🔴 Alto si solo hay 1 NS (sin redundancia DNS)
### Prioridad: 🔴 Alta


---

## 8. ⏱️ HOSTS (timed-out)

### Qué significa
Intenta resolver el host y obtener información de reverse DNS (PTR).

### Por qué falla
Cloudflare Proxy no permite PTR lookups de las IPs proxy. La IP `188.114.96.5` no tiene PTR público que apunte a tu dominio.

### Solución
**NO hacer nada.** PTR records se gestionan por el dueño del bloque IP (Cloudflare).

### Impacto: 🟢 Ninguno
### Prioridad: ✅ Ignorar


---

## 9. ❌ TRACE-ROUTE (error)

### Qué significa
Intenta hacer traceroute al servidor para ver la ruta de red.

### Por qué falla
Cloudflare bloquea ICMP y la mayoría de paquetes de traceroute. Solo llegas hasta el edge de Cloudflare (Madrid MAD en tu caso).

### Diagnóstico
```powershell
tracert benicetiendanimal.victoriafp.online
# Solo llegará hasta los nodos de Cloudflare
```

### Solución
**NO hacer nada.** Cloudflare bloquea traceroute intencionalmente como protección anti-DDoS.

### Impacto: 🟢 Ninguno
### Prioridad: ✅ Ignorar


---

## 10. ❌ MAIL-CONFIG (error) — ⚠️ IMPORTANTE

### Qué significa
Verifica la configuración de email: registros MX, SPF, DKIM, DMARC.

### Por qué falla
Tu dominio `victoriafp.online` tiene un SPF parcial (`v=spf1 include:_spf.mx.cloudflare.net ~all`) pero probablemente falta:
- **Registro MX** para recibir email
- **DKIM** para firmar emails salientes
- **DMARC** para política anti-spoofing

### Diagnóstico
```bash
# SPF:
dig TXT victoriafp.online +short
# Debería mostrar: "v=spf1 include:_spf.mx.cloudflare.net include:amazonses.com ~all"

# MX:
dig MX victoriafp.online +short
# Debería mostrar registros MX

# DMARC:
dig TXT _dmarc.victoriafp.online +short
# Debería mostrar: "v=DMARC1; p=quarantine; rua=mailto:dmarc@victoriafp.online"

# DKIM (si usas Resend):
dig TXT resend._domainkey.victoriafp.online +short
```

```powershell
# Windows:
nslookup -type=TXT _dmarc.victoriafp.online 8.8.8.8
nslookup -type=MX victoriafp.online 8.8.8.8
```

### Solución — Registros DNS para email

Entra en **Cloudflare Dashboard → DNS → Records** y añade:

#### Si usas Resend (tu caso):

| Tipo | Nombre | Contenido | TTL |
|---|---|---|---|
| TXT | `victoriafp.online` | `v=spf1 include:_spf.mx.cloudflare.net include:resend.com ~all` | Auto |
| TXT | `_dmarc.victoriafp.online` | `v=DMARC1; p=none; rua=mailto:dmarc-reports@victoriafp.online` | Auto |
| TXT | `resend._domainkey` | *(obtener de Resend Dashboard → Domains → DNS Records)* | Auto |
| MX | `victoriafp.online` | Si usas email de Cloudflare: según instrucciones de CF Email | Auto |

#### Para DKIM con Resend:
1. Ve a https://resend.com/domains
2. Añade `victoriafp.online` si no lo has hecho
3. Resend te dará 3 registros CNAME/TXT para DKIM
4. Añádelos en Cloudflare DNS

### Impacto: 🔴 **ALTO** — Sin DMARC, cualquiera puede enviar emails haciéndose pasar por tu dominio (spoofing/phishing)
### Prioridad: 🔴 **CRÍTICA**


---

## 11. ❌ TXT-RECORDS (error)

### Qué significa
Verifica los registros TXT del dominio (SPF, DKIM, verificaciones, etc.).

### Estado real
```
victoriafp.online text = "v=spf1 include:_spf.mx.cloudflare.net ~all"
```
Solo hay un SPF básico.

### Solución
Los registros TXT adicionales necesarios están listados en el punto 10 (MAIL-CONFIG):
- SPF expandido con Resend
- DMARC
- DKIM keys

Adicionalmente, puedes añadir para Google:
| Tipo | Nombre | Contenido |
|---|---|---|
| TXT | `victoriafp.online` | `google-site-verification=H9_x1DJqClBe_brtdbbfIC-6qY51T_c3Wou8WrOdY2k` |

### Impacto: 🟡 Medio
### Prioridad: 🔶 Media (vinculado a mail-config)


---

## 12. ❌ TLS-CIPHER-SUITES (error)

### Qué significa
Verifica qué cipher suites TLS acepta el servidor.

### Por qué falla
El escáner no puede negociar o analizar las cipher suites porque Cloudflare gestiona TLS en su edge. Tu contenedor Docker NO termina TLS — lo hace Cloudflare.

### Diagnóstico
```bash
# Desde Linux:
openssl s_client -connect benicetiendanimal.victoriafp.online:443 -servername benicetiendanimal.victoriafp.online 2>/dev/null | grep "Cipher\|Protocol"

# Comprobar suites específicas:
nmap --script ssl-enum-ciphers -p 443 benicetiendanimal.victoriafp.online
```

### Solución — Cloudflare Dashboard

1. Ve a **Cloudflare → SSL/TLS → Edge Certificates**
2. **Minimum TLS Version:** TLS 1.2 (recomendado)
3. Ve a **Cloudflare → SSL/TLS → Edge Certificates → Cipher Suites**
4. Desactiva cipher suites débiles si aparecen (RC4, 3DES, etc.)

Configuración recomendada:
- **SSL mode:** Full (strict)
- **Minimum TLS:** 1.2
- **TLS 1.3:** Enabled
- **Always Use HTTPS:** On
- **Automatic HTTPS Rewrites:** On
- **Opportunistic Encryption:** On

### Impacto: 🔴 Alto (seguridad de transporte)
### Prioridad: 🔴 Alta


---

## 13. ❌ TLS-SECURITY-CONFIG (error)

### Qué significa
Verifica la configuración general de seguridad TLS: validez del certificado, chain de confianza, OCSP stapling, etc.

### Solución — Cloudflare Dashboard
1. **SSL/TLS → Overview → SSL mode: Full (strict)** ← CRUCIAL
   - "Full" sin "strict" permite MITM entre Cloudflare y tu servidor
2. **SSL/TLS → Edge Certificates:**
   - Always Use HTTPS: ✅ ON
   - HTTP Strict Transport Security (HSTS): ✅ Enable (max-age=63072000)
   - Esto DUPLICA lo que ya envías por header, pero es un refuerzo en el edge de Cloudflare
3. **SSL/TLS → Origin Server:**
   - Genera un **Origin Certificate** de Cloudflare para la comunicación CF→Traefik
   - O usa un cert Let's Encrypt que Coolify genera automáticamente

### Verificación de la cadena:
```bash
openssl s_client -connect benicetiendanimal.victoriafp.online:443 -servername benicetiendanimal.victoriafp.online 2>/dev/null | openssl x509 -noout -dates -issuer -subject
```

### Impacto: 🔴 Alto
### Prioridad: 🔴 Alta


---

## 14. ❌ TLS-CLIENT-SUPPORT (error)

### Qué significa
Verifica qué versiones de TLS soporta el servidor (TLS 1.0, 1.1, 1.2, 1.3).

### Solución — Cloudflare Dashboard
1. **SSL/TLS → Edge Certificates → Minimum TLS Version:** `TLS 1.2`
2. **SSL/TLS → Edge Certificates → TLS 1.3:** `Enabled`
3. Verificar que TLS 1.0 y 1.1 están DESACTIVADOS

### Diagnóstico
```bash
# Probar TLS 1.0 (debería FALLAR):
openssl s_client -tls1 -connect benicetiendanimal.victoriafp.online:443

# Probar TLS 1.2 (debería FUNCIONAR):
openssl s_client -tls1_2 -connect benicetiendanimal.victoriafp.online:443

# Probar TLS 1.3 (debería FUNCIONAR):
openssl s_client -tls1_3 -connect benicetiendanimal.victoriafp.online:443
```

### Impacto: 🔴 Alto
### Prioridad: 🔴 Alta


---

## 15. ❌ SCREENSHOT (error)

### Qué significa
El escáner intenta renderizar la página y tomar una captura.

### Por qué falla
1. **CSP bloqueaba el renderizado** (ya arreglado — relajamos COOP y CORP)
2. **Cloudflare Bot Protection** puede estar bloqueando el headless browser del escáner
3. **Cloudflare JS Challenge** puede interponerse

### Solución
1. ✅ Ya arreglamos `Cross-Origin-Opener-Policy: same-origin-allow-popups`
2. ✅ Ya arreglamos `Cross-Origin-Resource-Policy: cross-origin`
3. En **Cloudflare → Security → Bots:**
   - **Bot Fight Mode:** OFF o configurado para no bloquear bots "buenos"
   - Alternativamente, crear una **Firewall Rule** que permita el User-Agent de web-check
4. En **Cloudflare → Security → Settings:**
   - **Security Level:** Medium (no "I'm Under Attack")
   - **Challenge Passage:** 30 minutes

### Impacto: 🟡 Medio (solo afecta al escáner, no a usuarios reales)
### Prioridad: 🟡 Baja


---

## 16. ⏱️ PORTS (timed-out)

### Qué significa
Escaneo de puertos abiertos (80, 443, 8080, etc.).

### Por qué falla
Cloudflare Proxy solo expone los puertos 80 y 443. Los demás están bloqueados. El timeout ocurre porque los puertos no estándar no responden.

### Diagnóstico
```bash
nmap -Pn -p 80,443,8080,8443,4321 benicetiendanimal.victoriafp.online
```
Solo 80 y 443 deberían estar "open" (a través de Cloudflare).

### Solución
**NO hacer nada.** Tener solo 80/443 abiertos es correcto. El puerto 4321 de tu contenedor Docker NO debe estar expuesto a Internet directamente.

### Verificar en VPS (SSH al servidor Coolify):
```bash
# Desde el VPS:
ss -tlnp | grep -E '80|443|4321'
# Verificar que 4321 solo escucha en la red Docker interna

# Verificar firewall:
ufw status
# o
iptables -L -n
```

### Impacto: 🟢 Ninguno (es correcto)
### Prioridad: ✅ Ignorar


---

## 17. ❌ SITEMAP (error) — YA ARREGLADO ✅

### Qué significaba
El escáner no podía obtener o parsear el sitemap.

### Estado actual
El sitemap ahora funciona correctamente:
```
https://benicetiendanimal.victoriafp.online/sitemap.xml → 200 OK
Contenido: XML válido con 23+ URLs
```

### Lo que se arregló
- Variables `site` y `today` movidas fuera del try-catch
- Fallback mejorado con 2 URLs mínimas
- Manejo de errores de Supabase más robusto

### Impacto: ✅ Arreglado
### Prioridad: ✅ Completado


---

## 18. ❌ FEATURES (error)

### Qué significa
Detecta features del sitio: PWA, service worker, manifest, responsive, etc.

### Causas probables
1. El escáner no puede renderizar la página (relacionado con screenshot error)
2. Falta el header `Link` con preload hints que algunos escáneres buscan

### Solución
✅ Ya añadimos en `Layout.astro`:
- `<link rel="manifest" href="/site.webmanifest">`
- `<meta name="mobile-web-app-capable" content="yes">`
- `<meta name="apple-mobile-web-app-capable" content="yes">`
- `<link rel="sitemap" href="/sitemap.xml">`

Para mejora adicional, podrías añadir un **Service Worker** básico, pero NO es necesario para una tienda SSR.

### Impacto: 🟡 Medio
### Prioridad: 🟡 Baja


---

## 19. ❌ CARBON (error)

### Qué significa
Calcula la huella de carbono del sitio basándose en el tamaño de la página y los recursos transferidos.

### Por qué falla
1. Si la página es pesada (imágenes grandes, JS bundles)
2. Si el escáner no puede renderizar (relacionado a screenshot/bot blocking)

### Diagnóstico
```bash
# Ver tamaño total de la página:
curl -sI https://benicetiendanimal.victoriafp.online/ | grep content-length

# Usar Website Carbon API:
curl "https://api.websitecarbon.com/site?url=https://benicetiendanimal.victoriafp.online/"
```

### Solución
1. **Optimizar imágenes:** Convertir `/images/hero/*.jpg` a WebP/AVIF
2. **Lazy load** imágenes below the fold
3. **Comprimir assets:** Verificar que Cloudflare tiene `Brotli: ON`
   - Cloudflare → Speed → Optimization → Content Optimization → Brotli: ✅

### Impacto: 🟡 Medio (SEO, percepción)
### Prioridad: 🟡 Baja


---

## 20. 🔲 COOKIES (skipped) / ARCHIVES (skipped) / RANK (skipped)

### Qué significa
- **Cookies:** Detecta cookies y verifica flags (Secure, HttpOnly, SameSite)
- **Archives:** Verifica presencia en Wayback Machine
- **Rank:** Posición en rankings (Tranco, etc.)

### Por qué "skipped"
El escáner no pudo ejecutar estos checks, generalmente porque el paso previo (screenshot/renderizado) falló.

### Solución
Se resolverán automáticamente cuando se arreglen los checks de los que dependen (screenshot, bot blocking).

### Prioridad: ✅ Se auto-resuelve


---

## Checks que YA ESTÁN EN VERDE ✅

Estos funcionan correctamente:

| Check | Estado | Verificación |
|---|---|---|
| **ssl** | ✅ success | Certificado Cloudflare válido |
| **domain** | ✅ success | Dominio registrado y resolvible |
| **headers** | ✅ success | Todos los security headers presentes |
| **http-security** | ✅ success | HSTS, CSP, X-Frame-Options, etc. |
| **social-tags** | ✅ success | Open Graph, Twitter Cards |
| **security-txt** | ✅ success | `/.well-known/security.txt` presente y válido |
| **firewall** | ✅ success | Cloudflare WAF activo |
| **dnssec** | ✅ success | DNSSEC via Cloudflare |
| **hsts** | ✅ success | `max-age=63072000; includeSubDomains; preload` |
| **threats** | ✅ success | Sin amenazas detectadas |
| **redirects** | ✅ success | HTTP→HTTPS correcto |
| **linked-pages** | ✅ success | Enlaces internos funcionan |
| **robots-txt** | ✅ success | robots.txt presente y válido |
| **status** | ✅ success | HTTP 200 |
| **block-lists** | ✅ success | Dominio no está en blacklists |


---

# 📋 CHECKLIST FINAL — Ordenado por Prioridad

## 🔴 PRIORIDAD CRÍTICA (hacer HOY)

### 1. Configurar registros de email (DMARC/DKIM)
```
Panel: Cloudflare → DNS → Records

Añadir:
- TXT | _dmarc.victoriafp.online | v=DMARC1; p=none; rua=mailto:dmarc@victoriafp.online
- TXT | victoriafp.online | v=spf1 include:_spf.mx.cloudflare.net include:resend.com ~all
  (REEMPLAZAR el SPF existente, no añadir otro)
- CNAME/TXT para DKIM → obtener de Resend Dashboard → Domains → tu dominio
```

### 2. Configurar TLS en Cloudflare
```
Panel: Cloudflare → SSL/TLS

→ Overview → SSL mode: Full (strict)
→ Edge Certificates:
  - Minimum TLS Version: TLS 1.2
  - TLS 1.3: Enabled
  - Always Use HTTPS: On
  - Automatic HTTPS Rewrites: On
  - HSTS: Enable con max-age=63072000
→ Edge Certificates → Cipher Suites:
  - Deshabilitar suites con RC4, 3DES si aparecen
```

### 3. Verificar Nameservers en registrador
```
Panel: Registrador del dominio (donde compraste victoriafp.online)

Verificar que AMBOS nameservers de Cloudflare están configurados:
- nash.ns.cloudflare.com
- (segundo NS que Cloudflare asignó)
```

## 🔶 PRIORIDAD MEDIA (esta semana)

### 4. Añadir registro CAA
```
Panel: Cloudflare → DNS → Records

Añadir:
- CAA | victoriafp.online | 0 issue "letsencrypt.org"
- CAA | victoriafp.online | 0 issue "digicert.com"
- CAA | victoriafp.online | 0 issuewild "letsencrypt.org"
```

### 5. Verificar dominio en Resend
```
Panel: https://resend.com/domains

1. Añadir victoriafp.online (si no está)
2. Copiar los 3 registros DNS que Resend genera
3. Añadirlos en Cloudflare DNS
4. Verificar en Resend
```

### 6. Añadir Google Site Verification como TXT
```
Panel: Cloudflare → DNS → Records

Añadir:
- TXT | victoriafp.online | google-site-verification=H9_x1DJqClBe_brtdbbfIC-6qY51T_c3Wou8WrOdY2k
```

## 🟡 PRIORIDAD BAJA (cuando sea posible)

### 7. Reducir Bot Protection de Cloudflare
```
Panel: Cloudflare → Security → Bots

- Bot Fight Mode: Off (o Very Low)
  → Esto permitirá que web-check haga screenshots

Panel: Cloudflare → Security → Settings
- Security Level: Medium
- Challenge Passage: 30 minutes
```

### 8. Activar Brotli y otras optimizaciones
```
Panel: Cloudflare → Speed → Optimization

- Brotli: On
- Auto Minify: JS ✅, CSS ✅, HTML ✅
- Rocket Loader: Off (puede romper Astro/React)
- Early Hints: On
- HTTP/2 Push: Off (deprecated)
```

### 9. Optimizar imágenes (código)
```
- Convertir /public/images/hero/*.jpg a WebP
- Añadir width/height explícitos a <img> tags
- Usar formato <picture> con srcset para responsiveness
```

## ✅ YA COMPLETADO (no requiere acción)

- [x] Security headers en middleware (HSTS, CSP, COOP, CORP, COEP)
- [x] security.txt dinámico en /.well-known/
- [x] sitemap.xml robusto con fallback
- [x] robots.txt con Sitemap reference
- [x] Meta tags SEO completos (OG, Twitter, JSON-LD)
- [x] Health check endpoint /api/health
- [x] Manifest, apple-touch-icon, browserconfig.xml
- [x] humans.txt con info del equipo

## ❌ NO HACER (estos "errores" son FEATURES de seguridad)

- [ ] ~~Exponer IP real del servidor~~ → Cloudflare la oculta correctamente
- [ ] ~~Exponer tech stack~~ → Ocultar tecnologías es buena práctica
- [ ] ~~Abrir más puertos~~ → Solo 80/443 es correcto
- [ ] ~~Permitir traceroute~~ → Cloudflare lo bloquea intencionalmente
- [ ] ~~Configurar PTR records~~ → Son de Cloudflare, no tuyos


---

# 📊 Resumen de Estado Post-Auditoría

| Check | Estado | Acción |
|---|---|---|
| get-ip | ❌→🟢 | Ignorar (Cloudflare) |
| location | ⏱️→🟢 | Ignorar (Cloudflare) |
| ssl | ✅ | OK |
| domain | ✅ | OK |
| quality | ❌ | Optimizar rendimiento |
| tech-stack | ❌→🟢 | Ignorar (seguridad) |
| server-info | ⏱️→🟢 | Ignorar (Cloudflare) |
| cookies | 🔲 | Depende de screenshot |
| headers | ✅ | OK |
| dns | ❌ | Añadir CAA records |
| hosts | ⏱️→🟢 | Ignorar (Cloudflare) |
| http-security | ✅ | OK |
| social-tags | ✅ | OK |
| trace-route | ❌→🟢 | Ignorar (Cloudflare) |
| security-txt | ✅ | OK |
| dns-server | ❌ | Verificar 2 NS |
| firewall | ✅ | OK |
| dnssec | ✅ | OK |
| hsts | ✅ | OK |
| threats | ✅ | OK |
| **mail-config** | **❌** | **🔴 AÑADIR DMARC/DKIM** |
| archives | 🔲 | Auto-resolve |
| rank | 🔲 | Auto-resolve |
| screenshot | ❌ | Reducir CF bot protection |
| **tls-cipher-suites** | **❌** | **🔴 Config Cloudflare TLS** |
| **tls-security-config** | **❌** | **🔴 Full (strict) mode** |
| **tls-client-support** | **❌** | **🔴 Min TLS 1.2** |
| redirects | ✅ | OK |
| linked-pages | ✅ | OK |
| robots-txt | ✅ | OK |
| status | ✅ | OK |
| ports | ⏱️→🟢 | Ignorar (correcto) |
| **txt-records** | **❌** | **🔶 Añadir SPF/DMARC** |
| block-lists | ✅ | OK |
| features | ❌ | Depende de screenshot |
| **sitemap** | **✅** | **Arreglado en código** |
| carbon | ❌ | Optimizar peso |
