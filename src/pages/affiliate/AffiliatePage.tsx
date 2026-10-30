import { useCallback, useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, QrCode, Share2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getMyAffiliate, getMyReferrals, joinAffiliateProgram, trackEvent, updateAffiliatePayout } from '../../lib/api';
import type { Affiliate, AffiliateCommission, MyReferrals } from '../../lib/api';
import {
  AFFILIATE_HOLD_DAYS, AFFILIATE_MIN_PAYOUT_EUR, AFFILIATE_RATE, AFFILIATE_TYPES, MEMBER_REWARDS_PER_YEAR,
  PREMIUM_YEAR_EUR, VAT_RATE, affiliateCommissionPerYear,
} from '../../lib/features';
import { REF_DAYS, withRef } from '../../lib/source';
import { Button, Loading, Notice, PageHeader, Segmented, TextField } from '../../components/ui';
import { useToast } from '../../components/Toast/Toast';
import { defineStrings, useStrings } from '../../i18n';
import { formatDate, formatEuros } from '../../lib/format';
import s from './AffiliatePage.module.css';

const pct = `${Math.round(AFFILIATE_RATE * 100)}\u00a0%`;
const pctEn = `${Math.round(AFFILIATE_RATE * 100)}%`;
const eur = (cents: number) => formatEuros(cents / 100, cents % 100 !== 0);
const months = (days: number) => Math.round(days / 30);
const M = AFFILIATE_TYPES.member, C = AFFILIATE_TYPES.creator, PRO = AFFILIATE_TYPES.pro;

