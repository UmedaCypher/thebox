import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLoad } from '../../hooks/useLoad';
import { listValueHistory, listWatches, listWearLogs, mainPhoto, thumbSrc } from '../../lib/api';
import { daysBetween, formatEuros, plural, toISODate } from '../../lib/format';
import { Cushion, LinkButton, Loading, Notice, PageHeader, Segmented, Stat } from '../../components/ui';
import Sparkline from '../../components/Sparkline/Sparkline';
import CostTeaser from '../../components/CostTeaser/CostTeaser';
import { analyseCosts } from '../../lib/costPerWear';
import { PAYMENTS_ENABLED, premiumPrices } from '../../lib/features';
import { defineStrings, useStrings } from '../../i18n';
import { COMMON } from '../../i18n/common';
import s from './StatsPage.module.css';

const S = defineStrings({
  title: 'Statistiques',
  period: 'Période',
  periods: { p90: '3 mois', p365: '12 mois', all: 'Depuis le début' },
  daysLogged: 'jours notés',
  watchesWorn: 'montres portées',
  dormantIdle: (n: number, days: number) => `dormante${n > 1 ? 's' : ''} (${days} j sans port)`,
  rotation: 'Rotation',
  costPerWear: 'Coût par port',
  costHint: "Prix d'achat divisé par le nombre total de jours portés. Plus vous la portez, moins elle coûte.",
  watch: 'Montre',
  days: 'Jours',
  neverWornCap: 'Jamais portée',
  noPrice: 'Prix non renseigné',
  drawer: 'Au fond du tiroir',
  neverWorn: 'jamais portée',
  notWornFor: (n: number) => `pas portée depuis ${plural(n, 'jour', 'jours')}`,
  collectionValue: 'Valeur de la collection',
  paid: 'payé',
  declaredValue: 'valeur déclarée',
  valueChart: 'Évolution de la valeur déclarée de la collection',
  valueEmpty: 'La courbe apparaîtra quand vous aurez mis à jour quelques estimations.',
  previewSubtitle: 'Aperçu calculé sur votre collection.',
  daysLogged12: 'jours notés en 12 mois',
  dormant: (n: number) => `dormante${n > 1 ? 's' : ''}`,
  withPremium: 'Avec Premium',
  features: [
    { title: 'Le coût par port de chaque montre', text: 'et son évolution à chaque port' },
    { title: 'Les montres dormantes', text: "depuis quand, et ce qu'elles immobilisent" },
    { title: 'La rotation', text: 'la part de chaque montre dans vos ports' },
    { title: 'La valeur de la collection', text: 'payée, déclarée, et sa courbe' },
  ],
  goPremium: (price: string) => `Passer à Premium, ${price} par an`,
  discoverPremium: 'Découvrir Premium',
}, {
  title: 'Stats',
  period: 'Period',
  periods: { p90: '3 months', p365: '12 months', all: 'All time' },
  daysLogged: 'days logged',
  watchesWorn: 'watches worn',
  dormantIdle: (_n, days) => `dormant (${days} days unworn)`,
  rotation: 'Rotation',
  costPerWear: 'Cost per wear',
  costHint: 'Purchase price divided by the total number of days worn. The more you wear it, the less it costs.',
  watch: 'Watch',
  days: 'Days',
  neverWornCap: 'Never worn',
  noPrice: 'No price entered',
  drawer: 'Sitting in the drawer',
  neverWorn: 'never worn',
  notWornFor: n => `not worn for ${plural(n, 'day', 'days')}`,
  collectionValue: 'Collection value',
  paid: 'paid',
  declaredValue: 'declared value',
  valueChart: 'Declared value of the collection over time',
  valueEmpty: 'The chart will appear once you have updated a few estimates.',
  previewSubtitle: 'A preview based on your collection.',
  daysLogged12: 'days logged in 12 months',
  dormant: () => 'dormant',
  withPremium: 'With Premium',
  features: [
    { title: 'Cost per wear for every watch', text: 'and how it changes with each wear' },
    { title: 'Dormant watches', text: 'for how long, and how much money they tie up' },
    { title: 'Rotation', text: 'each watch’s share of your wears' },
    { title: 'Collection value', text: 'paid, declared, and its chart' },
  ],
  goPremium: price => `Go Premium, ${price} a year`,
  discoverPremium: 'Discover Premium',
});

