import { Coins, MoonStar, Wrench } from 'lucide-react';
import { FREE_WATCH_LIMIT } from './features';
import { defineStrings, tr } from '../i18n';

const S = defineStrings({
  highlights: [
    { title: 'Coût par port', text: 'Ce que chaque montre vous coûte vraiment. De quoi réfléchir avant le prochain achat.' },
    { title: 'Montres dormantes', text: "Celles qui ne sortent plus du tiroir et l'argent qu'elles immobilisent, à revendre sur le Marché." },
    { title: "Carnet d'entretien", text: "Révisions, frais et rappels d'échéance : une montre suivie se garde mieux, et se revend mieux." },
  ],
  features: [
    { title: 'Collection illimitée', text: `Au-delà de ${FREE_WATCH_LIMIT} montres.` },
    { title: 'Suivi de valeur', text: "L'évolution de la valeur que vous déclarez, et la rotation de la collection." },
    { title: 'Export assurance', text: 'Un inventaire PDF avec photos, références et valeurs.' },
    { title: 'Wishlist', text: 'Les montres que vous cherchez, avec votre prix cible.' },
  ],
}, {
  highlights: [
    { title: 'Cost per wear', text: 'What each watch really costs you every time you wear it. Food for thought before the next purchase.' },
    { title: 'Dormant watches', text: 'The ones that never leave the drawer, and the money they tie up, ready to sell on the Market.' },
    { title: 'Service log', text: 'Services, costs and due-date reminders: a well-kept watch lasts longer and sells better.' },
  ],
  features: [
    { title: 'Unlimited collection', text: `More than ${FREE_WATCH_LIMIT} watches.` },
    { title: 'Value tracking', text: 'How the value you declare evolves, and how your collection rotates.' },
    { title: 'Insurance export', text: 'A PDF inventory with photos, references and values.' },
    { title: 'Wishlist', text: 'The watches you are looking for, with your target price.' },
  ],
});

const ICONS = [Coins, MoonStar, Wrench];

/** Les trois avantages qui rentabilisent Premium, mis en avant sur la page Premium. */
export const premiumHighlights = () => tr(S).highlights.map((h, i) => ({ ...h, icon: ICONS[i] }));

/** Les autres avantages. */
export const premiumFeatures = () => tr(S).features;

/** Liste complète, pour la feuille Premium. */
export const allPremiumFeatures = () => [...tr(S).highlights, ...tr(S).features];
