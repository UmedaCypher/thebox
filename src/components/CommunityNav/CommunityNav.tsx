import { useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { defineStrings, useStrings } from '../../i18n';
import s from './CommunityNav.module.css';

const S = defineStrings(
  { label: 'Communauté', feed: 'Feed', gallery: 'Galerie au poignet', stolen: 'Montres volées' },
  { label: 'Community', feed: 'Feed', gallery: 'On-wrist gallery', stolen: 'Stolen watches' },
);

const TABS = ['/fil', '/galerie', '/montres-volees'] as const;

/** Le geste ne doit pas voler celui d'un champ, d'un curseur, d'une fenêtre ou d'une zone qui défile en largeur. */
function swipeAllowed(target: EventTarget | null) {
  let el = target instanceof Element ? target : null;
  if (!el || el.closest('input, textarea, select, [role="dialog"], [data-no-swipe]')) return false;
  while (el && el !== document.body) {
    const style = getComputedStyle(el);
    if ((style.overflowX === 'auto' || style.overflowX === 'scroll') && el.scrollWidth > el.clientWidth + 2) return false;
    el = el.parentElement;
  }
  return true;
}

/** Les rubriques de la communauté, en tête du fil et de la galerie. Sur téléphone : glisser à gauche ou à droite pour changer d'onglet. */
export default function CommunityNav() {
  const t = useStrings(S);
  const nav = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const { pathname, state } = useLocation();
  const index = TABS.findIndex(p => pathname === p || pathname.startsWith(`${p}/`));

  // Geste de balayage horizontal sur toute la page
  useEffect(() => {
    if (index < 0) return;
    let start: { x: number; y: number; t: number } | null = null;
    const down = (e: TouchEvent) => {
      start = e.touches.length === 1 && swipeAllowed(e.target) ? { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() } : null;
    };
    const up = (e: TouchEvent) => {
      if (!start) return;
      const dx = e.changedTouches[0].clientX - start.x, dy = e.changedTouches[0].clientY - start.y;
      const quick = Date.now() - start.t < 700;
      start = null;
      if (!quick || Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.6) return;
      const next = index + (dx < 0 ? 1 : -1);
      if (next < 0 || next >= TABS.length) return;
      navigate(TABS[next], { state: { swipe: dx < 0 ? 'left' : 'right' } });
    };
    document.addEventListener('touchstart', down, { passive: true });
    document.addEventListener('touchend', up, { passive: true });
    return () => { document.removeEventListener('touchstart', down); document.removeEventListener('touchend', up); };
  }, [index, navigate]);

  // Arrivée par balayage : la page glisse depuis le côté du geste
  useEffect(() => {
    const dir = (state as { swipe?: string } | null)?.swipe;
    const page = nav.current?.closest<HTMLElement>('.page');
    if (!dir || !page || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    page.dataset.swipeIn = dir;
    const id = setTimeout(() => { delete page.dataset.swipeIn; }, 400);
    return () => clearTimeout(id);
  }, [pathname, state]);

  return (
    <nav ref={nav} className={s.nav} aria-label={t.label}>
      <NavLink to="/fil" className={s.link}>{t.feed}</NavLink>
      <NavLink to="/galerie" className={s.link}>{t.gallery}</NavLink>
      <NavLink to="/montres-volees" className={s.link}>{t.stolen}</NavLink>
    </nav>
  );
}
