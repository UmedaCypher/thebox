import { useMemo, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as RPointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { useScrollVar } from './useScrollVar';
import { defineStrings, useStrings } from '../../i18n';
import { formatDecimal } from '../../lib/format';
import s from './Sections.module.css';

/** Photos réelles de la collection du fondateur (public/landing), dans l'ordre des légendes S.photos. */
export const PHOTOS = [{ key: 'speedmaster' }, { key: 'yachtmaster' }, { key: 'leuba' }, { key: 'tudor' }, { key: 'zenith' }] as const;

const S = defineStrings({
  photos: [
    'Omega Speedmaster Professional, lunette verte',
    'Rolex Yacht-Master 40, cadran ardoise',
    'Leuba Louis Genève, rectangulaire des années 70',
    'Tudor Prince Date « Tiger », cadran rouge',
    'Zenith Defy Classic, céramique blanche',
  ],
  wall: {
    title: 'Un mois au poignet.',
    text: 'Chaque matin, un geste pour noter la montre du jour. À la fin du mois, vous savez enfin lesquelles vous portez, et lesquelles dorment.',
    days: 'jours notés',
    watches: 'montres portées',
    top: 'la plus portée',
    topDays: (n: number) => `${n} jours`,
    note: "Exemple de collection. L'image du mois se partage en un geste.",
    aria: (n: number) => `Calendrier d'un mois : ${n} jours notés sur 31`,
    weekdays: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
  },
  verdict: {
    over: { title: 'Les cornes dépassent du poignet', text: 'La montre paraîtra grande, surtout de profil. Regardez les photos portées avant de vous décider.' },
    bold: { title: 'Affirmée', text: 'Elle occupe toute la largeur du poignet. Une présence assumée, typique des plongeuses.' },
    classic: { title: 'Proportion classique', text: "L'équilibre que recherchent la plupart des collectionneurs." },
    discreet: { title: 'Discrète', text: 'Elle se glisse sous une manchette, comme une montre habillée.' },
  },
  tryOn: {
    title: "Essayez avant d'acheter.",
    text: 'Une 42 mm sur un poignet de 16 cm ne ressemble pas à la même sur 19 cm. Réglez les deux, puis regardez des photos réelles sur des poignets comme le vôtre.',
    wrist: 'Tour de poignet',
    diameter: 'Diamètre du boîtier',
    more: (lo: string, hi: string) => `Voir des photos sur des poignets de ${lo} à ${hi} cm`,
    aria: (diam: number, wrist: string) => `Montre de ${diam} mm sur un poignet de ${wrist} cm`,
  },
  passport: {
    title: 'Un passeport pour chaque montre.',
    text: "Référence, dimensions, état, boîte et papiers, entretiens. Partagez-le d'un lien quand vous vendez, faites expertiser ou assurez une pièce : les prix, eux, restent privés.",
    alt: 'Rolex Yacht-Master 40 au poignet',
    kind: 'Passeport de montre, exemple',
    name: 'Yacht-Master 40',
    specs: [
      ['Référence', '126622'],
      ['Mouvement', 'Automatique, cal. 3235'],
      ['Lunette', 'Platine, bidirectionnelle'],
      ['Entretiens', '2 notés'],
    ],
  },
  strip: {
    title: 'Au poignet, pas en catalogue.',
    text: 'La galerie montre les montres comme elles sont portées : en vacances, au bureau, à peine sorties de leur boîte.',
    open: 'Ouvrir la galerie',
  },
}, {
  photos: [
    'Omega Speedmaster Professional, green bezel',
    'Rolex Yacht-Master 40, slate dial',
    'Leuba Louis Genève, a 1970s rectangular',
    'Tudor Prince Date "Tiger", red dial',
    'Zenith Defy Classic, white ceramic',
  ],
  wall: {
    title: 'A month on the wrist.',
    text: 'Each morning, one tap to log the watch of the day. By the end of the month, you finally know which ones you wear, and which ones sleep.',
    days: 'days logged',
    watches: 'watches worn',
    top: 'most worn',
    topDays: n => (n === 1 ? '1 day' : `${n} days`),
    note: "An example collection. Share the month's picture in one tap.",
    aria: n => `One month calendar: ${n} of 31 days logged`,
    weekdays: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  },
  verdict: {
    over: { title: 'The lugs overhang the wrist', text: 'The watch will look large, especially from the side. Check wrist shots before you decide.' },
    bold: { title: 'Bold', text: 'It fills the full width of the wrist. A confident presence, typical of divers.' },
    classic: { title: 'Classic proportions', text: 'The balance most collectors look for.' },
    discreet: { title: 'Discreet', text: 'It slips under a cuff, like a dress watch.' },
  },
  tryOn: {
    title: 'Try before you buy.',
    text: 'A 42 mm watch on a 16 cm wrist looks nothing like the same watch on 19 cm. Set both, then browse real photos on wrists like yours.',
    wrist: 'Wrist size',
    diameter: 'Case diameter',
    more: (lo, hi) => `See photos on ${lo} to ${hi} cm wrists`,
    aria: (diam, wrist) => `A ${diam} mm watch on a ${wrist} cm wrist`,
  },
  passport: {
    title: 'A passport for every watch.',
    text: 'Reference, dimensions, condition, box & papers, service history. Share it with a link when you sell, get a valuation or insure a piece. Prices stay private.',
    alt: 'Rolex Yacht-Master 40 on the wrist',
    kind: 'Watch passport, example',
    name: 'Yacht-Master 40',
    specs: [
      ['Reference', '126622'],
      ['Movement', 'Automatic, cal. 3235'],
      ['Bezel', 'Platinum, bidirectional'],
      ['Services', '2 logged'],
    ],
  },
  strip: {
    title: 'On the wrist, not in a catalogue.',
    text: 'The gallery shows watches as they are really worn: on holiday, at the office, fresh out of the box.',
    open: 'Open the gallery',
  },
});

const face = (k: string) => `/landing/${k}-face.webp`;

/* ------------------------------------------------------------------ mur de portage */

// Un mois d'exemple : index de la montre portée chaque jour, -1 = rien noté.
const MONTH = [0, 1, 0, 2, -1, 3, 3, 0, 1, 0, 4, -1, 2, 0, 1, 1, 0, 3, -1, 0, 2, 0, 1, -1, 4, 0, 3, 0, 1, 2, 0];
const OFFSET = 2; // le 1er tombe un mercredi

export function WearWall() {
  const t = useStrings(S).wall;
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
        <h2 id="wall-title" className={s.h2}>{t.title}</h2>
        <p className={s.p}>{t.text}</p>
        <dl className={s.figures}>
          <div><dt>{t.days}</dt><dd className="num">{stats.days}</dd></div>
          <div><dt>{t.watches}</dt><dd className="num">{stats.watches}</dd></div>
          <div><dt>{t.top}</dt><dd className="num">{t.topDays(stats.topDays)}</dd></div>
        </dl>
        <p className={s.note}>{t.note}</p>
      </div>
      <div className={s.calendar} role="img" aria-label={t.aria(stats.days)}>
        {t.weekdays.map((d, i) => <span key={i} className={s.wd}>{d}</span>)}
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

/* Repères mesurés sur la photo détourée (672 × 672 px) : centre du cadran et largeur du boîtier hors couronne. */
const GS = { size: 672, cx: 335, cy: 323, caseW: 371 };

const verdict = (ratio: number) =>
  ratio > 1 ? 'over' as const : ratio > 0.9 ? 'bold' as const : ratio > 0.72 ? 'classic' as const : 'discreet' as const;

export function WristTry() {
  const all = useStrings(S);
  const t = all.tryOn;
  const [wrist, setWrist] = useState(17);
  const [diam, setDiam] = useState(40);
  const width = wrist * 10 * 0.32;          // largeur visible du poignet en mm (≈ tour × 0,32)
  const l2l = diam * 1.2;                   // corne à corne estimé
  const ratio = l2l / width;
  const v = all.verdict[verdict(ratio)];
  const k = 3.2;                            // px par mm dans le dessin
  const lo = Math.max(14, wrist - 0.5), hi = Math.min(22, wrist + 0.5);
  const fmt = formatDecimal;

  return (
    <section className={s.try} aria-labelledby="try-title">
      <div className={s.tryText}>
        <h2 id="try-title" className={s.h2}>{t.title}</h2>
        <p className={s.p}>{t.text}</p>
        <label className={s.range}>
          <span>{t.wrist} <strong className="num">{fmt(wrist)} cm</strong></span>
          <input type="range" min={14} max={22} step={0.5} value={wrist} onChange={e => setWrist(Number(e.target.value))} />
        </label>
        <label className={s.range}>
          <span>{t.diameter} <strong className="num">{diam} mm</strong></span>
          <input type="range" min={30} max={48} step={1} value={diam} onChange={e => setDiam(Number(e.target.value))} />
        </label>
        <div className={s.verdict} aria-live="polite">
          <strong>{v.title}</strong>
          <span>{v.text}</span>
        </div>
        <Link to={`/galerie?min=${lo}&max=${hi}`} className={s.more}>{t.more(fmt(lo), fmt(hi))}</Link>
      </div>

      <svg className={s.trySvg} viewBox="0 0 400 400" role="img" aria-label={t.aria(diam, fmt(wrist))}>
        <defs>
          <linearGradient id="wristGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#5a2a2f" /><stop offset="0.5" stopColor="#6e363b" /><stop offset="1" stopColor="#4a2125" />
          </linearGradient>
          <filter id="caseShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000" floodOpacity="0.45" /></filter>
        </defs>
        {/* Avant-bras vu de dessus */}
        <rect x="0" y={200 - (width * k) / 2} width="400" height={width * k} rx={18} fill="url(#wristGrad)" className={s.anim} />
        {/* Bracelet cuir, prolongé sous la photo */}
        <rect x={200 - diam * k * 0.21} y="0" width={diam * k * 0.42} height="400" rx={4} fill="#121011" className={s.anim} />
        {/* Montre entière détourée (Grand Seiko, vue de face), mise à l'échelle : la largeur du boîtier = le diamètre choisi */}
        <image href="/landing/grandseiko-cut.webp"
          x={200 - GS.cx * (diam * k / GS.caseW)} y={200 - GS.cy * (diam * k / GS.caseW)}
          width={GS.size * (diam * k / GS.caseW)} height={GS.size * (diam * k / GS.caseW)}
          preserveAspectRatio="xMidYMid meet" filter="url(#caseShadow)" className={s.anim} />
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
  const t = useStrings(S).passport;
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
        <h2 id="pass-title" className={s.h2}>{t.title}</h2>
        <p className={s.p}>{t.text}</p>
      </div>
      <div className={s.cardWrap} onPointerMove={move} onPointerLeave={leave}>
        <div ref={card} className={s.card}>
          <div className={s.cardPhoto}><img src="/landing/yachtmaster.webp" alt={t.alt} loading="lazy" /></div>
          <div className={s.cardBody}>
            <span className={s.cardKind}>{t.kind}</span>
            <strong className={s.cardTitle}>{t.name}</strong>
            <dl className={s.cardSpecs}>
              {t.specs.map(([dt, dd], i) => <div key={dt}><dt>{dt}</dt><dd className={i === 3 ? 'num' : undefined}>{dd}</dd></div>)}
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
  const all = useStrings(S);
  const t = all.strip;
  const items = [...PHOTOS, ...PHOTOS].map((p, i) => ({ ...p, label: all.photos[i % PHOTOS.length] }));
  return (
    <section className={s.strip} aria-labelledby="strip-title">
      <div className={s.stripHead}>
        <h2 id="strip-title" className={s.h2}>{t.title}</h2>
        <p className={s.p}>{t.text}</p>
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
      <div className={s.stripFoot}><Link to="/galerie" className={s.more}>{t.open}</Link></div>
    </section>
  );
}
