/** Flux RSS des sites horlogers lus par la page Actualités et l'encart « À lire ». */
export const NEWS_FEEDS = [
  { value: 'https://www.lecalibre.com/feed/', label: 'Le Calibre' },
  { value: 'https://www.lesrhabilleurs.com/feed/', label: 'Les Rhabilleurs' },
  { value: 'https://thewatchobserver.ouest-france.fr/feed/', label: 'Watch Observer' },
  { value: 'https://www.mrmontre.com/feed', label: 'Mr Montre' },
  { value: 'https://www.watches-news.com/fr/feed/', label: 'Watches News' },
];

export interface MagazineArticle {
  title: string;
  description: string;
  category: string;
  url: string;
  cover: string | null;
  publishedAt: string;
}

/**
 * Derniers articles du magazine Arcora (site statique du dossier site/, même domaine que l'app).
 * Renvoie une liste vide si le magazine n'est pas servi (par exemple avec `npm run dev`).
 */
export async function fetchMagazine(lang: 'fr' | 'en'): Promise<MagazineArticle[]> {
  try {
    const res = await fetch(lang === 'fr' ? '/magazine/articles.json' : '/en/magazine/articles.json');
    if (!res.ok || !res.headers.get('content-type')?.includes('json')) return [];
    return await res.json();
  } catch {
    return [];
  }
}
