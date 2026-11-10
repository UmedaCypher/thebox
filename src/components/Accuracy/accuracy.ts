import { defineStrings, getLocale } from '../../i18n';

/** Lecture d'une marche, en mots simples. */
export const verdictKey = (rate: number) =>
  rate >= -4 && rate <= 6 ? 'chrono' : Math.abs(rate) <= 15 ? 'good' : Math.abs(rate) <= 30 ? 'fair' : 'check';

export const ACC_STRINGS = defineStrings({
  verdict: {
    chrono: 'Dans les tolérances chronomètre (−4 / +6 s par jour)',
    good: 'Bonne marche pour une montre mécanique',
    fair: 'Marche correcte, à surveiller',
    check: 'Écart important : à faire contrôler par un horloger',
  },
  positions: {
    dial_up: 'Cadran en haut', dial_down: 'Cadran en bas', crown_up: 'Couronne en haut', crown_down: 'Couronne en bas',
    crown_left: 'Couronne à gauche', crown_right: 'Couronne à droite', wrist: 'Portée au poignet (sur la journée)',
  },
  perDay: 's/j',
}, {
  verdict: {
    chrono: 'Within chronometer tolerances (−4 / +6 s a day)',
    good: 'Good rate for a mechanical watch',
    fair: 'Fair rate, keep an eye on it',
    check: 'Large deviation: have a watchmaker check it',
  },
  positions: {
    dial_up: 'Dial up', dial_down: 'Dial down', crown_up: 'Crown up', crown_down: 'Crown down',
    crown_left: 'Crown left', crown_right: 'Crown right', wrist: 'Worn on the wrist (over a day)',
  },
  perDay: 's/d',
});

export const signed = (n: number, digits = 1) =>
  `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toLocaleString(getLocale(), { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