const S = defineStrings({
  title: 'Parrainage',
  subtitle: 'Faites découvrir Arcora : vos proches reçoivent du Premium, et vous aussi.',
  founder: 'Membre fondateur',
  founderHint: 'Vous faites partie des premiers membres : ce badge est à vie.',
  // Parrainage membre
  memberKicker: 'Votre lien de parrainage',
  memberChips: [
    `${months(M.welcomeDays)} mois de Premium offert à chaque filleul`,
    `${months(M.rewardDays)} mois pour vous dès qu'il a ajouté 3 montres`,
    `Jusqu'à ${MEMBER_REWARDS_PER_YEAR} mois par an`,
  ],
  needUsername: 'Choisissez un pseudo dans votre profil : il sert de code de parrainage.',
  toProfile: 'Choisir mon pseudo',
  invited: 'Inscrits par votre lien',
  active: 'Ont ajouté 3 montres',
  earned: 'Mois gagnés',
  premiumUntil: (d: string) => `Premium offert jusqu'au ${d}.`,
  rewardsLeft: (n: number) => `Encore ${n} mois à gagner cette année.`,
  // Lien
  copy: 'Copier',
  copied: 'Copié',
  share: 'Partager',
  qr: 'QR code',
  shareText: 'Je range ma collection de montres sur Arcora :',
  linkHint: `Valable ${REF_DAYS} jours après le clic.`,
  // Programmes
  programs: 'Ambassadeurs et partenaires',
  programsLead: "Vous avez une audience ou une boutique ? Deux programmes, validés par l'équipe.",
  creatorTitle: 'Ambassadeur créateur',
  creatorFor: 'YouTubeurs, podcasteurs, instagrammeurs horlogers',
  creatorChips: (per: string) => [
    `${pct} du prix HT de la première année, soit ${per} par abonné annuel`,
    `${months(C.welcomeDays)} mois de Premium offerts à votre public`,
    'Badge ambassadeur',
  ],
  proTitle: 'Partenaire pro',
  proFor: 'Horlogers, boutiques, revendeurs',
  proChips: [
    `${months(PRO.welcomeDays)} mois de Premium offerts à vos clients`,
    'QR code à poser en boutique',
    "Mention dans l'app",
  ],
  apply: 'Demander à rejoindre',
  kind: 'Programme',
  kindCreator: 'Créateur',
  kindPro: 'Professionnel',
  code: 'Code souhaité',
  codeHint: '3 à 30 caractères : lettres minuscules, chiffres, point, tiret. Il apparaît dans votre lien.',
  website: 'Votre chaîne, compte ou boutique',
  websiteHint: 'Lien vers votre chaîne YouTube, votre compte Instagram ou le site de la boutique, pour que nous puissions valider la demande.',
  acceptBefore: "J'accepte les ",
  terms: 'conditions du programme',
  acceptAfter: ' et je signalerai mes publications comme collaboration commerciale.',
  send: 'Envoyer la demande',
  sending: 'Envoi…',
  sent: 'Demande envoyée. Nous vous répondons rapidement.',
  pending: (code: string) => `Votre demande (code « ${code} ») est en cours d'examen. Vous serez prévenu par e-mail.`,
  suspended: 'Votre compte partenaire est suspendu : votre code ne donne plus d’avantage. Écrivez-nous pour en savoir plus.',
  // Espace ambassadeur
  creatorKicker: 'Votre lien ambassadeur',
  proKicker: 'Votre lien partenaire',
  disclose: 'Quand vous publiez ce lien, indiquez «\u00a0collaboration commerciale\u00a0» ou «\u00a0lien affilié\u00a0»\u00a0: c\'est une obligation légale.',
  qrHint: 'Imprimez le QR code près de la caisse : vos clients enregistrent leur nouvelle montre et reçoivent leur Premium offert.',
  signups: 'Inscrits',
  subscribers: 'Abonnés annuels',
  pendingCents: 'En attente',
  due: 'À verser',
  paid: 'Déjà versé',
  history: 'Commissions',
  none: 'Pas encore de commission. Elles apparaîtront ici dès le premier abonnement annuel.',
  status: {
    pending: (d: string) => `En attente jusqu'au ${d}`,
    due: 'À verser',
    paid: (d: string) => `Versée le ${d}`,
    cancelled: 'Annulée (remboursement)',
  },
  how: `Une commission est confirmée ${AFFILIATE_HOLD_DAYS} jours après le paiement de l'abonné, une fois passé le délai de rétractation.`,
  example: (incl: string, excl: string, per: string) => `${incl} TTC → ${excl} HT × ${pct} = ${per}`,
  payout: 'Coordonnées de virement',
  payoutHint: `Les virements partent au début de chaque mois dès ${AFFILIATE_MIN_PAYOUT_EUR} € à verser ; en dessous, le solde est reporté.`,
  holder: 'Titulaire du compte',
  iban: 'IBAN',
  ibanSaved: (last4: string) => `IBAN enregistré, se terminant par ${last4}. Saisissez-le à nouveau pour le changer.`,
  save: 'Enregistrer',
  saving: 'Enregistrement…',
  saved: 'Coordonnées enregistrées.',
  taxes: 'Ces sommes sont des revenus à déclarer. Au-delà d\'un usage occasionnel, un statut (micro-entreprise, société) peut être nécessaire.',
}, {
  title: 'Referrals',
  subtitle: 'Share Arcora: your friends get Premium, and so do you.',
  founder: 'Founding member',
  founderHint: 'You are one of the first members: this badge is yours for life.',
  memberKicker: 'Your referral link',
  memberChips: [
    `${months(M.welcomeDays)} month of Premium for each friend`,
    `${months(M.rewardDays)} month for you once they add 3 watches`,
    `Up to ${MEMBER_REWARDS_PER_YEAR} months a year`,
  ],
  needUsername: 'Choose a username in your profile: it is your referral code.',
  toProfile: 'Choose my username',
  invited: 'Signed up with your link',
  active: 'Added 3 watches',
  earned: 'Months earned',
  premiumUntil: (d: string) => `Free Premium until ${d}.`,
  rewardsLeft: (n: number) => `${n} more months to earn this year.`,
  copy: 'Copy',
  copied: 'Copied',
  share: 'Share',
  qr: 'QR code',
  shareText: 'I keep my watch collection on Arcora:',
  linkHint: `Valid for ${REF_DAYS} days after the click.`,
  programs: 'Ambassadors and partners',
  programsLead: 'Do you have an audience or a shop? Two programmes, approved by the team.',
  creatorTitle: 'Creator ambassador',
  creatorFor: 'Watch YouTubers, podcasters, Instagrammers',
  creatorChips: (per: string) => [
    `${pctEn} of the first year before tax, that is ${per} per yearly subscriber`,
    `${months(C.welcomeDays)} months of Premium for your audience`,
    'Ambassador badge',
  ],
  proTitle: 'Professional partner',
  proFor: 'Watchmakers, shops, dealers',
  proChips: [
    `${months(PRO.welcomeDays)} months of Premium for your customers`,
    'A QR code for your counter',
    'A mention in the app',
  ],
  apply: 'Apply',
  kind: 'Programme',
  kindCreator: 'Creator',
  kindPro: 'Professional',
  code: 'Preferred code',
  codeHint: '3 to 30 characters: lowercase letters, digits, dot, dash. It appears in your link.',
  website: 'Your channel, account or shop',
  websiteHint: 'A link to your YouTube channel, Instagram account or shop website, so we can review your application.',
  acceptBefore: 'I accept the ',
  terms: 'programme terms',
  acceptAfter: ' and will label my posts as advertising.',
  send: 'Send my application',
  sending: 'Sending…',
  sent: 'Application sent. We will get back to you soon.',
  pending: (code: string) => `Your application (code “${code}”) is being reviewed. We will email you.`,
  suspended: 'Your partner account is suspended: your code no longer gives any benefit. Write to us to find out more.',
  creatorKicker: 'Your ambassador link',
  proKicker: 'Your partner link',
  disclose: 'When you post this link, label it as an ad or affiliate link: it is a legal requirement.',
  qrHint: 'Print the QR code near your till: customers log their new watch and get their free Premium.',
  signups: 'Sign-ups',
  subscribers: 'Yearly subscribers',
  pendingCents: 'Pending',
  due: 'Due',
  paid: 'Paid out',
  history: 'Commissions',
  none: 'No commission yet. They will show here from the first yearly subscription.',
  status: {
    pending: (d: string) => `Pending until ${d}`,
    due: 'Due',
    paid: (d: string) => `Paid on ${d}`,
    cancelled: 'Cancelled (refund)',
  },
  how: `A commission is confirmed ${AFFILIATE_HOLD_DAYS} days after the subscriber's payment, once the withdrawal period is over.`,
  example: (incl: string, excl: string, per: string) => `${incl} incl. VAT → ${excl} excl. VAT × ${pctEn} = ${per}`,
  payout: 'Bank details',
  payoutHint: `Transfers go out at the start of each month once €${AFFILIATE_MIN_PAYOUT_EUR} is due; below that, the balance carries over.`,
  holder: 'Account holder',
  iban: 'IBAN',
  ibanSaved: (last4: string) => `IBAN saved, ending in ${last4}. Enter it again to change it.`,
  save: 'Save',
  saving: 'Saving…',
  saved: 'Bank details saved.',
  taxes: 'This is income you must declare. Beyond occasional use, you may need a business status.',
});

