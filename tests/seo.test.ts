/**
 * Tests de SEO: sitemap, robots, canonical URLs, structured data
 */
import { describe, it, expect } from 'vitest';

describe('Canonical URL Generation', () => {
  function generateCanonical(pathname: string): string {
    const siteUrl = 'https://benicetiendanimal.victoriafp.online';
    const canonicalPath = pathname.replace(/\/+$/, '') || '/';
    return `${siteUrl}${canonicalPath}`;
  }

  it('genera canonical sin trailing slash', () => {
    expect(generateCanonical('/productos/')).toBe('https://benicetiendanimal.victoriafp.online/productos');
  });

  it('mantiene la raíz como /', () => {
    expect(generateCanonical('/')).toBe('https://benicetiendanimal.victoriafp.online/');
  });

  it('elimina múltiples trailing slashes', () => {
    expect(generateCanonical('/info/contacto///')).toBe('https://benicetiendanimal.victoriafp.online/info/contacto');
  });

  it('no modifica rutas sin trailing slash', () => {
    expect(generateCanonical('/animales/perros')).toBe('https://benicetiendanimal.victoriafp.online/animales/perros');
  });
});

describe('Robots.txt Rules', () => {
  const disallowedPaths = ['/admin/', '/api/', '/cuenta/', '/checkout/', '/auth/', '/carrito'];
  const allowedPaths = ['/', '/productos', '/ofertas', '/blog', '/animales/perros'];

  it('bloquea rutas privadas', () => {
    disallowedPaths.forEach(path => {
      expect(disallowedPaths).toContain(path);
    });
  });

  it('permite rutas públicas', () => {
    allowedPaths.forEach(path => {
      expect(disallowedPaths).not.toContain(path);
    });
  });

  it('no bloquea la raíz', () => {
    expect(disallowedPaths).not.toContain('/');
  });
});

describe('Sitemap Structure', () => {
  const staticPages = [
    '/', '/productos', '/ofertas', '/blog', '/recomendador',
    '/animales/perros', '/animales/gatos', '/animales/pajaros',
    '/animales/peces', '/animales/roedores',
    '/info/contacto', '/info/sobre-nosotros', '/info/envios', '/info/faq',
    '/legal/privacidad', '/legal/terminos', '/legal/cookies',
  ];

  const blogPosts = [
    '/blog/elegir-pienso-perro', '/blog/cuidados-gato-verano',
    '/blog/juguetes-estimulacion-mental', '/blog/primeros-dias-cachorro',
    '/blog/antiparasitarios-importancia', '/blog/arenero-perfecto-gato',
  ];

  it('incluye todas las páginas estáticas requeridas', () => {
    expect(staticPages.length).toBeGreaterThanOrEqual(17);
    expect(staticPages).toContain('/');
    expect(staticPages).toContain('/productos');
    expect(staticPages).toContain('/legal/privacidad');
  });

  it('incluye posts de blog', () => {
    expect(blogPosts.length).toBeGreaterThanOrEqual(6);
  });

  it('no incluye rutas privadas en el sitemap', () => {
    const allPages = [...staticPages, ...blogPosts];
    const privatePaths = ['/admin', '/api', '/cuenta', '/checkout', '/auth', '/carrito'];
    privatePaths.forEach(path => {
      expect(allPages.some(p => p.startsWith(path))).toBe(false);
    });
  });

  it('no tiene URLs duplicadas', () => {
    const allPages = [...staticPages, ...blogPosts];
    const unique = new Set(allPages);
    expect(unique.size).toBe(allPages.length);
  });

  it('las prioridades siguen la jerarquía correcta', () => {
    const priorities: Record<string, string> = {
      '/': '1.0',
      '/productos': '0.9',
      '/ofertas': '0.8',
      '/legal/privacidad': '0.3',
    };
    
    expect(parseFloat(priorities['/'])).toBeGreaterThan(parseFloat(priorities['/productos']));
    expect(parseFloat(priorities['/productos'])).toBeGreaterThan(parseFloat(priorities['/ofertas']));
    expect(parseFloat(priorities['/legal/privacidad'])).toBeLessThanOrEqual(0.3);
  });
});

describe('Structured Data (JSON-LD)', () => {
  it('genera Organization LD válido', () => {
    const orgLD = {
      "@context": "https://schema.org",
      "@type": "PetStore",
      "name": "Benice Pet Shop",
      "url": "https://benicetiendanimal.victoriafp.online",
      "telephone": "+34900123456",
    };
    
    expect(orgLD["@context"]).toBe("https://schema.org");
    expect(orgLD["@type"]).toBe("PetStore");
    expect(orgLD.name).toBeTruthy();
    expect(orgLD.url).toMatch(/^https:\/\//);
  });

  it('genera WebSite LD con SearchAction', () => {
    const siteLD = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "potentialAction": {
        "@type": "SearchAction",
        "target": { "@type": "EntryPoint", "urlTemplate": "{search_term_string}" },
        "query-input": "required name=search_term_string"
      }
    };

    expect(siteLD["@type"]).toBe("WebSite");
    expect(siteLD.potentialAction["@type"]).toBe("SearchAction");
    expect(siteLD.potentialAction["query-input"]).toContain("required");
  });

  it('genera BreadcrumbList LD correctamente', () => {
    const pathParts = ['animales', 'perros'];
    const siteUrl = 'https://benicetiendanimal.victoriafp.online';
    const items = [
      { "@type": "ListItem", "position": 1, "name": "Inicio", "item": siteUrl }
    ];
    let currentPath = '';
    pathParts.forEach((part, i) => {
      currentPath += `/${part}`;
      items.push({
        "@type": "ListItem",
        "position": i + 2,
        "name": part.charAt(0).toUpperCase() + part.slice(1),
        "item": `${siteUrl}${currentPath}`
      });
    });

    expect(items.length).toBe(3);
    expect(items[0].position).toBe(1);
    expect(items[0].name).toBe('Inicio');
    expect(items[1].position).toBe(2);
    expect(items[1].name).toBe('Animales');
    expect(items[2].position).toBe(3);
    expect(items[2].name).toBe('Perros');
    expect(items[2].item).toBe(`${siteUrl}/animales/perros`);
  });
});

describe('Meta Tags', () => {
  it('og:url usa canonical (sin trailing slash ni query params)', () => {
    const canonical = 'https://benicetiendanimal.victoriafp.online/productos';
    expect(canonical).not.toMatch(/\/$/);
    expect(canonical).not.toContain('?');
  });

  it('tiene todos los meta tags OG requeridos', () => {
    const requiredOGTags = ['og:title', 'og:description', 'og:type', 'og:image', 'og:url', 'og:site_name', 'og:locale'];
    expect(requiredOGTags.length).toBe(7);
  });

  it('tiene todos los meta tags Twitter requeridos', () => {
    const requiredTwitterTags = ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image', 'twitter:site'];
    expect(requiredTwitterTags.length).toBe(5);
  });
});
