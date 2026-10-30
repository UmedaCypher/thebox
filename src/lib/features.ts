import { defineStrings, tr } from '../i18n';

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
const PRICES = defineStrings<Record<BillingInterval, { amount: string; period: string; note?: string }>>({
  month: { amount: '3 €', period: 'par mois' },
  year: { amount: '30 €', period: 'par an', note: '2 mois offerts' },
}, {
  month: { amount: '€3', period: 'per month' },
  year: { amount: '€30', period: 'per year', note: '2 months free' },
});
export const premiumPrices = () => tr(PRICES);
/** Prix TTC en euros, pour les calculs (coût par port, affiliation). Garder identique aux prix Stripe. */
export const PREMIUM_YEAR_EUR = 30;
export const PREMIUM_MONTH_EUR = 3;

/* ---------- Parrainage et affiliation (mêmes valeurs que la migration et le webhook) ---------- */
export type AffiliateKind = 'member' | 'creator' | 'pro';
/**
 * Les trois types. Garder identique à private.affiliate_perks() dans la migration du 29/10.
 *  commission : part de la première année d'abonnement annuel, hors taxes
 *  welcomeDays : Premium offert au filleul à l'inscription
 *  rewardDays : Premium offert au parrain quand le filleul a ajouté 3 montres
 */
export const AFFILIATE_TYPES: Record<AffiliateKind, { commission: number; welcomeDays: number; rewardDays: number }> = {
  member: { commission: 0, welcomeDays: 30, rewardDays: 30 },
  creator: { commission: 0.3, welcomeDays: 90, rewardDays: 0 },
  pro: { commission: 0, welcomeDays: 90, rewardDays: 0 },
};
/** Nombre maximum de mois gagnés par un membre en parrainant, par an. */
export const MEMBER_REWARDS_PER_YEAR = 12;
/** Part de la première année d'abonnement annuel reversée à l'ambassadeur, sur le prix hors taxes. */
export const AFFILIATE_RATE = AFFILIATE_TYPES.creator.commission;
/** Délai avant qu'une commission soit payable (après les 14 jours de rétractation). */
export const AFFILIATE_HOLD_DAYS = 30;
/** Montant minimum pour un virement ; en dessous, le solde est reporté au mois suivant. */
export const AFFILIATE_MIN_PAYOUT_EUR = 50;
/** TVA française incluse dans le prix affiché, pour estimer la commission par abonné. */
export const VAT_RATE = 0.2;
/** Commission estimée par abonné annuel, en euros (7,50 € pour 30 € TTC). */
export const affiliateCommissionPerYear = () => Math.round((PREMIUM_YEAR_EUR / (1 + VAT_RATE)) * AFFILIATE_RATE * 100) / 100;

/**
 * Adresse affichée sur la page Contact (lien mailto).
 * Provisoire : à remplacer par l'adresse dédiée quand le nom définitif de l'app sera choisi.
 */
export const CONTACT_EMAIL = 'contact@maison-mahe.com';
