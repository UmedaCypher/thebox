import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { saveProfile } from '../../lib/api';
import { defineStrings, useStrings } from '../../i18n';
import type { LangChoice } from '../../i18n';
import { COMMON } from '../../i18n/common';
import { useLanguageSetting } from '../../i18n/useLanguageSetting';
import { formatDecimal, formatEuros } from '../../lib/format';
import { Button, LinkButton, Notice, Segmented, TextField, Toggle } from '../../components/ui';
import s from './OnboardingPage.module.css';

const S = defineStrings({
  steps: ['Bienvenue', 'Découverte', 'Profil', 'Première montre'],
  stepOf: (i: number, n: number) => `Étape ${i} sur ${n}`,
  welcomeTitle: 'Bienvenue dans votre écrin',
  welcomeLead: 'The Box garde la trace de vos montres, de leur histoire et du temps passé au poignet.',
  heroAlt: 'Un écrin ouvert, ses coussins de velours',
  tour: [
    { kicker: 'Portage', title: 'Notez la montre du jour', text: "Un geste chaque matin. À la fin du mois, vous voyez lesquelles vous portez, et ce que chacune vous coûte à chaque port." },
    { kicker: 'Galerie', title: 'Voyez-la sur des poignets comme le vôtre', text: "Des photos réelles, filtrées par tour de poignet. Partagez les vôtres si vous le souhaitez." },
    { kicker: 'Marché', title: 'Vendez ou échangez entre collectionneurs', text: 'Mettez une montre en annonce depuis sa fiche et discutez directement avec les intéressés, sans commission.' },
  ],
  demo: {
    days: 'jours notés', perWear: 'par port', wrist: (cm: string) => `${cm} cm`,
    forSale: 'À vendre', contact: 'Écrire au vendeur', calendarAria: "Exemple de calendrier de portage", galleryAria: 'Exemple de photos au poignet',
    marketAria: "Exemple d'annonce du Marché",
  },
  next: 'Suivant',
  skip: 'Passer',
  slideOf: (i: number, n: number) => `${i} sur ${n}`,
  language: 'Langue',
  continue: 'Continuer',
  profileTitle: 'Votre profil',
  profileLead: 'Votre pseudo est la seule chose que les autres membres voient de vous. Vous pourrez tout changer plus tard.',
  username: 'Pseudo',
  usernameHint: '3 à 30 caractères : lettres, chiffres, point ou tiret bas.',
  usernameInvalid: 'Le pseudo doit faire 3 à 30 caractères : lettres, chiffres, point ou tiret bas.',
  wrist: 'Tour de poignet',
  wristHint: 'Il aide les autres à se projeter quand vous partagez une photo au poignet.',
  wristInvalid: 'Le tour de poignet doit être compris entre 12 et 26 cm.',
  publicLabel: 'Profil public',
  publicHint: 'Votre pseudo et les photos de vos montres deviennent visibles. Les prix restent toujours privés.',
  messagesLabel: 'Accepter les messages',
  messagesHint: 'Les membres peuvent vous écrire depuis vos annonces et votre profil public.',
  firstTitle: 'Votre première montre',
  firstLead: 'Commencez par celle que vous portez le plus. Une photo, une marque, un modèle : le reste peut attendre.',
  addFirst: 'Ajouter ma première montre',
  later: 'Plus tard',
}, {
  steps: ['Welcome', 'Discover', 'Profile', 'First watch'],
  stepOf: (i, n) => `Step ${i} of ${n}`,
  welcomeTitle: 'Welcome to your watch box',
  welcomeLead: 'The Box keeps track of your watches, their story and the time they spend on your wrist.',
  heroAlt: 'An open watch box with velvet cushions',
  tour: [
    { kicker: 'Wear', title: "Log today's watch", text: 'One tap each morning. By the end of the month you see which ones you wear, and what each one costs you per wear.' },
    { kicker: 'Gallery', title: 'See it on wrists like yours', text: 'Real photos, filtered by wrist size. Share your own if you like.' },
    { kicker: 'Market', title: 'Sell or trade with collectors', text: "List a watch from its page and talk directly with interested members, with no commission." },
  ],
  demo: {
    days: 'days logged', perWear: 'per wear', wrist: cm => `${cm} cm`,
    forSale: 'For sale', contact: 'Message the seller', calendarAria: 'Example wear calendar', galleryAria: 'Example wrist shots',
    marketAria: 'Example Market listing',
  },
  next: 'Next',
  skip: 'Skip',
  slideOf: (i, n) => `${i} of ${n}`,
  language: 'Language',
  continue: 'Continue',
  profileTitle: 'Your profile',
  profileLead: 'Your username is the only thing other members see about you. You can change everything later.',
  username: 'Username',
  usernameHint: '3 to 30 characters: letters, numbers, dot or underscore.',
  usernameInvalid: 'Your username must be 3 to 30 characters: letters, numbers, dot or underscore.',
  wrist: 'Wrist size',
  wristHint: 'It helps others picture a watch when you share a wrist shot.',
  wristInvalid: 'Wrist size must be between 12 and 26 cm.',
  publicLabel: 'Public profile',
  publicHint: 'Your username and watch photos become visible. Prices always stay private.',
  messagesLabel: 'Accept messages',
  messagesHint: 'Members can write to you from your listings and your public profile.',
  firstTitle: 'Your first watch',
  firstLead: 'Start with the one you wear most. A photo, a brand, a model: the rest can wait.',
  addFirst: 'Add my first watch',
  later: 'Later',
});