const suggestCode = (username?: string | null) =>
  (username ?? '').toLowerCase().replace(/[^a-z0-9._-]/g, '').replace(/^[^a-z0-9]+/, '').slice(0, 30);

export default function AffiliatePage() {
  const t = useStrings(S);
  const { profile, founder } = useAuth();
  const [refs, setRefs] = useState<MyReferrals | null | undefined>(undefined);
  const [aff, setAff] = useState<Affiliate | null | undefined>(undefined);

  const loadAff = useCallback(() => getMyAffiliate().then(setAff), []);
  useEffect(() => { getMyReferrals().then(setRefs); loadAff(); }, [loadAff]);

  return (
    <div className={`page ${s.page}`}>
      <PageHeader title={t.title} subtitle={t.subtitle} />
      {founder && (
        <p className={s.founder}><span className={s.founderDot} aria-hidden="true" /><b>{t.founder}</b><small>{t.founderHint}</small></p>
      )}
      <MemberReferral username={profile?.username ?? null} refs={refs} />
      {aff === undefined ? <Loading /> : aff ? <Partner aff={aff} onChange={loadAff} /> : <Apply username={profile?.username} onSent={loadAff} />}
    </div>
  );
}

/* ---------- Lien à copier / partager ---------- */
function LinkBox({ link, kicker, tone, children, qr }: { link: string; kicker: string; tone: 'ruby' | 'brass'; children?: ReactNode; qr?: string }) {
  const t = useStrings(S);
  const [copied, setCopied] = useState(false);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const copy = async () => {
    trackEvent('link_shared');
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { /* presse-papiers indisponible : le lien reste sélectionnable */ }
  };
  const share = () => { trackEvent('link_shared'); navigator.share?.({ title: 'Arcora', text: t.shareText, url: link }).catch(() => {}); };
  const downloadQr = async () => {
    const QR = await import('qrcode');
    const url = await QR.toDataURL(link, { width: 1024, margin: 2, color: { dark: '#1f0e11', light: '#ffffff' } });
    const a = document.createElement('a');
    a.href = url; a.download = `arcora-${qr}.png`; a.click();
  };

  return (
    <section className="panel" data-tone={tone} data-reveal>
      <p className="panel-kicker">{kicker}</p>
      <div className={s.linkRow}>
        <input className={s.link} data-tone={tone} value={link} readOnly onFocus={e => e.currentTarget.select()} aria-label={kicker} />
        <div className={s.linkActions}>
          <Button variant="secondary" onClick={copy}>
            {copied ? <Check size={16} strokeWidth={2} aria-hidden="true" /> : <Copy size={16} strokeWidth={1.8} aria-hidden="true" />}
            {copied ? t.copied : t.copy}
          </Button>
          {canShare && <Button variant="secondary" onClick={share}><Share2 size={16} strokeWidth={1.8} aria-hidden="true" />{t.share}</Button>}
          {qr && <Button variant="secondary" onClick={downloadQr}><QrCode size={16} strokeWidth={1.8} aria-hidden="true" />{t.qr}</Button>}
        </div>
      </div>
      {children}
    </section>
  );
}

