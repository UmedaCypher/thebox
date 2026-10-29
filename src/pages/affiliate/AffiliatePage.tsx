import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, Share2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getAffiliatePayoutsDue, getMyAffiliate, joinAffiliateProgram, recordAffiliatePayout, updateAffiliatePayout,
} from '../../lib/api';
import type { Affiliate, AffiliateCommission, AffiliatePayoutDue } from '../../lib/api';
import {
  AFFILIATE_HOLD_DAYS, AFFILIATE_MIN_PAYOUT_EUR, AFFILIATE_RATE, PREMIUM_YEAR_EUR, VAT_RATE, affiliateCommissionPerYear,
} from '../../lib/features';
import { REF_DAYS } from '../../lib/source';
import { Button, Loading, Notice, PageHeader, TextField } from '../../components/ui';
import { useToast } from '../../components/Toast/Toast';
import { defineStrings, useStrings } from '../../i18n';
import { formatDate, formatEuros } from '../../lib/format';
import s from './AffiliatePage.module.css';

const pct = `${Math.round(AFFILIATE_RATE * 100)}\u00a0%`;
const pctEn = `${Math.round(AFFILIATE_RATE * 100)}%`;
const eur = (cents: number) => formatEuros(cents / 100, cents % 100 !== 0);

const S = defineStrings({
  title: 'Affiliation',
  subtitle: `Recommandez The Box et touchez ${pct} de la première année de chaque abonné annuel.`,
  how: 'Comment ça marche',
  pct,
  incl: 'TTC',
  excl: 'HT',
  chips: (per: string) => [
    `${pct} du prix hors taxes, la première année`,
    `Soit ${per} par abonné annuel`,
    `Virement chaque mois dès ${AFFILIATE_MIN_PAYOUT_EUR} €`,
  ],
  steps: [
    'Vous choisissez votre code et recevez votre lien.',
    `Une personne arrive par ce lien et souscrit l'abonnement annuel dans les ${REF_DAYS} jours.`,
    `Votre commission est confirmée ${AFFILIATE_HOLD_DAYS} jours après son paiement, une fois passé le délai de rétractation.`,
  ],
  code: 'Votre code',
  codeHint: '3 à 30 caractères : lettres minuscules, chiffres, point, tiret. Il apparaît dans votre lien.',
  acceptBefore: "J'accepte les ",
  terms: 'conditions du programme',
  acceptAfter: ' et je signalerai mes publications comme collaboration commerciale.',
  join: 'Rejoindre le programme',
  joining: 'Inscription…',
  joined: 'Bienvenue dans le programme. Voici votre lien.',
  yourLink: 'Votre lien',
  linkHint: `Valable ${REF_DAYS} jours après le clic. Seul l'abonnement annuel est commissionné.`,
  copy: 'Copier',
  copied: 'Copié',
  share: 'Partager',
  shareText: 'Je range ma collection de montres sur The Box :',
  disclose: 'Quand vous publiez ce lien, indiquez « collaboration commerciale » ou « lien affilié » : c\'est une obligation légale.',
  suspended: 'Votre compte affilié est suspendu : votre lien ne génère plus de commission. Écrivez-nous pour en savoir plus.',
  referrals: 'Abonnés parrainés',
  pending: 'En attente',
  due: 'À verser',
  paid: 'Déjà versé',
  history: 'Commissions',
  none: 'Pas encore de commission. Elles apparaîtront ici dès le premier abonnement.',
  status: {
    pending: (d: string) => `En attente jusqu'au ${d}`,
    due: 'À verser',
    paid: (d: string) => `Versée le ${d}`,
    cancelled: 'Annulée (remboursement)',
  },
  payout: 'Coordonnées de virement',
  payoutHint: `Les virements partent au début de chaque mois dès ${AFFILIATE_MIN_PAYOUT_EUR} € à verser ; en dessous, le solde est reporté.`,
  holder: 'Titulaire du compte',
  iban: 'IBAN',
  ibanSaved: (last4: string) => `IBAN enregistré, se terminant par ${last4}. Saisissez-le à nouveau pour le changer.`,
  save: 'Enregistrer',
  saving: 'Enregistrement…',
  saved: 'Coordonnées enregistrées.',
  taxes: 'Ces sommes sont des revenus à déclarer. Au-delà d\'un usage occasionnel, un statut (micro-entreprise, société) peut être nécessaire.',
  admin: 'Administration : virements à faire',
  adminHint: (min: number) => `Affiliés à qui au moins ${min} € sont dus. Faites le virement depuis votre banque, puis marquez-le comme versé.`,
  adminNone: 'Aucun virement à faire pour le moment.',
  noIban: 'IBAN non renseigné',
  reference: 'Référence du virement',
  markPaid: 'Marquer comme versé',
  marked: (a: string) => `${a} marqués comme versés.`,
  loadError: 'Chargement impossible. Réessayez dans un moment.',
}, {
  title: 'Affiliate programme',
  subtitle: `Recommend The Box and earn ${pctEn} of the first year of every yearly subscriber.`,
  how: 'How it works',
  pct: pctEn,
  incl: 'incl. VAT',
  excl: 'excl. VAT',
  chips: (per: string) => [
    `${pctEn} of the price before tax, for the first year`,
    `That is ${per} per yearly subscriber`,
    `Monthly bank transfer from €${AFFILIATE_MIN_PAYOUT_EUR}`,
  ],
  steps: [
    'Pick your code and get your link.',
    `Someone arrives through it and takes the yearly plan within ${REF_DAYS} days.`,
    `Your commission is confirmed ${AFFILIATE_HOLD_DAYS} days after their payment, once the withdrawal period is over.`,
  ],
  code: 'Your code',
  codeHint: '3 to 30 characters: lowercase letters, digits, dot, dash. It appears in your link.',
  acceptBefore: 'I accept the ',
  terms: 'programme terms',
  acceptAfter: ' and will label my posts as advertising.',
  join: 'Join the programme',
  joining: 'Joining…',
  joined: 'Welcome to the programme. Here is your link.',
  yourLink: 'Your link',
  linkHint: `Valid for ${REF_DAYS} days after the click. Only the yearly plan earns a commission.`,
  copy: 'Copy',
  copied: 'Copied',
  share: 'Share',
  shareText: 'I keep my watch collection on The Box:',
  disclose: 'When you post this link, label it as an ad or affiliate link: it is a legal requirement.',
  suspended: 'Your affiliate account is suspended: your link no longer earns commissions. Write to us to find out more.',
  referrals: 'Subscribers referred',
  pending: 'Pending',
  due: 'Due',
  paid: 'Paid out',
  history: 'Commissions',
  none: 'No commission yet. They will show here from the first subscription.',
  status: {
    pending: d => `Pending until ${d}`,
    due: 'Due',
    paid: d => `Paid on ${d}`,
    cancelled: 'Cancelled (refund)',
  },
  payout: 'Bank details',
  payoutHint: `Transfers go out at the start of each month once €${AFFILIATE_MIN_PAYOUT_EUR} is due; below that, the balance carries over.`,
  holder: 'Account holder',
  iban: 'IBAN',
  ibanSaved: last4 => `IBAN saved, ending in ${last4}. Enter it again to change it.`,
  save: 'Save',
  saving: 'Saving…',
  saved: 'Bank details saved.',
  taxes: 'This is income you must declare. Beyond occasional use, you may need a business status.',
  admin: 'Admin: transfers to make',
  adminHint: min => `Affiliates owed at least €${min}. Make the transfer from your bank, then mark it as paid.`,
  adminNone: 'No transfer to make right now.',
  noIban: 'No IBAN yet',
  reference: 'Transfer reference',
  markPaid: 'Mark as paid',
  marked: a => `${a} marked as paid.`,
  loadError: "Couldn't load. Try again in a moment.",
});

