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

Sitemap: ${siteUrl}/sitemap.xml
`;

  return new Response(robotsTxt, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
