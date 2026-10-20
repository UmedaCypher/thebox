import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FREE_WATCH_LIMIT, LAUNCH_MODE } from '../../lib/features';
import { LinkButton } from '../../components/ui';
import WaitlistForm from '../../components/Waitlist/WaitlistForm';
import EcrinHero from './EcrinHero';
import { GalleryStrip, PassportShowcase, WearWall, WristTry } from './Sections';
import s from './HomePage.module.css';

export default function HomePage() {
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
          <h2>Discret par défaut.</h2>
          <p>
            Votre collection reste privée tant que vous ne décidez pas l'inverse. Les prix et valeurs ne sont jamais publics,
            et la position GPS est retirée de chaque photo avant l'envoi.
          </p>
        </section>

        <section className={s.offer}>
          <div>
            <h2>Gratuit jusqu'à {FREE_WATCH_LIMIT} montres.</h2>
            <p>La collection, le passeport, le calendrier et la galerie sont gratuits. Premium ajoute une collection illimitée, le carnet d'entretien avec rappels, les statistiques de portage, le suivi de valeur, la wishlist et l'inventaire pour l'assurance.</p>
          </div>
          <LinkButton to="/premium" variant="secondary">Comparer les offres</LinkButton>
        </section>

        {LAUNCH_MODE === 'waitlist' && (
          <section className={s.waitlist} id="liste">
            <div>
              <h2>Ouverture prochaine.</h2>
              <p>Laissez votre adresse : vous ferez partie des premiers à ouvrir votre écrin.</p>
            </div>
            <WaitlistForm />
          </section>
        )}
      </div>
    </div>
  );
}
