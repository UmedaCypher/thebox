import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Activity, Trash2 } from 'lucide-react';
import { addAccuracy, deleteAccuracy, listAccuracy } from '../../lib/api';
import type { AccuracyMeasurement, MeasurePosition } from '../../lib/api';
import { Button, LinkButton, Notice, SelectField, TextField } from '../ui';
import { formatDate } from '../../lib/format';
import { defineStrings, useStrings } from '../../i18n';
import AccuracyChart from './AccuracyChart';
import { ACC_STRINGS, signed, verdictKey } from './accuracy';
import s from './Accuracy.module.css';

const S = defineStrings({
  title: 'Précision',
  empty: 'Aucune mesure. Mesurez la marche au micro avec le timegrapher, ou notez celle d’un horloger.',
  measure: 'Mesurer avec le timegrapher',
  manual: 'Saisir une mesure',
  rate: 'Marche (s/j)', ratePh: '+4,5',
  beatError: 'Défaut de repère (ms)', amplitude: 'Amplitude (°)', position: 'Position',
  save: 'Enregistrer', cancel: 'Annuler',
  invalid: 'Indiquez la marche en secondes par jour (ex. +4,5 ou −2).',
  latest: 'Dernière mesure',
  chart: 'Évolution de la marche, en secondes par jour',
  avg: (n: number) => `moyenne sur ${n} mesures`,
}, {
  title: 'Accuracy',
  empty: 'No measurement yet. Measure the rate with the timegrapher, or log a watchmaker’s reading.',
  measure: 'Measure with the timegrapher',
  manual: 'Log a measurement',
  rate: 'Rate (s/d)', ratePh: '+4.5',
  beatError: 'Beat error (ms)', amplitude: 'Amplitude (°)', position: 'Position',
  save: 'Save', cancel: 'Cancel',
  invalid: 'Enter the rate in seconds per day (e.g. +4.5 or −2).',
  latest: 'Latest measurement',
  chart: 'Rate over time, in seconds per day',
  avg: (n: number) => `average of ${n} measurements`,
});

const POS: MeasurePosition[] = ['dial_up', 'dial_down', 'crown_down', 'crown_up', 'crown_left', 'crown_right', 'wrist'];
const parse = (v: string) => { const n = Number(v.replace(',', '.').replace('−', '-').replace(/\s/g, '')); return v.trim() && Number.isFinite(n) ? n : null; };

/** Bloc « Précision » de la fiche d'une montre : dernière mesure, évolution, saisie manuelle. */
export default function AccuracyCard({ uid, watchId }: { uid: string; watchId: string }) {
  const t = useStrings(S);
  const a = useStrings(ACC_STRINGS);
  const [rows, setRows] = useState<AccuracyMeasurement[] | null>(null);
  const [form, setForm] = useState<{ rate: string; be: string; amp: string; pos: MeasurePosition } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => { listAccuracy(uid, watchId).then(setRows); }, [uid, watchId]);
  useEffect(() => { load(); }, [load]);
  if (!rows) return null;

  const last = rows[rows.length - 1];
  const submit = async (e: FormEvent) => {
    e.preventDefault(); if (!form) return;
    const rate = parse(form.rate);
    if (rate === null || Math.abs(rate) > 999) { setError(t.invalid); return; }
    try {
      await addAccuracy(uid, { watch_id: watchId, rate_s_day: rate, beat_error_ms: parse(form.be), amplitude_deg: parse(form.amp), bph: null, position: form.pos, source: 'manual', quality: null, note: null });
      setForm(null); setError(null); load();
    } catch (err) { setError(err instanceof Error ? err.message : String(err)); }
  };
  const remove = async (id: string) => { await deleteAccuracy(id).catch(() => null); load(); };

  return (
    <section className={`panel ${s.card}`} data-tone="plain">
      <div className={s.head}>
        <h3 className="panel-kicker">{t.title}</h3>
        <div className={s.head}>
          <LinkButton to={`/timegrapher?montre=${watchId}`} size="small"><Activity size={16} aria-hidden="true" />{t.measure}</LinkButton>
          {!form && <Button size="small" variant="ghost" onClick={() => setForm({ rate: '', be: '', amp: '', pos: 'dial_up' })}>{t.manual}</Button>}
        </div>
      </div>
      {last ? (
        <div>
          <p className={s.big}>{signed(last.rate_s_day)}<small>{a.perDay}</small></p>
          <p className={s.verdict} data-v={verdictKey(last.rate_s_day)}>{a.verdict[verdictKey(last.rate_s_day)]}</p>
          <p className={s.muted}>
            {t.latest} · {formatDate(last.measured_at)}{last.position ? ` · ${a.positions[last.position]}` : ''}
            {last.beat_error_ms !== null ? ` · ${last.beat_error_ms.toLocaleString()} ms` : ''}{last.amplitude_deg ? ` · ${last.amplitude_deg}°` : ''}
            {rows.length > 1 ? ` · ${t.avg(rows.length)} ${signed(rows.reduce((x, r) => x + r.rate_s_day, 0) / rows.length)} ${a.perDay}` : ''}
          </p>
        </div>
      ) : <p className={s.muted}>{t.empty}</p>}
      <AccuracyChart data={rows} label={t.chart} />
      {form && (
        <form className={s.form} onSubmit={submit}>
          <TextField label={t.rate} inputMode="decimal" value={form.rate} placeholder={t.ratePh} onChange={e => setForm({ ...form, rate: e.target.value })} />
          <TextField label={t.beatError} optional inputMode="decimal" value={form.be} onChange={e => setForm({ ...form, be: e.target.value })} />
          <TextField label={t.amplitude} optional inputMode="numeric" value={form.amp} onChange={e => setForm({ ...form, amp: e.target.value })} />
          <SelectField label={t.position} value={form.pos} onChange={e => setForm({ ...form, pos: e.target.value as MeasurePosition })} options={POS.map(p => ({ value: p, label: a.positions[p] }))} />
          {error && <Notice tone="error">{error}</Notice>}
          <div className={s.head}><Button type="submit" size="small">{t.save}</Button><Button size="small" variant="ghost" onClick={() => setForm(null)}>{t.cancel}</Button></div>
        </form>
      )}
      {rows.length > 0 && (
        <ul className={s.list}>
          {[...rows].reverse().slice(0, 6).map(r => (
            <li key={r.id}>
              <span>{formatDate(r.measured_at)}{r.position ? ` · ${a.positions[r.position]}` : ''}</span>
              <strong>{signed(r.rate_s_day)} {a.perDay}</strong>
              <button type="button" onClick={() => remove(r.id)} aria-label="×"><Trash2 size={14} /></button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
