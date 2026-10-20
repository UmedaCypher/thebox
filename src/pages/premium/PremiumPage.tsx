import { useAuth } from '../../contexts/AuthContext';
import { FREE_WATCH_LIMIT, PREMIUM_PRICE_HINT } from '../../lib/features';
import { PREMIUM_FEATURES } from '../../lib/premium';
import { LinkButton, PageHeader } from '../../components/ui';
import WaitlistForm from '../../components/Waitlist/WaitlistForm';
import s from './PremiumPage.module.css';

const FREE = [
  `Jusqu'à ${FREE_WATCH_LIMIT} montres`,
  'Passeport partageable pour chaque montre',
  'Calendrier de portage et image du mois',
  'Galerie au poignet',
  'Prix et valeurs déclarés, toujours privés',
];

export default function PremiumPage() {
  const { user, isPremium } = useAuth();
  return (
    <div className="page">
      <PageHeader title="Premium" subtitle="Pour les collections qui débordent de l'écrin, et ceux qui veulent tout savoir de leurs montres." />

      <div className={s.plans}>
        <section className={s.plan}>
          <h2>Gratuit</h2>
          <p className={s.price}>0 €</p>
          <ul>{FREE.map(f => <li key={f}>{f}</li>)}</ul>
        </section>

        <section className={`${s.plan} ${s.premium}`}>
          <h2>Premium</h2>
          <p className={s.price}>Bientôt <span>{PREMIUM_PRICE_HINT}</span></p>
          <p className={s.includes}>Tout le gratuit, et :</p>
          <ul>{PREMIUM_FEATURES.map(f => <li key={f.title}><strong>{f.title}</strong>{f.text}</li>)}</ul>
        </section>
      </div>

      <section className={s.notify}>
        {isPremium ? (
          <p>Votre compte est déjà Premium. Merci.</p>
        ) : (
          <>
            <div>
              <h2>Être prévenu de l'ouverture</h2>
              <p className={s.muted}>Le paiement n'est pas encore ouvert. Laissez votre adresse et nous vous écrirons une fois, au lancement.</p>
            </div>
            {user ? <WaitlistForm premiumDefault compact /> : <WaitlistForm premiumDefault />}
          </>
        )}
        {!user && <LinkButton to="/galerie" variant="ghost">Voir la galerie en attendant</LinkButton>}
      </section>
    </div>
  );
}
