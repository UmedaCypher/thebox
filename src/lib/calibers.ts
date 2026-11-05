/**
 * Calibres courants, proposés à la saisie (le champ reste libre).
 * La valeur est le nom du calibre ; la marque du fabricant sert d'indication dans la liste.
 */
export const COMMON_CALIBERS: { value: string; maker: string }[] = [
  ['NH35', 'Seiko'], ['NH36', 'Seiko'], ['NH34', 'Seiko'], ['NH38', 'Seiko'], ['4R35', 'Seiko'], ['4R36', 'Seiko'],
  ['6R15', 'Seiko'], ['6R35', 'Seiko'], ['9S65', 'Grand Seiko'], ['9SA5', 'Grand Seiko'], ['9R65', 'Grand Seiko'], ['9F62', 'Grand Seiko'],
  ['8215', 'Miyota'], ['9015', 'Miyota'], ['9039', 'Miyota'],
  ['2824-2', 'ETA'], ['2892-A2', 'ETA'], ['2836-2', 'ETA'], ['2671', 'ETA'], ['6497', 'ETA'], ['6498', 'ETA'], ['7750', 'ETA / Valjoux'],
  ['SW200-1', 'Sellita'], ['SW300-1', 'Sellita'], ['SW500', 'Sellita'], ['SW510', 'Sellita'],
  ['3135', 'Rolex'], ['3235', 'Rolex'], ['3230', 'Rolex'], ['3285', 'Rolex'], ['4130', 'Rolex'], ['4131', 'Rolex'],
  ['1861', 'Omega'], ['3861', 'Omega'], ['8800', 'Omega'], ['8900', 'Omega'],
  ['MT5602', 'Tudor'], ['MT5402', 'Tudor'], ['MT5612', 'Tudor'],
  ['ST1901', 'Sea-Gull'], ['515', 'Ronda'], ['715', 'Ronda'],
].map(([value, maker]) => ({ value, maker }));

const key = (v: string) => v.toUpperCase().replace(/[\s\-.]/g, '');

/**
 * Mise au propre d'un calibre saisi : sans « Cal. » devant, espaces réduits, en capitales,
 * et à l'écriture connue quand il ne diffère que par les espaces ou les tirets (« sw 200 1 » → « SW200-1 »).
 */
export function normalizeCaliber(raw: string, known: string[] = []): string | null {
  const v = raw.trim().replace(/^cal(?:ibre|iber)?\.?\s*/i, '').replace(/\s+/g, ' ').toUpperCase();
  if (!v) return null;
  const k = key(v);
  return [...COMMON_CALIBERS.map(c => c.value), ...known].find(c => key(c) === k) ?? v;
}
