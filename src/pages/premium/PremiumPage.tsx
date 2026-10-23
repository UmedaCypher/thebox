import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FREE_WATCH_LIMIT, PAYMENTS_ENABLED, PREMIUM_PRICES } from '../../lib/features';
import type { BillingInterval } from '../../lib/features';
import { PREMIUM_FEATURES, PREMIUM_HIGHLIGHTS } from '../../lib/premium';
import { openBillingPortal, startCheckout } from '../../lib/api';
import { Button, LinkButton, Notice, PageHeader, Segmented } from '../../components/ui';
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
  const { user, isPremium, refreshProfile } = useAuth();
  const [params, setParams] = useSearchParams();
  const result = params.get('paiement');
  const [accepted, setAccepted] = useState(false);
  const [interval, setInterval_] = useState<BillingInterval>('year');
  const price = PREMIUM_PRICES[interval];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(result === 'ok');

  // Retour de Stripe : le webhook active Premium en quelques secondes, on vérifie régulièrement.
  useEffect(() => {
    if (result !== 'ok' || isPremium) { setWaiting(false); return; }
    let tries = 0;
    const id = setInterval(async () => {
      tries++;
      await refreshProfile();
      if (tries >= 15) { clearInterval(id); setWaiting(false); }
    }, 2000);
    return () => clearInterval(id);
  }, [result, isPremium, refreshProfile]);

  const subscribe = async () => {
    setBusy(true); setError(null);
    try { await startCheckout(interval); } catch (e) { setError(e instanceof Error ? e.message : 'Paiement indisponible.'); setBusy(false); }
  };
  const manage = async () => {
    setBusy(true); setError(null);
    try { await openBillingPortal(); } catch (e) { setError(e instanceof Error ? e.message : 'Espace abonnement indisponible.'); setBusy(false); }
  };

  const action = () => {
    if (isPremium) {
      return (
        <div className={s.cta}>
          <p>Votre compte est Premium. Merci de soutenir The Box.</p>
          {PAYMENTS_ENABLED && <Button variant="secondary" onClick={manage} disabled={busy}>Gérer mon abonnement</Button>}
        </div>
      );
    }
    if (!PAYMENTS_ENABLED) {
      return (
        <div className={s.cta}>
          <p className={s.muted}>Le paiement n'est pas encore ouvert. Laissez votre adresse et nous vous écrirons une fois, au lancement.</p>
          <WaitlistForm premiumDefault />
        </div>
      );
    }
    if (!user) {
      return (
        <div className={s.cta}>
          <LinkButton to="/signup">Créer un compte pour passer à Premium</LinkButton>
          <p className={s.muted}>Déjà inscrit ? <Link to="/login" state={{ from: { pathname: '/premium' } }}>Se connecter</Link></p>
        </div>
      );
    }
    return (
      <div className={s.cta}>
        <label className={s.consent}>
          <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} />
          <span>J'accepte les <Link to="/cgv">conditions générales de vente</Link> et je demande l'accès immédiat à Premium.</span>
        </label>
        <Button onClick={subscribe} disabled={!accepted || busy}>{busy ? 'Ouverture du paiement…' : `Passer à Premium, ${price.amount} ${price.period}`}</Button>
        <p className={s.small}>Paiement sécurisé par Stripe. Résiliable à tout moment depuis votre profil : Premium reste actif jusqu'à la fin de la période payée.</p>
      </div>
    );
  };

  return (
    <div className="page">
      <PageHeader title="Premium" subtitle="Savoir ce que chaque montre vous coûte vraiment." />

      {result === 'ok' && (
        <Notice tone={isPremium ? 'ok' : 'info'}>
          {isPremium ? 'Bienvenue dans Premium. Toutes les fonctionnalités sont débloquées.'
            : waiting ? 'Paiement reçu, activation de Premium en cours…'
            : "Paiement reçu. L'activation prend plus de temps que prévu : rechargez la page dans une minute."}
        </Notice>
      )}
      {result === 'annule' && (
        <Notice>Paiement annulé, rien n'a été débité. <button className={s.linkBtn} onClick={() => setParams({})}>Fermer</button></Notice>
      )}
      {error && <Notice tone="error">{error}</Notice>}

      <div className={s.plans}>
        <section className={s.plan}>
          <h2>Gratuit</h2>
          <p className={s.price}>0 €</p>
          <ul>{FREE.map(f => <li key={f}>{f}</li>)}</ul>
        </section>

        <section className={`${s.plan} ${s.premium}`}>
          <h2>Premium</h2>
          <Segmented label="Facturation" value={interval} onChange={setInterval_}
            options={[{ value: 'year', label: 'À l’année' }, { value: 'month', label: 'Au mois' }]} />
          <p className={s.price}>
            {price.amount}
            <span>{price.period}{price.note && `, ${price.note}`}{!PAYMENTS_ENABLED && '. Bientôt disponible'}</span>
          </p>
          <p className={s.includes}>Ce qui le rentabilise</p>
          <ol className={s.highlights}>
            {PREMIUM_HIGHLIGHTS.map(({ title, text, icon: Icon }) => (
              <li key={title}>
                <span className={s.hlIcon} aria-hidden="true"><Icon size={20} strokeWidth={1.6} /></span>
                <span><strong>{title}</strong>{text}</span>
              </li>
            ))}
          </ol>
          <p className={s.includes}>Et aussi, en plus du gratuit :</p>
          <ul>{PREMIUM_FEATURES.map(f => <li key={f.title}><strong>{f.title}</strong>{f.text}</li>)}</ul>
          {action()}
        </section>
      </div>
    </div>
  );
}
