import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { CalendarDays, Images, MessageCircle, Store, Watch } from 'lucide-react';
import { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LinkButton } from '../ui';
import { LAUNCH_MODE } from '../../lib/features';
import { useUnreadCount } from '../../hooks/useUnreadCount';
import s from './Layout.module.css';

/* Le profil reste accessible par l'avatar en haut à droite. */
const APP_TABS = [
  { to: '/collection', label: 'Collection', icon: Watch },
  { to: '/portage', label: 'Portage', icon: CalendarDays },
  { to: '/marche', label: 'Marché', icon: Store },
  { to: '/messages', label: 'Messages', icon: MessageCircle },
  { to: '/galerie', label: 'Galerie', icon: Images },
];

const badgeText = (n: number) => (n > 99 ? '99+' : String(n));

function Header({ unread }: { unread: number }) {
  const { user, profile, isPremium } = useAuth();
  const initial = (profile?.username || user?.email || '?').charAt(0).toUpperCase();

  return (
    <header className={s.header}>
      <div className={s.headerInner}>
        <Link to={user ? '/collection' : '/'} className={s.wordmark}>The Box</Link>

        <nav className={s.nav} aria-label="Navigation principale">
          {user
            ? APP_TABS.map(t => (
                <NavLink key={t.to} to={t.to} className={s.navLink}>
                  {t.label}
                  {t.to === '/messages' && unread > 0 && <span className={s.navBadge} aria-label={`${unread} non lus`}>{badgeText(unread)}</span>}
                </NavLink>
              ))
            : <>
                <NavLink to="/marche" className={s.navLink}>Marché</NavLink>
                <NavLink to="/galerie" className={s.navLink}>Galerie</NavLink>
                <NavLink to="/premium" className={s.navLink}>Premium</NavLink>
                <NavLink to="/faq" className={s.navLink}>Questions</NavLink>
              </>}
        </nav>

        <div className={s.headerEnd}>
          {user ? (
            <>
              {!isPremium && <Link to="/premium" className={`${s.textLink} ${s.desktopOnly}`}>Premium</Link>}
              <Link to="/profil" className={s.avatar} aria-label="Mon profil">
                {profile?.profile_picture_url ? <img src={profile.profile_picture_url} alt="" className={s.avatar} /> : initial}
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className={s.textLink}>Se connecter</Link>
              {LAUNCH_MODE === 'waitlist'
                ? <LinkButton to="/#liste" size="small" className={s.desktopOnly}>Rejoindre la liste</LinkButton>
                : <LinkButton to="/signup" size="small" className={s.desktopOnly}>Créer un compte</LinkButton>}
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function TabBar({ unread }: { unread: number }) {
  return (
    <nav className={s.tabbar} aria-label="Onglets">
      {APP_TABS.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} className={s.tab}>
          <span className={s.tabIcon}>
            <Icon size={26} strokeWidth={1.6} aria-hidden="true" />
            {to === '/messages' && unread > 0 && <span className={s.tabBadge} aria-label={`${unread} non lus`}>{badgeText(unread)}</span>}
          </span>
          <span className={s.tabLabel}>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function Footer({ loggedIn }: { loggedIn: boolean }) {
  return (
    <footer className={s.footer} data-member={loggedIn}>
      <div className={s.footerInner}>
        <nav className={s.footerLinks} aria-label="Informations">
          <Link to="/a-propos">À propos</Link>
          <Link to="/faq">Questions fréquentes</Link>
          <Link to="/actualites">Actualités</Link>
          <Link to="/presse">Presse</Link>
          <Link to="/contact">Contact</Link>
        </nav>
        <nav className={s.footerLinks} aria-label="Légal">
          <Link to="/cgu">CGU</Link>
          <Link to="/cgv">CGV</Link>
          <Link to="/confidentialite">Confidentialité</Link>
          <Link to="/mentions-legales">Mentions légales</Link>
        </nav>
        <p className={s.footerNote}>© {new Date().getFullYear()} The Box</p>
      </div>
      {/* Sur téléphone, pour les visiteurs : une seule ligne avec l'essentiel légal. */}
      <nav className={s.footerCompact} aria-label="Légal">
        <Link to="/cgu">CGU</Link>
        <Link to="/confidentialite">Confidentialité</Link>
        <Link to="/mentions-legales">Mentions légales</Link>
        <Link to="/contact">Contact</Link>
      </nav>
    </footer>
  );
}

export default function Layout() {
  const { user } = useAuth();
  const { pathname, hash } = useLocation();
  const unread = useUnreadCount(Boolean(user), pathname);
  const inMessages = pathname.startsWith('/messages');
  // Dans une conversation sur téléphone, la zone de saisie remplace la barre d'onglets.
  const inThread = /^\/messages\/[^/]+/.test(pathname);

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
    else window.scrollTo(0, 0);
  }, [pathname, hash]);

  return (
    <div className={s.shell}>
      <a href="#contenu" className="visually-hidden">Aller au contenu</a>
      <Header unread={unread} />
      <main id="contenu" className={`${s.main} ${user && !inThread ? s.withTabbar : ''}`}>
        <Outlet />
      </main>
      {!inMessages && <Footer loggedIn={Boolean(user)} />}
      {user && <div className={inThread ? s.hideOnMobile : undefined}><TabBar unread={unread} /></div>}
    </div>
  );
}
