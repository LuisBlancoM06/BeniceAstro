// Utilidades compartidas para productos — Single Source of Truth

/** Gradientes por tipo de animal + categoría para placeholders de imagen */
export function getCategoryGradient(animal: string, category: string): string {
  const gradients: Record<string, Record<string, string>> = {
    perro: {
      alimentacion: 'from-orange-400 to-amber-600',
      higiene: 'from-cyan-400 to-blue-500',
      salud: 'from-green-400 to-emerald-600',
      accesorios: 'from-blue-400 to-indigo-600',
      juguetes: 'from-yellow-400 to-orange-500',
    },
    gato: {
      alimentacion: 'from-purple-400 to-violet-600',
      higiene: 'from-fuchsia-400 to-pink-600',
      salud: 'from-teal-400 to-cyan-600',
      accesorios: 'from-rose-400 to-pink-600',
      juguetes: 'from-indigo-400 to-purple-600',
    },
    otros: {
      alimentacion: 'from-lime-400 to-green-600',
      higiene: 'from-sky-400 to-blue-600',
      salud: 'from-emerald-400 to-teal-600',
      accesorios: 'from-amber-400 to-yellow-600',
      juguetes: 'from-sky-400 to-indigo-500',
    },
  };
  return gradients[animal]?.[category] || 'from-gray-400 to-gray-600';
}

/** Emoji por tipo de animal */
export function getAnimalEmoji(animal: string): string {
  switch (animal) {
    case 'perro': return '🐕';
    case 'gato': return '🐱';
    default: return '🐾';
  }
}

/** Label localizado por tipo de animal */
export function getAnimalLabel(animal: string): string {
  switch (animal) {
    case 'perro': return 'Perro';
    case 'gato': return 'Gato';
    default: return 'Otros';
  }
}

/** Detectar si una URL es placeholder */
export function isPlaceholder(url: string): boolean {
  return !url || url.includes('placehold') || url.includes('placeholder') || url === '';
}

/** SVG icon paths por especie (para Astro templates) */
export function getAnimalSvgPath(animal: string): string {
  if (animal === 'perro') {
    return '<svg class="w-24 h-24 text-white/30" fill="currentColor" viewBox="0 0 24 24"><path d="M18 4c-.55 0-1.05.22-1.41.59L12 9.17 7.41 4.59C7.05 4.22 6.55 4 6 4c-1.1 0-2 .9-2 2v4c0 1.1.45 2.1 1.17 2.83L9 16.66V20c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-3.34l3.83-3.83C19.55 12.1 20 11.1 20 10V6c0-1.1-.9-2-2-2z"/></svg>';
  }
  if (animal === 'gato') {
    return '<svg class="w-24 h-24 text-white/30" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6zm4 4h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>';
  }
  return '<svg class="w-24 h-24 text-white/30" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>';
}