const DORMANT_DAYS = 60;
const cushionSrc = (path?: string | null) => { const t = thumbSrc(path); return { src: t.src, fallbackSrc: t.fallback }; };
type Period = '90' | '365' | 'all';

function StatsContent() {
  const t = useStrings(S);
  const c = useStrings(COMMON);
  const { user } = useAuth();
  const uid = user!.id;
  const [period, setPeriod] = useState<Period>('365');
  const q = useLoad(async () => {
    const [watches, wears, values] = await Promise.all([listWatches(uid), listWearLogs(uid), listValueHistory(uid)]);
    return { watches, wears, values };
  }, [uid]);

  const stats = useMemo(() => {
    if (!q.data) return null;
    const { watches, wears } = q.data;
    const since = period === 'all' ? '0000-00-00' : toISODate(new Date(Date.now() - Number(period) * 86_400_000));
    const inPeriod = wears.filter(w => w.worn_on >= since);
    const per = new Map<string, { n: number; last: string | null; total: number }>();
    watches.forEach(w => per.set(w.id, { n: 0, last: null, total: 0 }));
    for (const l of wears) {
      const p = per.get(l.watch_id); if (!p) continue;
      p.total++;
      if (!p.last || l.worn_on > p.last) p.last = l.worn_on;
    }
    for (const l of inPeriod) { const p = per.get(l.watch_id); if (p) p.n++; }
    const days = new Set(inPeriod.map(l => l.worn_on)).size;
    const rows = watches.map(w => {
      const p = per.get(w.id)!;
      const price = w.purchase_price !== null ? Number(w.purchase_price) : null;
      return { w, ...p, share: inPeriod.length ? p.n / inPeriod.length : 0, cpw: price && p.total ? price / p.total : null, idle: p.last ? daysBetween(p.last) : null };
    }).sort((a, b) => b.n - a.n);
    const dormant = rows.filter(r => r.idle === null || r.idle >= DORMANT_DAYS);
    return { rows, days, dormant };
  }, [q.data, period]);

  const valueSeries = useMemo(() => {
    if (!q.data) return [];
    // Valeur totale de la collection dans le temps : à chaque estimation, somme de la dernière valeur connue de chaque montre.
    const latest = new Map<string, number>();
    return q.data.values.map(v => {
      latest.set(v.watch_id, v.value);
      return { t: new Date(v.recorded_at).getTime(), v: [...latest.values()].reduce((a, b) => a + b, 0) };
    });
  }, [q.data]);

  if (q.loading) return <div className="page"><Loading /></div>;
  if (q.error || !stats) return <div className="page"><Notice tone="error">{q.error}</Notice></div>;

  const totalBought = q.data!.watches.reduce((a, w) => a + (Number(w.purchase_price) || 0), 0);
  const totalNow = q.data!.watches.reduce((a, w) => a + (Number(w.current_estimated_value) || 0), 0);

  return (
    <div className="page">
      <PageHeader title={t.title} back={{ to: '/portage', label: c.tabs.wear }} />
      <Segmented label={t.period} value={period} onChange={setPeriod}
        options={[{ value: '90', label: t.periods.p90 }, { value: '365', label: t.periods.p365 }, { value: 'all', label: t.periods.all }]} />

      <section className={s.summary}>
        <Stat value={<span className="num">{stats.days}</span>} label={t.daysLogged} />
        <Stat value={<span className="num">{stats.rows.filter(r => r.n > 0).length}/{stats.rows.length}</span>} label={t.watchesWorn} />
        <Stat value={<span className="num">{stats.dormant.length}</span>} label={t.dormantIdle(stats.dormant.length, DORMANT_DAYS)} />
      </section>

      <section className={s.block}>
        <h2>{t.rotation}</h2>
        <ul className={s.bars}>
          {stats.rows.map(r => (
            <li key={r.w.id}>
              <Link to={`/montre/${r.w.id}?onglet=portage`} className={s.barRow}>
                <Cushion {...cushionSrc(mainPhoto(r.w.photos)?.storage_path)} alt="" className={s.thumb} />
                <span className={s.barText}>
                  <span className={s.barName}>{r.w.brand} {r.w.model}</span>
                  <span className={s.track}><span style={{ width: `${Math.max(r.share * 100, r.n ? 2 : 0)}%` }} /></span>
                </span>
                <span className={`${s.barNum} num`}>{r.n}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className={s.block}>
        <h2>{t.costPerWear}</h2>
        <p className={s.muted}>{t.costHint}</p>
        <table className={s.table}>
          <thead><tr><th>{t.watch}</th><th className="num">{t.days}</th><th className="num">{t.costPerWear}</th></tr></thead>
          <tbody>
            {[...stats.rows].sort((a, b) => (a.cpw ?? Infinity) - (b.cpw ?? Infinity)).map(r => (
              <tr key={r.w.id}>
                <td>{r.w.brand} {r.w.model}</td>
                <td className="num">{r.total}</td>
                <td className="num">{r.cpw ? formatEuros(r.cpw) : r.w.purchase_price ? t.neverWornCap : t.noPrice}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {stats.dormant.length > 0 && (
        <section className={s.block}>
          <h2>{t.drawer}</h2>
          <ul className={s.dormant}>
            {stats.dormant.map(r => (
              <li key={r.w.id}>
                <Link to={`/montre/${r.w.id}`}>{r.w.brand} {r.w.model}</Link>
                <span>{r.idle === null ? t.neverWorn : t.notWornFor(r.idle)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={s.block}>
        <h2>{t.collectionValue}</h2>
        <div className={s.summary}>
          <Stat value={<span className="num">{formatEuros(totalBought)}</span>} label={t.paid} />
          <Stat value={<span className="num">{formatEuros(totalNow)}</span>} label={t.declaredValue} />
        </div>
        {valueSeries.length >= 2 ? <Sparkline points={valueSeries} label={t.valueChart} height={140} />
          : <p className={s.muted}>{t.valueEmpty}</p>}
      </section>
    </div>
  );
}

/** Version gratuite : les vrais chiffres de la collection en aperçu, le détail réservé à Premium. */
function StatsPreview() {
  const t = useStrings(S);
  const c = useStrings(COMMON);
  const { user, profile } = useAuth();
  const uid = user!.id;
  const q = useLoad(async () => {
    const [watches, wears] = await Promise.all([listWatches(uid), listWearLogs(uid)]);
    return { watches, wears };
  }, [uid]);
  const a = useMemo(() => (q.data ? analyseCosts(q.data.watches, q.data.wears) : null), [q.data]);

  if (q.loading || !profile) return <div className="page"><Loading /></div>;
  if (q.error || !a) return <div className="page"><Notice tone="error">{q.error}</Notice></div>;

  const since = toISODate(new Date(Date.now() - 365 * 86_400_000));
  const days = new Set(q.data!.wears.filter(w => w.worn_on >= since).map(w => w.worn_on)).size;

  return (
    <div className="page">
      <PageHeader title={t.title} subtitle={t.previewSubtitle} back={{ to: '/portage', label: c.tabs.wear }} />
      <section className={s.summary}>
        <Stat value={<span className="num">{days}</span>} label={t.daysLogged12} />
        <Stat value={<span className="num">{a.rows.filter(r => r.wears > 0).length}/{a.rows.length}</span>} label={t.watchesWorn} />
        <Stat value={<span className="num">{a.dormant.length}</span>} label={t.dormant(a.dormant.length)} />
      </section>

      <CostTeaser analysis={a} />

      <section className={s.block}>
        <h2>{t.withPremium}</h2>
        <ul className={s.dormant}>
          {t.features.map(f => <li key={f.title}><strong>{f.title}</strong><span>{f.text}</span></li>)}
        </ul>
        <div>
          <LinkButton to="/premium">
            {PAYMENTS_ENABLED ? t.goPremium(premiumPrices().year.amount) : t.discoverPremium}
          </LinkButton>
        </div>
      </section>
    </div>
  );
}

export default function StatsPage() {
  const { isPremium } = useAuth();
  return isPremium ? <StatsContent /> : <StatsPreview />;
}
