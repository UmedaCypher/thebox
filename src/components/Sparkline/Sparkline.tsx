/** Courbe d'évolution simple (valeur dans le temps), en SVG, sans dépendance. */
export default function Sparkline({ points, height = 120, label }: { points: { t: number; v: number }[]; height?: number; label: string }) {
  if (points.length < 2) return null;
  const W = 600;
  const pad = 8;
  const ts = points.map(p => p.t);
  const vs = points.map(p => p.v);
  const [t0, t1] = [Math.min(...ts), Math.max(...ts)];
  let [v0, v1] = [Math.min(...vs), Math.max(...vs)];
  if (v0 === v1) { v0 -= 1; v1 += 1; }
  const x = (t: number) => pad + ((t - t0) / (t1 - t0 || 1)) * (W - pad * 2);
  const y = (v: number) => pad + (1 - (v - v0) / (v1 - v0)) * (height - pad * 2);
  // Escalier : une valeur déclarée reste vraie jusqu'à la suivante.
  let d = `M ${x(points[0].t)} ${y(points[0].v)}`;
  for (let i = 1; i < points.length; i++) d += ` H ${x(points[i].t)} V ${y(points[i].v)}`;
  const last = points[points.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${height}`} width="100%" height={height} preserveAspectRatio="none" role="img" aria-label={label}>
      <path d={`${d} V ${height} H ${x(points[0].t)} Z`} fill="var(--brass)" opacity="0.08" />
      <path d={d} fill="none" stroke="var(--brass)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      <circle cx={x(last.t)} cy={y(last.v)} r="4" fill="var(--brass)" />
    </svg>
  );
}
