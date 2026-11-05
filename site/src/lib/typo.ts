// @ts-expect-error module JS sans types
import { frTypo } from './rehype-figure.mjs';
import type { Lang } from './i18n';

/** Applique la typographie française aux titres et descriptions affichés. */
export const typo = (s: string, lang: Lang): string => (lang === 'fr' ? frTypo(s) : s);
