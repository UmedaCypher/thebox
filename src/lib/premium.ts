import { Coins, MoonStar, Wrench } from 'lucide-react';
import { FREE_WATCH_LIMIT } from './features';

/** Les trois avantages qui rentabilisent Premium, mis en avant sur la page Premium. */
export const PREMIUM_HIGHLIGHTS = [
  { icon: Coins, title: 'Coût par port', text: 'Ce que chaque montre vous coûte vraiment. De quoi réfléchir avant le prochain achat.' },
  { icon: MoonStar, title: 'Montres dormantes', text: "Celles qui ne sortent plus du tiroir et l'argent qu'elles immobilisent, à revendre sur le Marché." },
  { icon: Wrench, title: "Carnet d'entretien", text: "Révisions, frais et rappels d'échéance : une montre suivie se garde mieux, et se revend mieux." },
];

/** Les autres avantages. */
export const PREMIUM_FEATURES = [
  { title: 'Collection illimitée', text: `Au-delà de ${FREE_WATCH_LIMIT} montres.` },
  { title: 'Suivi de valeur', text: "L'évolution de la valeur que vous déclarez, et la rotation de la collection." },
  { title: 'Export assurance', text: 'Un inventaire PDF avec photos, références et valeurs.' },
  { title: 'Wishlist', text: 'Les montres que vous cherchez, avec votre prix cible.' },
];

/** Liste complète, pour la feuille Premium. */
export const ALL_PREMIUM_FEATURES = [...PREMIUM_HIGHLIGHTS.map(({ title, text }) => ({ title, text })), ...PREMIUM_FEATURES];
