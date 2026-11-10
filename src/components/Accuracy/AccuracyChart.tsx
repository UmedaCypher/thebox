import type { AccuracyMeasurement } from '../../lib/api';
import { formatDate } from '../../lib/format';
import { signed } from './accuracy';
import s from './Accuracy.module.css';

/**
 * Évolution de la marche : une ligne par mesure, la bande des tolérances chronomètre (−4 / +6 s/j)
 * en fond et le zéro en pointillé.
 */
export default function AccuracyChart({ data, label }: { data: AccuracyMeasurement[]; label: string }) {
  if (data.length < 2) return null;
  const W = 600, H = 180, PAD = { l: 40, r: 12, t: 12, b: 26 };
  const vals = data.map(d => d.rate_s_day);
  const lo = Math.min(-8, ...vals) - 2, hi = Math.max(8, ...vals) + 2;
  const t0 = new Date(data[0].measured_at).getTime(), t1 = new Date(data[data.length - 1].measured_at).getTime();
  const x = (t: number) => PAD.l + (t1 === t0 ? 0.5 : (t - t0) / (t1 - t0)) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - (v - lo) / (hi - lo)) * (H - PAD.t - PAD.b);
  const pts = data.map(d => [x(new Date(d.measured_at).getTime()), y(d.rate_s_day)] as const);
  const ticks = [lo, 0, hi].map(v => Math.round(v));
  return (
    <svg className={s.chart} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} preserveAspectRatio="none">
      <rect x={PAD.l} y={y(6)} width={W - PAD.l - PAD.r} height={y(-4) - y(6)} className={s.band} />
      <line x1={PAD.l} x2={W - PAD.r} y1={y(0)} y2={y(0)} className={s.zero} />
      {ticks.map(v => <text key={v} x={PAD.l - 6} y={y(v) + 4} className={s.axis} textAnchor="end">{signed(v, 0)}</text>)}
      <polyline points={pts.map(p => p.join(',')).join(' ')} className={s.line} />
      {pts.map(([px, py], i) => <circle key={data[i].id} cx={px} cy={py} r={4} className={s.dot}><title>{`${formatDate(data[i].measured_at)} : ${signed(data[i].rate_s_day)} s/j`}</title></circle>)}
      <text x={PAD.l} y={H - 6} className={s.axis}>{formatDate(data[0].measured_at, { day: 'numeric', month: 'short' })}</text>
      <text x={W - PAD.r} y={H - 6} className={s.axis} textAnchor="end">{formatDate(data[data.length - 1].measured_at, { day: 'numeric', month: 'short' })}</text>
    </svg>
  );
}
