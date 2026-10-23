/* eslint-disable react-refresh/only-export-components -- module mixte : fournisseur React et fonctions de traduction */
/**
 * Traductions français / anglais.
 *
 * Chaque page déclare ses textes à côté de son code :
 *
 *   const S = defineStrings({
 *     title: 'Collection',
 *     watches: (n: number) => (n > 1 ? `${n} montres` : `${n} montre`),
 *   }, {
 *     title: 'Collection',
 *     watches: n => (n === 1 ? '1 watch' : `${n} watches`),
 *   });
 *   const t = useStrings(S);   // dans un composant
 *   t.title; t.watches(3);
 *
 * Le français est la référence : TypeScript refuse une traduction anglaise incomplète.
 * Hors composant (messages d'erreur, formats), utiliser tr(S).
 *
 * Langue : choix du profil (« fr » ou « en »), sinon choix mémorisé sur l'appareil,
 * sinon langue du système (français si elle commence par « fr », anglais sinon).
 */
import { createContext, Fragment, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type Lang = 'fr' | 'en';
export type LangChoice = 'auto' | Lang;

/* ---------- Langue courante (lisible partout, y compris hors React) ---------- */

const KEY = 'thebox-lang';

export const systemLang = (): Lang => {
  const langs = typeof navigator !== 'undefined' ? (navigator.languages?.length ? navigator.languages : [navigator.language]) : [];
  return (langs[0] ?? 'fr').toLowerCase().startsWith('fr') ? 'fr' : 'en';
};

/** « fr » ou « en » si c'est un choix explicite ; les anciennes valeurs (« fr-FR ») valent « automatique ». */
export const parseChoice = (v: string | null | undefined): LangChoice => (v === 'fr' || v === 'en' ? v : 'auto');

const readStored = (): LangChoice => {
  try { return parseChoice(localStorage.getItem(KEY)); } catch { return 'auto'; }
};

let current: Lang = (() => { const c = readStored(); return c === 'auto' ? systemLang() : c; })();

export const getLang = () => current;
/** Locale pour Intl (nombres, dates, monnaie). */
export const getLocale = () => (current === 'fr' ? 'fr-FR' : 'en-GB');

/* ---------- Déclaration des textes ---------- */

type Shape<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => string ? (...args: A) => string
    : T[K] extends string ? string
    : T[K] extends readonly unknown[] ? Shape<T[K]>
    : Shape<T[K]>;
};

export interface Strings<F> { fr: F; en: F }

export function defineStrings<F extends object>(fr: F, en: Shape<F>): Strings<F> {
  return { fr, en: en as unknown as F };
}

/** Textes dans la langue courante, hors composant. */
export const tr = <F,>(s: Strings<F>): F => s[current];

/* ---------- Contexte React ---------- */

interface LangContextValue {
  lang: Lang;
  choice: LangChoice;
  /** Change la langue sur cet appareil ; l'appelant enregistre aussi le choix dans le profil s'il y en a un. */
  setChoice: (c: LangChoice) => void;
}

const LangContext = createContext<LangContextValue>({ lang: current, choice: 'auto', setChoice: () => {} });

export function useLang() { return useContext(LangContext); }

/** Textes d'un composant dans la langue courante. */
export function useStrings<F>(s: Strings<F>): F {
  return s[useContext(LangContext).lang];
}

/**
 * Fournit la langue. `profileChoice` : valeur de profiles.preferred_language (prioritaire si « fr » ou « en »).
 * Au changement de langue, toute l'application est redessinée.
 */
export function LangProvider({ profileChoice, children }: { profileChoice: string | null | undefined; children: ReactNode }) {
  const [choice, setChoiceState] = useState<LangChoice>(readStored);

  // Le choix enregistré dans le profil suit l'utilisateur d'un appareil à l'autre.
  useEffect(() => {
    const c = parseChoice(profileChoice);
    if (c === 'auto') return; // pas de choix explicite dans le profil : on garde celui de l'appareil
    setChoiceState(c);
    try { localStorage.setItem(KEY, c); } catch { /* stockage indisponible */ }
  }, [profileChoice]);

  const lang: Lang = choice === 'auto' ? systemLang() : choice;
  current = lang;

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const setChoice = useCallback((c: LangChoice) => {
    setChoiceState(c);
    try { localStorage.setItem(KEY, c); } catch { /* stockage indisponible */ }
  }, []);

  const value = useMemo(() => ({ lang, choice, setChoice }), [lang, choice, setChoice]);
  return (
    <LangContext.Provider value={value}>
      <Fragment key={lang}>{children}</Fragment>
    </LangContext.Provider>
  );
}
