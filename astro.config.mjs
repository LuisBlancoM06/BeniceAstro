import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), react()],
  output: 'server',
  adapter: node({
    mode: 'standalone',
    // Coolify usa Traefik como proxy — necesario para obtener la IP real del visitante
    forwardedAllowedIPs: ['0.0.0.0/0', '::/0'],
  }),
  server: {
    host: '0.0.0.0',
    port: 4321
  }
});
