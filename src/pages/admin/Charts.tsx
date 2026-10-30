import { useEffect, useRef, useState } from 'react';
import s from './AdminPage.module.css';

/**
 * Petits graphiques du backoffice, en SVG, une seule série chacun (pas de légende nécessaire :
 * le titre nomme la série). Survol : info-bulle par barre ou par point ; une table accompagne
 * toujours les montants.
 */

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(600);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(240, Math.round(e.contentRect.width))));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

export type Point = { label: string; value: number; tip: string };

const H = 180, PAD_T = 14, PAD_B = 26, PAD_L = 4;

/** Barres verticales. `signed` : valeurs positives en lume, négatives en rubis, autour d'une ligne zéro. */
export function Bars({ data, signed = false, ariaLabel, tick }: { data: Point[]; signed?: boolean; ariaLabel: string; tick?: (i: number) => boolean }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(0, ...data.map(d => d.value));
  const min = signed ? Math.min(0, ...data.map(d => d.value)) : 0;
  const span = max - min || 1;
  const plotH = H - PAD_T - PAD_B;
  const y = (v: number) => PAD_T + ((max - v) / span) * plotH;
  const band = (w - PAD_L) / Math.max(1, data.length);
  const bw = Math.max(3, Math.min(28, band - 4));
  const zero = y(0);

  return (
    <div ref={ref} className={s.chart} onMouseLeave={() => setHover(null)}>
      <svg width={w} height={H} role="img" aria-label={ariaLabel}>
        <line x1={0} x2={w} y1={zero} y2={zero} className={s.axis} />
        {data.map((d, i) => {
          const x = PAD_L + i * band + (band - bw) / 2;
          const top = Math.min(y(d.value), zero), h = Math.max(d.value === 0 ? 0 : 2, Math.abs(zero - y(d.value)));
          const neg = d.value < 0;
          return (
            <g key={d.label}>
              {/* barre : extrémité arrondie côté données, ancrée sur la ligne zéro */}
              <path
                className={signed ? (neg ? s.barNeg : s.barPos) : s.bar}
                data-dim={hover !== null && hover !== i}
                d={roundedBar(x, top, bw, h, neg)}
              />
              {(tick ? tick(i) : i % Math.ceil(data.length / 6) === 0) && (
                <text x={x + bw / 2} y={H - 8} className={s.tick} textAnchor="middle">{d.label}</text>
              )}
              <rect x={PAD_L + i * band} y={0} width={band} height={H} fill="transparent"
                onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={-1} />
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div className={s.tooltip} style={{ left: Math.min(w - 170, Math.max(0, PAD_L + hover * band + band / 2 - 85)) }}>
          {data[hover].tip}
        </div>
      )}
    </div>
  );
}

function roundedBar(x: number, top: number, w: number, h: number, down: boolean) {
  const r = Math.min(4, w / 2, h);
  if (h <= 0) return '';
  if (down) return `M${x},${top} h${w} v${h - r} q0,${r} ${-r},${r} h${-(w - 2 * r)} q${-r},0 ${-r},${-r} z`;
  return `M${x},${top + h} v${-(h - r)} q0,${-r} ${r},${-r} h${w - 2 * r} q${r},0 ${r},${r} v${h - r} z`;
}

/** Courbe d'une seule série (cumul), avec réticule et info-bulle au survol. */
export function Line({ data, ariaLabel }: { data: Point[]; ariaLabel: string }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map(d => d.value));
  const plotH = H - PAD_T - PAD_B;
  const x = (i: number) => PAD_L + 6 + (i / Math.max(1, data.length - 1)) * (w - PAD_L - 12);
  const y = (v: number) => PAD_T + (1 - v / max) * plotH;
  const path = data.map((d, i) => `${i ? 'L' : 'M'}${x(i)},${y(d.value)}`).join(' ');
  const area = `${path} L${x(data.length - 1)},${y(0)} L${x(0)},${y(0)} z`;

  return (
    <div ref={ref} className={s.chart}
      onMouseMove={e => {
        const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        const i = Math.round(((e.clientX - r.left - PAD_L - 6) / (w - PAD_L - 12)) * (data.length - 1));
        setHover(Math.max(0, Math.min(data.length - 1, i)));
      }}
      onMouseLeave={() => setHover(null)}>
      <svg width={w} height={H} role="img" aria-label={ariaLabel}>
        <line x1={0} x2={w} y1={y(0)} y2={y(0)} className={s.axis} />
        <path d={area} className={s.area} />
        <path d={path} className={s.line} />
        {data.map((d, i) => i % Math.ceil(data.length / 6) === 0 && (
          <text key={d.label} x={x(i)} y={H - 8} className={s.tick} textAnchor="middle">{d.label}</text>
        ))}
        {hover !== null && <>
          <line x1={x(hover)} x2={x(hover)} y1={PAD_T} y2={y(0)} className={s.crosshair} />
          <circle cx={x(hover)} cy={y(data[hover].value)} r={5} className={s.dot} />
        </>}
      </svg>
      {hover !== null && (
        <div className={s.tooltip} style={{ left: Math.min(w - 170, Math.max(0, x(hover) - 85)) }}>{data[hover].tip}</div>
      )}
    </div>
  );
}
