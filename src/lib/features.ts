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

/** Prix envisagé, affiché sur la page Premium comme une indication. */
export const PREMIUM_PRICE_HINT = 'environ 39 € par an';

/**
 * Adresse affichée sur la page Contact (lien mailto).
 * À RENSEIGNER avant la mise en ligne : tant qu'elle est vide, la page l'indique.
 */
export const CONTACT_EMAIL = '';
