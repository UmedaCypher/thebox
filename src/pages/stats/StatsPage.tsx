import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLoad } from '../../hooks/useLoad';
import { listValueHistory, listWatches, listWearLogs, mainPhoto, thumbSrc } from '../../lib/api';
import { daysBetween, formatEuros, plural, toISODate } from '../../lib/format';
import { Cushion, Loading, Notice, PageHeader, Segmented, Stat } from '../../components/ui';
import Sparkline from '../../components/Sparkline/Sparkline';
import PremiumGate from '../../components/PremiumGate/PremiumGate';
import s from './StatsPage.module.css';

const DORMANT_DAYS = 60;
const cushionSrc = (path?: string | null) => { const t = thumbSrc(path); return { src: t.src, fallbackSrc: t.fallback }; };
type Period = '90' | '365' | 'all';

function StatsContent() {
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
      <PageHeader title="Statistiques" back={{ to: '/portage', label: 'Portage' }} />
      <Segmented label="Période" value={period} onChange={setPeriod}
        options={[{ value: '90', label: '3 mois' }, { value: '365', label: '12 mois' }, { value: 'all', label: 'Depuis le début' }]} />

      <section className={s.summary}>
        <Stat value={<span className="num">{stats.days}</span>} label="jours notés" />
        <Stat value={<span className="num">{stats.rows.filter(r => r.n > 0).length}/{stats.rows.length}</span>} label="montres portées" />
        <Stat value={<span className="num">{stats.dormant.length}</span>} label={`dormante${stats.dormant.length > 1 ? 's' : ''} (${DORMANT_DAYS} j sans port)`} />
      </section>

      <section className={s.block}>
        <h2>Rotation</h2>
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
        <h2>Coût par port</h2>
        <p className={s.muted}>Prix d'achat divisé par le nombre total de jours portés. Plus vous la portez, moins elle coûte.</p>
        <table className={s.table}>
          <thead><tr><th>Montre</th><th className="num">Jours</th><th className="num">Coût par port</th></tr></thead>
          <tbody>
            {[...stats.rows].sort((a, b) => (a.cpw ?? Infinity) - (b.cpw ?? Infinity)).map(r => (
              <tr key={r.w.id}>
                <td>{r.w.brand} {r.w.model}</td>
                <td className="num">{r.total}</td>
                <td className="num">{r.cpw ? formatEuros(r.cpw) : r.w.purchase_price ? 'Jamais portée' : 'Prix non renseigné'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {stats.dormant.length > 0 && (
        <section className={s.block}>
          <h2>Au fond du tiroir</h2>
          <ul className={s.dormant}>
            {stats.dormant.map(r => (
              <li key={r.w.id}>
                <Link to={`/montre/${r.w.id}`}>{r.w.brand} {r.w.model}</Link>
                <span>{r.idle === null ? 'jamais portée' : `pas portée depuis ${plural(r.idle, 'jour', 'jours')}`}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={s.block}>
        <h2>Valeur de la collection</h2>
        <div className={s.summary}>
          <Stat value={<span className="num">{formatEuros(totalBought)}</span>} label="payé" />
          <Stat value={<span className="num">{formatEuros(totalNow)}</span>} label="valeur déclarée" />
        </div>
        {valueSeries.length >= 2 ? <Sparkline points={valueSeries} label="Évolution de la valeur déclarée de la collection" height={140} />
          : <p className={s.muted}>La courbe apparaîtra quand vous aurez mis à jour quelques estimations.</p>}
      </section>
    </div>
  );
}

export default function StatsPage() {
  return (
    <PremiumGate title="Statistiques" pitch="Coût par port, montres dormantes, rotation et valeur de la collection : vos ports notés deviennent des chiffres.">
      <StatsContent />
    </PremiumGate>
  );
}
