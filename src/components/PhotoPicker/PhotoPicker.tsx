import { useEffect, useId, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { defineStrings, useStrings } from '../../i18n';
import { Cushion } from '../ui';
import s from './PhotoPicker.module.css';

const MAX_MB = 15;

const S = defineStrings({
  notImage: 'Choisissez une image (JPEG, PNG, HEIC…).',
  tooBig: (mb: number) => `Cette image dépasse ${mb} Mo.`,
  prompt: 'Prendre ou choisir une photo',
  remove: 'Retirer',
}, {
  notImage: 'Please choose an image (JPEG, PNG, HEIC…).',
  tooBig: mb => `This image is larger than ${mb} MB.`,
  prompt: 'Take or choose a photo',
  remove: 'Remove',
});

/** Sélecteur de photo présenté comme un coussin vide, avec aperçu. */
export default function PhotoPicker({ label, hint, file, onChange, ratio = 'portrait' }:
  { label: string; hint?: string; file: File | null; onChange: (f: File | null) => void; ratio?: 'portrait' | 'square' }) {
  const t = useStrings(S);
  const id = useId();
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pick = (f: File | undefined) => {
    setError(null);
    if (!f) return;
    if (!f.type.startsWith('image/')) { setError(t.notImage); return; }
    if (f.size > MAX_MB * 1024 * 1024) { setError(t.tooBig(MAX_MB)); return; }
    onChange(f);
  };

  return (
    <div className={s.wrap}>
      <span className={s.label}>{label}</span>
      <label htmlFor={id} className={s.target}>
        <Cushion src={preview} alt={label} ratio={ratio}>
          {!preview && (
            <span className={s.prompt}>
              <Camera size={26} strokeWidth={1.4} aria-hidden="true" />
              <span>{t.prompt}</span>
            </span>
          )}
        </Cushion>
      </label>
      <input id={id} type="file" accept="image/*" className="visually-hidden" onChange={e => { pick(e.target.files?.[0]); e.target.value = ''; }} />
      {preview && (
        <button type="button" className={s.remove} onClick={() => onChange(null)}>
          <X size={14} strokeWidth={2} aria-hidden="true" />{t.remove}
        </button>
      )}
      {error ? <span className={s.error} role="alert">{error}</span> : hint && <span className={s.hint}>{hint}</span>}
    </div>
  );
}
