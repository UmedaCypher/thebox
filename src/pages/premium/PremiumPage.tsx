import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FREE_WATCH_LIMIT, PAYMENTS_ENABLED, premiumPrices } from '../../lib/features';
import type { BillingInterval } from '../../lib/features';
import { premiumFeatures, premiumHighlights } from '../../lib/premium';
import { openBillingPortal, startCheckout } from '../../lib/api';
import { Button, LinkButton, Notice, PageHeader, Segmented } from '../../components/ui';
import WaitlistForm from '../../components/Waitlist/WaitlistForm';
import { defineStrings, useStrings } from '../../i18n';
import { COMMON } from '../../i18n/common';
import { formatEuros } from '../../lib/format';
import s from './PremiumPage.module.css';

const S = defineStrings({
  freeLimit: (n: number) => `Jusqu'à ${n} montres`,
  free: [
    'Passeport partageable pour chaque montre',
    'Calendrier de portage et image du mois',
    'Galerie au poignet',
    'Prix et valeurs déclarés, toujours privés',
  ],
  paymentUnavailable: 'Paiement indisponible.',
  portalUnavailable: 'Espace abonnement indisponible.',
  isPremium: 'Votre compte est Premium. Merci de soutenir The Box.',
  manage: 'Gérer mon abonnement',
  notOpen: "Le paiement n'est pas encore ouvert. Laissez votre adresse et nous vous écrirons une fois, au lancement.",
  signupForPremium: 'Créer un compte pour passer à Premium',
  already: 'Déjà inscrit ?',
  login: 'Se connecter',
  consentBefore: "J'accepte les ",
  terms: 'conditions générales de vente',
  consentAfter: " et je demande l'accès immédiat à Premium.",
  opening: 'Ouverture du paiement…',
  subscribe: (amount: string, period: string) => `Passer à Premium, ${amount} ${period}`,
  secure: "Paiement sécurisé par Stripe. Résiliable à tout moment depuis votre profil : Premium reste actif jusqu'à la fin de la période payée.",
  subtitle: 'Savoir ce que chaque montre vous coûte vraiment.',
  welcome: 'Bienvenue dans Premium. Toutes les fonctionnalités sont débloquées.',
  activating: 'Paiement reçu, activation de Premium en cours…',
  slow: "Paiement reçu. L'activation prend plus de temps que prévu : rechargez la page dans une minute.",
  cancelled: "Paiement annulé, rien n'a été débité.",
  freePlan: 'Gratuit',
  billing: 'Facturation',
  yearly: 'À l’année',
  monthly: 'Au mois',
  soon: '. Bientôt disponible',
  pays: 'Ce qui le rentabilise',
  alsoIncluded: 'Et aussi, en plus du gratuit :',
}, {
  freeLimit: n => `Up to ${n} watches`,
  free: [
    'A shareable passport for every watch',
    'Wear calendar and picture of the month',
    'Wrist gallery',
    'Declared prices and values, always private',
  ],
  paymentUnavailable: 'Payment is unavailable.',
  portalUnavailable: 'Subscription management is unavailable.',
  isPremium: 'Your account is Premium. Thank you for supporting The Box.',
  manage: 'Manage my subscription',
  notOpen: "Payments aren't open yet. Leave your email and we'll write to you once, at launch.",
  signupForPremium: 'Create an account to go Premium',
  already: 'Already have an account?',
  login: 'Sign in',
  consentBefore: 'I accept the ',
  terms: 'terms of sale',
  consentAfter: ' and request immediate access to Premium.',
  opening: 'Opening checkout…',
  subscribe: (amount, period) => `Go Premium, ${amount} ${period}`,
  secure: 'Secure payment by Stripe. Cancel anytime from your profile: Premium stays active until the end of the paid period.',
  subtitle: 'Find out what each watch really costs you.',
  welcome: 'Welcome to Premium. Every feature is now unlocked.',
  activating: 'Payment received, activating Premium…',
  slow: 'Payment received. Activation is taking longer than expected: reload the page in a minute.',
  cancelled: 'Payment cancelled, nothing was charged.',
  freePlan: 'Free',
  billing: 'Billing',
  yearly: 'Yearly',
  monthly: 'Monthly',
  soon: '. Coming soon',
  pays: 'What makes it worth it',
  alsoIncluded: 'Plus, on top of the free plan:',
});

