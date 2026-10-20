/**
 * Réglages produit en un seul endroit.
 *
 * Fonctionnalités en pause (code conservé, plus de route ni de lien) :
 *   messagerie (MessagingPage), marché (MarketplacePage),
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

/** Prix affiché. Le vrai prix est celui défini dans Stripe : garder les deux identiques. */
export const PREMIUM_PRICE = { amount: '39 €', period: 'par an' };
export const PREMIUM_PRICE_LABEL = `${PREMIUM_PRICE.amount} ${PREMIUM_PRICE.period}`;

/**
 * Adresse affichée sur la page Contact (lien mailto).
 * À RENSEIGNER avant la mise en ligne : tant qu'elle est vide, la page l'indique.
 */
export const CONTACT_EMAIL = '';
