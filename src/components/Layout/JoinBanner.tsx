import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { defineStrings, useStrings } from '../../i18n';
import s from './JoinBanner.module.css';

/*
 * Invitation à rejoindre Arcora, pour les visiteurs non connectés arrivés sur une page publique
 * (lien partagé, Google). Le message reprend ce que le visiteur est en train de regarder.
 */

const KEY = 'arcora-join-banner-closed';

const S = defineStrings({
  passport: { title: 'Le passeport de vos montres', text: 'Références, révisions, factures et photos : tout au même endroit, gratuitement.' },
  profile: { title: 'Votre collection mérite le même écrin', text: 'Cataloguez vos montres et partagez celles que vous voulez.' },
  gallery: { title: 'Montrez vos montres au poignet', text: 'Partagez vos Wrist Checks et voyez ce qui tombe bien sur un poignet comme le vôtre.' },
  market: { title: 'Vendez sans commission', text: 'Annonces entre collectionneurs, 0 % de frais, à partir de votre collection.' },
  stolen: { title: 'Protégez votre collection', text: 'Numéros de série, factures et photos à l’abri, prêts en cas de vol.' },
  other: { title: 'L’écrin de votre collection de montres', text: 'Collection, Wrist Check du jour, galerie au poignet, Marché sans commission.' },
  cta: 'Créer ma collection',
  free: 'Gratuit',
  login: 'Se connecter',
  close: 'Masquer',
}, {
  passport: { title: 'A passport for your watches', text: 'References, services, invoices and photos, all in one place, for free.' },
  profile: { title: 'Your collection deserves the same', text: 'Catalogue your watches and share the ones you choose.' },
  gallery: { title: 'Show your watches on the wrist', text: 'Share your Wrist Checks and see what suits a wrist like yours.' },
  market: { title: 'Sell with no commission', text: 'Listings between collectors, 0% fees, straight from your collection.' },
  stolen: { title: 'Protect your collection', text: 'Serial numbers, invoices and photos kept safe, ready if a watch is stolen.' },
  other: { title: 'A home for your watch collection', text: 'Collection, daily Wrist Check, on-the-wrist gallery, commission-free Market.' },
  cta: 'Start my collection',
  free: 'Free',
  login: 'Log in',
  close: 'Hide',
});

/** Pages publiques où l'invitation a du sens (pas l'accueil, déjà une invitation, ni les pages légales). */
export function joinBannerKind(pathname: string): 'passport' | 'profile' | 'gallery' | 'market' | 'stolen' | 'other' | null {
  const seg = pathname.split('/')[1];
  switch (seg) {
    case 'passeport': return 'passport';
    case 'profil': return pathname.split('/').length > 2 ? 'profile' : null;
    case 'galerie': return 'gallery';
    case 'marche': return 'market';
    case 'montres-volees': return 'stolen';
    case 'arcora-vs': case 'actualites': return 'other';
    default: return null;
  }
}

const closed = () => { try { return sessionStorage.getItem(KEY) === '1'; } catch { return false; } };

export default function JoinBanner() {
  const t = useStrings(S);
  const { pathname } = useLocation();
  const [hidden, setHidden] = useState(closed);
  const kind = joinBannerKind(pathname);
  if (hidden || !kind) return null;
  const msg = t[kind];
  const close = () => { try { sessionStorage.setItem(KEY, '1'); } catch { /* stockage indisponible */ } setHidden(true); };
  return (
    <aside className={s.banner} aria-label={msg.title}>
      <span className={s.text}>
        <strong>{msg.title}</strong>
        <span>{msg.text}</span>
      </span>
      <span className={s.actions}>
        <Link to={`/signup?depuis=${kind}`} className={s.cta}>{t.cta}<small>{t.free}</small></Link>
        <Link to="/login" className={s.login}>{t.login}</Link>
      </span>
      <button type="button" className={s.close} onClick={close} aria-label={t.close} title={t.close}><X size={16} strokeWidth={2} /></button>
    </aside>
  );
}