const IMG = (name: string) => `/landing/${name}.webp`;

/* ---------- Aperçus illustrés (photos réelles de la collection du fondateur) ---------- */

// Un mois de 28 jours : l'index de la montre portée, ou -1.
const MONTH = [0, 1, -1, 2, 0, 3, -1, 1, 0, 4, -1, 2, 0, 1, 3, -1, 0, 2, 1, -1, 4, 0, 1, -1, 2, 0, 3, -1];
const FACES = ['speedmaster-face', 'yachtmaster-face', 'leuba-face', 'tudor-face', 'zenith-face'];

function CalendarDemo({ t }: { t: typeof S.fr }) {
  return (
    <div className={s.demo} role="img" aria-label={t.demo.calendarAria}>
      <div className={s.calendar}>
        {MONTH.map((w, i) => (
          <span key={i} className={s.day} data-worn={w >= 0}>
            {w >= 0 && <img src={IMG(FACES[w])} alt="" loading="lazy" />}
          </span>
        ))}
      </div>
      <div className={s.demoStats}>
        <span><strong className="num">{MONTH.filter(x => x >= 0).length}</strong>{t.demo.days}</span>
        <span><strong className="num">{formatEuros(24)}</strong>{t.demo.perWear}</span>
      </div>
    </div>
  );
}

function GalleryDemo({ t }: { t: typeof S.fr }) {
  return (
    <div className={s.demo} role="img" aria-label={t.demo.galleryAria}>
      <div className={s.fan}>
        {['leuba', 'speedmaster', 'zenith'].map((n, i) => (
          <figure key={n} className={s.fanItem} style={{ ['--i' as string]: i - 1 }}>
            <img src={IMG(n)} alt="" loading="lazy" />
            {i === 1 && <figcaption className="num">{t.demo.wrist(formatDecimal(17.5))}</figcaption>}
          </figure>
        ))}
      </div>
    </div>
  );
}

function MarketDemo({ t }: { t: typeof S.fr }) {
  return (
    <div className={s.demo} role="img" aria-label={t.demo.marketAria}>
      <div className={s.listing}>
        <div className={s.listingPhoto}>
          <img src={IMG('tudor')} alt="" loading="lazy" />
          <span className={s.badge}>{t.demo.forSale}</span>
        </div>
        <div className={s.listingBody}>
          <span className={s.listingBrand}>Tudor</span>
          <span className={s.listingModel}>Prince Date “Tiger”</span>
          <span className={`${s.listingPrice} num`}>{formatEuros(5900)}</span>
          <span className={s.fakeButton}><MessageCircle size={14} strokeWidth={1.8} aria-hidden="true" />{t.demo.contact}</span>
        </div>
      </div>
    </div>
  );
}

const DEMOS = [CalendarDemo, GalleryDemo, MarketDemo];

