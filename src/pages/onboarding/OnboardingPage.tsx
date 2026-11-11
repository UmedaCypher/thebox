import { useMemo, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Activity, Check, FileText, MessageCircle, ShieldAlert, Sparkles, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { saveProfile } from '../../lib/api';
import { defineStrings, useStrings } from '../../i18n';
import type { LangChoice } from '../../i18n';
import { COMMON } from '../../i18n/common';
import { useLanguageSetting } from '../../i18n/useLanguageSetting';
import { formatDecimal, formatEuros } from '../../lib/format';
import { FREE_WATCH_LIMIT, canPurchase, premiumPrices } from '../../lib/features';
import { allPremiumFeatures } from '../../lib/premium';
import FoundersOffer from '../../components/FoundersOffer/FoundersOffer';
import { Button, LinkButton, Notice, Segmented, TextField, Toggle } from '../../components/ui';
import s from './OnboardingPage.module.css';

/*
 * Accueil des nouveaux membres. On ne vend pas des fonctions : on part de ce qui agace un collectionneur
 * (« je ne sais plus ce que je porte », « mes papiers sont partout »…) et on montre ce que devient sa collection.
 * Les besoins cochés passent en premier dans la découverte ; Premium est proposé à la fin, sans insister.
 */
type Need = 'wear' | 'papers' | 'fit' | 'sell' | 'accuracy' | 'theft' | 'share';
const NEEDS: Need[] = ['wear', 'papers', 'fit', 'sell', 'accuracy', 'theft', 'share'];

const S = defineStrings({
  steps: ['Bienvenue', 'Vos besoins', 'Découverte', 'Profil', 'Premium', 'Première montre'],
  stepOf: (i: number, n: number) => `Étape ${i} sur ${n}`,
  welcomeTitle: 'Bienvenue dans votre écrin',
  welcomeLead: 'Une collection mérite mieux qu’un tiroir, une boîte mail et des souvenirs approximatifs. En quelques minutes, voyons ce qu’Arcora peut changer pour vous.',
  heroAlt: 'Un écrin ouvert, ses coussins de velours',
  needsTitle: 'Qu’est-ce qui vous ressemble\u00a0?',
  needsLead: 'Cochez tout ce qui vous parle\u00a0: on commencera par là.',
  needs: {
    wear: 'Je ne sais plus vraiment quelles montres je porte',
    papers: 'Mes papiers, factures et révisions sont éparpillés',
    fit: 'J’hésite avant d’acheter\u00a0: est-ce qu’elle m’ira\u00a0?',
    sell: 'Je voudrais vendre ou échanger sans commission',
    accuracy: 'Ma montre avance ou retarde, est-ce normal\u00a0?',
    theft: 'J’ai peur du vol, et d’être mal assuré',
    share: 'Je veux partager ma passion avec d’autres collectionneurs',
  } as Record<Need, string>,
  tour: {
    wear: { kicker: 'Wrist Check', before: 'Avant\u00a0: des montres qui dorment sans que vous le sachiez.', title: 'Chaque montre retrouve sa place au poignet', text: 'Un geste le matin pour noter la montre du jour. Votre série avance, des badges marquent les paliers, et à la fin du mois vous voyez enfin votre vraie rotation et ce que chaque montre vous coûte à chaque port.' },
    papers: { kicker: 'Dossier et entretien', before: 'Avant\u00a0: des papiers dans un tiroir, des factures dans une boîte mail.', title: 'Tout le dossier de chaque montre, au même endroit', text: 'Référence, calibre, numéro de série, boîte et papiers, révisions et rappels d’entretien. Le jour où vous vendez ou assurez, tout est prêt, et l’inventaire pour l’assureur se génère en un clic.' },
    fit: { kicker: 'Galerie au poignet', before: 'Avant\u00a0: des photos de catalogue sur des poignets qui ne ressemblent pas au vôtre.', title: 'Sachez si elle vous ira avant de l’acheter', text: 'Des wrist shots réels, classés par tour de poignet. Les membres disent si la montre est petite, parfaite ou grande\u00a0: vous voyez ce qui va vraiment à un poignet comme le vôtre.' },
    sell: { kicker: 'Marché', before: 'Avant\u00a0: des plateformes qui prennent leur part sur chaque vente.', title: 'Vendez entre passionnés, et gardez 100 % du prix', text: 'Un marché pair à pair\u00a0: vous publiez l’annonce depuis la fiche de la montre, vous échangez par messagerie avec des collectionneurs, et Arcora ne prend aucune commission. Zéro.' },
    accuracy: { kicker: 'Timegrapher', before: 'Avant\u00a0: une montre qui dérive, sans savoir si c’est normal.', title: 'Mesurez sa précision avec votre téléphone', text: 'Posez la montre contre le micro\u00a0: en 30 secondes, Arcora mesure sa marche et son défaut de repère. Enregistrez la mesure et suivez son évolution, pour savoir quand passer chez l’horloger.' },
    theft: { kicker: 'Sécurité', before: 'Avant\u00a0: en cas de vol, des preuves introuvables et une montre revendue en deux clics.', title: 'Protégez vos montres, même après un vol', text: 'Numéro de série privé, factures et papiers rangés. En cas de vol, une déclaration retire la montre du Marché et bloque toute revente sur Arcora, et chacun peut vérifier un numéro avant d’acheter.' },
    share: { kicker: 'Social', before: 'Avant\u00a0: une passion vécue seul, ou noyée dans des réseaux qui n’y connaissent rien.', title: 'Une communauté qui parle montres, et seulement montres', text: 'Suivez des collectionneurs, publiez vos nouvelles pièces, commentez, comparez deux montres côte à côte. Votre collection reste privée tant que vous le décidez.' },
  } as Record<Need, { kicker: string; before: string; title: string; text: string }>,
  demo: {
    days: 'jours notés', perWear: 'par port', wrist: (cm: string) => `${cm} cm`,
    forSale: 'À vendre', contact: 'Écrire au vendeur', calendarAria: 'Exemple de calendrier de portage', galleryAria: 'Exemple de photos au poignet',
    marketAria: 'Exemple d’annonce du Marché', commission: '0 % de commission',
    papers: ['Facture d’achat', 'Carte de garantie', 'Révision 2025', 'Inventaire assurance'],
    accuracy: ['+3,2 s/j · cadran en haut', '+5,1 s/j · couronne en bas', 'Dans les tolérances chronomètre'],
    theft: ['N° de série enregistré', 'Montre retirée du Marché', 'Revente bloquée sur Arcora'],
    share: ['@lea_watches a publié un wrist shot', '12 j’aime · 3 commentaires', 'Suivre'],
  },
  next: 'Suivant',
  skip: 'Passer',
  slideOf: (i: number, n: number) => `${i} sur ${n}`,
  language: 'Langue',
  continue: 'Continuer',
  profileTitle: 'Votre profil',
  profileLead: 'Votre pseudo est la seule chose que les autres membres voient de vous. Vous pourrez tout changer plus tard.',
  username: 'Pseudo',
  usernameHint: '3 à 30 caractères\u00a0: lettres, chiffres, point ou tiret bas.',
  usernameInvalid: 'Le pseudo doit faire 3 à 30 caractères\u00a0: lettres, chiffres, point ou tiret bas.',
  wrist: 'Tour de poignet',
  wristHint: 'Il aide les autres à se projeter quand vous partagez une photo au poignet.',
  wristInvalid: 'Le tour de poignet doit être compris entre 12 et 26 cm.',
  publicLabel: 'Profil public',
  publicHint: 'Votre pseudo et les photos de vos montres deviennent visibles, et vous pouvez publier dans le feed. Les prix restent toujours privés.',
  messagesLabel: 'Accepter les messages',
  messagesHint: 'Les membres peuvent vous écrire depuis vos annonces et votre profil public.',
  premiumTitle: 'Et quand la collection grandit\u00a0?',
  premiumLead: (n: number) => `Arcora est gratuit jusqu’à ${n} montres, sans limite de temps. Premium ouvre l’écrin en grand, et finance une app indépendante, sans publicité ni revente de données.`,
  seePremium: 'Choisir Premium',
  continueFree: 'Commencer gratuitement',
  priceLine: (m: string, y: string) => `${m} par mois, ou ${y} par an`,
  firstTitle: 'Votre première montre',
  firstLead: 'Commencez par celle que vous portez le plus. Une photo, une marque, un modèle\u00a0: le reste peut attendre.',
  addFirst: 'Ajouter ma première montre',
  later: 'Plus tard',
}, {
  steps: ['Welcome', 'Your needs', 'Discover', 'Profile', 'Premium', 'First watch'],
  stepOf: (i, n) => `Step ${i} of ${n}`,
  welcomeTitle: 'Welcome to your watch box',
  welcomeLead: 'A collection deserves better than a drawer, an inbox and fuzzy memories. In a few minutes, let’s see what Arcora can change for you.',
  heroAlt: 'An open watch box with velvet cushions',
  needsTitle: 'What sounds like you?',
  needsLead: 'Tick everything that rings true: we’ll start there.',
  needs: {
    wear: 'I’m not really sure which watches I actually wear',
    papers: 'My papers, invoices and services are scattered everywhere',
    fit: 'I hesitate before buying: will it suit my wrist?',
    sell: 'I’d like to sell or trade with no commission',
    accuracy: 'My watch runs fast or slow, is that normal?',
    theft: 'I worry about theft, and about being under-insured',
    share: 'I want to share my passion with other collectors',
  },
  tour: {
    wear: { kicker: 'Wrist Check', before: 'Before: watches sleeping in a drawer without you noticing.', title: 'Every watch finds its way back to your wrist', text: 'One tap in the morning to log today’s watch. Your streak grows, badges mark the milestones, and by the end of the month you finally see your real rotation and what each watch costs per wear.' },
    papers: { kicker: 'File and servicing', before: 'Before: papers in a drawer, invoices in an inbox.', title: 'Each watch’s full file, in one place', text: 'Reference, calibre, serial number, box and papers, services and reminders. The day you sell or insure, everything is ready, and the insurance inventory is one tap away.' },
    fit: { kicker: 'On-wrist gallery', before: 'Before: catalogue photos on wrists nothing like yours.', title: 'Know if it suits you before you buy', text: 'Real wrist shots, sorted by wrist size. Members say whether the watch is small, perfect or large: you see what really works on a wrist like yours.' },
    sell: { kicker: 'Market', before: 'Before: platforms taking a cut of every sale.', title: 'Sell among enthusiasts and keep 100% of the price', text: 'A peer-to-peer market: list from the watch’s page, talk with collectors through messaging, and Arcora takes no commission. Zero.' },
    accuracy: { kicker: 'Timegrapher', before: 'Before: a watch drifting, with no idea if it’s normal.', title: 'Measure its accuracy with your phone', text: 'Place the watch against the microphone: in 30 seconds Arcora measures its rate and beat error. Save the reading and follow it over time, so you know when to see a watchmaker.' },
    theft: { kicker: 'Security', before: 'Before: after a theft, missing proof and a watch resold in two clicks.', title: 'Protect your watches, even after a theft', text: 'Private serial number, invoices and papers stored. If it’s stolen, a report removes the watch from the Market and blocks any resale on Arcora, and anyone can check a serial before buying.' },
    share: { kicker: 'Social', before: 'Before: a passion lived alone, or lost in networks that know nothing about it.', title: 'A community that talks watches, and only watches', text: 'Follow collectors, post your new pieces, comment, compare two watches side by side. Your collection stays private for as long as you want.' },
  },
  demo: {
    days: 'days logged', perWear: 'per wear', wrist: cm => `${cm} cm`,
    forSale: 'For sale', contact: 'Message the seller', calendarAria: 'Example wear calendar', galleryAria: 'Example wrist shots',
    marketAria: 'Example Market listing', commission: '0% commission',
    papers: ['Purchase invoice', 'Warranty card', '2025 service', 'Insurance inventory'],
    accuracy: ['+3.2 s/d · dial up', '+5.1 s/d · crown down', 'Within chronometer tolerances'],
    theft: ['Serial number saved', 'Removed from the Market', 'Resale blocked on Arcora'],
    share: ['@lea_watches posted a wrist shot', '12 likes · 3 comments', 'Follow'],
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
  publicHint: 'Your username and watch photos become visible, and you can post in the feed. Prices always stay private.',
  messagesLabel: 'Accept messages',
  messagesHint: 'Members can write to you from your listings and your public profile.',
  premiumTitle: 'And when the collection grows?',
  premiumLead: n => `Arcora is free up to ${n} watches, with no time limit. Premium opens the box wide, and funds an independent app with no ads and no data resale.`,
  seePremium: 'Choose Premium',
  continueFree: 'Start for free',
  priceLine: (m, y) => `${m} a month, or ${y} a year`,
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
          <span className={s.zero}>{t.demo.commission}</span>
          <span className={s.fakeButton}><MessageCircle size={14} strokeWidth={1.8} aria-hidden="true" />{t.demo.contact}</span>
        </div>
      </div>
    </div>
  );
}


/** Aperçu générique : une icône et quelques lignes cochées. */
function ListDemo({ icon, lines, label }: { icon: ReactNode; lines: string[]; label: string }) {
  return (
    <div className={s.demo} role="img" aria-label={label}>
      <div className={s.listDemo}>
        <span className={s.listIcon}>{icon}</span>
        <ul>{lines.map(l => <li key={l}><Check size={14} strokeWidth={2.4} aria-hidden="true" />{l}</li>)}</ul>
      </div>
    </div>
  );
}

function Demo({ need, t }: { need: Need; t: typeof S.fr }) {
  switch (need) {
    case 'wear': return <CalendarDemo t={t} />;
    case 'fit': return <GalleryDemo t={t} />;
    case 'sell': return <MarketDemo t={t} />;
    case 'papers': return <ListDemo icon={<FileText size={26} strokeWidth={1.5} />} lines={t.demo.papers} label={t.tour.papers.kicker} />;
    case 'accuracy': return <ListDemo icon={<Activity size={26} strokeWidth={1.5} />} lines={t.demo.accuracy} label={t.tour.accuracy.kicker} />;
    case 'theft': return <ListDemo icon={<ShieldAlert size={26} strokeWidth={1.5} />} lines={t.demo.theft} label={t.tour.theft.kicker} />;
    case 'share': return <ListDemo icon={<Users size={26} strokeWidth={1.5} />} lines={t.demo.share} label={t.tour.share.kicker} />;
  }
}

/** La découverte : chaque fonction racontée comme une transformation, les besoins cochés d'abord. */
function Tour({ order, onDone }: { order: Need[]; onDone: () => void }) {
  const t = useStrings(S);
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const last = order.length - 1;

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
        {order.map((need, i) => {
          const slide = t.tour[need];
          return (
            <article key={need} className={s.slide} aria-roledescription="slide" aria-label={t.slideOf(i + 1, order.length)} aria-hidden={i !== index}>
              <Demo need={need} t={t} />
              <p className={s.kicker}>{slide.kicker}</p>
              <p className={s.before}>{slide.before}</p>
              <h1 className={s.slideTitle}>{slide.title}</h1>
              <p className={s.lead}>{slide.text}</p>
            </article>
          );
        })}
      </div>
      <div className={s.slideDots} aria-hidden="true">
        {order.map((n, i) => <button key={n} type="button" tabIndex={-1} data-on={i === index} onClick={() => goTo(i)} />)}
      </div>
      <div className={s.actions}>
        <Button block onClick={() => (index < last ? goTo(index + 1) : onDone())}>{index < last ? t.next : t.continue}</Button>
        {index < last && <Button variant="ghost" onClick={onDone}>{t.skip}</Button>}
      </div>
    </section>
  );
}

/** Accueil à la première connexion : langue, besoins, découverte, profil, Premium, première montre. */
export default function OnboardingPage() {
  const t = useStrings(S);
  const c = useStrings(COMMON);
  const { user, profile, refreshProfile, isPremium } = useAuth();
  const navigate = useNavigate();
  const { choice, change } = useLanguageSetting();
  const [step, setStep] = useState(0);
  const [needs, setNeeds] = useState<Need[]>([]);
  const order = useMemo(() => [...needs, ...NEEDS.filter(n => !needs.includes(n))], [needs]);
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

  const toggleNeed = (n: Need) => setNeeds(x => (x.includes(n) ? x.filter(y => y !== n) : [...x, n]));
  const prices = premiumPrices();

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
      setStep(isPremium ? 5 : 4);
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

        {step === 1 && (
          <section className={s.step}>
            <h1>{t.needsTitle}</h1>
            <p className={s.lead}>{t.needsLead}</p>
            <ul className={s.needs}>
              {NEEDS.map(n => (
                <li key={n}>
                  <button type="button" className={s.need} aria-pressed={needs.includes(n)} onClick={() => toggleNeed(n)}>
                    <span className={s.needBox} aria-hidden="true">{needs.includes(n) && <Check size={14} strokeWidth={3} />}</span>
                    {t.needs[n]}
                  </button>
                </li>
              ))}
            </ul>
            <div className={s.actions}>
              <Button block onClick={() => setStep(2)}>{t.continue}</Button>
              <Button variant="ghost" onClick={() => setStep(0)}>{c.back}</Button>
            </div>
          </section>
        )}

        {step === 2 && <Tour order={order} onDone={() => setStep(3)} />}

        {step === 3 && (
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
              <Button variant="ghost" onClick={() => setStep(2)}>{c.back}</Button>
            </div>
          </form>
        )}

        {step === 4 && (
          <section className={s.step}>
            <p className={s.kicker}><Sparkles size={14} aria-hidden="true" /> Premium</p>
            <h1>{t.premiumTitle}</h1>
            <p className={s.lead}>{t.premiumLead(FREE_WATCH_LIMIT)}</p>
            <ul className={s.premiumList}>
              {allPremiumFeatures().slice(0, 5).map(x => <li key={x.title}><Check size={14} strokeWidth={2.4} aria-hidden="true" /><span><strong>{x.title}</strong> {x.text}</span></li>)}
            </ul>
            {canPurchase() && <><FoundersOffer compact /><p className={s.priceLine}>{t.priceLine(prices.month.amount, prices.year.amount)}</p></>}
            <div className={s.actions}>
              {canPurchase() && <LinkButton to="/premium" block>{t.seePremium}</LinkButton>}
              <Button variant={canPurchase() ? 'ghost' : 'primary'} block={!canPurchase()} onClick={() => setStep(5)}>{t.continueFree}</Button>
            </div>
          </section>
        )}

        {step === 5 && (
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
