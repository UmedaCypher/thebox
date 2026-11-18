// Magazine Arcora : site statique Astro servi sous arcorawatch.com/magazine (FR) et /en/magazine (EN).
// Il est construit après l'app (npm run build à la racine) puis copié dans le même dossier dist/ :
// l'app reste à la racine, sans redirection.
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import rehypeFigure, { rehypeFrenchTypo } from './src/lib/rehype-figure.mjs';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const SITE = 'https://arcorawatch.com';

// Pages publiques de l'app à déclarer aussi dans le sitemap (l'app elle-même n'en génère pas).
const APP_PUBLIC_PAGES = [
  '/', '/galerie', '/marche', '/premium', '/faq', '/a-propos', '/contact', '/presse', '/arcora-vs', '/montres-volees',
];

// Pages « au poignet » trop minces (moins de 3 photos) : en ligne pour les membres, hors du sitemap (noindex).
const MODELS_FILE = new URL('./src/data/wrist-models.generated.json', import.meta.url);
const thinModelPages = new Set(
  (existsSync(MODELS_FILE) ? JSON.parse(readFileSync(MODELS_FILE, 'utf8')) : [])
    .filter((m) => m.photo_count < 3).map((m) => `${SITE}/au-poignet/${m.slug}/`),
);

// Date de dernière modification de chaque article (balise <lastmod> du sitemap) :
// lue dans les fichiers Markdown écrits par scripts/sync-articles.mjs juste avant la construction.
const articleDates = new Map();
for (const lang of ['fr', 'en']) {
  const dir = new URL(`./src/content/articles/${lang}/`, import.meta.url);
  if (!existsSync(dir)) continue;
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.md'))) {
    const fm = readFileSync(new URL(file, dir), 'utf8').split('---')[1] ?? '';
    const date = (fm.match(/^updatedAt:\s*"?([\d-]+)/m) ?? fm.match(/^publishedAt:\s*"?([\d-]+)/m))?.[1];
    if (/^\d{4}-\d{2}-\d{2}$/.test(date ?? '') && !/^draft:\s*true/m.test(fm)) {
      const base = lang === 'fr' ? '/magazine/' : '/en/magazine/';
      articleDates.set(`${SITE}${base}${file.replace(/\.md$/, '')}/`, date);
    }
  }
}
const newest = [...articleDates.values()].sort().pop();

export default defineConfig({
  site: SITE,
  trailingSlash: 'always',
  build: { format: 'directory' },
  // Images optimisées (WebP, plusieurs tailles, largeur et hauteur fixées pour éviter les sauts de mise en page).
  image: { layout: 'constrained', responsiveStyles: true },
  markdown: { rehypePlugins: [rehypeFigure, rehypeFrenchTypo] },
  integrations: [
    sitemap({
      customPages: APP_PUBLIC_PAGES.map((p) => SITE + p),
      filter: (page) => !thinModelPages.has(page),
      serialize: (item) => {
        const date = articleDates.get(item.url)
          ?? (/\/magazine\/$/.test(item.url) ? newest : undefined);
        return date ? { ...item, lastmod: new Date(date).toISOString() } : item;
      },
      i18n: { defaultLocale: 'fr', locales: { fr: 'fr-FR', en: 'en-US' } },
    }),
  ],
});
