import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Activity, Mic, Share2, Square } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLoad } from '../../hooks/useLoad';
import { addAccuracy, listWatches, mainPhoto, photoUrl } from '../../lib/api';
import { drawAccuracyStory, shareImage } from '../../lib/shareCard';
import type { MeasurePosition } from '../../lib/api';
import { analyze, BPH } from '../../lib/timegrapher';
import type { TimegrapherResult } from '../../lib/timegrapher';
import { startRecording } from '../../lib/recorder';
import type { Recording } from '../../lib/recorder';
import { Button, Notice, PageHeader, SelectField } from '../../components/ui';
import { useToast } from '../../components/Toast/Toast';
import { ACC_STRINGS, signed, verdictKey } from '../../components/Accuracy/accuracy';
import { formatNumber } from '../../lib/format';
import { defineStrings, useStrings } from '../../i18n';
import s from './TimegrapherPage.module.css';

const DURATION = 30;
const POS: MeasurePosition[] = ['dial_up', 'dial_down', 'crown_down', 'crown_up', 'crown_left', 'crown_right'];

const S = defineStrings({
  title: 'Timegrapher',
  subtitle: 'Mesurez la marche de votre montre mécanique avec le micro du téléphone, et suivez-la dans le temps.',
  watch: 'Montre', noWatch: 'Sans montre (mesure libre)',
  position: 'Position', bph: 'Cadence', auto: 'Automatique',
  bphLabel: (n: number) => `${formatNumber(n)} alt/h`,
  start: 'Lancer la mesure', stop: 'Arrêter',
  listening: (s: number) => `Écoute… ${s} s`,
  analysing: 'Analyse…',
  tipsTitle: 'Pour une bonne mesure',
  tips: [
    'Une pièce silencieuse, téléphone posé sur une surface souple (une serviette pliée).',
    'Montre remontée, posée contre le micro du téléphone (souvent en bas, près du port de charge).',
    'Ne touchez à rien pendant les 30 secondes de mesure.',
    'Mesurez dans plusieurs positions : la marche change selon la position.',
  ],
  rate: 'Marche', beatError: 'Défaut de repère', beats: 'Battements analysés', quality: 'Qualité du signal',
  save: 'Enregistrer sur la fiche de la montre', saved: 'Mesure enregistrée.',
  share: 'Partager le résultat', preparing: 'Préparation…',
  pickWatch: 'Choisissez une montre pour enregistrer la mesure.',
  failed: 'Le tic-tac n’a pas été reconnu. Rapprochez la montre du micro, dans une pièce plus calme, et réessayez.',
  micDenied: 'Le micro n’est pas accessible. Autorisez-le pour arcorawatch.com dans les réglages du navigateur.',
  unsupported: 'Ce navigateur ne permet pas l’enregistrement nécessaire. Essayez Chrome, Edge ou Safari récent.',
  lowQuality: 'Signal faible : la mesure est indicative. Refaites-la au calme si l’écart vous surprend.',
  limits: 'Ce timegrapher logiciel mesure la marche et le défaut de repère ; il ne mesure pas l’amplitude. Pour un diagnostic complet, un horloger utilise un micro de contact.',
  seeWatch: 'Voir l’historique de la montre',
}, {
  title: 'Timegrapher',
  subtitle: 'Measure your mechanical watch’s rate with your phone’s microphone, and follow it over time.',
  watch: 'Watch', noWatch: 'No watch (free measurement)',
  position: 'Position', bph: 'Beat rate', auto: 'Automatic',
  bphLabel: (n: number) => `${formatNumber(n)} bph`,
  start: 'Start measuring', stop: 'Stop',
  listening: (s: number) => `Listening… ${s} s`,
  analysing: 'Analysing…',
  tipsTitle: 'For a good measurement',
  tips: [
    'A quiet room, phone lying on something soft (a folded towel).',
    'Watch wound, placed against the phone’s microphone (often at the bottom, near the charging port).',
    'Don’t touch anything during the 30 seconds of measurement.',
    'Measure in several positions: the rate changes with position.',
  ],
  rate: 'Rate', beatError: 'Beat error', beats: 'Beats analysed', quality: 'Signal quality',
  save: 'Save to the watch’s page', saved: 'Measurement saved.',
  share: 'Share the result', preparing: 'Preparing…',
  pickWatch: 'Choose a watch to save the measurement.',
  failed: 'The ticking wasn’t recognised. Bring the watch closer to the microphone, in a quieter room, and try again.',
  micDenied: 'The microphone is not accessible. Allow it for arcorawatch.com in your browser settings.',
  unsupported: 'This browser can’t make the recording needed. Try a recent Chrome, Edge or Safari.',
  lowQuality: 'Weak signal: the result is indicative. Measure again somewhere quiet if the deviation surprises you.',
  limits: 'This software timegrapher measures rate and beat error; it doesn’t measure amplitude. For a full diagnosis, a watchmaker uses a contact microphone.',
  seeWatch: 'See the watch’s history',
});

