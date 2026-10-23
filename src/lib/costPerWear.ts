import { daysBetween, formatEuros } from './format';
import { PREMIUM_PRICES } from './features';
import type { Watch, WearLog } from '../types';

/** Une montre est « dormante » sans port depuis 60 jours (ou jamais portée après 30 jours dans la collection). */
export const DORMANT_DAYS = 60;
const SETTLE_DAYS = 30;

export interface WatchCost {
  watch: Watch;
  wears: number;
  lastWorn: string | null;
  idleDays: number | null;
  price: number | null;
  /** Prix d'achat divisé par le nombre de jours portés. null si prix inconnu ou jamais portée. */
  costPerWear: number | null;
  dormant: boolean;
}

export interface CostAnalysis {
  rows: WatchCost[];
  dormant: WatchCost[];
  /** Valeur (estimée, sinon prix d'achat) des montres dormantes. */
  dormantValue: number;
  /** La montre au coût par port le plus élevé (celle qu'on porte trop peu pour ce qu'elle a coûté). */
  priciest: WatchCost | null;
  /** La mieux rentabilisée. */
  cheapest: WatchCost | null;
  pricedCount: number;
  totalWears: number;
}

export function analyseCosts(watches: Watch[], wears: WearLog[]): CostAnalysis {
  const per = new Map<string, { n: number; last: string | null }>();
  for (const l of wears) {
    const p = per.get(l.watch_id) ?? { n: 0, last: null };
    p.n++;
    if (!p.last || l.worn_on > p.last) p.last = l.worn_on;
    per.set(l.watch_id, p);
  }
  const rows: WatchCost[] = watches.map(w => {
    const p = per.get(w.id) ?? { n: 0, last: null };
    const price = w.purchase_price !== null && Number(w.purchase_price) > 0 ? Number(w.purchase_price) : null;
    const idleDays = p.last ? daysBetween(p.last) : null;
    const ownedDays = daysBetween((w.purchase_date ?? w.created_at).slice(0, 10));
    return {
      watch: w, wears: p.n, lastWorn: p.last, idleDays, price,
      costPerWear: price && p.n ? price / p.n : null,
      dormant: idleDays === null ? ownedDays >= SETTLE_DAYS : idleDays >= DORMANT_DAYS,
    };
  });
  const worn = rows.filter(r => r.costPerWear !== null).sort((a, b) => b.costPerWear! - a.costPerWear!);
  const dormant = rows.filter(r => r.dormant);
  return {
    rows, dormant,
    dormantValue: dormant.reduce((a, r) => a + (Number(r.watch.current_estimated_value) || r.price || 0), 0),
    priciest: worn[0] ?? null,
    cheapest: worn.length > 1 ? worn[worn.length - 1] : null,
    pricedCount: rows.filter(r => r.price).length,
    totalWears: wears.length,
  };
}

/** Phrase de comparaison avec le prix de Premium, à partir d'un vrai chiffre de la collection. */
export function premiumAnchor(a: CostAnalysis): string {
  const year = PREMIUM_PRICES.year.amount;
  if (a.priciest && a.priciest.costPerWear! > 20) {
    return `Premium coûte ${year} par an : moins qu'un seul port de votre ${a.priciest.watch.model}.`;
  }
  return `Premium coûte ${year} par an, soit ${formatEuros(20 / 12, true)} par mois.`;
}