export default function PremiumPage() {
  const t = useStrings(S);
  const c = useStrings(COMMON);
  const FREE = [t.freeLimit(FREE_WATCH_LIMIT), ...t.free];
  const { user, isPremium, refreshProfile } = useAuth();
  const [params, setParams] = useSearchParams();
  const result = params.get('paiement');
  const [accepted, setAccepted] = useState(false);
  const [interval, setInterval_] = useState<BillingInterval>('year');
  const price = premiumPrices()[interval];
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
    try { await startCheckout(interval); } catch (e) { setError(e instanceof Error ? e.message : t.paymentUnavailable); setBusy(false); }
  };
  const manage = async () => {
    setBusy(true); setError(null);
    try { await openBillingPortal(); } catch (e) { setError(e instanceof Error ? e.message : t.portalUnavailable); setBusy(false); }
  };

  const action = () => {
    if (isPremium) {
      return (
        <div className={s.cta}>
          <p>{t.isPremium}</p>
          {PAYMENTS_ENABLED && <Button variant="secondary" onClick={manage} disabled={busy}>{t.manage}</Button>}
        </div>
      );
    }
    if (!PAYMENTS_ENABLED) {
      return (
        <div className={s.cta}>
          <p className={s.muted}>{t.notOpen}</p>
          <WaitlistForm premiumDefault />
        </div>
      );
    }
    if (!user) {
      return (
        <div className={s.cta}>
          <LinkButton to="/signup">{t.signupForPremium}</LinkButton>
          <p className={s.muted}>{t.already} <Link to="/login" state={{ from: { pathname: '/premium' } }}>{t.login}</Link></p>
        </div>
      );
    }
    return (
      <div className={s.cta}>
        <label className={s.consent}>
          <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} />
          <span>{t.consentBefore}<Link to="/cgv">{t.terms}</Link>{t.consentAfter}</span>
        </label>
        <Button onClick={subscribe} disabled={!accepted || busy}>{busy ? t.opening : t.subscribe(price.amount, price.period)}</Button>
        <p className={s.small}>{t.secure}</p>
      </div>
    );
  };

  return (
    <div className="page">
      <PageHeader title="Premium" subtitle={t.subtitle} />

      {result === 'ok' && (
        <Notice tone={isPremium ? 'ok' : 'info'}>
          {isPremium ? t.welcome : waiting ? t.activating : t.slow}
        </Notice>
      )}
      {result === 'annule' && (
        <Notice>{t.cancelled} <button className={s.linkBtn} onClick={() => setParams({})}>{c.close}</button></Notice>
      )}
      {error && <Notice tone="error">{error}</Notice>}

      <div className={s.plans}>
        <section className={`panel ${s.plan}`} data-tone="lume">
          <h2>{t.freePlan}</h2>
          <p className={s.price}>{formatEuros(0)}</p>
          <ul className="chips">{FREE.map(f => <li key={f}>{f}</li>)}</ul>
        </section>

        <section className={`panel ${s.plan}`} data-tone="brass">
          <h2>Premium</h2>
          <Segmented label={t.billing} value={interval} onChange={setInterval_}
            options={[{ value: 'year', label: t.yearly }, { value: 'month', label: t.monthly }]} />
          <p className={s.price}>
            {price.amount}
            <span>{price.period}{price.note && `, ${price.note}`}{!PAYMENTS_ENABLED && t.soon}</span>
          </p>
          <p className={s.includes}>{t.pays}</p>
          <ol className={s.highlights}>
            {premiumHighlights().map(({ title, text, icon: Icon }) => (
              <li key={title}>
                <span className={s.hlIcon} aria-hidden="true"><Icon size={20} strokeWidth={1.6} /></span>
                <span><strong>{title}</strong>{text}</span>
              </li>
            ))}
          </ol>
          <p className={s.includes}>{t.alsoIncluded}</p>
          <ul>{premiumFeatures().map(f => <li key={f.title}><strong>{f.title}</strong>{f.text}</li>)}</ul>
          {action()}
        </section>
      </div>
    </div>
  );
}
