import { supabase } from './supabaseClient';

/*
 * Marques et modèles : la saisie reste libre, mais on garde des noms propres pour les statistiques.
 * - la marque reprend l'écriture officielle quand elle n'en diffère que par la casse, les accents ou la ponctuation ;
 * - une faute probable (« Rollex ») déclenche une suggestion, jamais une correction forcée ;
 * - le modèle reprend l'écriture la plus courante dans la communauté pour cette marque.
 */

/** Clé de comparaison : minuscules, sans accents, sans espaces ni ponctuation. */
export const nameKey = (v: string) =>
  v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

const tidy = (v: string) => v.trim().replace(/\s+/g, ' ');

let brandsPromise: Promise<string[]> | null = null;
/** Liste officielle des marques (chargée une fois par session). */
export function loadBrands(): Promise<string[]> {
  brandsPromise ??= Promise.resolve(supabase.from('brands').select('name').order('name'))
    .then(({ data }) => (data ?? []).map(b => b.name as string))
    .catch(() => { brandsPromise = null; return []; });
  return brandsPromise;
}

const modelCache = new Map<string, Promise<string[]>>();
/** Modèles déjà saisis par plusieurs membres pour cette marque. */
export function loadModels(brand: string): Promise<string[]> {
  const k = nameKey(brand);
  if (k.length < 2) return Promise.resolve([]);
  let p = modelCache.get(k);
  if (!p) {
    p = Promise.resolve(supabase.rpc('get_model_suggestions', { p_brand: tidy(brand) }))
      .then(({ data, error }) => (error ? [] : ((data ?? []) as { model: string }[]).map(r => r.model)))
      .catch(() => []);
    modelCache.set(k, p);
  }
  return p;
}

/** Marque officielle de même écriture (casse, accents, ponctuation près), sinon null. */
export function officialBrand(input: string, brands: string[]): string | null {
  const k = nameKey(input);
  return k ? brands.find(b => nameKey(b) === k) ?? null : null;
}

function distance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]; row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cur = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
  }
  return row[b.length];
}

/** Marque officielle proche d'une saisie qui n'y correspond pas exactement (« Rollex » → « Rolex »). */
export function closeBrand(input: string, brands: string[]): string | null {
  const k = nameKey(input);
  if (k.length < 3 || officialBrand(input, brands)) return null;
  const max = k.length <= 5 ? 1 : 2;
  let best: string | null = null, bestD = max + 1;
  for (const b of brands) {
    const bk = nameKey(b);
    if (Math.abs(bk.length - k.length) > max) continue;
    const d = distance(k, bk);
    if (d < bestD) { best = b; bestD = d; }
  }
  return bestD <= max ? best : null;
}

/** Marque à enregistrer : l'écriture officielle si elle existe, sinon la saisie mise au propre. */
export function normalizeBrand(input: string, brands: string[]): string {
  const v = tidy(input);
  const official = officialBrand(v, brands);
  if (official) return official;
  // Tout en minuscules : on met des capitales aux mots (« san martin » → « San Martin »)
  return v === v.toLowerCase() ? v.replace(/(^|[\s\-&.])(\p{L})/gu, (_, sep: string, c: string) => sep + c.toUpperCase()) : v;
}

/** Modèle à enregistrer : l'écriture courante de la communauté si elle ne diffère que par la casse ou les espaces. */
export function normalizeModel(input: string, models: string[]): string {
  const v = tidy(input);
  const k = v.toLowerCase();
  return models.find(m => tidy(m).toLowerCase() === k) ?? v;
}
