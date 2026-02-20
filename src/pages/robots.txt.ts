import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ site: astroSite }) => {
  const siteUrl = (import.meta.env.PUBLIC_SITE_URL || astroSite?.origin || 'https://benicetiendanimal.victoriafp.online').replace(/\/$/, '');

  const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /cuenta/
Disallow: /checkout/
Disallow: /auth/
Disallow: /carrito

# Bots de IA adicionales (no gestionados por Cloudflare)
User-agent: ChatGPT-User
Disallow: /

User-agent: Claude-Web
Disallow: /

User-agent: FacebookBot
Disallow: /

User-agent: PerplexityBot
Disallow: /

User-agent: Cohere-ai
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: Omgilibot
Disallow: /

User-agent: YouBot
Disallow: /

User-agent: Diffbot
Disallow: /

User-agent: img2dataset
Disallow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

  return new Response(robotsTxt, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
