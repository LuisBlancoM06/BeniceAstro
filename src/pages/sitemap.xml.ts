import type { APIRoute } from 'astro';
import { supabase } from '../lib/supabase';

export const prerender = false;

export const GET: APIRoute = async ({ site: astroSite }) => {
  const site = (import.meta.env.PUBLIC_SITE_URL || astroSite?.origin || 'https://benicetiendanimal.victoriafp.online').replace(/\/$/, '');

  // Páginas estáticas
  const staticPages: { url: string; priority: string; changefreq: string; lastmod?: string }[] = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/productos', priority: '0.9', changefreq: 'daily' },
    { url: '/ofertas', priority: '0.8', changefreq: 'daily' },
    { url: '/blog', priority: '0.7', changefreq: 'weekly' },
    { url: '/recomendador', priority: '0.7', changefreq: 'monthly' },
    { url: '/animales/perros', priority: '0.8', changefreq: 'weekly' },
    { url: '/animales/gatos', priority: '0.8', changefreq: 'weekly' },
    { url: '/animales/pajaros', priority: '0.7', changefreq: 'weekly' },
    { url: '/animales/peces', priority: '0.7', changefreq: 'weekly' },
    { url: '/animales/roedores', priority: '0.7', changefreq: 'weekly' },
    { url: '/info/contacto', priority: '0.5', changefreq: 'monthly' },
    { url: '/info/sobre-nosotros', priority: '0.5', changefreq: 'monthly' },
    { url: '/info/envios', priority: '0.5', changefreq: 'monthly' },
    { url: '/info/faq', priority: '0.5', changefreq: 'monthly' },
    { url: '/legal/privacidad', priority: '0.3', changefreq: 'yearly' },
    { url: '/legal/terminos', priority: '0.3', changefreq: 'yearly' },
    { url: '/legal/cookies', priority: '0.3', changefreq: 'yearly' },
  ];

  // Páginas dinámicas de productos
  let productPages: { url: string; priority: string; changefreq: string; lastmod?: string }[] = [];
  try {
    const { data: products } = await supabase
      .from('products')
      .select('slug, updated_at')
      .gt('stock', 0);

    if (products) {
      productPages = products.map(p => ({
        url: `/producto/${p.slug}`,
        priority: '0.8',
        changefreq: 'weekly',
        lastmod: p.updated_at ? new Date(p.updated_at).toISOString().split('T')[0] : undefined
      }));
    }
  } catch {
    // Si falla la DB, generamos sitemap solo con estáticas
  }

  const allPages = [...staticPages, ...productPages];
  const today = new Date().toISOString().split('T')[0];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${site}${page.url}</loc>
    <lastmod>${page.lastmod || today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};
