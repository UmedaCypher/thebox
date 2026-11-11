import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Check, Share2, Watch as WatchIcon, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { addWatchPhoto, addWear, getMyWearStreak, mainPhoto, saveProfile, thumbSrc } from '../../lib/api';
import type { Watch, WearStreak } from '../../types';
import { Button, Img, Notice, Segmented, Sheet, TextArea, TextField } from '../ui';
import { useToast } from '../Toast/Toast';
import { defineStrings, useStrings } from '../../i18n';
import { formatDate, toISODate } from '../../lib/format';
import { PHOTO_MILESTONES, STREAK_MILESTONES, STREAK_STRINGS } from './streak';
import { drawWristCheckStory, shareImage } from '../../lib/shareCard';
import s from './WristCheck.module.css';

const MAX_PHOTOS = 3;
const VIS_KEY = 'arcora-wc-visibility';

const S = defineStrings({
  title: 'Wrist Check',
  day: 'Jour',
  today: 'Aujourd’hui',
  yesterday: 'Hier',
  before: 'Avant-hier',
  watch: 'Quelle montre ?',
  photos: 'Wrist shot',
  photosHint: 'Facultatif. Une à trois photos, au poignet.',
  addPhoto: 'Prendre ou choisir une photo',
  remove: 'Retirer la photo',
  visibility: 'Visibilité des photos',
  public: 'Galerie publique',
  private: 'Privé',
  publicHint: 'Visibles dans la Galerie, avec votre tour de poignet : les membres peuvent dire si elle vous va.',
  privateHint: 'Visibles par vous seul, sur la page de la montre.',
  wrist: 'Votre tour de poignet',
  wristHint: 'Demandé une seule fois : il accompagne vos photos dans la Galerie.',
  note: 'Note',
  notePlaceholder: 'Un mot sur la journée, l’occasion…',
  submit: 'Valider le Wrist Check',
  doneTitle: 'C’est noté',
  doneText: 'Partagez votre Wrist Check en story : vos abonnés verront la montre du jour.',
  shareStory: 'Partager en story',
  preparing: 'Préparation…',
  finish: 'Terminer',
  saving: 'Enregistrement…',
  sendingPhoto: (i: number, n: number) => `Envoi de la photo ${i} sur ${n}…`,
  pickWatch: 'Choisissez une montre.',
  noWatch: 'Ajoutez d’abord une montre à votre collection.',
}, {
  title: 'Wrist Check',
  day: 'Day',
  today: 'Today',
  yesterday: 'Yesterday',
  before: 'Day before',
  watch: 'Which watch?',
  photos: 'Wrist shot',
  photosHint: 'Optional. One to three photos, on the wrist.',
  addPhoto: 'Take or choose a photo',
  remove: 'Remove photo',
  visibility: 'Photo visibility',
  public: 'Public gallery',
  private: 'Private',
  publicHint: 'Shown in the Gallery with your wrist size: members can say whether it suits you.',
  privateHint: 'Only you can see them, on the watch page.',
  wrist: 'Your wrist size',
  wristHint: 'Asked once: it goes with your photos in the Gallery.',
  note: 'Note',
  notePlaceholder: 'A word about the day, the occasion…',
  submit: 'Save the Wrist Check',
  doneTitle: 'Logged',
  doneText: 'Share your Wrist Check as a story: your followers will see today’s watch.',
  shareStory: 'Share as a story',
  preparing: 'Preparing…',
  finish: 'Done',
  saving: 'Saving…',
  sendingPhoto: (i: number, n: number) => `Uploading photo ${i} of ${n}…`,
  pickWatch: 'Choose a watch.',
  noWatch: 'Add a watch to your collection first.',
});

const readVis = (): 'public' | 'private' => { try { return localStorage.getItem(VIS_KEY) === 'private' ? 'private' : 'public'; } catch { return 'public'; } };

/**
 * Le Wrist Check : la montre du jour, une à trois photos facultatives, une note, la visibilité.
 * C'est le portage du jour (wear_logs) ; les photos rejoignent la page de la montre, datées du jour porté.
 */
