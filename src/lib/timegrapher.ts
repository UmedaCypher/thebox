/*
 * Timegrapher logiciel : analyse le tic-tac d'une montre mécanique enregistré au micro.
 *
 * 1. Filtre passe-haut (on garde les clics, on retire le souffle et les basses).
 * 2. Enveloppe du signal, ramenée à 10 kHz (résolution 0,1 ms).
 * 3. Cadence (alternances par heure) : choisie, ou reconnue par autocorrélation parmi les cadences courantes.
 * 4. Repérage de chaque battement autour de sa position attendue.
 * 5. Droite des moindres carrés sur les instants des battements → période réelle → marche en secondes par jour.
 * 6. Écart entre tic et tac (alternances paires / impaires) → défaut de repère (beat error), en millisecondes.
 *
 * L'amplitude n'est pas mesurée : elle demande l'angle de levée et un micro de contact.
 */

/** Cadences courantes, en alternances par heure. */
export const BPH = [18000, 19800, 21600, 25200, 28800, 36000] as const;
const ENV_RATE = 10000;

export interface TimegrapherResult {
  bph: number;
  /** Marche, en secondes par jour (positif : la montre avance). */
  rate: number;
  /** Défaut de repère, en millisecondes. */
  beatError: number;
  /** Battements retenus. */
  beats: number;
  /** Qualité de 0 à 1 : part des battements attendus trouvés, et régularité. */
  quality: number;
  /** Durée analysée, en secondes. */
  seconds: number;
}

/** Enveloppe (environ 10 kHz) d'un signal passé au filtre passe-haut, et sa fréquence exacte. */
export function envelope(samples: Float32Array, sampleRate: number): { env: Float32Array; rate: number } {
  // Passe-haut du premier ordre vers 1,5 kHz
  const rc = 1 / (2 * Math.PI * 1500), dt = 1 / sampleRate, alpha = rc / (rc + dt);
  const step = Math.max(1, Math.round(sampleRate / ENV_RATE));
  const out = new Float32Array(Math.floor(samples.length / step));
  let prevX = 0, prevY = 0, acc = 0, n = 0, j = 0;
  for (let i = 0; i < samples.length; i++) {
    const y = alpha * (prevY + samples[i] - prevX);
    prevX = samples[i]; prevY = y;
    acc = Math.max(acc, Math.abs(y)); n++;
    if (n === step) { if (j < out.length) out[j++] = acc; acc = 0; n = 0; }
  }
  // Léger lissage (0,3 ms) pour stabiliser les pics
  const sm = new Float32Array(out.length);
  for (let i = 0; i < out.length; i++) sm[i] = (out[i] + (out[i - 1] ?? out[i]) * 0.6 + (out[i + 1] ?? out[i]) * 0.6) / 2.2;
  return { env: sm, rate: sampleRate / step };
}

/** Cadence la plus probable : autocorrélation de l'enveloppe à la période de chaque cadence. */
export function detectBph(env: Float32Array, envRate = ENV_RATE): number {
  // Enveloppe élargie (2 ms) : le tic et le tac, décalés par le défaut de repère, se recouvrent
  const w = Math.max(1, Math.round(envRate * 0.002));
  const wide = new Float32Array(env.length);
  for (let i = 0; i < env.length; i++) { let m = 0; for (let j = Math.max(0, i - w); j <= Math.min(env.length - 1, i + w); j++) m = Math.max(m, env[j]); wide[i] = m; }
  const mean = wide.reduce((a, b) => a + b, 0) / wide.length;
  const x = Array.from(wide, v => v - mean);
  const scores: [number, number][] = [];
  for (const bph of BPH) {
    const lag = Math.round((3600 / bph) * envRate);
    // Autocorrélation sur une petite fenêtre autour de la période (la marche peut l'écarter un peu)
    let score = -Infinity;
    for (let d = -3; d <= 3; d++) {
      const L = lag + d;
      let s = 0;
      for (let i = 0; i + L < x.length; i++) s += x[i] * x[i + L];
      score = Math.max(score, s / (x.length - L));
    }
    scores.push([bph, score]);
  }
  // Une cadence deux fois plus lente corrèle aussi (un battement sur deux) : on retient la plus rapide
  // dont la corrélation approche la meilleure.
  const max = Math.max(...scores.map(x => x[1]));
  return scores.filter(x => x[1] >= max * 0.75).reduce((a, b) => (b[0] > a[0] ? b : a))[0];
}