function Tile({ label, value, tone }: { label: string; value: string; tone?: 'lume' | 'brass' }) {
  return (
    <div className={`panel ${s.tile}`} data-tone={tone ?? 'plain'}>
      <span className={s.tileValue}>{value}</span>
      <span className={s.tileLabel}>{label}</span>
    </div>
  );
}

/* ---------- Parrainage membre ---------- */
function MemberReferral({ username, refs }: { username: string | null; refs: MyReferrals | null | undefined }) {
  const t = useStrings(S);
  if (!username) {
    return (
      <section className="panel" data-tone="ruby" data-reveal>
        <p className="panel-kicker">{t.memberKicker}</p>
        <ul className="chips" data-tone="ruby">{t.memberChips.map(c => <li key={c}>{c}</li>)}</ul>
        <p className={s.muted}>{t.needUsername}</p>
        <Link to="/profil" className={s.textLink}>{t.toProfile}</Link>
      </section>
    );
  }
  return (
    <>
      <LinkBox link={withRef(window.location.origin, username)} kicker={t.memberKicker} tone="ruby">
        <ul className="chips" data-tone="ruby">{t.memberChips.map(c => <li key={c}>{c}</li>)}</ul>
        <p className={s.small}>
          {t.linkHint}
          {refs?.premium_until && <> {t.premiumUntil(formatDate(refs.premium_until))}</>}
          {refs && refs.rewards_left < MEMBER_REWARDS_PER_YEAR && <> {t.rewardsLeft(refs.rewards_left)}</>}
        </p>
      </LinkBox>
      {refs && (
        <section className={s.stats3} data-reveal>
          <Tile label={t.invited} value={String(refs.invited)} />
          <Tile label={t.active} value={String(refs.active)} tone="lume" />
          <Tile label={t.earned} value={String(months(refs.days_earned))} tone="brass" />
        </section>
      )}
    </>
  );
}

/* ---------- Demande ambassadeur / partenaire ---------- */
function Apply({ username, onSent }: { username?: string | null; onSent: () => void }) {
  const t = useStrings(S);
  const toast = useToast();
  const [kind, setKind] = useState<'creator' | 'pro'>('creator');
  const [code, setCode] = useState(() => suggestCode(username));
  const [website, setWebsite] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const per = formatEuros(affiliateCommissionPerYear(), true);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try { await joinAffiliateProgram(code, kind, website); toast(t.sent); onSent(); }
    catch (err) { setError(err instanceof Error ? err.message : String(err)); setBusy(false); }
  };

  return (
    <>
      <h2 className={s.section}>{t.programs}</h2>
      <p className={s.muted}>{t.programsLead}</p>
      <div className={s.programs}>
        <section className="panel" data-tone="brass" data-reveal>
          <p className="panel-kicker">{t.creatorTitle}</p>
          <p className={s.small}>{t.creatorFor}</p>
          <ul className="chips">{t.creatorChips(per).map(c => <li key={c}>{c}</li>)}</ul>
          <p className={s.example}>{t.example(formatEuros(PREMIUM_YEAR_EUR), formatEuros(PREMIUM_YEAR_EUR / (1 + VAT_RATE)), per)}</p>
        </section>
        <section className="panel" data-tone="lume" data-reveal>
          <p className="panel-kicker">{t.proTitle}</p>
          <p className={s.small}>{t.proFor}</p>
          <ul className="chips" data-tone="lume">{t.proChips.map(c => <li key={c}>{c}</li>)}</ul>
        </section>
      </div>

      <form className={`panel ${s.form}`} data-tone="plain" onSubmit={submit} data-reveal>
        <h3 className={s.h}>{t.apply}</h3>
        {error && <Notice tone="error">{error}</Notice>}
        <Segmented label={t.kind} value={kind} onChange={setKind}
          options={[{ value: 'creator', label: t.kindCreator }, { value: 'pro', label: t.kindPro }]} />
        <TextField label={t.code} value={code} onChange={e => setCode(e.target.value.toLowerCase())} hint={t.codeHint}
          autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={30} required />
        <TextField label={t.website} value={website} onChange={e => setWebsite(e.target.value)} hint={t.websiteHint}
          type="url" inputMode="url" placeholder="https://" maxLength={200} required />
        <label className={s.consent}>
          <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} required />
          <span>{t.acceptBefore}<Link to="/affiliation/conditions">{t.terms}</Link>{t.acceptAfter}</span>
        </label>
        <div><Button type="submit" disabled={busy || !accepted || code.length < 3}>{busy ? t.sending : t.send}</Button></div>
      </form>
    </>
  );
}

