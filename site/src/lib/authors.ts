import { SITE, type Lang } from './i18n';

/**
 * Auteurs du magazine. La clé est le nom saisi dans le champ « Auteur » du backoffice.
 * Un auteur connu reçoit une page (/magazine/auteur/<slug>/), un encadré sous ses articles
 * et un schéma Person relié à ses profils (sameAs) : c'est ce qui montre à Google et aux
 * moteurs IA qui écrit, et pourquoi on peut lui faire confiance (E-E-A-T).
 */
export interface Author {
  name: string;
  slug: string;
  jobTitle: Record<Lang, string>;
  bio: Record<Lang, string>;
  links: { label: string; url: string }[];
  /** Profils qui identifient la même personne (LinkedIn, YouTube, registre des entreprises, sites). */
  sameAs: string[];
}

export const AUTHORS: Record<string, Author> = {
  'Quentin Mahé': {
    name: 'Quentin Mahé',
    slug: 'quentin-mahe',
    jobTitle: {
      fr: "Fondateur d'Arcora",
      en: 'Founder of Arcora',
    },
    bio: {
      fr: "Passionné d'horlogerie, Quentin Mahé est le créateur d'Arcora, l'app des collectionneurs. Il anime la chaîne YouTube MAHEwatches, consacrée à l'horlogerie, dirige la société Mahe Fine Collectibles et a fondé Maison Mahé, une marque de bracelets de montre et d'accessoires.",
      en: 'A watch enthusiast, Quentin Mahé is the creator of Arcora, the app for watch collectors. He runs the watch-focused YouTube channel MAHEwatches, heads the company Mahe Fine Collectibles and founded Maison Mahé, a brand of watch straps and accessories.',
    },
    links: [
      { label: 'YouTube · MAHEwatches', url: 'https://www.youtube.com/@MAHEwatches' },
      { label: 'LinkedIn', url: 'https://www.linkedin.com/in/quentin-mah%C3%A9-30072a74/' },
      { label: 'Maison Mahé', url: 'https://maison-mahe.com/' },
      { label: 'Mahe Fine Collectibles', url: 'https://annuaire-entreprises.data.gouv.fr/entreprise/mahe-fine-collectibles-104672431' },
    ],
    sameAs: [
      'https://www.youtube.com/@MAHEwatches',
      'https://www.linkedin.com/in/quentin-mah%C3%A9-30072a74/',
      'https://maison-mahe.com/',
      'https://annuaire-entreprises.data.gouv.fr/entreprise/mahe-fine-collectibles-104672431',
    ],
  },
};

/** Auteur affiché pour les articles signés « Arcora » (ou sans auteur connu) : le fondateur. */
export const DEFAULT_AUTHOR = AUTHORS['Quentin Mahé'];

export const authorFor = (name?: string) => AUTHORS[name ?? ''] ?? DEFAULT_AUTHOR;

export const authorPath = (a: Author, lang: Lang) =>
  lang === 'fr' ? `/magazine/auteur/${a.slug}/` : `/en/magazine/author/${a.slug}/`;

export const personId = (a: Author) => `${SITE}/#${a.slug}`;

/** Schéma Person de l'auteur, relié à Arcora. */
export function personSchema(a: Author, lang: Lang) {
  return {
    '@type': 'Person',
    '@id': personId(a),
    name: a.name,
    jobTitle: a.jobTitle[lang],
    description: a.bio[lang],
    url: SITE + authorPath(a, 'fr'),
    sameAs: a.sameAs,
    worksFor: { '@id': `${SITE}/#organization` },
    knowsAbout: lang === 'fr'
      ? ['Horlogerie', 'Montres mécaniques', 'Collection de montres', 'Bracelets de montre']
      : ['Watchmaking', 'Mechanical watches', 'Watch collecting', 'Watch straps'],
  };
}
