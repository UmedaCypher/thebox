import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { RefreshCw, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  adminAddExpense, adminDeleteExpense, adminGrantPremium, adminSetFoundersOpen, adminUpdateAffiliate,
  getAdminAffiliates, getAdminDashboard, getAffiliatePayoutsDue, recordAffiliatePayout,
} from '../../lib/api';
import type { AdminAffiliate, AdminAffiliates, AdminDashboard, AdminMonth, AffiliatePayoutDue, ExpenseCategory } from '../../lib/api';
import { AFFILIATE_MIN_PAYOUT_EUR } from '../../lib/features';
import { Button, EmptyState, IconButton, Loading, Notice, PageHeader, SelectField, TextField, Toggle } from '../../components/ui';
import { useToast } from '../../components/Toast/Toast';
import { formatDate, formatEuros, formatNumber, todayISO } from '../../lib/format';
import { Bars, Line } from './Charts';
import s from './AdminPage.module.css';

/*
 * Backoffice : réservé au compte administrateur (profiles.account_type = 'admin').
 * Toutes les données passent par des fonctions de la base qui vérifient ce rôle ; cette page
 * n'est qu'une vue. Textes en français seulement (outil interne).
 */

const eur = (cents: number) => formatEuros(cents / 100, Math.abs(cents) % 100 !== 0 && Math.abs(cents) < 100000);
const pct = (v: number | null) => (v === null ? '—' : `${formatNumber(v, 1)}\u00a0%`);
const monthLabel = (ym: string, opts: Intl.DateTimeFormatOptions = { month: 'short' }) => formatDate(`${ym}-15`, opts);
/** Résultat du mois : CA HT − remboursements − frais Stripe − commissions − dépenses. */
const net = (m: AdminMonth) => m.revenue_excl_tax_cents - m.refunds_cents - m.stripe_fees_cents - m.commissions_cents - m.expenses_cents;

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'ads', label: 'Publicité' },
  { value: 'tools', label: 'Outils et abonnements' },
  { value: 'hosting', label: 'Hébergement' },
  { value: 'design', label: 'Design et contenus' },
  { value: 'legal', label: 'Juridique et comptable' },
  { value: 'other', label: 'Autre' },
];
const catLabel = (c: string) => CATEGORIES.find(x => x.value === c)?.label ?? c;

/** Objectifs du plan de lancement (à recalibrer après la bêta). */
const TARGETS = { activation: 40, sharing: 20, retention: 35, conversion: 4 };

export default function AdminPage() {
  const { profile } = useAuth();
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    try { setData(await getAdminDashboard()); setError(null); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    setBusy(false);
  }, []);
  const isAdmin = profile?.account_type === 'admin';
  useEffect(() => { if (isAdmin) load(); }, [isAdmin, load]);

  if (!profile) return <div className="page"><Loading /></div>;
  if (!isAdmin) return <div className="page"><EmptyState title="Accès réservé">Cette page est réservée à l'administrateur.</EmptyState></div>;

  return (
    <div className={`page ${s.page}`}>
      <PageHeader title="Backoffice" subtitle={data ? `Mis à jour le ${formatDate(data.generated_at, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}` : undefined}
        action={<Button variant="secondary" onClick={load} disabled={busy}><RefreshCw size={16} aria-hidden="true" />Actualiser</Button>} />
      {error && <Notice tone="error">{error}</Notice>}
      {!data ? (!error && <Loading />) : (
        <>
          <Overview d={data} />
          <Growth d={data} />
          <Money d={data} onChange={load} />
          <Affiliates onChange={load} />
          <Payouts />
          <Audience d={data} />
          <Settings d={data} onChange={load} />
        </>
      )}
    </div>
  );
}

function Tile({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'lume' | 'brass' | 'ruby' }) {
  return (
    <div className={`panel ${s.tile}`} data-tone={tone ?? 'plain'}>
      <span className={s.tileValue}>{value}</span>
      <span className={s.tileLabel}>{label}</span>
      {sub && <span className={s.tileSub}>{sub}</span>}
    </div>
  );
}

