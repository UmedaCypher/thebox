/*
 * Mesure d'audience (Google Tag Manager / Google Analytics) avec consentement préalable.
 * Utilisé par l'app (index.html) et par le magazine (site/src/layouts/Base.astro).
 *
 * - Rien n'est chargé chez Google tant que le visiteur n'a pas cliqué « Accepter » (exigence CNIL).
 * - Consent Mode v2 : tout est refusé par défaut ; seule la mesure d'audience est accordée à l'acceptation.
 * - Le choix est gardé 6 mois sur l'appareil (localStorage), puis redemandé.
 * - window.arcoraConsent.open() rouvre le bandeau (lien « Gérer les cookies »).
 */
(function () {
  var GTM_ID = 'GTM-55MQH6RF';
  var KEY = 'arcora-consent';
  var MAX_AGE = 1000 * 60 * 60 * 24 * 182; // 6 mois

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
  });

  function read() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (v && (v.choice === 'granted' || v.choice === 'denied') && Date.now() - v.at < MAX_AGE) return v.choice;
    } catch (e) { /* stockage indisponible */ }
    return null;
  }
  function save(choice) {
    try { localStorage.setItem(KEY, JSON.stringify({ choice: choice, at: Date.now() })); } catch (e) {}
  }

  var loaded = false;
  function loadGtm() {
    if (loaded) return;
    loaded = true;
    gtag('consent', 'update', { analytics_storage: 'granted' });
    // CNIL : cookies de mesure 13 mois au plus (390 jours). À régler aussi dans la balise Google de GTM.
    gtag('set', { cookie_expires: 60 * 60 * 24 * 390 });
    gtag('js', new Date());
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtm.js?id=' + GTM_ID;
    document.head.appendChild(s);
  }

  var fr = (document.documentElement.lang || navigator.language || 'fr').toLowerCase().indexOf('fr') === 0;
  var T = fr
    ? {
        text: 'Nous utilisons des cookies de mesure d’audience (Google Analytics) pour comprendre comment le site est utilisé et l’améliorer. Aucun cookie publicitaire.',
        more: 'En savoir plus',
        accept: 'Accepter',
        refuse: 'Refuser',
        label: 'Cookies de mesure d’audience',
      }
    : {
        text: 'We use audience measurement cookies (Google Analytics) to understand how the site is used and improve it. No advertising cookies.',
        more: 'Learn more',
        accept: 'Accept',
        refuse: 'Decline',
        label: 'Audience measurement cookies',
      };

  var CSS =
    '.ac-banner{position:fixed;left:16px;right:16px;bottom:16px;z-index:2147483000;max-width:560px;margin:0 auto;' +
    'padding:18px 20px;border-radius:18px;border:1px solid rgba(239,232,220,.16);background:rgba(31,14,17,.94);' +
    '-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);box-shadow:0 24px 60px rgba(0,0,0,.55);' +
    'color:#f3ede3;font:14px/1.5 "Hanken Grotesk Variable","Hanken Grotesk",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}' +
    '.ac-banner p{margin:0 0 14px}.ac-banner a{color:#c2a072}' +
    '.ac-row{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap}' +
    '.ac-btn{min-height:40px;padding:0 18px;border-radius:999px;font:600 14px/1 inherit;font-family:inherit;cursor:pointer;border:1px solid rgba(239,232,220,.22);background:transparent;color:#f3ede3}' +
    '.ac-btn:hover{border-color:rgba(239,232,220,.4)}' +
    '.ac-btn.ac-ok{background:#c2a072;border-color:#c2a072;color:#1f0e11}.ac-btn.ac-ok:hover{background:#d4b688}' +
    '.ac-btn:focus-visible{outline:2px solid #c2a072;outline-offset:3px}' +
    '@media (min-width:860px){.ac-banner{left:24px;right:auto;bottom:24px}}';

  var banner = null;
  function close() { if (banner) { banner.remove(); banner = null; } }
  function open() {
    if (banner || !document.body) return;
    if (!document.getElementById('ac-style')) {
      var st = document.createElement('style');
      st.id = 'ac-style';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    banner = document.createElement('div');
    banner.className = 'ac-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-label', T.label);
    banner.innerHTML =
      '<p>' + T.text + ' <a href="/confidentialite#cookies">' + T.more + '</a></p>' +
      '<div class="ac-row"><button type="button" class="ac-btn" data-c="denied">' + T.refuse + '</button>' +
      '<button type="button" class="ac-btn ac-ok" data-c="granted">' + T.accept + '</button></div>';
    banner.addEventListener('click', function (e) {
      var c = e.target && e.target.getAttribute && e.target.getAttribute('data-c');
      if (!c) return;
      var before = read();
      save(c);
      close();
      if (c === 'granted') loadGtm();
      // Retrait du consentement : on recharge pour couper la mesure déjà chargée.
      else if (before === 'granted' && loaded) location.reload();
    });
    document.body.appendChild(banner);
  }

  window.arcoraConsent = { open: open, get: read };

  var choice = read();
  if (choice === 'granted') loadGtm();
  else if (choice === null) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', open);
    else open();
  }

  // Liens « Gérer les cookies » : <a href="#cookies-settings"> ou [data-consent-open]
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('[data-consent-open], a[href="#cookies-settings"]');
    if (!a) return;
    e.preventDefault();
    open();
  });
})();