type Phase = 'idle' | 'listening' | 'analysing' | 'done';

export default function TimegrapherPage() {
  const t = useStrings(S);
  const a = useStrings(ACC_STRINGS);
  const toast = useToast();
  const { user, profile } = useAuth();
  const uid = user!.id;
  const [params] = useSearchParams();
  const watches = useLoad(() => listWatches(uid), [uid]);
  const mechanical = (watches.data ?? []).filter(w => w.movement !== 'Quartz');
  const [watchId, setWatchId] = useState(params.get('montre') ?? 'none');
  const [position, setPosition] = useState<MeasurePosition>('dial_up');
  const [bph, setBph] = useState('auto');
  const [phase, setPhase] = useState<Phase>('idle');
  const [left, setLeft] = useState(DURATION);
  const [result, setResult] = useState<TimegrapherResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const rec = useRef<Recording | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const timer = useRef<number | null>(null);
  const frame = useRef<number | null>(null);

  // Arrêt propre si l'on quitte la page pendant l'écoute
  useEffect(() => () => {
    if (timer.current) window.clearInterval(timer.current);
    if (frame.current) cancelAnimationFrame(frame.current);
    rec.current?.stop().catch(() => null);
  }, []);

  const draw = () => {
    const c = canvas.current, r = rec.current;
    if (c && r) {
      const g = c.getContext('2d')!;
      const w = c.width = c.clientWidth * devicePixelRatio, h = c.height = c.clientHeight * devicePixelRatio;
      const data = r.tail(9600); // ~0,2 s
      g.clearRect(0, 0, w, h);
      g.strokeStyle = getComputedStyle(c).color; g.lineWidth = devicePixelRatio;
      g.beginPath();
      const peak = Math.max(0.02, ...Array.from(data, Math.abs));
      for (let i = 0; i < data.length; i += 4) { const x = (i / data.length) * w, y = h / 2 - (data[i] / peak) * (h / 2.2); if (i) g.lineTo(x, y); else g.moveTo(x, y); }
      g.stroke();
    }
    frame.current = requestAnimationFrame(draw);
  };

  const finish = async () => {
    if (timer.current) { window.clearInterval(timer.current); timer.current = null; }
    if (frame.current) { cancelAnimationFrame(frame.current); frame.current = null; }
    const c = canvas.current; if (c) c.getContext('2d')?.clearRect(0, 0, c.width, c.height);
    const r = rec.current; rec.current = null;
    if (!r) return;
    setPhase('analysing');
    const { samples, sampleRate } = await r.stop();
    // Laisse l'écran se mettre à jour avant le calcul
    await new Promise(res => setTimeout(res, 30));
    const out = analyze(samples, sampleRate, bph === 'auto' ? null : Number(bph));
    if (!out) setError(t.failed);
    setResult(out); setPhase(out ? 'done' : 'idle');
  };

  const start = async () => {
    setError(null); setResult(null); setSaved(false);
    if (!navigator.mediaDevices?.getUserMedia || typeof AudioWorkletNode === 'undefined') { setError(t.unsupported); return; }
    try { rec.current = await startRecording(); }
    catch { setError(t.micDenied); return; }
    setPhase('listening'); setLeft(DURATION);
    const t0 = Date.now();
    timer.current = window.setInterval(() => {
      const remain = DURATION - Math.floor((Date.now() - t0) / 1000);
      setLeft(Math.max(0, remain));
      if (remain <= 0) finish();
    }, 250);
    frame.current = requestAnimationFrame(draw);
  };

  const save = async () => {
    if (!result) return;
    if (watchId === 'none') { setError(t.pickWatch); return; }
    try {
      await addAccuracy(uid, { watch_id: watchId, rate_s_day: Math.round(result.rate * 100) / 100, beat_error_ms: Math.round(result.beatError * 100) / 100,
        amplitude_deg: null, bph: result.bph, position, source: 'timegrapher', quality: Math.round(result.quality * 100) / 100, note: null });
      setSaved(true); toast(t.saved);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };

  const busy = phase === 'listening' || phase === 'analysing';
  const [sharing, setSharing] = useState(false);
  const shareResult = async () => {
    if (!result) return;
    const w = (watches.data ?? []).find(x => x.id === watchId);
    setSharing(true);
    try {
      const blob = await drawAccuracyStory({
        rate: result.rate, beatError: result.beatError, bph: result.bph, verdict: a.verdict[verdictKey(result.rate)],
        brand: w?.brand ?? null, model: w?.model ?? null, photo: photoUrl(mainPhoto(w?.photos)?.storage_path), username: profile?.username ?? null,
      });
      await shareImage(blob, 'arcora-timegrapher.png', w ? `${w.brand} ${w.model} : ${signed(result.rate)} ${a.perDay}` : `${signed(result.rate)} ${a.perDay}`);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    setSharing(false);
  };

  return (
    <div className="page">
      <PageHeader title={t.title} subtitle={t.subtitle} />
      <div className={s.layout}>
        <section className={`panel ${s.main}`} data-tone="brass">
          <div className={s.fields}>
            <SelectField label={t.watch} value={watchId} onChange={e => setWatchId(e.target.value)} disabled={busy}
              options={[{ value: 'none', label: t.noWatch }, ...mechanical.map(w => ({ value: w.id, label: `${w.brand} ${w.model}` }))]} />
            <SelectField label={t.position} value={position} onChange={e => setPosition(e.target.value as MeasurePosition)} disabled={busy}
              options={POS.map(p => ({ value: p, label: a.positions[p] }))} />
            <SelectField label={t.bph} value={bph} onChange={e => setBph(e.target.value)} disabled={busy}
              options={[{ value: 'auto', label: t.auto }, ...BPH.map(b => ({ value: String(b), label: t.bphLabel(b) }))]} />
          </div>

          <div className={s.scope} data-active={phase === 'listening'}>
            <canvas ref={canvas} className={s.wave} aria-hidden="true" />
            {phase === 'listening' && <span className={s.count}>{t.listening(left)}</span>}
            {phase === 'analysing' && <span className={s.count}>{t.analysing}</span>}
            {phase === 'idle' && <Activity size={34} strokeWidth={1.2} className={s.idleIcon} aria-hidden="true" />}
            {phase === 'done' && result && (
              <div className={s.result}>
                <p className={s.rate}>{signed(result.rate)}<small>{a.perDay}</small></p>
                <p className={s.verdict} data-v={verdictKey(result.rate)}>{a.verdict[verdictKey(result.rate)]}</p>
              </div>
            )}
          </div>

          {phase === 'listening'
            ? <Button onClick={finish}><Square size={16} aria-hidden="true" />{t.stop}</Button>
            : <Button onClick={start} disabled={busy}><Mic size={16} aria-hidden="true" />{t.start}</Button>}

          {error && <Notice tone="error">{error}</Notice>}

          {phase === 'done' && result && (
            <>
              <dl className={s.stats}>
                <div><dt>{t.rate}</dt><dd>{signed(result.rate)} {a.perDay}</dd></div>
                <div><dt>{t.beatError}</dt><dd>{result.beatError.toLocaleString(undefined, { maximumFractionDigits: 1 })} ms</dd></div>
                <div><dt>{t.bph}</dt><dd>{t.bphLabel(result.bph)}</dd></div>
                <div><dt>{t.beats}</dt><dd>{result.beats}</dd></div>
                <div><dt>{t.quality}</dt><dd>{Math.round(result.quality * 100)}&nbsp;%</dd></div>
              </dl>
              {result.quality < 0.7 && <Notice>{t.lowQuality}</Notice>}
              <div className={s.resultActions}>
                {saved
                  ? watchId !== 'none' && <Link to={`/montre/${watchId}?onglet=entretien`}>{t.seeWatch}</Link>
                  : <Button variant="secondary" onClick={save}>{t.save}</Button>}
                <Button variant="ghost" onClick={shareResult} disabled={sharing}>
                  <Share2 size={16} aria-hidden="true" />{sharing ? t.preparing : t.share}
                </Button>
              </div>
            </>
          )}
        </section>

        <aside className={`panel ${s.tips}`} data-tone="plain">
          <h2 className={s.tipsTitle}>{t.tipsTitle}</h2>
          <ol>{t.tips.map(x => <li key={x}>{x}</li>)}</ol>
          <p className={s.small}>{t.limits}</p>
        </aside>
      </div>
    </div>
  );
}