/* ---------- Vue d'ensemble ---------- */
function Overview({ d }: { d: AdminDashboard }) {
  const t = d.totals, r = d.rates;
  const rate = (label: string, v: number | null, target: number, base?: number) => (
    <Tile label={label} value={pct(v)} tone={v !== null && v >= target ? 'lume' : undefined}
      sub={`objectif ${target}\u00a0%${base !== undefined ? ` · ${base} inscrits mesurés` : ''}`} />
  );
  return (
    <section className={s.section}>
      <h2 className={s.h}>Vue d'ensemble</h2>
      <div className={s.tiles}>
        <Tile label="Membres" value={formatNumber(t.members)} sub={`+${t.members_7d} en 7 jours · +${t.members_30d} en 30 jours`} tone="brass" />
        <Tile label="Premium payants" value={formatNumber(t.premium_paying)} sub={`${t.premium_offered} en Premium offert`} />
        <Tile label="Revenu mensuel récurrent" value={eur(t.mrr_cents)} sub="HT, abonnements actifs" tone="brass" />
        <Tile label="Membres fondateurs" value={formatNumber(t.founders)} />
        <Tile label="Montres enregistrées" value={formatNumber(t.watches)}
          sub={`${t.members ? formatNumber(t.watches / t.members, 1) : '0'} par membre · ${formatEuros(t.watches_value_eur)} déclarés`} />
        <Tile label="Collectionneurs (3 montres ou plus)" value={formatNumber(t.collectors_3plus)} />
        <Tile label="Ports notés (30 jours)" value={formatNumber(t.wears_30d)} sub={`${t.wearers_30d} membres actifs`} />
        <Tile label="Marché" value={formatNumber(t.listings)} sub={`annonces · ${t.messages_30d} messages en 30 jours`} />
      </div>
      <h3 className={s.h3}>Indicateurs du plan de lancement</h3>
      <div className={s.tiles}>
        {rate('Activation : 3 montres en 7 jours', r.activation, TARGETS.activation, r.activation_base)}
        {rate('Partage : passeport, image ou lien', r.sharing, TARGETS.sharing)}
        {rate('Rétention : actifs après 30 jours', r.retention, TARGETS.retention, r.retention_base)}
        {rate('Conversion Premium', r.conversion, TARGETS.conversion)}
      </div>
    </section>
  );
}

/* ---------- Croissance ---------- */
function Growth({ d }: { d: AdminDashboard }) {
  const weekLabel = (w: string) => formatDate(w, { day: 'numeric', month: 'short' });
  return (
    <section className={s.section}>
      <h2 className={s.h}>Croissance</h2>
      <div className={s.charts}>
        <div className={`panel ${s.chartPanel}`} data-tone="plain">
          <h3 className={s.h3}>Inscriptions par semaine</h3>
          <Bars ariaLabel="Inscriptions par semaine, 26 dernières semaines"
            data={d.weekly.map(w => ({
              label: weekLabel(w.week), value: w.signups,
              tip: `Semaine du ${weekLabel(w.week)} : ${w.signups} inscrits, ${w.activated} activés, ${w.watches} montres ajoutées, ${w.premium_starts} Premium`,
            }))} />
        </div>
        <div className={`panel ${s.chartPanel}`} data-tone="plain">
          <h3 className={s.h3}>Membres au total</h3>
          <Line ariaLabel="Nombre total de membres, 26 dernières semaines"
            data={d.weekly.map(w => ({ label: weekLabel(w.week), value: w.members, tip: `${weekLabel(w.week)} : ${formatNumber(w.members)} membres` }))} />
        </div>
      </div>
    </section>
  );
}

