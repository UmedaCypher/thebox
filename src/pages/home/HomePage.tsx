import type { CSSProperties } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FREE_WATCH_LIMIT, LAUNCH_MODE, premiumPrices } from '../../lib/features';
import { LinkButton } from '../../components/ui';
import WaitlistForm from '../../components/Waitlist/WaitlistForm';
import EcrinHero from './EcrinHero';
import { GalleryStrip, PassportShowcase, WearWall, WristTry } from './Sections';
import { defineStrings, useStrings } from '../../i18n';
import s from './HomePage.module.css';

const S = defineStrings({
  privacyTitle: 'Discret par défaut.',
  privacyText: "Votre collection reste privée tant que vous ne décidez pas l'inverse. Les prix et valeurs ne sont jamais publics, et la position GPS est retirée de chaque photo avant l'envoi.",
  offerTitle: (n: number) => `Gratuit jusqu'à ${n} montres.`,
  offerFree: ['Collection', 'Passeport', 'Calendrier de portage', 'Galerie', 'Marché et messages'],
  offerPremiumTitle: 'Premium, pour aller plus loin',
  offerPremium: ['Collection illimitée', "Carnet d'entretien et rappels", 'Statistiques de portage', 'Suivi de valeur', 'Wishlist', 'Inventaire pour l’assurance'],
  compare: 'Comparer les offres',
  startFree: 'Réserver ma place',
  startFreeOpen: 'Ouvrir mon écrin',
  waitlistTitle: 'Ouverture prochaine.',
  waitlistText: 'Laissez votre adresse : vous ferez partie des premiers à ouvrir votre écrin.',
}, {
  privacyTitle: 'Private by default.',
  privacyText: 'Your collection stays private until you decide otherwise. Prices and values are never public, and GPS location is removed from every photo before upload.',
  offerTitle: n => `Free for up to ${n} watches.`,
  offerFree: ['Collection', 'Passport', 'Wear calendar', 'Gallery', 'Market and messages'],
  offerPremiumTitle: 'Premium, to go further',
  offerPremium: ['Unlimited collection', 'Service log and reminders', 'Wear statistics', 'Value tracking', 'Wishlist', 'Insurance inventory'],
  compare: 'Compare plans',
  startFree: 'Save my spot',
  startFreeOpen: 'Open my watch box',
  waitlistTitle: 'Opening soon.',
  waitlistText: 'Leave your email and be among the first to open your watch box.',
});

export default function HomePage() {
  const t = useStrings(S);
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/collection" replace />;

  return (
    <div className={s.home}>
      <EcrinHero />

      <div className={s.inner}>
        <WearWall />
        <WristTry />
        <PassportShowcase />
        <GalleryStrip />

        <section className={s.privacy}>
          <h2>{t.privacyTitle}</h2>
          <p>{t.privacyText}</p>
        </section>

        <section className={s.offer} data-reveal>
          <div className={s.offerFree}>
            <span className={s.indices} aria-hidden="true">
              {Array.from({ length: FREE_WATCH_LIMIT }, (_, i) => <i key={i} style={{ '--i': i } as CSSProperties} />)}
            </span>
            <h2>{t.offerTitle(FREE_WATCH_LIMIT)}</h2>
            <ul className={s.chips} data-tone="lume">{t.offerFree.map(f => <li key={f}>{f}</li>)}</ul>
            {LAUNCH_MODE === 'waitlist'
              ? <LinkButton to="/#liste" variant="secondary">{t.startFree}</LinkButton>
              : <LinkButton to="/signup" variant="secondary">{t.startFreeOpen}</LinkButton>}
          </div>
          <div className={s.offerPremium}>
            <p className={s.offerPrice}><strong className="num">{premiumPrices().year.amount}</strong> {premiumPrices().year.period}</p>
            <h3>{t.offerPremiumTitle}</h3>
            <ul className={s.chips} data-tone="brass">{t.offerPremium.map(f => <li key={f}>{f}</li>)}</ul>
            <LinkButton to="/premium">{t.compare}</LinkButton>
          </div>
        </section>

        {LAUNCH_MODE === 'waitlist' && (
          <section className={s.waitlist} id="liste">
            <div>
              <h2>{t.waitlistTitle}</h2>
              <p>{t.waitlistText}</p>
            </div>
            <WaitlistForm />
          </section>
        )}
      </div>
    </div>
  );
}
