import { scrollToElement, scrollToTop, useMotion } from '../../lib/motion';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { BookOpen, CalendarDays, Images, MessageCircle, Newspaper, Sparkles, Store, Users, Watch, LayoutGrid } from 'lucide-react';
import { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LinkButton } from '../ui';
import GlobalSearch from '../Search/GlobalSearch';
import { LAUNCH_MODE } from '../../lib/features';
import { useUnreadCount } from '../../hooks/useUnreadCount';
import { defineStrings, useLang, useStrings } from '../../i18n';
import type { LangChoice } from '../../i18n';
import { COMMON } from '../../i18n/common';
import { useLanguageSetting } from '../../i18n/useLanguageSetting';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { pageTitle } from './pageTitle';
import PlayBanner from './PlayBanner';
import JoinBanner, { joinBannerKind } from './JoinBanner';
import s from './Layout.module.css';

const S = defineStrings({
  mainNav: 'Navigation principale', tabsNav: 'Onglets', questions: 'Questions', myProfile: 'Mon profil',
  login: 'Se connecter', joinList: 'Rejoindre la liste', signup: 'Créer un compte', skip: 'Aller au contenu',
  info: 'Informations', legal: 'Légal', about: 'À propos', versus: 'Comparatif des apps', stolen: 'Montres volées', faq: 'Questions fréquentes', news: 'Actualités', press: 'Presse',
  contact: 'Contact', affiliate: 'Parrainage', cgu: 'Conditions d’utilisation', cgv: 'CGV', privacy: 'Confidentialité', mentions: 'Mentions légales', language: 'Langue',
}, {
  mainNav: 'Main navigation', tabsNav: 'Tabs', questions: 'FAQ', myProfile: 'My profile',
  login: 'Log in', joinList: 'Join the waitlist', signup: 'Create an account', skip: 'Skip to content',
  info: 'Information', legal: 'Legal', about: 'About', versus: 'App comparison', stolen: 'Stolen watches', faq: 'FAQ', news: 'News', press: 'Press',
  contact: 'Contact', affiliate: 'Referrals', cgu: 'Terms of use', cgv: 'Terms of sale', privacy: 'Privacy', mentions: 'Legal notice', language: 'Language',
});

/* Navigation du membre sur ordinateur, avec les mêmes icônes que la barre mobile. Messages et profil sont à droite. */
const APP_TABS = [
  { to: '/accueil', key: 'home', icon: LayoutGrid },
  { to: '/collection', key: 'collection', icon: Watch },
  { to: '/portage', key: 'wear', icon: CalendarDays },
  { to: '/fil', key: 'community', icon: Users },
  { to: '/marche', key: 'market', icon: Store },
] as const;

/* La rubrique Communauté regroupe le fil, la galerie et les montres volées */
const COMMUNITY = ['/fil', '/galerie', '/montres-volees'];
/** Lien de l'onglet Communauté : la page courante si l'on y est déjà (l'onglet reste allumé), sinon le fil. */
const COMMUNITY_TO = (pathname: string) => COMMUNITY.find(p => pathname.startsWith(p)) ?? '/fil';

/* Sur mobile : Messages est dans l'en-tête (à côté du profil), la Communauté (fil, galerie) dans la barre du bas. */
const MOBILE_TABS = [
  { to: '/accueil', key: 'home', icon: LayoutGrid },
  { to: '/collection', key: 'collection', icon: Watch },
  { to: '/portage', key: 'wear', icon: CalendarDays },
  { to: '/fil', key: 'community', icon: Users },
  { to: '/marche', key: 'market', icon: Store },
] as const;

const badgeText = (n: number) => (n > 99 ? '99+' : String(n));