/* ---------- Espace ambassadeur / partenaire ---------- */
function Partner({ aff, onChange }: { aff: Affiliate; onChange: () => void }) {
  const t = useStrings(S);
  const isCreator = aff.kind === 'creator';
  const title = isCreator ? t.creatorTitle : t.proTitle;

  if (aff.status === 'pending') {
    return (
      <>
        <h2 className={s.section}>{title}</h2>
        <Notice>{t.pending(aff.code)}</Notice>
      </>
    );
  }

  return (
    <>
      <h2 className={s.section}>{title}</h2>
      {aff.status === 'suspended' && <Notice tone="error">{t.suspended}</Notice>}
      <LinkBox link={withRef(window.location.origin, aff.code)} kicker={isCreator ? t.creatorKicker : t.proKicker} tone="brass" qr={aff.code}>
        <ul className="chips">{(isCreator ? t.creatorChips(formatEuros(affiliateCommissionPerYear(), true)) : t.proChips).map(c => <li key={c}>{c}</li>)}</ul>
        <p className={s.disclose}>{isCreator ? t.disclose : t.qrHint}</p>
      </LinkBox>

      <section className={isCreator ? s.stats : s.stats3} data-reveal>
        <Tile label={t.signups} value={String(aff.signups)} />
        <Tile label={t.subscribers} value={String(aff.referrals)} />
        {isCreator && <>
          <Tile label={t.pendingCents} value={eur(aff.pending_cents)} />
          <Tile label={t.due} value={eur(aff.due_cents)} tone="lume" />
          <Tile label={t.paid} value={eur(aff.paid_cents)} tone="brass" />
        </>}
      </section>

      {isCreator && (
        <>
          <section className={`panel ${s.block}`} data-tone="plain" data-reveal>
            <h3 className={s.h}>{t.history}</h3>
            <p className={s.small}>{t.how}</p>
            {aff.commissions.length === 0 ? <p className={s.muted}>{t.none}</p> : (
              <ul className={s.list}>
                {aff.commissions.map((c, i) => <CommissionRow key={`${c.created_at}-${i}`} c={c} />)}
              </ul>
            )}
          </section>
          <PayoutForm aff={aff} onSaved={onChange} />
        </>
      )}
    </>
  );
}

function CommissionRow({ c }: { c: AffiliateCommission }) {
  const t = useStrings(S);
  const label = c.status === 'pending' ? t.status.pending(formatDate(c.available_at))
    : c.status === 'paid' ? t.status.paid(formatDate(c.paid_at))
      : c.status === 'due' ? t.status.due : t.status.cancelled;
  return (
    <li className={s.row} data-status={c.status}>
      <span className={s.rowDate}>{formatDate(c.created_at, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
      <span className={s.rowStatus}>{label}</span>
      <span className={s.rowAmount}>{eur(c.amount_cents)}</span>
    </li>
  );
}

function PayoutForm({ aff, onSaved }: { aff: Affiliate; onSaved: () => void }) {
  const t = useStrings(S);
  const toast = useToast();
  const [holder, setHolder] = useState(aff.payout_holder ?? '');
  const [iban, setIban] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      // IBAN laissé vide : on garde celui déjà enregistré.
      await updateAffiliatePayout(holder, iban.trim() || null);
      setIban(''); toast(t.saved); onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : String(err)); }
    setBusy(false);
  };

  return (
    <form className={`panel ${s.block}`} data-tone="plain" onSubmit={submit} data-reveal>
      <h3 className={s.h}>{t.payout}</h3>
      <p className={s.muted}>{t.payoutHint}</p>
      {error && <Notice tone="error">{error}</Notice>}
      <TextField label={t.holder} value={holder} onChange={e => setHolder(e.target.value)} autoComplete="name" maxLength={120} required />
      <TextField label={t.iban} value={iban} onChange={e => setIban(e.target.value.toUpperCase())}
        hint={aff.payout_iban_last4 ? t.ibanSaved(aff.payout_iban_last4) : undefined}
        placeholder="FR76 …" autoCapitalize="characters" autoCorrect="off" spellCheck={false} required={!aff.payout_iban_last4} />
      <div><Button type="submit" disabled={busy}>{busy ? t.saving : t.save}</Button></div>
      <p className={s.small}>{t.taxes}</p>
    </form>
  );
}
