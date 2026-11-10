import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { adminSetFoundersOfferOpen, deleteAdminOkr, getAdminKpis, getFoundersOffer, listAdminOkrs, saveAdminOkr } from '../../lib/api';
import type { AdminKpis, AdminOkr, FoundersOffer, KpiKey } from '../../lib/api';
import { Button, Notice, SelectField, TextField, Toggle } from '../../components/ui';
import { useToast } from '../../components/Toast/Toast';
import { formatEuros, formatNumber } from '../../lib/format';
import s from './AdminPage.module.css';

/*
 * Indicateurs clés et OKR.
 * Un indicateur (KPI) mesure ; un OKR fixe un cap : un objectif qualitatif et quelques résultats clés chiffrés,
 * chacun branché sur un indicateur pour suivre la progression sans saisie.
 */

type Unit = 'count' | 'pct' | 'cents';
export const KPI: Record<KpiKey, { label: string; unit: Unit; help: string }> = {
  members: { label: 'Membres inscrits', unit: 'count', help: 'Comptes créés.' },
  paying: { label: 'Abonnés payants', unit: 'count', help: 'Abonnements Stripe actifs.' },
  mrr_cents: { label: 'MRR', unit: 'cents', help: 'Revenu mensuel récurrent HT (annuels ramenés au mois).' },
  arr_cents: { label: 'ARR', unit: 'cents', help: 'MRR × 12.' },
  arpu_cents: { label: 'ARPU (30 jours)', unit: 'cents', help: 'Revenu HT des 30 derniers jours, remboursements déduits, divisé par le nombre de membres.' },
  arppu_cents: { label: 'ARPPU', unit: 'cents', help: 'MRR divisé par le nombre d’abonnés payants.' },
  revenue_30d_cents: { label: 'Revenu 30 jours', unit: 'cents', help: 'HT, remboursements déduits.' },
  conversion_pct: { label: 'Conversion Premium', unit: 'pct', help: 'Abonnés payants / membres.' },
  churn_30d_pct: { label: 'Churn 30 jours', unit: 'pct', help: 'Abonnements terminés en 30 jours / (actifs + terminés).' },
  ltv_cents: { label: 'Valeur vie client (LTV)', unit: 'cents', help: 'ARPPU / churn mensuel. Fiable avec quelques dizaines d’abonnés.' },
  dau: { label: 'Actifs du jour', unit: 'count', help: 'Membres ayant porté, ajouté, photographié, écrit ou partagé en 24 h.' },
  wau: { label: 'Actifs de la semaine', unit: 'count', help: 'Même définition, sur 7 jours.' },
  mau: { label: 'Actifs du mois', unit: 'count', help: 'Même définition, sur 30 jours.' },
  stickiness_pct: { label: 'Fidélité (DAU/MAU)', unit: 'pct', help: 'Part des actifs du mois qui reviennent chaque jour.' },
  wearers_7d: { label: 'Wrist Check hebdo', unit: 'count', help: 'Membres ayant noté une montre portée en 7 jours. Bon candidat d’indicateur phare.' },
  listings: { label: 'Annonces en ligne', unit: 'count', help: 'Montres à vendre ou à échanger.' },
  listing_conversations_30d: { label: 'Conversations sur annonce', unit: 'count', help: 'Ouvertes depuis une annonce en 30 jours.' },
  watches_30d: { label: 'Montres ajoutées (30 j)', unit: 'count', help: 'Nouvelles fiches.' },
  founders_taken: { label: 'Offre fondateurs prise', unit: 'count', help: 'Places utilisées (sur 100).' },
  activation_pct: { label: 'Activation', unit: 'pct', help: '3 montres dans la première semaine.' },
  retention_pct: { label: 'Rétention 30 jours', unit: 'pct', help: 'Encore actifs 30 jours après l’inscription.' },
};

const fmt = (v: number | null | undefined, unit: Unit) =>
  v === null || v === undefined ? '—'
    : unit === 'pct' ? `${formatNumber(v, 1)}\u00a0%`
      : unit === 'cents' ? formatEuros(v / 100, v < 10000 && v % 100 !== 0)
        : formatNumber(v);

const SHOWN: KpiKey[] = ['mrr_cents', 'arpu_cents', 'arppu_cents', 'conversion_pct', 'churn_30d_pct', 'ltv_cents',
  'dau', 'wau', 'mau', 'stickiness_pct', 'wearers_7d', 'listing_conversations_30d'];

