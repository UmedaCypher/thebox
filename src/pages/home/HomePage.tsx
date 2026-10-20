import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FREE_WATCH_LIMIT, LAUNCH_MODE } from '../../lib/features';
import { LinkButton } from '../../components/ui';
import Dial from '../../components/Dial/Dial';
import WaitlistForm from '../../components/Waitlist/WaitlistForm';
import s from './HomePage.module.css';

const SLOTS: ({ dial: string; ink: string; bezel?: string } | null)[] = [
  { dial: '#14161b', ink: '#efe8dc' },
  { dial: '#e9e4da', ink: '#1c2a4a', bezel: '#c9c3b8' },
  { dial: '#1d3a2f', ink: '#efe8dc', bezel: '#c2a072' },
  { dial: '#1b2c52', ink: '#efe8dc' },
  { dial: '#f1ece2', ink: '#2a1418', bezel: '#c2a072' },
  null,
];

export default function HomePage() {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/collection" replace />;

  const cta = LAUNCH_MODE === 'waitlist'
    ? <LinkButton to="/#liste">Rejoindre la liste d'attente</LinkButton>
    : <LinkButton to="/signup">Créer mon écrin</LinkButton>;

  return (
    <div className={s.home}>
      <section className={s.hero}>
        <div className={s.heroText}>
          <h1 className={s.title}>Chaque montre a sa&nbsp;place.</h1>
          <p className={s.lead}>
            The Box range votre collection comme un écrin : une fiche par montre, le jour où vous l'avez portée,
            ses entretiens, et des photos au poignet pour comparer avec d'autres collectionneurs.
          </p>
          <div className={s.heroCta}>
            {cta}
            <LinkButton to="/galerie" variant="ghost">Voir la galerie</LinkButton>
          </div>
        </div>

        <div className={s.box} aria-label={`Un écrin à ${FREE_WATCH_LIMIT} places, cinq montres rangées et une place libre`} role="img">
          <div className={s.lid} aria-hidden="true" />
          <div className={s.tray}>
            {SLOTS.map((m, i) => (
              <div key={i} className={s.slot} data-empty={!m}>
                {m ? <Dial {...m} hands={i * 3 + 2} /> : <span className={s.free}>Libre</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={s.features}>
        <article>
          <h2>Le passeport de chaque montre</h2>
          <p>Référence, dimensions, état, boîte et papiers, histoire. Partagez-le d'un lien quand vous vendez ou faites expertiser : les prix restent privés.</p>
        </article>
        <article>
          <h2>Un calendrier de portage</h2>
          <p>Un geste par jour pour noter ce que vous avez au poignet. À la fin du mois, une image à partager, et la vérité sur celles qui dorment au fond du tiroir.</p>
        </article>
        <article>
          <h2>Une galerie au poignet</h2>
          <p>Des photos portées, filtrées par tour de poignet. Avant d'acheter, voyez comment une 40 mm tombe sur un poignet de 16,5 cm.</p>
        </article>
      </section>

      <section className={s.privacy}>
        <h2>Discret par défaut</h2>
        <p>
          Votre collection est privée tant que vous ne décidez pas l'inverse. Les prix et valeurs ne sont jamais publics,
          et la position GPS est retirée de chaque photo avant l'envoi.
        </p>
      </section>

      <section className={s.offer}>
        <div>
          <h2>Gratuit jusqu'à {FREE_WATCH_LIMIT} montres</h2>
          <p>La collection, le passeport, le calendrier et la galerie sont gratuits. Premium ajoute une collection illimitée, le carnet d'entretien avec rappels, les statistiques de portage, le suivi de valeur, la wishlist et l'inventaire pour l'assurance.</p>
        </div>
        <LinkButton to="/premium" variant="secondary">Comparer les offres</LinkButton>
      </section>

      {LAUNCH_MODE === 'waitlist' && (
        <section className={s.waitlist} id="liste">
          <div>
            <h2>Ouverture prochaine</h2>
            <p>Laissez votre adresse : vous ferez partie des premiers à ouvrir votre écrin.</p>
          </div>
          <WaitlistForm />
        </section>
      )}
    </div>
  );
}
