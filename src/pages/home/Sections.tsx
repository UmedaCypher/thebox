import { useMemo, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as RPointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { useScrollVar } from './useScrollVar';
import s from './Sections.module.css';

/** Photos réelles de la collection du fondateur (public/landing). */
export const PHOTOS = [
  { key: 'gmt', label: 'Plongeuse GMT, bracelet Nato' },
  { key: 'santos', label: 'Carrée en acier, bracelet vissé' },
  { key: 'seagull', label: 'Coussin à cadran pixel' },
  { key: 'abart', label: 'Minimaliste à quantième circulaire' },
  { key: 'gshock', label: 'Digitale en résine, encore dans sa boîte' },
] as const;

const face = (k: string) => `/landing/${k}-face.webp`;

/* ------------------------------------------------------------------ mur de portage */

// Un mois d'exemple : index de la montre portée chaque jour, -1 = rien noté.
const MONTH = [0, 1, 0, 2, -1, 3, 3, 0, 1, 0, 4, -1, 2, 0, 1, 1, 0, 3, -1, 0, 2, 0, 1, -1, 4, 0, 3, 0, 1, 2, 0];
const OFFSET = 2; // le 1er tombe un mercredi

export function WearWall() {
  const ref = useRef<HTMLElement>(null);
  useScrollVar(ref, { mode: 'enter' });
  const stats = useMemo(() => {
    const worn = MONTH.filter(i => i >= 0);
    const counts = PHOTOS.map((_, i) => worn.filter(w => w === i).length);
    const top = counts.indexOf(Math.max(...counts));
    return { days: worn.length, watches: new Set(worn).size, top, topDays: counts[top] };
  }, []);

  return (
    <section ref={ref} className={s.wall} aria-labelledby="wall-title">
      <div className={s.wallText}>
        <h2 id="wall-title" className={s.h2}>Un mois au poignet.</h2>
        <p className={s.p}>Chaque matin, un geste pour noter la montre du jour. À la fin du mois, vous savez enfin lesquelles vous portez, et lesquelles dorment.</p>
        <dl className={s.figures}>
          <div><dt>jours notés</dt><dd className="num">{stats.days}</dd></div>
          <div><dt>montres portées</dt><dd className="num">{stats.watches}</dd></div>
          <div><dt>la plus portée</dt><dd className="num">{stats.topDays} jours</dd></div>
        </dl>
        <p className={s.note}>Exemple avec la collection du fondateur. L'image du mois se partage en un geste.</p>
      </div>
      <div className={s.calendar} role="img" aria-label={`Calendrier d'un mois : ${stats.days} jours notés sur 31`}>
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <span key={i} className={s.wd}>{d}</span>)}
        {Array.from({ length: OFFSET }, (_, i) => <span key={`o${i}`} />)}
        {MONTH.map((w, i) => (
          <span key={i} className={s.day} style={{ '--i': i } as CSSProperties} data-worn={w >= 0}>
            {w >= 0 ? <img src={face(PHOTOS[w].key)} alt="" loading="lazy" decoding="async" /> : <span>{i + 1}</span>}
          </span>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ essai au poignet */

const verdict = (ratio: number) => {
  if (ratio > 1) return { title: 'Les cornes dépassent du poignet', text: 'La montre paraîtra grande, surtout de profil. Regardez les photos portées avant de vous décider.' };
  if (ratio > 0.9) return { title: 'Affirmée', text: 'Elle occupe toute la largeur du poignet. Une présence assumée, typique des plongeuses.' };
  if (ratio > 0.72) return { title: 'Proportion classique', text: "L'équilibre que recherchent la plupart des collectionneurs." };
  return { title: 'Discrète', text: 'Elle se glisse sous une manchette, comme une montre habillée.' };
};

export function WristTry() {
  const [wrist, setWrist] = useState(17);
  const [diam, setDiam] = useState(40);
  const width = wrist * 10 * 0.32;          // largeur visible du poignet en mm (≈ tour × 0,32)
  const l2l = diam * 1.2;                   // corne à corne estimé
  const ratio = l2l / width;
  const v = verdict(ratio);
  const k = 3.2;                            // px par mm dans le dessin
  const lo = Math.max(14, wrist - 0.5), hi = Math.min(22, wrist + 0.5);
  const fmt = (n: number) => String(n).replace('.', ',');

  return (
    <section className={s.try} aria-labelledby="try-title">
      <div className={s.tryText}>
        <h2 id="try-title" className={s.h2}>Essayez avant d'acheter.</h2>
        <p className={s.p}>Une 42 mm sur un poignet de 16 cm ne ressemble pas à la même sur 19 cm. Réglez les deux, puis regardez des photos réelles sur des poignets comme le vôtre.</p>
        <label className={s.range}>
          <span>Tour de poignet <strong className="num">{fmt(wrist)} cm</strong></span>
          <input type="range" min={14} max={22} step={0.5} value={wrist} onChange={e => setWrist(Number(e.target.value))} />
        </label>
        <label className={s.range}>
          <span>Diamètre du boîtier <strong className="num">{diam} mm</strong></span>
          <input type="range" min={30} max={48} step={1} value={diam} onChange={e => setDiam(Number(e.target.value))} />
        </label>
        <div className={s.verdict} aria-live="polite">
          <strong>{v.title}</strong>
          <span>{v.text}</span>
        </div>
        <Link to={`/galerie?min=${lo}&max=${hi}`} className={s.more}>Voir des photos sur des poignets de {fmt(lo)} à {fmt(hi)} cm</Link>
      </div>

      <svg className={s.trySvg} viewBox="0 0 400 400" role="img" aria-label={`Montre de ${diam} mm sur un poignet de ${fmt(wrist)} cm`}>
        <defs>
          <linearGradient id="wristGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#5a2a2f" /><stop offset="0.5" stopColor="#6e363b" /><stop offset="1" stopColor="#4a2125" />
          </linearGradient>
          <radialGradient id="dialGrad" cx="0.4" cy="0.35" r="0.8">
            <stop offset="0" stopColor="#1d3566" /><stop offset="1" stopColor="#0a1530" />
          </radialGradient>
          <linearGradient id="steel" x1="0" x2="1"><stop offset="0" stopColor="#9fa3a7" /><stop offset="0.5" stopColor="#eceef0" /><stop offset="1" stopColor="#8d9194" /></linearGradient>
        </defs>
        {/* Avant-bras vu de dessus */}
        <rect x="0" y={200 - (width * k) / 2} width="400" height={width * k} rx={18} fill="url(#wristGrad)" className={s.anim} />
        {/* Bracelet */}
        <rect x={200 - diam * k * 0.26} y="0" width={diam * k * 0.52} height="400" fill="#1b1012" opacity="0.92" className={s.anim} />
        {/* Cornes */}
        <rect x={200 - diam * k * 0.3} y={200 - (l2l * k) / 2} width={diam * k * 0.6} height={l2l * k} rx={8} fill="url(#steel)" className={s.anim} />
        {/* Boîtier et cadran */}
        <circle cx="200" cy="200" r={(diam * k) / 2} fill="url(#steel)" className={s.anim} />
        <circle cx="200" cy="200" r={(diam * k) / 2 * 0.84} fill="url(#dialGrad)" className={s.anim} />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * Math.PI) / 6, r1 = (diam * k) / 2 * 0.62, r2 = (diam * k) / 2 * 0.76;
          return <line key={i} x1={200 + Math.sin(a) * r1} y1={200 - Math.cos(a) * r1} x2={200 + Math.sin(a) * r2} y2={200 - Math.cos(a) * r2} stroke="#efe8dc" strokeWidth={i % 3 ? 2 : 4} strokeLinecap="round" className={s.anim} />;
        })}
        <line x1="200" y1="200" x2={200 + (diam * k) * 0.2} y2={200 - (diam * k) * 0.12} stroke="#efe8dc" strokeWidth="4" strokeLinecap="round" className={s.anim} />
        <line x1="200" y1="200" x2={200 - (diam * k) * 0.06} y2={200 - (diam * k) * 0.32} stroke="#efe8dc" strokeWidth="3" strokeLinecap="round" className={s.anim} />
        <circle cx="200" cy="200" r="4" fill="#c2a072" />
        {/* Repères de largeur */}
        <g className={s.measure}>
          <line x1="372" x2="372" y1={200 - (width * k) / 2} y2={200 + (width * k) / 2} />
          <text x="364" y="200" textAnchor="end" dominantBaseline="middle">{Math.round(width)} mm</text>
          <line x1="28" x2="28" y1={200 - (l2l * k) / 2} y2={200 + (l2l * k) / 2} data-over={ratio > 1} />
          <text x="36" y="200" dominantBaseline="middle">{Math.round(l2l)} mm</text>
        </g>
      </svg>
    </section>
  );
}

