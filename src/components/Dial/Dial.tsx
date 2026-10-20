/** Illustration de cadran en SVG, pour l'accueil et les états vides (pas une vraie montre). */
interface Props { dial: string; ink: string; bezel?: string; hands?: number; seconds?: boolean; label?: string }

export default function Dial({ dial, ink, bezel = '#b9b3aa', hands = 0, seconds = true, label }: Props) {
  const idx = Array.from({ length: 12 }, (_, i) => i);
  const h = (hands % 12) * 30 + 300; // heure arbitraire mais stable
  const m = (hands * 47) % 360;
  return (
    <svg viewBox="0 0 200 200" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <defs>
        <radialGradient id={`g-${dial.slice(1)}`} cx="40%" cy="35%" r="75%">
          <stop offset="0" stopColor="#fff" stopOpacity="0.18" />
          <stop offset="1" stopColor="#000" stopOpacity="0.25" />
        </radialGradient>
      </defs>
      <rect x="82" y="0" width="36" height="200" rx="6" fill="#000" opacity="0.35" />
      <circle cx="100" cy="100" r="74" fill={bezel} />
      <circle cx="100" cy="100" r="66" fill={dial} />
      <circle cx="100" cy="100" r="66" fill={`url(#g-${dial.slice(1)})`} />
      {idx.map(i => {
        const a = (i * Math.PI) / 6;
        const long = i % 3 === 0;
        const r1 = long ? 46 : 52, r2 = 59;
        return (
          <line key={i} x1={100 + r1 * Math.sin(a)} y1={100 - r1 * Math.cos(a)} x2={100 + r2 * Math.sin(a)} y2={100 - r2 * Math.cos(a)}
            stroke={ink} strokeWidth={long ? 4 : 2} strokeLinecap="round" />
        );
      })}
      <g stroke={ink} strokeLinecap="round">
        <line x1="100" y1="100" x2={100 + 30 * Math.sin((h * Math.PI) / 180)} y2={100 - 30 * Math.cos((h * Math.PI) / 180)} strokeWidth="5" />
        <line x1="100" y1="100" x2={100 + 48 * Math.sin((m * Math.PI) / 180)} y2={100 - 48 * Math.cos((m * Math.PI) / 180)} strokeWidth="3.5" />
        {seconds && <line x1="100" y1="112" x2="100" y2="44" stroke="#c2a072" strokeWidth="1.2" />}
      </g>
      <circle cx="100" cy="100" r="3.5" fill={ink} />
    </svg>
  );
}