function Header({ unread, showSearch }: { unread: number; showSearch: boolean }) {
  const { user, profile, isPremium } = useAuth();
  const { pathname } = useLocation();
  const { lang } = useLang();
  const initial = (profile?.username || user?.email || '?').charAt(0).toUpperCase();
  const t = useStrings(S);
  const c = useStrings(COMMON);

  return (
    <header className={s.header}>
      <div className={s.headerInner}>
        <Link to={user ? '/accueil' : '/'} className={s.wordmark}>Arcora</Link>
        {/* Téléphone : le nom de la page remplace le logo */}
        <p className={s.pageTitle} aria-hidden="true">{pageTitle(pathname, Boolean(user))}</p>

        <div className={s.searchSlot}><GlobalSearch /></div>

        <div className={s.headerEnd}>
          {user ? (
            <>
              <NavLink to="/messages" className={s.iconLink}
                aria-label={unread > 0 ? `${c.tabs.messages}, ${c.unread(unread)}` : c.tabs.messages} title={c.tabs.messages}>
                <MessageCircle size={22} strokeWidth={1.7} aria-hidden="true" />
                {unread > 0 && <span className={s.iconBadge} aria-hidden="true">{badgeText(unread)}</span>}
              </NavLink>
              <Link to="/profil" className={s.avatar} aria-label={t.myProfile}>
                {profile?.profile_picture_url ? <img src={profile.profile_picture_url} alt="" className={s.avatar} /> : initial}
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className={s.textLink}>{t.login}</Link>
              {LAUNCH_MODE === 'waitlist'
                ? <LinkButton to="/#liste" size="small" className={s.desktopOnly}>{t.joinList}</LinkButton>
                : <LinkButton to="/signup" size="small" className={s.desktopOnly}>{t.signup}</LinkButton>}
            </>
          )}
        </div>
      </div>

      {/* Téléphone : la recherche sous l'en-tête */}
      {showSearch && <div className={s.mobileSearch}><GlobalSearch /></div>}

      {/* Deuxième ligne (ordinateur) : les rubriques, avec les mêmes icônes que la barre mobile */}
      <nav className={s.subnav} aria-label={t.mainNav}>
        <div className={s.subnavInner}>
          <div className={s.subnavMain}>
            {user
              ? APP_TABS.map(({ to, key, icon: Icon }) => (
                  // La Communauté reste active sur le fil, la galerie et les montres volées
                  <NavLink key={to} to={key === 'community' ? COMMUNITY_TO(pathname) : to} className={s.subLink}>
                    <Icon size={18} strokeWidth={1.7} aria-hidden="true" />{c.tabs[key]}
                  </NavLink>
                ))
              : <>
                  <NavLink to="/marche" className={s.subLink}><Store size={18} strokeWidth={1.7} aria-hidden="true" />{c.tabs.market}</NavLink>
                  <NavLink to="/galerie" className={s.subLink}><Images size={18} strokeWidth={1.7} aria-hidden="true" />{c.tabs.gallery}</NavLink>
                  <NavLink to="/faq" className={s.subLink}>{t.questions}</NavLink>
                </>}
          </div>
          <div className={s.subnavAside}>
            {/* Le magazine est un site statique servi à part : lien classique, pas de navigation interne. */}
            <a href={lang === 'fr' ? '/magazine/' : '/en/magazine/'} className={s.subLink}><BookOpen size={18} strokeWidth={1.7} aria-hidden="true" />Magazine</a>
            <NavLink to="/actualites" className={s.subLink}><Newspaper size={18} strokeWidth={1.7} aria-hidden="true" />{t.news}</NavLink>
            {!isPremium && (
              <NavLink to="/premium" className={`${s.subLink} ${s.premiumLink}`}><Sparkles size={16} strokeWidth={1.8} aria-hidden="true" />Premium</NavLink>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}

function TabBar() {
  const t = useStrings(S);
  const c = useStrings(COMMON);
  const { pathname } = useLocation();
  return (
    <nav className={s.tabbar} aria-label={t.tabsNav}>
      {MOBILE_TABS.map(({ to, key, icon: Icon }) => (
        <NavLink key={to} to={key === 'community' ? COMMUNITY_TO(pathname) : to} className={s.tab}>
          <span className={s.tabIcon}>
            <Icon size={26} strokeWidth={1.6} aria-hidden="true" />
          </span>
          <span className={s.tabLabel}>{c.tabs[key]}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function LanguageSwitch() {
  const t = useStrings(S);
  const c = useStrings(COMMON);
  const { choice, change } = useLanguageSetting();
  return (
    <label className={s.langSwitch}>
      <span className="visually-hidden">{t.language}</span>
      <select value={choice} onChange={e => change(e.target.value as LangChoice)}>
        <option value="auto">{c.language.auto}</option>
        <option value="fr">Français</option>
        <option value="en">English</option>
      </select>
    </label>
  );
}

function Footer({ loggedIn }: { loggedIn: boolean }) {
  const t = useStrings(S);
  const { lang } = useLang();
  return (
    <footer className={s.footer} data-member={loggedIn}>
      <div className={s.footerInner}>
        <nav className={s.footerLinks} aria-label={t.info}>
          <Link to="/a-propos">{t.about}</Link>
          <Link to="/arcora-vs">{t.versus}</Link>
          <Link to="/montres-volees">{t.stolen}</Link>
          <Link to="/faq">{t.faq}</Link>
          <Link to="/actualites">{t.news}</Link>
          {/* Le magazine est un site statique à part (dossier site/) : lien classique, pas de navigation interne. */}
          <a href={lang === 'fr' ? '/magazine/' : '/en/magazine/'}>Magazine</a>
          <Link to="/presse">{t.press}</Link>
          <Link to="/contact">{t.contact}</Link>
          <Link to="/affiliation">{t.affiliate}</Link>
        </nav>
        <nav className={s.footerLinks} aria-label={t.legal}>
          <Link to="/cgu">{t.cgu}</Link>
          <Link to="/cgv">{t.cgv}</Link>
          <Link to="/confidentialite">{t.privacy}</Link>
          <Link to="/mentions-legales">{t.mentions}</Link>
        </nav>
        <div className={s.footerBottom}>
          <p className={s.footerNote}>© {new Date().getFullYear()} Arcora</p>
          <LanguageSwitch />
        </div>
      </div>
      {/* Sur téléphone, pour les visiteurs : une seule ligne avec l'essentiel légal. */}
      <nav className={s.footerCompact} aria-label={t.legal}>
        <Link to="/cgu">{t.cgu}</Link>
        <Link to="/confidentialite">{t.privacy}</Link>
        <Link to="/mentions-legales">{t.mentions}</Link>
        <Link to="/contact">{t.contact}</Link>
        <LanguageSwitch />
      </nav>
    </footer>
  );
}

export default function Layout() {
  const { user } = useAuth();
  const { pathname, hash } = useLocation();
  const unread = useUnreadCount(Boolean(user), pathname);
  const inMessages = pathname.startsWith('/messages');
  const inOnboarding = pathname === '/bienvenue';
  // Dans une conversation sur téléphone, la zone de saisie remplace la barre d'onglets.
  const inThread = /^\/messages\/[^/]+/.test(pathname);
  const t = useStrings(S);
  useMotion();
  // Recherche sous l'en-tête sur téléphone : pour les membres, hors conversation et hors accueil guidé
  const phone = useMediaQuery('(max-width: 859px)');
  const showSearch = phone && Boolean(user) && !inThread && !inOnboarding;
  useEffect(() => {
    if (showSearch) document.documentElement.dataset.headerSearch = '';
    else delete document.documentElement.dataset.headerSearch;
  }, [showSearch]);

  // La lumière de fond prend la couleur de la rubrique
  useEffect(() => {
    const seg = pathname.split('/')[1] || 'accueil';
    const section = seg === 'passeport' ? 'marche' : seg;
    document.documentElement.dataset.section = section;
  }, [pathname]);

  useEffect(() => {
    const target = hash ? document.getElementById(hash.slice(1)) : null;
    if (target) scrollToElement(target);
    else scrollToTop();
  }, [pathname, hash]);

  return (
    <div className={s.shell} data-join-banner={!user && joinBannerKind(pathname) ? '' : undefined}>
      <a href="#contenu" className="visually-hidden">{t.skip}</a>
      <Header unread={unread} showSearch={showSearch} />
      <main id="contenu" className={`${s.main} ${user && !inThread && !inOnboarding ? s.withTabbar : ''}`}>
        {/* Fondu léger à chaque changement de page (la messagerie garde sa liste en place) */}
        <div key={inMessages ? '/messages' : pathname} className={s.route}><Outlet /></div>
      </main>
      {!inMessages && !inOnboarding && <Footer loggedIn={Boolean(user)} />}
      {/* Visiteur sur une page publique : l'invitation à créer sa collection passe avant la bannière Play Store */}
      {!user && joinBannerKind(pathname) ? <JoinBanner /> : !phone && <PlayBanner />}
      {user && !inOnboarding && <div className={inThread ? s.hideOnMobile : undefined}><TabBar /></div>}
    </div>
  );
}