/** Trois aperçus à faire défiler du doigt. */
function Tour({ onDone }: { onDone: () => void }) {
  const t = useStrings(S);
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const last = t.tour.length - 1;

  const goTo = (i: number) => {
    const el = track.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <section className={s.step}>
      <div
        ref={track}
        className={s.track}
        onScroll={e => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        aria-roledescription="carousel"
      >
        {t.tour.map((slide, i) => {
          const Demo = DEMOS[i];
          return (
            <article key={slide.kicker} className={s.slide} aria-roledescription="slide" aria-label={t.slideOf(i + 1, t.tour.length)} aria-hidden={i !== index}>
              <Demo t={t} />
              <p className={s.kicker}>{slide.kicker}</p>
              <h1 className={s.slideTitle}>{slide.title}</h1>
              <p className={s.lead}>{slide.text}</p>
            </article>
          );
        })}
      </div>
      <div className={s.slideDots} aria-hidden="true">
        {t.tour.map((_, i) => <button key={i} type="button" tabIndex={-1} data-on={i === index} onClick={() => goTo(i)} />)}
      </div>
      <div className={s.actions}>
        <Button block onClick={() => (index < last ? goTo(index + 1) : onDone())}>{index < last ? t.next : t.continue}</Button>
        {index < last && <Button variant="ghost" onClick={onDone}>{t.skip}</Button>}
      </div>
    </section>
  );
}

/** Accueil à la première connexion : langue, profil, première montre. */
export default function OnboardingPage() {
  const t = useStrings(S);
  const c = useStrings(COMMON);
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { choice, change } = useLanguageSetting();
  const [step, setStep] = useState(0);
  const suggested = typeof user?.user_metadata?.username === 'string' ? user.user_metadata.username : '';
  const [f, setF] = useState({
    username: profile?.username ?? suggested,
    wrist: profile?.wrist_size_cm ? formatDecimal(profile.wrist_size_cm) : '',
    is_public: Boolean(profile?.is_public),
    messages: profile?.allow_private_messages !== false,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Accueil déjà terminé (ou colonne absente) : direction la collection.
  if (profile && profile.onboarded_at !== null && step === 0) return <Navigate to="/collection" replace />;

  const saveProfileStep = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const username = f.username.trim();
    if (!/^[a-z0-9._]{3,30}$/i.test(username)) { setError(t.usernameInvalid); return; }
    const wrist = f.wrist.trim() ? Number(f.wrist.replace(',', '.')) : null;
    if (wrist !== null && (!Number.isFinite(wrist) || wrist < 12 || wrist > 26)) { setError(t.wristInvalid); return; }
    setSaving(true);
    try {
      await saveProfile(user!.id, {
        username, wrist_size_cm: wrist, is_public: f.is_public, allow_private_messages: f.messages,
        onboarded_at: new Date().toISOString(),
      }, Boolean(profile));
      await refreshProfile();
      setStep(3);
    } catch (x) {
      setError(x instanceof Error ? x.message : c.error);
    } finally { setSaving(false); }
  };

  return (
    <div className={s.page}>
      <div className={s.card}>
        <ol className={s.dots} aria-label={t.stepOf(step + 1, t.steps.length)}>
          {t.steps.map((label, i) => <li key={label} data-state={i < step ? 'done' : i === step ? 'current' : 'next'} aria-current={i === step ? 'step' : undefined}><span className="visually-hidden">{label}</span></li>)}
        </ol>

        {step === 0 && (
          <section className={s.step}>
            <img src={IMG('ecrin-ouvert')} alt={t.heroAlt} className={s.hero} />
            <h1>{t.welcomeTitle}</h1>
            <p className={s.lead}>{t.welcomeLead}</p>
            <div className={s.field}>
              <span className={s.label}>{t.language}</span>
              <Segmented label={t.language} value={choice} onChange={(v: LangChoice) => change(v)}
                options={[{ value: 'auto', label: c.language.auto }, { value: 'fr', label: 'Français' }, { value: 'en', label: 'English' }]} />
            </div>
            <Button block onClick={() => setStep(1)}>{t.continue}</Button>
          </section>
        )}

        {step === 1 && <Tour onDone={() => setStep(2)} />}

        {step === 2 && (
          <form className={s.step} onSubmit={saveProfileStep} noValidate>
            <h1>{t.profileTitle}</h1>
            <p className={s.lead}>{t.profileLead}</p>
            {error && <Notice tone="error">{error}</Notice>}
            <TextField label={t.username} value={f.username} onChange={e => setF({ ...f, username: e.target.value })}
              hint={t.usernameHint} autoCapitalize="none" autoComplete="username" required autoFocus />
            <TextField label={t.wrist} optional inputMode="decimal" suffix="cm" value={f.wrist}
              onChange={e => setF({ ...f, wrist: e.target.value })} hint={t.wristHint} />
            <Toggle label={t.publicLabel} description={t.publicHint} checked={f.is_public} onChange={v => setF({ ...f, is_public: v })} />
            <Toggle label={t.messagesLabel} description={t.messagesHint} checked={f.messages} onChange={v => setF({ ...f, messages: v })} />
            <div className={s.actions}>
              <Button type="submit" block disabled={saving}>{saving ? c.saving : t.continue}</Button>
              <Button variant="ghost" onClick={() => setStep(1)}>{c.back}</Button>
            </div>
          </form>
        )}

        {step === 3 && (
          <section className={s.step}>
            <img src={IMG('ecrin-ferme')} alt="" className={s.hero} />
            <h1>{t.firstTitle}</h1>
            <p className={s.lead}>{t.firstLead}</p>
            <div className={s.actions}>
              <LinkButton to="/ajouter-montre" block replace>{t.addFirst}</LinkButton>
              <Button variant="ghost" onClick={() => navigate('/accueil', { replace: true })}>{t.later}</Button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
