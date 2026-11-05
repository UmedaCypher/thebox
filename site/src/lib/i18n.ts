import { getCollection, type CollectionEntry } from 'astro:content';

export type Lang = 'fr' | 'en';
export type Article = CollectionEntry<'articles'>;

export const SITE = 'https://arcorawatch.com';

export const T = {
  fr: {
    locale: 'fr-FR',
    magazine: 'Magazine',
    magazineTitle: 'Le magazine Arcora : guides pour collectionneurs de montres',
    magazineDescription:
      "Guides pratiques pour bien choisir, entretenir et suivre votre collection de montres : tailles, valeur, révision, photo.",
    intro: 'Guides pratiques pour choisir, porter et entretenir vos montres.',
    openApp: "Ouvrir l'app",
    readingTime: (m: number) => `${m} min de lecture`,
    updated: 'Mis à jour le',
    by: 'Par',
    ctaTitle: 'Votre collection mérite son écrin',
    ctaText:
      'Cataloguez vos montres, notez ce que vous portez chaque jour et suivez leur entretien. Gratuit jusqu’à 6 montres.',
    ctaButton: 'Créer mon écrin',
    related: 'À lire aussi',
    allArticles: 'Tous les articles',
    otherLang: 'English',
    footerApp: "L'app",
    gallery: 'Galerie au poignet',
    market: 'Marché',
    premium: 'Premium',
    faq: 'FAQ',
    legal: 'Mentions légales',
    privacy: 'Confidentialité',
    empty: 'Les premiers articles arrivent bientôt.',
  },
  en: {
    locale: 'en-US',
    magazine: 'Magazine',
    magazineTitle: 'The Arcora magazine: guides for watch collectors',
    magazineDescription:
      'Practical guides to choose, service and keep track of your watch collection: sizing, value, servicing, photography.',
    intro: 'Practical guides to choosing, wearing and caring for your watches.',
    openApp: 'Open the app',
    readingTime: (m: number) => `${m} min read`,
    updated: 'Updated',
    by: 'By',
    ctaTitle: 'Your collection deserves a proper home',
    ctaText:
      'Catalogue your watches, log what you wear every day and keep track of servicing. Free for up to 6 watches.',
    ctaButton: 'Start my collection',
    related: 'Keep reading',
    allArticles: 'All articles',
    otherLang: 'Français',
    footerApp: 'The app',
    gallery: 'Wrist gallery',
    market: 'Market',
    premium: 'Premium',
    faq: 'FAQ',
    legal: 'Legal notice',
    privacy: 'Privacy',
    empty: 'The first articles are coming soon.',
  },
} as const;

/** Adresse de la page d'accueil du magazine dans une langue. */
export const magazinePath = (lang: Lang) => (lang === 'fr' ? '/magazine/' : '/en/magazine/');

/** Nom de fichier sans le dossier de langue : « fr/taille-montre-poignet » → « taille-montre-poignet ». */
export const slugOf = (a: Article) => a.id.split('/').pop()!;

export const articlePath = (a: Article) => `${magazinePath(a.data.lang)}${slugOf(a)}/`;

/** Articles publiés d'une langue, du plus récent au plus ancien. */
export async function getArticles(lang: Lang) {
  const all = await getCollection('articles', (a) => a.data.lang === lang && !a.data.draft);
  return all.sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());
}

/** Versions d'un article dans les autres langues (pour hreflang et le sélecteur de langue). */
export async function getTranslations(a: Article) {
  const all = await getCollection('articles', (x) => !x.data.draft);
  return all.filter((x) => x.data.translationKey === a.data.translationKey);
}

export const readingMinutes = (body = '') => Math.max(1, Math.round(body.split(/\s+/).length / 220));

export const formatDate = (d: Date, lang: Lang) =>
  d.toLocaleDateString(T[lang].locale, { day: 'numeric', month: 'long', year: 'numeric' });