const suggestCode = (username?: string | null) =>
  (username ?? '').toLowerCase().replace(/[^a-z0-9._-]/g, '').replace(/^[^a-z0-9]+/, '').slice(0, 30);

export default function AffiliatePage() {
  const t = useStrings(S);
  const { profile } = useAuth();
  const isAdmin = profile?.account_type === 'admin';
  const [aff, setAff] = useState<Affiliate | null | undefined>(undefined);

  const load = useCallback(() => getMyAffiliate().then(setAff), []);
  useEffect(() => { load(); }, [load]);

  return (
    <div className={`page ${s.page}`}>
      <PageHeader title={t.title} subtitle={t.subtitle} />
      {aff === undefined ? <Loading /> : aff ? <Dashboard aff={aff} onChange={load} /> : <Join username={profile?.username} onJoined={load} />}
      {isAdmin && <AdminPayouts />}
    </div>
  );
}

/* ---------- Rejoindre ---------- */
function Join({ username, onJoined }: { username?: string | null; onJoined: () => void }) {
  const t = useStrings(S);
  const toast = useToast();
  const [code, setCode] = useState(() => suggestCode(username));
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try { await joinAffiliateProgram(code); toast(t.joined); onJoined(); }
    catch (err) { setError(err instanceof Error ? err.message : String(err)); setBusy(false); }
  };

  return (
    <>
      <section className="panel" data-tone="brass" data-reveal>
        <p className="panel-kicker">{t.how}</p>
        <ul className="chips">{t.chips(formatEuros(affiliateCommissionPerYear(), true)).map(c => <li key={c}>{c}</li>)}</ul>
        <ol className={s.steps}>{t.steps.map(st => <li key={st}>{st}</li>)}</ol>
        <p className={s.example}>
          {formatEuros(PREMIUM_YEAR_EUR)} {t.incl} → {formatEuros(PREMIUM_YEAR_EUR / (1 + VAT_RATE))} {t.excl} × {t.pct} = <b>{formatEuros(affiliateCommissionPerYear(), true)}</b>
        </p>
      </section>

      <form className={`panel ${s.form}`} data-tone="plain" onSubmit={submit} data-reveal>
        {error && <Notice tone="error">{error}</Notice>}
        <TextField label={t.code} value={code} onChange={e => setCode(e.target.value.toLowerCase())} hint={t.codeHint}
          autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={30} required />
        <label className={s.consent}>
          <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} required />
          <span>{t.acceptBefore}<Link to="/affiliation/conditions">{t.terms}</Link>{t.acceptAfter}</span>
        </label>
        <div><Button type="submit" disabled={busy || !accepted || code.length < 3}>{busy ? t.joining : t.join}</Button></div>
      </form>
    </>
  );
}