/* ---------- Argent ---------- */
function Money({ d, onChange }: { d: AdminDashboard; onChange: () => void }) {
  const months = d.monthly;
  const sum = (k: keyof AdminMonth) => months.reduce((a, m) => a + (m[k] as number), 0);
  const total = months.reduce((a, m) => a + net(m), 0);
  return (
    <section className={s.section}>
      <h2 className={s.h}>Argent</h2>
      <div className={s.tiles}>
        <Tile label="Chiffre d'affaires (12 mois)" value={eur(sum('revenue_cents'))} sub={`${eur(sum('revenue_excl_tax_cents'))} HT`} tone="brass" />
        <Tile label="Commissions affiliés" value={eur(sum('commissions_cents'))} sub={`${eur(sum('payouts_cents'))} déjà virés`} />
        <Tile label="Dépenses saisies" value={eur(sum('expenses_cents'))} sub={`frais Stripe : ${eur(sum('stripe_fees_cents'))}`} />
        <Tile label="Résultat (12 mois)" value={eur(total)} tone={total >= 0 ? 'lume' : 'ruby'} sub="HT, avant impôts et salaires" />
      </div>
      <div className={`panel ${s.chartPanel}`} data-tone="plain">
        <h3 className={s.h3}>Résultat par mois</h3>
        <p className={s.small}>Chiffre d'affaires HT moins remboursements, frais Stripe, commissions et dépenses. Au-dessus de zéro : bénéfice ; en dessous : perte.</p>
        <Bars signed ariaLabel="Résultat par mois, 12 derniers mois" tick={() => true}
          data={months.map(m => ({
            label: monthLabel(m.month), value: net(m) / 100,
            tip: `${monthLabel(m.month, { month: 'long', year: 'numeric' })} : ${net(m) >= 0 ? 'bénéfice' : 'perte'} de ${eur(Math.abs(net(m)))}`,
          }))} />
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead><tr><th>Mois</th><th>CA TTC</th><th>CA HT</th><th>Rembours.</th><th>Frais Stripe</th><th>Commissions</th><th>Dépenses</th><th>Résultat</th></tr></thead>
            <tbody>
              {[...months].reverse().map(m => (
                <tr key={m.month}>
                  <th scope="row">{monthLabel(m.month, { month: 'long', year: 'numeric' })}</th>
                  <td>{eur(m.revenue_cents)}</td><td>{eur(m.revenue_excl_tax_cents)}</td><td>{eur(m.refunds_cents)}</td>
                  <td>{eur(m.stripe_fees_cents)}</td><td>{eur(m.commissions_cents)}</td><td>{eur(m.expenses_cents)}</td>
                  <td className={net(m) < 0 ? s.neg : s.pos}>{eur(net(m))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Expenses d={d} onChange={onChange} />
    </section>
  );
}

function Expenses({ d, onChange }: { d: AdminDashboard; onChange: () => void }) {
  const toast = useToast();
  const [f, setF] = useState({ date: todayISO(), category: 'ads' as ExpenseCategory, label: '', amount: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const cents = Math.round(parseFloat(f.amount.replace(',', '.')) * 100);
    if (!cents || cents <= 0) { setError('Indiquez un montant positif.'); return; }
    setBusy(true); setError(null);
    try { await adminAddExpense(f.date, f.category, f.label, cents); setF({ ...f, label: '', amount: '' }); toast('Dépense ajoutée.'); onChange(); }
    catch (err) { setError(err instanceof Error ? err.message : String(err)); }
    setBusy(false);
  };
  const remove = async (id: string) => {
    try { await adminDeleteExpense(id); onChange(); } catch (err) { setError(err instanceof Error ? err.message : String(err)); }
  };

  return (
    <div className={`panel ${s.block}`} data-tone="plain">
      <h3 className={s.h3}>Dépenses</h3>
      <p className={s.small}>Publicité, outils, hébergement… Saisies ici, elles entrent dans le résultat du mois. Montants TTC payés.</p>
      {error && <Notice tone="error">{error}</Notice>}
      <form className={s.expenseForm} onSubmit={submit}>
        <TextField label="Date" type="date" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} required />
        <SelectField label="Catégorie" value={f.category} onChange={e => setF({ ...f, category: e.target.value as ExpenseCategory })} options={CATEGORIES} required />
        <TextField label="Libellé" value={f.label} onChange={e => setF({ ...f, label: e.target.value })} maxLength={140} placeholder="Campagne Meta, retargeting" required />
        <TextField label="Montant" inputMode="decimal" suffix="€" value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} required />
        <Button type="submit" disabled={busy}>Ajouter</Button>
      </form>
      {d.expenses.length > 0 && (
        <ul className={s.list}>
          {d.expenses.map(x => (
            <li key={x.id} className={s.row}>
              <span className={s.rowDate}>{formatDate(x.spent_on, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              <span><b>{x.label}</b> <span className={s.small}>{catLabel(x.category)}</span></span>
              <span className={s.rowAmount}>{eur(x.amount_cents)}</span>
              <IconButton label="Supprimer" onClick={() => remove(x.id)}><Trash2 size={16} /></IconButton>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------- Affiliés ---------- */
const STATUS = { pending: 'À valider', active: 'Actif', suspended: 'Suspendu' } as const;
const KIND = { creator: 'Créateur', pro: 'Pro' } as const;

function Affiliates({ onChange }: { onChange: () => void }) {
  const toast = useToast();
  const [data, setData] = useState<AdminAffiliates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => { getAdminAffiliates().then(setData).catch(e => setError(e instanceof Error ? e.message : String(e))); }, []);
  useEffect(() => { load(); }, [load]);

  const update = async (a: AdminAffiliate, kind: AdminAffiliate['kind'], status: AdminAffiliate['status']) => {
    try { await adminUpdateAffiliate(a.user_id, kind, status); toast(`${a.code} : ${STATUS[status].toLowerCase()}`); load(); onChange(); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };

  return (
    <section className={s.section}>
      <h2 className={s.h}>Affiliés</h2>
      {error && <Notice tone="error">{error}</Notice>}
      {!data ? <Loading /> : (
        <>
          {data.affiliates.length === 0 ? <p className={s.muted}>Aucune demande pour le moment. Les membres postulent depuis la page Parrainage.</p> : (
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead><tr><th>Code</th><th>Type</th><th>Statut</th><th>Inscrits</th><th>Activés</th><th>Abonnés</th><th>En attente</th><th>À verser</th><th>Versé</th><th /></tr></thead>
                <tbody>
                  {data.affiliates.map(a => (
                    <tr key={a.user_id} data-status={a.status}>
                      <th scope="row">
                        <b>{a.code}</b><br />
                        <span className={s.small}>@{a.username ?? '—'}{a.website && <> · <a href={a.website} target="_blank" rel="noreferrer noopener">lien</a></>}{!a.has_iban && a.kind === 'creator' && ' · sans IBAN'}</span>
                      </th>
                      <td>
                        <select className={s.inlineSelect} value={a.kind} onChange={e => update(a, e.target.value as AdminAffiliate['kind'], a.status)} aria-label={`Type de ${a.code}`}>
                          <option value="creator">{KIND.creator}</option><option value="pro">{KIND.pro}</option>
                        </select>
                      </td>
                      <td><span className={s.status} data-status={a.status}>{STATUS[a.status]}</span></td>
                      <td>{a.signups}</td><td>{a.activated}</td><td>{a.subscriptions}</td>
                      <td>{eur(a.pending_cents)}</td><td>{eur(a.due_cents)}</td><td>{eur(a.paid_cents)}</td>
                      <td className={s.actions}>
                        {a.status !== 'active' && <Button size="small" variant="secondary" onClick={() => update(a, a.kind, 'active')}>{a.status === 'pending' ? 'Valider' : 'Réactiver'}</Button>}
                        {a.status !== 'suspended' && <Button size="small" variant="ghost" onClick={() => update(a, a.kind, 'suspended')}>{a.status === 'pending' ? 'Refuser' : 'Suspendre'}</Button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {data.top_members.length > 0 && (
            <div className={`panel ${s.block}`} data-tone="plain">
              <h3 className={s.h3}>Meilleurs parrains (membres)</h3>
              <ul className={s.list}>
                {data.top_members.map(m => (
                  <li key={m.username} className={s.row}>
                    <span>@{m.username}</span><span className={s.small}>{m.activated} activés</span><span className={s.rowAmount}>{m.invited} inscrits</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}

/* ---------- Virements ---------- */
function Payouts() {
  const toast = useToast();
  const [rows, setRows] = useState<AffiliatePayoutDue[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refs, setRefs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const defaultRef = `ARCORA AFFILIATION ${todayISO().slice(0, 7)}`;

  const load = useCallback(() => {
    getAffiliatePayoutsDue(AFFILIATE_MIN_PAYOUT_EUR * 100).then(setRows).catch(e => setError(e instanceof Error ? e.message : String(e)));
  }, []);
  useEffect(() => { load(); }, [load]);

  const mark = async (r: AffiliatePayoutDue) => {
    setBusy(r.affiliate_id); setError(null);
    try { const cents = await recordAffiliatePayout(r.affiliate_id, refs[r.affiliate_id] ?? defaultRef); toast(`${eur(cents)} marqués comme versés.`); load(); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    setBusy(null);
  };

  return (
    <section className={s.section}>
      <h2 className={s.h}>Virements à faire</h2>
      <p className={s.muted}>Ambassadeurs à qui au moins {AFFILIATE_MIN_PAYOUT_EUR} € sont dus. Faites le virement depuis la banque de la société, puis marquez-le comme versé.</p>
      {error && <Notice tone="error">{error}</Notice>}
      {rows === null && !error ? <Loading /> : rows && rows.length === 0 ? <p className={s.small}>Aucun virement à faire.</p> : (
        <ul className={s.payouts}>
          {rows?.map(r => (
            <li key={r.affiliate_id} className={`panel ${s.payout}`} data-tone="brass">
              <div className={s.payoutHead}>
                <span><b>{r.payout_holder ?? `@${r.username ?? r.code}`}</b> <span className={s.small}>@{r.username ?? '—'} · {r.code} · {r.commissions} commissions</span></span>
                <span className={s.payoutAmount}>{eur(r.due_cents)}</span>
              </div>
              <code className={s.iban}>{r.payout_iban ? r.payout_iban.replace(/(.{4})/g, '$1 ').trim() : 'IBAN non renseigné'}</code>
              <div className={s.payoutActions}>
                <TextField label="Référence du virement" value={refs[r.affiliate_id] ?? defaultRef}
                  onChange={e => setRefs({ ...refs, [r.affiliate_id]: e.target.value })} maxLength={140} />
                <Button variant="secondary" onClick={() => mark(r)} disabled={busy === r.affiliate_id || !r.payout_iban}>Marquer comme versé</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ---------- Provenance et collections ---------- */
function Audience({ d }: { d: AdminDashboard }) {
  const maxSrc = Math.max(1, ...d.sources.map(x => x.n));
  const maxBrand = Math.max(1, ...d.brands.map(x => x.n));
  return (
    <section className={s.section}>
      <div className={s.charts}>
        <div className={`panel ${s.block}`} data-tone="plain">
          <h3 className={s.h3}>D'où viennent les inscrits (90 jours)</h3>
          <p className={s.small}>Liens courts (/yt, /podcast…), paramètre ?src= ou utm_source, parrainage.</p>
          {d.sources.length === 0 ? <p className={s.muted}>Pas encore de données.</p> : (
            <ul className={s.hbars}>
              {d.sources.map(x => (
                <li key={x.label}>
                  <span className={s.hbarLabel}>{x.label}</span>
                  <span className={s.hbarTrack}><span className={s.hbar} style={{ width: `${(x.n / maxSrc) * 100}%` }} /></span>
                  <span className={s.hbarValue}>{x.n} <small>· {x.activated} activés</small></span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className={`panel ${s.block}`} data-tone="plain">
          <h3 className={s.h3}>Marques les plus enregistrées</h3>
          {d.brands.length === 0 ? <p className={s.muted}>Pas encore de montres.</p> : (
            <ul className={s.hbars}>
              {d.brands.map(x => (
                <li key={x.brand}>
                  <span className={s.hbarLabel}>{x.brand}</span>
                  <span className={s.hbarTrack}><span className={s.hbar} style={{ width: `${(x.n / maxBrand) * 100}%` }} /></span>
                  <span className={s.hbarValue}>{x.n}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------- Réglages ---------- */
function Settings({ d, onChange }: { d: AdminDashboard; onChange: () => void }) {
  const toast = useToast();
  const [grant, setGrant] = useState({ username: '', days: '90' });
  const [error, setError] = useState<string | null>(null);

  const toggleFounders = async (v: boolean) => {
    try { await adminSetFoundersOpen(v); toast(v ? 'Inscriptions fondateurs ouvertes.' : 'Inscriptions fondateurs fermées.'); onChange(); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };
  const submitGrant = async (e: FormEvent) => {
    e.preventDefault(); setError(null);
    try {
      const until = await adminGrantPremium(grant.username, parseInt(grant.days, 10));
      toast(`Premium offert à @${grant.username.replace(/^@/, '')} jusqu'au ${formatDate(until)}.`);
      setGrant({ ...grant, username: '' }); onChange();
    } catch (err) { setError(err instanceof Error ? err.message : String(err)); }
  };

  return (
    <section className={s.section}>
      <h2 className={s.h}>Réglages</h2>
      {error && <Notice tone="error">{error}</Notice>}
      <div className={s.charts}>
        <div className={`panel ${s.block}`} data-tone="plain">
          <Toggle label="Inscriptions « membre fondateur » ouvertes" checked={d.founders_open} onChange={toggleFounders}
            description="Tant que c'est activé, chaque nouvel inscrit reçoit le badge fondateur à vie. À fermer à l'ouverture des paiements, ou à 500 fondateurs." />
        </div>
        <form className={`panel ${s.block}`} data-tone="lume" onSubmit={submitGrant}>
          <h3 className={s.h3}>Offrir du Premium</h3>
          <p className={s.small}>Pour un co-animateur, un invité ou un geste commercial. Les jours s'ajoutent à ceux déjà offerts.</p>
          <div className={s.inline}>
            <TextField label="Pseudo" value={grant.username} onChange={e => setGrant({ ...grant, username: e.target.value })} placeholder="@pseudo" required autoCapitalize="none" />
            <TextField label="Jours" inputMode="numeric" value={grant.days} onChange={e => setGrant({ ...grant, days: e.target.value.replace(/\D/g, '') })} required />
            <Button type="submit">Offrir</Button>
          </div>
        </form>
      </div>
    </section>
  );
}
