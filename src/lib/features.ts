/**
 * Réglages produit en un seul endroit.
 *
 * Fonctionnalités en pause (code conservé dans src/paused, plus de route ni de lien) :
 *   espace revendeur (ProDashboardPage, ClientListPage, ClientDetailPage, InvoiceEditorPage, LocationManagerPage).
 * Pour en réactiver une : remettre sa route dans App.tsx.
 */

/** Nombre de montres dans la collection gratuite. Doit rester égal à public.free_watch_limit() en base. */
export const FREE_WATCH_LIMIT = 6;

/**
 * 'waitlist' : l'accueil propose la liste d'attente ; l'inscription reste possible via /signup (testeurs).
 * 'open'     : l'accueil propose de créer un compte.
 */
export const LAUNCH_MODE: 'waitlist' | 'open' = 'waitlist';

/**
 * Paiement Stripe actif. false : la page Premium propose la liste d'attente.
 * Passer à true une fois les fonctions et secrets Stripe en place (voir docs/stripe.md).
 */
export const PAYMENTS_ENABLED = false;

/**
 * Prix affichés. Les vrais prix sont ceux définis dans Stripe (STRIPE_PRICE_MONTHLY / STRIPE_PRICE_YEARLY) :
 * garder les deux identiques.
 */
export type BillingInterval = 'month' | 'year';
export const PREMIUM_PRICES: Record<BillingInterval, { amount: string; period: string; note?: string }> = {
  month: { amount: '2 €', period: 'par mois' },
  year: { amount: '20 €', period: 'par an', note: '2 mois offerts' },
};

/**
 * Adresse affichée sur la page Contact (lien mailto).
 * Provisoire : à remplacer par l'adresse dédiée quand le nom définitif de l'app sera choisi.
 */
export const CONTACT_EMAIL = 'contact@maison-mahe.com';