/* ---------- Espace affilié ---------- */
function Dashboard({ aff, onChange }: { aff: Affiliate; onChange: () => void }) {
  const t = useStrings(S);
  const link = `${window.location.origin}/?ref=${aff.code}`;
  const [copied, setCopied] = useState(false);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { /* presse-papiers indisponible : le lien reste sélectionnable */ }
  };
  const share = () => navigator.share?.({ title: 'The Box', text: t.shareText, url: link }).catch(() => {});

  return (
    <>
      {aff.status === 'suspended' && <Notice tone="error">{t.suspended}</Notice>}

      <section className="panel" data-tone="ruby" data-reveal>
        <p className="panel-kicker">{t.yourLink}</p>
        <div className={s.linkRow}>
          <input className={s.link} value={link} readOnly onFocus={e => e.currentTarget.select()} aria-label={t.yourLink} />
          <div className={s.linkActions}>
            <Button variant="secondary" onClick={copy}>
              {copied ? <Check size={16} strokeWidth={2} aria-hidden="true" /> : <Copy size={16} strokeWidth={1.8} aria-hidden="true" />}
              {copied ? t.copied : t.copy}
            </Button>
            {canShare && <Button variant="secondary" onClick={share}><Share2 size={16} strokeWidth={1.8} aria-hidden="true" />{t.share}</Button>}
          </div>
        </div>
        <p className={s.small}>{t.linkHint}</p>
        <p className={s.disclose}>{t.disclose}</p>
      </section>

      <section className={s.stats} aria-label={t.history} data-reveal>
        <Tile label={t.referrals} value={String(aff.referrals)} />
        <Tile label={t.pending} value={eur(aff.pending_cents)} />
        <Tile label={t.due} value={eur(aff.due_cents)} tone="lume" />
        <Tile label={t.paid} value={eur(aff.paid_cents)} tone="brass" />
      </section>

      <section className={`panel ${s.block}`} data-tone="plain" data-reveal>
        <h2 className={s.h}>{t.history}</h2>
        {aff.commissions.length === 0 ? <p className={s.muted}>{t.none}</p> : (
          <ul className={s.list}>
            {aff.commissions.map((c, i) => <CommissionRow key={`${c.created_at}-${i}`} c={c} />)}
          </ul>
        )}
      </section>

      <PayoutForm aff={aff} onSaved={onChange} />
    </>
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
      <h2 className={s.h}>{t.payout}</h2>
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

/* ---------- Administration ---------- */
function AdminPayouts() {
  const t = useStrings(S);
  const toast = useToast();
  const [rows, setRows] = useState<AffiliatePayoutDue[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refs, setRefs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const defaultRef = `AFFILIATION ${new Date().toISOString().slice(0, 7)}`;

  const load = useCallback(() => {
    getAffiliatePayoutsDue(AFFILIATE_MIN_PAYOUT_EUR * 100).then(setRows).catch(e => setError(e instanceof Error ? e.message : t.loadError));
  }, [t.loadError]);
  useEffect(() => { load(); }, [load]);

  const mark = async (r: AffiliatePayoutDue) => {
    setBusy(r.affiliate_id); setError(null);
    try {
      const cents = await recordAffiliatePayout(r.affiliate_id, refs[r.affiliate_id] ?? defaultRef);
      toast(t.marked(eur(cents))); load();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    setBusy(null);
  };

  return (
    <section className={`panel ${s.block} ${s.admin}`} data-tone="brass">
      <h2 className={s.h}>{t.admin}</h2>
      <p className={s.muted}>{t.adminHint(AFFILIATE_MIN_PAYOUT_EUR)}</p>
      {error && <Notice tone="error">{error}</Notice>}
      {rows === null && !error ? <Loading /> : rows && rows.length === 0 ? <p className={s.muted}>{t.adminNone}</p> : (
        <ul className={s.payouts}>
          {rows?.map(r => (
            <li key={r.affiliate_id} className={s.payout}>
              <div className={s.payoutHead}>
                <span><b>{r.payout_holder ?? `@${r.username ?? r.code}`}</b> <span className={s.small}>@{r.username ?? '—'} · {r.code}</span></span>
                <span className={s.payoutAmount}>{eur(r.due_cents)}</span>
              </div>
              <code className={s.iban}>{r.payout_iban ? r.payout_iban.replace(/(.{4})/g, '$1 ').trim() : t.noIban}</code>
              <div className={s.payoutActions}>
                <TextField label={t.reference} value={refs[r.affiliate_id] ?? defaultRef}
                  onChange={e => setRefs({ ...refs, [r.affiliate_id]: e.target.value })} maxLength={140} />
                <Button variant="secondary" onClick={() => mark(r)} disabled={busy === r.affiliate_id || !r.payout_iban}>{t.markPaid}</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