/* ------------------------------------------------------------------ passeport */

function pseudoCode(seed: number, n = 11) {
  const cells: [number, number][] = [];
  let x = seed;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    x = (x * 9301 + 49297) % 233280;
    const corner = (i < 3 && j < 3) || (i < 3 && j > n - 4) || (i > n - 4 && j < 3);
    if (corner ? (i % 2 === 0 || j % 2 === 0) && !(i === 1 && j === 1) && !(i === 1 && j === n - 2) && !(i === n - 2 && j === 1) : x / 233280 > 0.55) cells.push([i, j]);
  }
  return cells;
}

export function PassportShowcase() {
  const card = useRef<HTMLDivElement>(null);
  const code = useMemo(() => pseudoCode(1127), []);
  const move = (e: RPointerEvent<HTMLDivElement>) => {
    const el = card.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    el.style.setProperty('--rx', `${(0.5 - y) * 14}deg`);
    el.style.setProperty('--ry', `${(x - 0.5) * 18}deg`);
    el.style.setProperty('--gx', `${x * 100}%`);
    el.style.setProperty('--gy', `${y * 100}%`);
  };
  const leave = () => {
    const el = card.current; if (!el) return;
    ['--rx', '--ry'].forEach(v => el.style.setProperty(v, '0deg'));
    el.style.setProperty('--gx', '30%'); el.style.setProperty('--gy', '20%');
  };

  return (
    <section className={s.passport} aria-labelledby="pass-title">
      <div className={s.passText}>
        <h2 id="pass-title" className={s.h2}>Un passeport pour chaque montre.</h2>
        <p className={s.p}>Référence, dimensions, état, boîte et papiers, entretiens. Partagez-le d'un lien quand vous vendez, faites expertiser ou assurez une pièce : les prix, eux, restent privés.</p>
      </div>
      <div className={s.cardWrap} onPointerMove={move} onPointerLeave={leave}>
        <div ref={card} className={s.card}>
          <div className={s.cardPhoto}><img src="/landing/gmt.webp" alt="Plongeuse GMT au poignet" loading="lazy" /></div>
          <div className={s.cardBody}>
            <span className={s.cardKind}>Passeport de montre, exemple</span>
            <strong className={s.cardTitle}>Plongeuse GMT</strong>
            <dl className={s.cardSpecs}>
              <div><dt>Mouvement</dt><dd>Automatique</dd></div>
              <div><dt>Bracelet</dt><dd>Nato tissé</dd></div>
              <div><dt>Lunette</dt><dd>Céramique 24 h</dd></div>
              <div><dt>Entretiens</dt><dd className="num">2 notés</dd></div>
            </dl>
            <div className={s.cardFoot}>
              <span className={`${s.serial} num`}>N° 0001127</span>
              <svg viewBox="0 0 11 11" className={s.code} aria-hidden="true">{code.map(([i, j]) => <rect key={`${i}-${j}`} x={j} y={i} width="1" height="1" />)}</svg>
            </div>
          </div>
          <div className={s.sheen} aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ galerie */

export function GalleryStrip() {
  const items = [...PHOTOS, ...PHOTOS];
  return (
    <section className={s.strip} aria-labelledby="strip-title">
      <div className={s.stripHead}>
        <h2 id="strip-title" className={s.h2}>Au poignet, pas en catalogue.</h2>
        <p className={s.p}>La galerie montre les montres comme elles sont portées : en vacances, au bureau, à peine sorties de leur boîte.</p>
      </div>
      <div className={s.marquee}>
        <ul className={s.track}>
          {items.map((p, i) => (
            <li key={i} aria-hidden={i >= PHOTOS.length}>
              <img src={`/landing/${p.key}.webp`} alt={i < PHOTOS.length ? p.label : ''} loading="lazy" decoding="async" />
              <span>{p.label}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className={s.stripFoot}><Link to="/galerie" className={s.more}>Ouvrir la galerie</Link></div>
    </section>
  );
}