export function Kpis() {
  const [k, setK] = useState<AdminKpis | null>(null);
  useEffect(() => { getAdminKpis().then(setK); }, []);
  if (!k) return null;
  return (
    <section className={s.section}>
      <h2 className={s.h}>Indicateurs clés</h2>
      <p className={s.small}>Ce sont des KPI : ils mesurent. Les OKR, plus bas, fixent le cap en reliant chaque objectif chiffré à l'un d'eux.</p>
      <div className={s.tiles}>
        {SHOWN.map(key => (
          <div key={key} className={`panel ${s.tile}`} data-tone={key === 'wearers_7d' ? 'lume' : key.endsWith('cents') ? 'brass' : 'plain'} title={KPI[key].help}>
            <span className={s.tileValue}>{fmt(k[key], KPI[key].unit)}</span>
            <span className={s.tileLabel}>{KPI[key].label}</span>
            <span className={s.tileSub}>{KPI[key].help}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

const empty = { period: 'T1 2027', objective: '', key_result: '', metric: 'wau' as KpiKey, target: '', sort: '0' };

export function Okrs() {
  const toast = useToast();
  const [k, setK] = useState<AdminKpis | null>(null);
  const [okrs, setOkrs] = useState<AdminOkr[]>([]);
  const [form, setForm] = useState<(typeof empty & { id?: string }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => { getAdminKpis().then(setK); listAdminOkrs().then(setOkrs); }, []);
  useEffect(() => { load(); }, [load]);

  // Regroupement : période → objectif → résultats clés
  const grouped = useMemo(() => {
    const m = new Map<string, Map<string, AdminOkr[]>>();
    for (const o of okrs) {
      if (!m.has(o.period)) m.set(o.period, new Map());
      const g = m.get(o.period)!;
      g.set(o.objective, [...(g.get(o.objective) ?? []), o]);
    }
    return m;
  }, [okrs]);

  const submit = async (e: FormEvent) => {
    e.preventDefault(); if (!form) return; setError(null);
    const target = Number(String(form.target).replace(',', '.'));
    if (!form.objective.trim() || !form.key_result.trim() || !Number.isFinite(target)) { setError('Objectif, résultat clé et cible sont nécessaires.'); return; }
    try {
      // Les montants se saisissent en euros et se stockent en centimes, comme les indicateurs
      const stored = KPI[form.metric].unit === 'cents' ? Math.round(target * 100) : target;
      await saveAdminOkr({ id: form.id, period: form.period.trim(), objective: form.objective.trim(), key_result: form.key_result.trim(), metric: form.metric, target: stored, sort: parseInt(form.sort, 10) || 0 });
      toast('OKR enregistré.'); setForm(null); load();
    } catch (err) { setError(err instanceof Error ? err.message : String(err)); }
  };
  const remove = async (o: AdminOkr) => {
    if (!window.confirm(`Supprimer « ${o.key_result} » ?`)) return;
    try { await deleteAdminOkr(o.id); load(); } catch (err) { setError(err instanceof Error ? err.message : String(err)); }
  };
  const edit = (o: AdminOkr) => setForm({
    id: o.id, period: o.period, objective: o.objective, key_result: o.key_result, metric: o.metric,
    target: String(KPI[o.metric]?.unit === 'cents' ? o.target / 100 : o.target), sort: String(o.sort),
  });

  return (
    <section className={s.section}>
      <div className={s.sectionHead}>
        <h2 className={s.h}>OKR</h2>
        <Button size="small" variant="secondary" onClick={() => setForm({ ...empty })}><Plus size={16} aria-hidden="true" />Résultat clé</Button>
      </div>
      <p className={s.small}>Objectif = où l'on va (qualitatif). Résultats clés = comment on sait qu'on y est (chiffrés, 2 à 4 par objectif). La progression se calcule en direct.</p>
      {error && <Notice tone="error">{error}</Notice>}

      {form && (
        <form className={`panel ${s.block}`} data-tone="lume" onSubmit={submit}>
          <div className={s.okrForm}>
            <TextField label="Période" value={form.period} onChange={e => setForm({ ...form, period: e.target.value })} placeholder="T1 2027" />
            <TextField label="Objectif" value={form.objective} onChange={e => setForm({ ...form, objective: e.target.value })} list="okr-objectives" />
            <datalist id="okr-objectives">{[...new Set(okrs.map(o => o.objective))].map(o => <option key={o} value={o} />)}</datalist>
            <TextField label="Résultat clé" value={form.key_result} onChange={e => setForm({ ...form, key_result: e.target.value })} />
            <SelectField label="Indicateur suivi" value={form.metric} onChange={e => setForm({ ...form, metric: e.target.value as KpiKey })}
              options={(Object.keys(KPI) as KpiKey[]).map(key => ({ value: key, label: KPI[key].label }))} />
            <TextField label={KPI[form.metric].unit === 'cents' ? 'Cible (€)' : KPI[form.metric].unit === 'pct' ? 'Cible (%)' : 'Cible'}
              inputMode="decimal" value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} />
            <TextField label="Ordre" inputMode="numeric" value={form.sort} onChange={e => setForm({ ...form, sort: e.target.value })} />
          </div>
          <div className={s.inline}>
            <Button type="submit">Enregistrer</Button>
            <Button variant="ghost" onClick={() => setForm(null)}>Annuler</Button>
          </div>
        </form>
      )}

      {[...grouped.entries()].map(([period, objectives]) => (
        <div key={period} className={s.okrPeriod}>
          <h3 className={s.h3}>{period}</h3>
          {[...objectives.entries()].map(([objective, krs]) => {
            const scores = krs.map(o => progress(k?.[o.metric] ?? null, o.target));
            const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
            return (
              <div key={objective} className={`panel ${s.okr}`} data-tone="plain">
                <div className={s.okrHead}>
                  <strong>{objective}</strong>
                  <span className={s.okrScore} data-level={level(avg)}>{Math.round(avg * 100)}&nbsp;%</span>
                </div>
                <ul className={s.krList}>
                  {krs.map((o, i) => {
                    const unit = KPI[o.metric]?.unit ?? 'count';
                    return (
                      <li key={o.id}>
                        <div className={s.krText}>
                          <span>{o.key_result}</span>
                          <span className={s.small}>{fmt(k?.[o.metric] ?? null, unit)} / {fmt(o.target, unit)}</span>
                        </div>
                        <span className={s.krBar} data-level={level(scores[i])} aria-hidden="true"><i style={{ width: `${Math.round(scores[i] * 100)}%` }} /></span>
                        <span className={s.krActions}>
                          <button type="button" onClick={() => edit(o)} aria-label="Modifier"><Pencil size={14} /></button>
                          <button type="button" onClick={() => remove(o)} aria-label="Supprimer"><Trash2 size={14} /></button>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      ))}
      {okrs.length === 0 && <p className={s.small}>Aucun OKR : ajoutez un premier résultat clé.</p>}
    </section>
  );
}

/** Progression bornée à 100 % ; un indicateur absent compte pour 0. */
const progress = (v: number | null, target: number) => (v === null || target <= 0 ? 0 : Math.max(0, Math.min(1, v / target)));
/** Lecture habituelle des OKR : 70 % est déjà un bon résultat. */
const level = (p: number) => (p >= 0.7 ? 'good' : p >= 0.4 ? 'mid' : 'low');

/** Ouverture de l'offre fondateurs (une fois les coupons Stripe créés). */
export function FoundersOfferSetting() {
  const toast = useToast();
  const [offer, setOffer] = useState<FoundersOffer | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { getFoundersOffer().then(setOffer); }, []);
  if (!offer) return null;
  const toggle = async (v: boolean) => {
    try { await adminSetFoundersOfferOpen(v); setOffer(await getFoundersOffer()); toast(v ? 'Offre fondateurs ouverte.' : 'Offre fondateurs fermée.'); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };
  return (
    <div className={`panel ${s.block}`} data-tone="brass">
      {error && <Notice tone="error">{error}</Notice>}
      <Toggle label={`Offre membres fondateurs ouverte (${offer.taken}/${offer.limit} places prises)`}
        checked={offer.open} onChange={toggle}
        description="1 €/mois ou 9,99 €/an la première année. Créez d'abord les deux coupons Stripe (docs/stripe.md) : sans eux, Stripe facture le tarif normal. Se ferme seule à 100." />
    </div>
  );
}
