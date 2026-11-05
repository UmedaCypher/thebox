// Magazine Arcora : site statique Astro servi sous arcorawatch.com/magazine (FR) et /en/magazine (EN).
// Il est construit après l'app (npm run build à la racine) puis copié dans le même dossier dist/ :
// l'app reste à la racine, sans redirection.
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const SITE = 'https://arcorawatch.com';

// Pages publiques de l'app à déclarer aussi dans le sitemap (l'app elle-même n'en génère pas).
const APP_PUBLIC_PAGES = [
  '/', '/galerie', '/marche', '/premium', '/faq', '/a-propos', '/contact', '/presse',
];

export default defineConfig({
  site: SITE,
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [
    sitemap({
      customPages: APP_PUBLIC_PAGES.map((p) => SITE + p),
      i18n: { defaultLocale: 'fr', locales: { fr: 'fr-FR', en: 'en-US' } },
    }),
  ],
});
