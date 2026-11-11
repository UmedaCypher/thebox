import { NavLink } from 'react-router-dom';
import { defineStrings, useStrings } from '../../i18n';
import s from './CommunityNav.module.css';

const S = defineStrings(
  { label: 'Communauté', feed: 'Feed', gallery: 'Galerie au poignet', stolen: 'Montres volées' },
  { label: 'Community', feed: 'Feed', gallery: 'On-wrist gallery', stolen: 'Stolen watches' },
);

/** Les rubriques de la communauté, en tête du fil et de la galerie. */
export default function CommunityNav() {
  const t = useStrings(S);
  return (
    <nav className={s.nav} aria-label={t.label}>
      <NavLink to="/fil" className={s.link}>{t.feed}</NavLink>
      <NavLink to="/galerie" className={s.link}>{t.gallery}</NavLink>
      <NavLink to="/montres-volees" className={s.link}>{t.stolen}</NavLink>
    </nav>
  );
}