export default function WristCheckSheet({ open, onClose, watches, watchId, day, onDone }: {
  open: boolean; onClose: () => void; watches: Watch[];
  /** Montre et jour proposés à l'ouverture (rattrapage d'hier, photo après un portage en un geste…) */
  watchId?: string | null; day?: string | null;
  onDone?: (streak: WearStreak | null) => void;
}) {
  const t = useStrings(S);
  const st = useStrings(STREAK_STRINGS);
  const toast = useToast();
  const { user, profile, refreshProfile } = useAuth();
  const days = useMemo(() => {
    const d = new Date();
    return [0, 1, 2].map(i => toISODate(new Date(d.getFullYear(), d.getMonth(), d.getDate() - i)));
  }, []);

  const [selDay, setSelDay] = useState(day ?? days[0]);
  const [selWatch, setSelWatch] = useState<string | null>(watchId ?? null);
  const [files, setFiles] = useState<{ file: File; url: string }[]>([]);
  const [vis, setVis] = useState<'public' | 'private'>(readVis);
  const [wrist, setWrist] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  // Après validation avec photo : proposition de partage avant de fermer
  const [done, setDone] = useState<{ streak: number } | null>(null);
  const [sharing, setSharing] = useState(false);

  // Remise à zéro à chaque ouverture, avec la montre et le jour proposés
  useEffect(() => {
    if (!open) return;
    setSelDay(day && days.includes(day) ? day : days[0]);
    setSelWatch(watchId ?? (watches.length === 1 ? watches[0].id : null));
    setFiles([]); setNote(''); setError(null); setBusy(null); setWrist(''); setDone(null);
  }, [open, watchId, day, days, watches]);
  useEffect(() => () => files.forEach(f => URL.revokeObjectURL(f.url)), [files]);

  const needWrist = files.length > 0 && vis === 'public' && !profile?.wrist_size_cm;

  const pick = (e: ChangeEvent<HTMLInputElement>) => {
    const list = [...(e.target.files ?? [])].filter(f => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name));
    setFiles(prev => [...prev, ...list.map(file => ({ file, url: URL.createObjectURL(file) }))].slice(0, MAX_PHOTOS));
    e.target.value = '';
  };

  const submit = async () => {
    if (!user) return;
    if (!selWatch) { setError(t.pickWatch); return; }
    setError(null);
    try {
      const before = await getMyWearStreak();
      setBusy(t.saving);
      await addWear(user.id, selWatch, selDay, note.trim() || null);

      let wristSize = profile?.wrist_size_cm ? Number(profile.wrist_size_cm) : null;
      const typed = Number(wrist.replace(',', '.'));
      if (needWrist && wrist.trim() && Number.isFinite(typed) && typed > 10 && typed < 30) {
        wristSize = typed;
        await saveProfile(user.id, { wrist_size_cm: typed }, true);
        refreshProfile();
      }
      try { localStorage.setItem(VIS_KEY, vis); } catch { /* stockage indisponible */ }
      for (let i = 0; i < files.length; i++) {
        setBusy(t.sendingPhoto(i + 1, files.length));
        await addWatchPhoto(user.id, selWatch, files[i].file, {
          type: 'wrist_shot', inGallery: vis === 'public', wristSizeCm: wristSize, wornOn: selDay,
        });
      }

      const after = await getMyWearStreak();
      const reached = STREAK_MILESTONES.find(m => after && after.current >= m && (before?.current ?? 0) < m && after.badges.some(b => b.days === m));
      const photoReached = PHOTO_MILESTONES.find(m => after && after.photos >= m && (before?.photos ?? 0) < m);
      toast(reached ? st.celebrate(reached, st.badge[reached]) : photoReached ? st.celebratePhoto(photoReached) : st.kept(Math.max(1, after?.current ?? 1)));
      onDone?.(after);
      if (files.length) { setBusy(null); setDone({ streak: after?.current ?? 1 }); }
      else onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(null);
    }
  };

  const shareStory = async () => {
    const w = watches.find(x => x.id === selWatch);
    if (!w || !done) return;
    setSharing(true);
    try {
      const blob = await drawWristCheckStory({
        photo: files[0]?.url ?? null, brand: w.brand, model: w.model,
        dateLabel: formatDate(selDay, { day: 'numeric', month: 'long' }), streak: done.streak, username: profile?.username ?? null,
      });
      await shareImage(blob, `arcora-wrist-check-${selDay}.png`, `${w.brand} ${w.model} · Wrist Check`);
    } catch (e) { toast(e instanceof Error ? e.message : String(e)); }
    setSharing(false);
  };

  if (!open) return null;
  if (done) {
    return createPortal(
      <Sheet open={open} onClose={onClose} title={t.doneTitle}>
        <div className={s.form}>
          {files[0] && <img className={s.donePhoto} src={files[0].url} alt="" />}
          <p className={s.hint}>{t.doneText}</p>
          <Button onClick={shareStory} disabled={sharing} block><Share2 size={16} aria-hidden="true" />{sharing ? t.preparing : t.shareStory}</Button>
          <Button variant="ghost" onClick={onClose} block>{t.finish}</Button>
        </div>
      </Sheet>,
      document.body,
    );
  }
  return createPortal(
    <Sheet open={open} onClose={() => !busy && onClose()} title={t.title}>
      <div className={s.form}>
        <Segmented label={t.day} value={selDay} onChange={setSelDay}
          options={[{ value: days[0], label: t.today }, { value: days[1], label: t.yesterday }, { value: days[2], label: t.before }]} />

        <fieldset className={s.field}>
          <legend className={s.legend}>{t.watch}</legend>
          {watches.length === 0 ? <p className={s.hint}>{t.noWatch}</p> : (
            <ul className={s.watchRow}>
              {watches.map(w => {
                const th = thumbSrc(mainPhoto(w.photos)?.storage_path);
                return (
                  <li key={w.id}>
                    <button type="button" className={s.watchBtn} aria-pressed={selWatch === w.id} onClick={() => setSelWatch(w.id)}>
                      <span className={s.watchPhoto}>
                        {th.src ? <Img src={th.src} fallback={th.fallback} alt="" /> : <WatchIcon size={20} strokeWidth={1.3} />}
                        {selWatch === w.id && <span className={s.watchCheck}><Check size={14} strokeWidth={3} /></span>}
                      </span>
                      <span className={s.watchName}>{w.model}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </fieldset>

        <fieldset className={s.field}>
          <legend className={s.legend}>{t.photos}</legend>
          <p className={s.hint}>{t.photosHint}</p>
          <div className={s.photos}>
            {files.map((f, i) => (
              <span key={f.url} className={s.preview}>
                <img src={f.url} alt="" />
                <button type="button" className={s.removePhoto} aria-label={t.remove} onClick={() => setFiles(files.filter((_, j) => j !== i))}><X size={14} strokeWidth={2.4} /></button>
              </span>
            ))}
            {files.length < MAX_PHOTOS && (
              <button type="button" className={s.addPhoto} onClick={() => input.current?.click()}>
                <Camera size={22} strokeWidth={1.6} aria-hidden="true" />
                <span>{t.addPhoto}</span>
              </button>
            )}
          </div>
          <input ref={input} type="file" accept="image/*" multiple hidden onChange={pick} />
        </fieldset>

        {files.length > 0 && (
          <fieldset className={s.field}>
            <legend className={s.legend}>{t.visibility}</legend>
            <Segmented label={t.visibility} value={vis} onChange={setVis}
              options={[{ value: 'public', label: t.public }, { value: 'private', label: t.private }]} />
            <p className={s.hint}>{vis === 'public' ? t.publicHint : t.privateHint}</p>
          </fieldset>
        )}

        {needWrist && (
          <TextField label={t.wrist} hint={t.wristHint} inputMode="decimal" suffix="cm" value={wrist} onChange={e => setWrist(e.target.value)} placeholder="17" />
        )}

        <TextArea label={t.note} optional value={note} onChange={e => setNote(e.target.value.slice(0, 280))} placeholder={t.notePlaceholder} rows={2} />

        {error && <Notice tone="error">{error}</Notice>}
        <Button onClick={submit} disabled={Boolean(busy) || !selWatch} block>
          {busy ?? t.submit}
        </Button>
        {selDay !== days[0] && <p className={s.hint}>{formatDate(selDay, { weekday: 'long', day: 'numeric', month: 'long' })}</p>}
      </div>
    </Sheet>,
    document.body,
  );
}
