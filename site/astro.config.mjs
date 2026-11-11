// Magazine Arcora : site statique Astro servi sous arcorawatch.com/magazine (FR) et /en/magazine (EN).
// Il est construit après l'app (npm run build à la racine) puis copié dans le même dossier dist/ :
// l'app reste à la racine, sans redirection.
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import rehypeFigure, { rehypeFrenchTypo } from './src/lib/rehype-figure.mjs';
import { existsSync, readFileSync } from 'node:fs';

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
      i18n: { defaultLocale: 'fr', locales: { fr: 'fr-FR', en: 'en-US' } },
    }),
  ],
});
