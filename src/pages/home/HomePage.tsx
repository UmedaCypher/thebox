import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FREE_WATCH_LIMIT, LAUNCH_MODE } from '../../lib/features';
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
  offerText: "La collection, le passeport, le calendrier et la galerie sont gratuits. Premium ajoute une collection illimitée, le carnet d'entretien avec rappels, les statistiques de portage, le suivi de valeur, la wishlist et l'inventaire pour l'assurance.",
  compare: 'Comparer les offres',
  waitlistTitle: 'Ouverture prochaine.',
  waitlistText: 'Laissez votre adresse : vous ferez partie des premiers à ouvrir votre écrin.',
}, {
  privacyTitle: 'Private by default.',
  privacyText: 'Your collection stays private until you decide otherwise. Prices and values are never public, and GPS location is removed from every photo before upload.',
  offerTitle: n => `Free for up to ${n} watches.`,
  offerText: 'The collection, passport, wear calendar and gallery are free. Premium adds an unlimited collection, a service log with reminders, wear statistics, value tracking, a wishlist and an insurance inventory.',
  compare: 'Compare plans',
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

        <section className={s.offer}>
          <div>
            <h2>{t.offerTitle(FREE_WATCH_LIMIT)}</h2>
            <p>{t.offerText}</p>
          </div>
          <LinkButton to="/premium" variant="secondary">{t.compare}</LinkButton>
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
