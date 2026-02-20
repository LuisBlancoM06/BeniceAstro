import type { APIRoute } from 'astro';
import { supabase } from '../lib/supabase';

export const prerender = false;

interface SitemapEntry {
  url: string;
  priority: string;
  changefreq: string;
  lastmod?: string;
}

export const GET: APIRoute = async ({ site: astroSite }) => {
  const site = (import.meta.env.PUBLIC_SITE_URL || astroSite?.origin || 'https://benicetiendanimal.victoriafp.online').replace(/\/$/, '');
  const today = new Date().toISOString().split('T')[0];

  // Paginas estaticas publicas
  const staticPages: SitemapEntry[] = [
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

  // Blog posts estaticos
  const blogPosts: SitemapEntry[] = [
    { url: '/blog/elegir-pienso-perro', priority: '0.6', changefreq: 'monthly' },
    { url: '/blog/cuidados-gato-verano', priority: '0.6', changefreq: 'monthly' },
    { url: '/blog/juguetes-estimulacion-mental', priority: '0.6', changefreq: 'monthly' },
    { url: '/blog/primeros-dias-cachorro', priority: '0.6', changefreq: 'monthly' },
    { url: '/blog/antiparasitarios-importancia', priority: '0.6', changefreq: 'monthly' },
    { url: '/blog/arenero-perfecto-gato', priority: '0.6', changefreq: 'monthly' },
  ];

  // Paginas dinamicas de productos (incluir todos los activos, no solo con stock)
  let productPages: SitemapEntry[] = [];
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('slug, updated_at')
      .eq('active', true);

    if (error) {
      console.error('Sitemap: Error fetching products:', error.message);
    }

    if (products) {
      productPages = products
        .filter(p => p.slug)
        .map(p => ({
          url: `/producto/${p.slug}`,
          priority: '0.8',
          changefreq: 'weekly' as const,
          lastmod: p.updated_at ? new Date(p.updated_at).toISOString().split('T')[0] : undefined
        }));
    }
  } catch (err) {
    console.error('Sitemap: Failed to fetch products from database:', err);
  }

  const allPages = [...staticPages, ...blogPosts, ...productPages];

  // Validar que no haya URLs duplicadas
  const seen = new Set<string>();
  const uniquePages = allPages.filter(page => {
    if (seen.has(page.url)) return false;
    seen.add(page.url);
    return true;
  });

  // Escapar caracteres especiales en URLs para XML valido
  const escapeXml = (str: string) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniquePages.map(page => `  <url>
    <loc>${escapeXml(site + page.url)}</loc>
    <lastmod>${page.lastmod || today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'X-Robots-Tag': 'noindex',
    }
  });
};
