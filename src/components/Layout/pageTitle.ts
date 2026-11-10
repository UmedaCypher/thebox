import { defineStrings, tr } from '../../i18n';

/*
 * Titre affiché dans l'en-tête sur téléphone, à la place du logo : on sait toujours où l'on est.
 * Du plus précis au plus général ; la première règle qui correspond l'emporte.
 */
const S = defineStrings({
  home: 'Accueil', collection: 'Collection', add: 'Ajouter une montre', watch: 'Montre', edit: 'Modifier la montre',
  wear: 'Portage', gallery: 'Galerie', market: 'Marché', messages: 'Messages', profile: 'Profil', stats: 'Statistiques',
  wishlist: 'Wishlist', premium: 'Premium', admin: 'Backoffice', affiliate: 'Parrainage', insurance: 'Inventaire',
  welcome: 'Bienvenue', news: 'Actualités', faq: 'Questions', about: 'À propos', contact: 'Contact', press: 'Presse',
  legal: 'Informations légales', passport: 'Passeport', compare: 'Comparateur', timegrapher: 'Timegrapher', feed: 'Fil', social: 'Social',
  vs: 'Comparatif', stolen: 'Montres volées', login: 'Connexion', signup: 'Inscription', password: 'Mot de passe',
}, {
  home: 'Home', collection: 'Collection', add: 'Add a watch', watch: 'Watch', edit: 'Edit watch',
  wear: 'Wear', gallery: 'Gallery', market: 'Market', messages: 'Messages', profile: 'Profile', stats: 'Statistics',
  wishlist: 'Wishlist', premium: 'Premium', admin: 'Back office', affiliate: 'Referrals', insurance: 'Inventory',
  welcome: 'Welcome', news: 'News', faq: 'FAQ', about: 'About', contact: 'Contact', press: 'Press',
  legal: 'Legal', passport: 'Passport', compare: 'Compare', timegrapher: 'Timegrapher', feed: 'Feed', social: 'Social',
  vs: 'Comparison', stolen: 'Stolen watches', login: 'Log in', signup: 'Sign up', password: 'Password',
});

type Key = keyof typeof S.fr;
const RULES: [RegExp, Key | ((m: RegExpMatchArray) => string)][] = [
  [/^\/accueil/, 'home'], [/^\/collection/, 'collection'], [/^\/ajouter-montre/, 'add'],
  [/^\/montre\/[^/]+\/modifier/, 'edit'], [/^\/montre\//, 'watch'], [/^\/portage/, 'wear'], [/^\/galerie/, 'gallery'],
  [/^\/marche/, 'market'], [/^\/messages/, 'messages'], [/^\/profil\/([^/]+)/, m => `@${decodeURIComponent(m[1])}`],
  [/^\/profil/, 'profile'], [/^\/stats/, 'stats'], [/^\/wishlist/, 'wishlist'], [/^\/premium/, 'premium'],
  [/^\/admin/, 'admin'], [/^\/affiliation/, 'affiliate'], [/^\/export/, 'insurance'], [/^\/bienvenue/, 'welcome'],
  [/^\/actualites/, 'news'], [/^\/faq/, 'faq'], [/^\/a-propos/, 'about'], [/^\/contact/, 'contact'], [/^\/presse/, 'press'],
  [/^\/(cgu|cgv|confidentialite|mentions-legales|suppression-compte)/, 'legal'], [/^\/passeport/, 'passport'],
  [/^\/comparer/, 'compare'], [/^\/timegrapher/, 'timegrapher'], [/^\/fil/, 'feed'], [/^\/arcora-vs/, 'vs'],
  [/^\/montres-volees/, 'stolen'], [/^\/login/, 'login'], [/^\/signup/, 'signup'], [/^\/(mot-de-passe|nouveau-mot-de-passe)/, 'password'],
];

/** Nom de la page pour l'en-tête mobile ; « Arcora » sur la page d'accueil publique et les pages inconnues. */
export function pageTitle(pathname: string, loggedIn = false): string {
  const t = tr(S);
  // Connecté, le fil, la galerie et les montres volées sont les onglets de la rubrique Social
  if (loggedIn && /^\/(fil|galerie|montres-volees)(\/|$)/.test(pathname)) return t.social;
  for (const [re, key] of RULES) {
    const m = pathname.match(re);
    if (m) return typeof key === 'function' ? key(m) : t[key];
  }
  return 'Arcora';
}
