import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { CalendarDays, CircleUser, Images, Watch } from 'lucide-react';
import { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LinkButton } from '../ui';
import { LAUNCH_MODE } from '../../lib/features';
import s from './Layout.module.css';

const APP_TABS = [
  { to: '/collection', label: 'Collection', icon: Watch },
  { to: '/portage', label: 'Portage', icon: CalendarDays },
  { to: '/galerie', label: 'Galerie', icon: Images },
  { to: '/profil', label: 'Profil', icon: CircleUser },
];

function Header() {
  const { user, profile, isPremium } = useAuth();
  const initial = (profile?.username || user?.email || '?').charAt(0).toUpperCase();

  return (
    <header className={s.header}>
      <div className={s.headerInner}>
        <Link to={user ? '/collection' : '/'} className={s.wordmark}>The Box</Link>

        <nav className={s.nav} aria-label="Navigation principale">
          {user
            ? APP_TABS.slice(0, 3).map(t => <NavLink key={t.to} to={t.to} className={s.navLink}>{t.label}</NavLink>)
            : <>
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

function TabBar() {
  return (
    <nav className={s.tabbar} aria-label="Onglets">
      {APP_TABS.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} className={s.tab}>
          <Icon size={22} strokeWidth={1.5} aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

function Footer() {
  return (
    <footer className={s.footer}>
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
    </footer>
  );
}

export default function Layout() {
  const { user } = useAuth();
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
    else window.scrollTo(0, 0);
  }, [pathname, hash]);

  return (
    <div className={s.shell}>
      <a href="#contenu" className="visually-hidden">Aller au contenu</a>
      <Header />
      <main id="contenu" className={`${s.main} ${user ? s.withTabbar : ''}`}>
        <Outlet />
      </main>
      <Footer />
      {user && <TabBar />}
    </div>
  );
}
