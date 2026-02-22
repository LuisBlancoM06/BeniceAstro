import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'https://benicetiendanimal.victoriafp.online',
  integrations: [tailwind(), react()],
  // Modo híbrido: SSG por defecto, SSR opt-in con prerender = false
  // En Astro 5.x, output:'static' = antiguo 'hybrid' (SSG default + SSR selectivo)
  output: 'static',
  // trailingSlash: el middleware ya redirige con 301 las URLs con trailing slash
  // No usar build.format: 'file' — incompatible con el node adapter para páginas prerendered
  trailingSlash: 'never',
  adapter: node({
    mode: 'standalone',
    // Coolify usa Traefik como proxy — necesario para obtener la IP real del visitante
    // SEGURIDAD: Idealmente restringir a CIDRs de Traefik/Cloudflare internos.
    // En Coolify la IP del proxy varía por despliegue (red Docker interna).
    // Cloudflare CIDRs: https://www.cloudflare.com/ips/
    forwardedAllowedIPs: [
      // Redes privadas Docker (donde vive Traefik en Coolify)
      '172.16.0.0/12',
      '10.0.0.0/8',
      '192.168.0.0/16',
      // IPv6 link-local
      'fe80::/10',
      'fd00::/8',
      // Cloudflare IPv4
      '173.245.48.0/20',
      '103.21.244.0/22',
      '103.22.200.0/22',
      '103.31.4.0/22',
      '141.101.64.0/18',
      '108.162.192.0/18',
      '190.93.240.0/20',
      '188.114.96.0/20',
      '197.234.240.0/22',
      '198.41.128.0/17',
      '162.158.0.0/15',
      '104.16.0.0/13',
      '104.24.0.0/14',
      '172.64.0.0/13',
      '131.0.72.0/22',
      // Cloudflare IPv6
      '2400:cb00::/32',
      '2606:4700::/32',
      '2803:f800::/32',
      '2405:b500::/32',
      '2405:8100::/32',
      '2a06:98c0::/29',
      '2c0f:f248::/32',
    ],
  }),
  server: {
    host: '0.0.0.0',
    port: 4321
  }
});