/** Analyse complète. Renvoie null si le signal ne permet pas de mesurer. */
export function analyze(samples: Float32Array, sampleRate: number, bphHint?: number | null): TimegrapherResult | null {
  const { env, rate: R } = envelope(samples, sampleRate);
  if (env.length < R * 4) return null;
  const bph = bphHint ?? detectBph(env, R);
  const P = (3600 / bph) * R; // période attendue, en échantillons d'enveloppe

  // Seuil : au-dessus du bruit de fond (médiane) et d'une part des plus forts pics
  const sorted = Float32Array.from(env).sort();
  const median = sorted[Math.floor(sorted.length * 0.5)];
  const high = sorted[Math.floor(sorted.length * 0.995)];
  const threshold = median + (high - median) * 0.25;

  // Premier battement : le plus fort pic de la première période et demie
  let start = 0;
  for (let i = 1; i < Math.min(env.length, P * 1.5); i++) if (env[i] > env[start]) start = i;
  if (env[start] < threshold) return null;

  const times: number[] = []; const idx: number[] = [];
  let expected = start, k = 0, misses = 0;
  while (expected < env.length - 2) {
    const lo = Math.max(0, Math.round(expected - P * 0.25)), hi = Math.min(env.length - 1, Math.round(expected + P * 0.25));
    let m = lo;
    for (let i = lo; i <= hi; i++) if (env[i] > env[m]) m = i;
    if (env[m] >= threshold) {
      // Début du clic : premier franchissement de la moitié du pic, interpolé
      const half = median + (env[m] - median) * 0.5;
      let s = m;
      while (s > lo && env[s - 1] >= half) s--;
      const frac = s > 0 && env[s] !== env[s - 1] ? (half - env[s - 1]) / (env[s] - env[s - 1]) : 0;
      const tt = s - 1 + Math.min(1, Math.max(0, frac));
      times.push(tt); idx.push(k);
      expected = tt + P; misses = 0;
    } else {
      expected += P; misses++;
      if (misses > 8) break; // plus de signal
    }
    k++;
  }
  if (times.length < 20) return null;

  // Segments continus : une coupure (choc, bruit) décale la suite des battements ; on recommence alors
  // un segment, et toutes les droites partagent la même pente (la période), chacune avec son origine.
  const n = times.length;
  const seg: number[] = [0];
  for (let i = 1; i < n; i++) {
    const drift = (times[i] - times[i - 1]) - (idx[i] - idx[i - 1]) * P;
    seg.push(Math.abs(drift) > P * 0.12 ? seg[i - 1] + 1 : seg[i - 1]);
  }
  const groups = new Map<number, number[]>();
  seg.forEach((g, i) => groups.set(g, [...(groups.get(g) ?? []), i]));
  let sxy = 0, sxx = 0;
  const means = new Map<number, [number, number]>();
  for (const [g, ids] of groups) {
    if (ids.length < 4) continue;
    const mk = ids.reduce((a, i) => a + idx[i], 0) / ids.length, mt = ids.reduce((a, i) => a + times[i], 0) / ids.length;
    means.set(g, [mk, mt]);
    for (const i of ids) { sxy += (idx[i] - mk) * (times[i] - mt); sxx += (idx[i] - mk) ** 2; }
  }
  if (!sxx) return null;
  const b = sxy / sxx;
  const rate = (P / b - 1) * 86400;

  // Défaut de repère : écart moyen entre les résidus des battements pairs et impairs ; dispersion pour la qualité
  let even = 0, odd = 0, ne = 0, no = 0, ss = 0, used = 0;
  for (let i = 0; i < n; i++) {
    const m = means.get(seg[i]); if (!m) continue;
    const r = times[i] - (m[1] + b * (idx[i] - m[0]));
    ss += r * r; used++;
    if (idx[i] % 2 === 0) { even += r; ne++; } else { odd += r; no++; }
  }
  const beatError = ne && no ? Math.abs(even / ne - odd / no) / R * 1000 : 0;
  const jitterMs = Math.sqrt(ss / Math.max(1, used)) / R * 1000;
  const found = used / (k || 1);
  // Qualité : battements trouvés, peu de coupures, et régularité une fois le défaut de repère retiré
  const quality = Math.max(0, Math.min(1, found * (1 - (groups.size - 1) / Math.max(4, n / 10))
    * Math.max(0, 1 - Math.max(0, jitterMs - beatError / 2) / 1.5)));

  // Pas de tic-tac reconnaissable (silence, bruit) : pas de mesure plutôt qu'un chiffre faux
  if (quality < 0.3 || Math.abs(rate) > 900) return null;
  return { bph, rate, beatError, beats: n, quality, seconds: env.length / R };
}

/** Signal de test : clics d'une montre à la cadence, la marche et le défaut de repère donnés. */
export function synthesize(sampleRate: number, seconds: number, bph: number, rate: number, beatErrorMs: number, noise = 0.02): Float32Array {
  const out = new Float32Array(Math.round(sampleRate * seconds));
  const period = (3600 / bph) / (1 + rate / 86400);
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 - 0.5; };
  for (let i = 0; i < out.length; i++) out[i] = rnd() * noise;
  for (let k = 0; ; k++) {
    const t = 0.05 + k * period + (k % 2 ? beatErrorMs / 2000 : -beatErrorMs / 2000);
    const s0 = Math.round(t * sampleRate);
    if (s0 >= out.length) break;
    // Un clic : trois petits chocs amortis (dégagement, impulsion, chute), comme un vrai échappement
    for (const [dt, amp] of [[0, 0.6], [0.003, 1], [0.008, 0.5]] as const) {
      const st = s0 + Math.round(dt * sampleRate);
      for (let j = 0; j < sampleRate * 0.002 && st + j < out.length; j++) {
        out[st + j] += amp * Math.exp(-j / (sampleRate * 0.0004)) * Math.sin(2 * Math.PI * 4500 * j / sampleRate);
      }
    }
  }
  return out;
}
