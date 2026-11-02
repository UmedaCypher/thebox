/**
 * Où tourne l'app : site web, ou application Android du Play Store (la PWA emballée en TWA).
 *
 * Dans l'application Android, Google interdit de vendre un abonnement autrement que par Google Play,
 * et de renvoyer vers un paiement extérieur. Arcora n'y vend donc rien : Premium s'achète sur le site,
 * et un compte Premium l'est aussi dans l'application.
 *
 * L'application s'ouvre sur « /?app=android » (adresse de lancement réglée dans PWABuilder) ; on le retient
 * pour la session. sessionStorage et non localStorage : la TWA partage le stockage de Chrome, et le site
 * ouvert ensuite dans Chrome ne doit pas se croire dans l'application.
 */
const KEY = 'arcora-android-app';

export function detectAndroidApp() {
  try {
    const fromApp = new URLSearchParams(window.location.search).get('app') === 'android'
      || document.referrer.startsWith('android-app://');
    if (fromApp) sessionStorage.setItem(KEY, '1');
  } catch { /* stockage indisponible */ }
}

export function isAndroidApp() {
  try { return sessionStorage.getItem(KEY) === '1'; } catch { return false; }
}
