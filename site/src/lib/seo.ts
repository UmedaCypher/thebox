import { SITE, T, magazinePath, type Lang } from './i18n';
import { DEFAULT_AUTHOR, personId } from './authors';

/**
 * Référencement du magazine : identité de la marque (Organization, WebSite), titres de page,
 * et FAQ détectée dans le texte des articles (FAQPage, lue par Google et les moteurs IA).
 */

export const ORG_ID = `${SITE}/#organization`;
export const WEBSITE_ID = `${SITE}/#website`;

/**
 * Profils officiels d'Arcora (YouTube, Instagram, TikTok…). Les ajouter ici renforce l'identité
 * de la marque auprès de Google et des moteurs IA (sameAs). Laisser vide tant qu'ils n'existent pas.
 */
export const SAME_AS: string[] = [];

/** Identité de la marque, déclarée sur chaque page du magazine. */
export function siteGraph(lang: Lang) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': ORG_ID,
        name: 'Arcora',
        url: `${SITE}/`,
        logo: { '@type': 'ImageObject', url: `${SITE}/icons/icon-512x512.png`, width: 512, height: 512 },
        description: lang === 'fr'
          ? "Arcora est l'app des collectionneurs de montres : catalogue de collection, carnet de portage, entretien, galerie au poignet et marché entre particuliers."
          : 'Arcora is the app for watch collectors: collection catalogue, wear log, servicing, wrist gallery and a marketplace between collectors.',
        founder: { '@id': personId(DEFAULT_AUTHOR) },
        ...(SAME_AS.length ? { sameAs: SAME_AS } : {}),
      },
      {
        '@type': 'Person',
        '@id': personId(DEFAULT_AUTHOR),
        name: DEFAULT_AUTHOR.name,
        url: `${SITE}/magazine/auteur/${DEFAULT_AUTHOR.slug}/`,
        sameAs: DEFAULT_AUTHOR.sameAs,
      },
      {
        '@type': 'WebSite',
        '@id': WEBSITE_ID,
        name: 'Arcora',
        url: `${SITE}/`,
        inLanguage: ['fr', 'en'],
        publisher: { '@id': ORG_ID },
      },
    ],
  };
}

/** Titre de page : « Titre | Arcora » quand ça tient dans ~60 caractères, sinon le titre seul (Google le tronquerait). */
export const pageTitle = (title: string) => (title.length + 9 <= 62 ? `${title} | Arcora` : title);

const FAQ_HEADINGS = /^(questions fréquentes|questions courantes|faq|frequently asked questions|common questions)\s*$/i;

/** Retire la mise en forme Markdown d'un texte court (réponse de FAQ). */
const plain = (md: string) =>
  md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`>#]/g, '')
    .replace(/^\s*[-+]\s+/gm, '')
    .replace(/\n{2,}/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();

/**
 * FAQ d'un article : section « ## Questions fréquentes » (ou « ## Frequently asked questions »),
 * chaque « ### Question ? » suivie de sa réponse. Aucune section : aucune donnée structurée.
 */
export function faqFromMarkdown(body = '') {
  const lines = body.split('\n');
  const start = lines.findIndex((l) => /^##\s+/.test(l) && FAQ_HEADINGS.test(l.replace(/^##\s+/, '')));
  if (start < 0) return [];
  const items: { q: string; a: string }[] = [];
  let cur: { q: string; a: string[] } | null = null;
  for (const l of lines.slice(start + 1)) {
    if (/^##\s+/.test(l)) break;
    const q = l.match(/^###\s+(.+)$/);
    if (q) {
      if (cur) items.push({ q: cur.q, a: plain(cur.a.join('\n')) });
      cur = { q: q[1].trim(), a: [] };
    } else if (cur) cur.a.push(l);
  }
  if (cur) items.push({ q: cur.q, a: plain(cur.a.join('\n')) });
  return items.filter((i) => i.q && i.a);
}

export function faqSchema(items: { q: string; a: string }[], lang: Lang) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: lang,
    mainEntity: items.map((i) => ({
      '@type': 'Question',
      name: i.q,
      acceptedAnswer: { '@type': 'Answer', text: i.a },
    })),
  };
}

/** Nombre de mots d'un texte Markdown (pour wordCount). */
export const wordCount = (md = '') => plain(md).split(/\s+/).filter(Boolean).length;

export const blogId = (lang: Lang) => `${SITE}${magazinePath(lang)}#blog`;
export const blogName = (lang: Lang) => `Arcora — ${T[lang].magazine}`;
