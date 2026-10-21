import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Star, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLoad } from '../../hooks/useLoad';
import {
  addWatchPhoto, createWatch, deletePhoto, fetchReferenceOptions, getWatch, photoUrl, setMainPhoto, updateWatch, WatchLimitError,
} from '../../lib/api';
import type { Photo, Watch, WatchInput } from '../../types';
import { Button, Cushion, IconButton, Loading, Notice, PageHeader, SelectField, TextArea, TextField, Toggle } from '../../components/ui';
import PhotoPicker from '../../components/PhotoPicker/PhotoPicker';
import PremiumSheet from '../../components/PremiumSheet/PremiumSheet';
import { FREE_WATCH_LIMIT } from '../../lib/features';
import s from './WatchEditorPage.module.css';

type Form = Record<
  'brand' | 'model' | 'reference_number' | 'year_of_production' | 'movement' | 'case_diameter_mm' | 'lug_to_lug_mm' |
  'lug_width_mm' | 'dial_color' | 'case_material' | 'bracelet_material' | 'bracelet_type' | 'condition' |
  'box_papers_status' | 'purchase_price' | 'purchase_date' | 'purchase_location' | 'current_estimated_value' |
  'last_service_date' | 'notes_history', string>;

const EMPTY: Form = {
  brand: '', model: '', reference_number: '', year_of_production: '', movement: '', case_diameter_mm: '', lug_to_lug_mm: '',
  lug_width_mm: '', dial_color: '', case_material: '', bracelet_material: '', bracelet_type: '', condition: '',
  box_papers_status: '', purchase_price: '', purchase_date: '', purchase_location: '', current_estimated_value: '',
  last_service_date: '', notes_history: '',
};

const MOVEMENTS = ['Automatique', 'Manuel', 'Quartz', 'Solaire', 'Spring Drive', 'Mécanique connecté'];

const fromWatch = (w: Watch): Form => {
  const f = { ...EMPTY };
  (Object.keys(EMPTY) as (keyof Form)[]).forEach(k => {
    const v = w[k as keyof Watch];
    f[k] = v === null || v === undefined ? '' : String(v);
  });
  return f;
};

const num = (v: string) => {
  if (!v.trim()) return null;
  const n = Number(v.replace(',', '.').replace(/\s/g, ''));
  return Number.isFinite(n) ? n : null;
};
const txt = (v: string) => (v.trim() ? v.trim() : null);

const toInput = (f: Form): Partial<WatchInput> => ({
  brand: f.brand.trim(), model: f.model.trim(), reference_number: txt(f.reference_number),
  year_of_production: num(f.year_of_production), movement: txt(f.movement),
  case_diameter_mm: num(f.case_diameter_mm), lug_to_lug_mm: num(f.lug_to_lug_mm), lug_width_mm: num(f.lug_width_mm),
  dial_color: txt(f.dial_color), case_material: txt(f.case_material), bracelet_material: txt(f.bracelet_material),
  bracelet_type: txt(f.bracelet_type), condition: txt(f.condition), box_papers_status: txt(f.box_papers_status),
  purchase_price: num(f.purchase_price), purchase_date: txt(f.purchase_date), purchase_location: txt(f.purchase_location),
  current_estimated_value: num(f.current_estimated_value), last_service_date: txt(f.last_service_date),
  notes_history: txt(f.notes_history),
});

const STEPS = ['Photos', 'Identité', 'Détails'] as const;

export default function WatchEditorPage() {
  const { watchId } = useParams();
  const isEdit = Boolean(watchId);
  const { user, profile } = useAuth();
  const uid = user!.id;
  const navigate = useNavigate();

  const [form, setForm] = useState<Form>(EMPTY);
  const [step, setStep] = useState(0);
  const [mainFile, setMainFile] = useState<File | null>(null);
  const [wristFile, setWristFile] = useState<File | null>(null);
  const [wristInGallery, setWristInGallery] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [limitOpen, setLimitOpen] = useState(false);

  const options = useLoad(fetchReferenceOptions, []);
  const existing = useLoad(() => getWatch(uid, watchId!), [uid, watchId], isEdit);

  useEffect(() => { if (existing.data) setForm(fromWatch(existing.data)); }, [existing.data]);

  const set = (k: keyof Form) => (e: { target: { value: string } }) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setFieldErrors(fe => ({ ...fe, [k]: undefined }));
  };

  const validate = (only?: 'identity') => {
    const fe: Partial<Record<keyof Form, string>> = {};
    if (!form.brand.trim()) fe.brand = 'Indiquez la marque.';
    if (!form.model.trim()) fe.model = 'Indiquez le modèle.';
    if (!only) {
      const y = num(form.year_of_production);
      if (form.year_of_production && (y === null || y < 1700 || y > new Date().getFullYear())) fe.year_of_production = 'Année invalide.';
      for (const k of ['case_diameter_mm', 'lug_to_lug_mm', 'lug_width_mm', 'purchase_price', 'current_estimated_value'] as const) {
        if (form[k] && num(form[k]) === null) fe[k] = 'Saisissez un nombre.';
        else if (form[k] && (num(form[k]) as number) < 0) fe[k] = 'Le montant ne peut pas être négatif.';
      }
    }
    setFieldErrors(fe);
    return fe;
  };

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    const fe = validate();
    if (Object.keys(fe).length) { if (!isEdit) setStep(fe.brand || fe.model ? 1 : 2); return; }
    setSaving(true);
    setError(null);
    try {
      let id = watchId;
      if (isEdit) await updateWatch(uid, id!, toInput(form));
      else id = (await createWatch(uid, { ...toInput(form), current_status: 'in_collection' })).id;

      if (mainFile) await addWatchPhoto(uid, id!, mainFile, { type: 'watch_only', isMain: true });
      if (wristFile) await addWatchPhoto(uid, id!, wristFile, { type: 'wrist_shot', inGallery: wristInGallery, wristSizeCm: profile?.wrist_size_cm ?? null });
      navigate(`/montre/${id}`, { replace: !isEdit });
    } catch (err) {
      if (err instanceof WatchLimitError) setLimitOpen(true);
      else setError(err instanceof Error ? err.message : 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  const o = options.data;
  const brandList = useMemo(() => o?.brands ?? [], [o]);

  if (isEdit && existing.loading) return <div className="page"><Loading /></div>;
  if (isEdit && !existing.loading && !existing.data) return <div className="page"><Notice tone="error">{existing.error ?? 'Montre introuvable.'}</Notice></div>;

  const photosBlock = (
    <section className={s.section}>
      {!isEdit && <p className={s.lead}>Une belle photo de face, de préférence sur fond neutre. Vous pourrez en ajouter d'autres ensuite.</p>}
      <div className={s.photoGrid}>
        <PhotoPicker label={isEdit ? 'Nouvelle photo principale' : 'La montre'} file={mainFile} onChange={setMainFile} />
        <PhotoPicker label="Au poignet" hint="Facultatif" file={wristFile} onChange={setWristFile} />
      </div>
      {wristFile && (
        <Toggle
          label="Montrer cette photo dans la galerie"
          description={profile?.wrist_size_cm
            ? `Elle apparaîtra avec votre tour de poignet (${String(profile.wrist_size_cm).replace('.', ',')} cm), sans prix ni détails d'achat.`
            : "Ajoutez votre tour de poignet dans votre profil pour qu'elle apparaisse dans les filtres."}
          checked={wristInGallery}
          onChange={setWristInGallery}
        />
      )}
    </section>
  );

  const identityBlock = (
    <section className={s.section}>
      <div className={s.grid2}>
        <TextField label="Marque" list="brand-options" value={form.brand} onChange={set('brand')} error={fieldErrors.brand} autoComplete="off" required />
        <datalist id="brand-options">{brandList.map(b => <option key={b} value={b} />)}</datalist>
        <TextField label="Modèle" value={form.model} onChange={set('model')} error={fieldErrors.model} placeholder="Ex. Submariner Date" required />
        <TextField label="Référence" optional value={form.reference_number} onChange={set('reference_number')} placeholder="Ex. 126610LN" />
        <TextField label="Année" optional inputMode="numeric" value={form.year_of_production} onChange={set('year_of_production')} error={fieldErrors.year_of_production} placeholder="Ex. 2021" />
      </div>
    </section>
  );

  const detailsBlock = (
    <>
      <fieldset className={s.group}>
        <legend>Caractéristiques</legend>
        <div className={s.grid2}>
          <SelectField label="Mouvement" optional options={MOVEMENTS} value={form.movement} onChange={set('movement')} />
          <TextField label="Diamètre" optional inputMode="decimal" suffix="mm" value={form.case_diameter_mm} onChange={set('case_diameter_mm')} error={fieldErrors.case_diameter_mm} />
          <TextField label="Corne à corne" optional inputMode="decimal" suffix="mm" value={form.lug_to_lug_mm} onChange={set('lug_to_lug_mm')} error={fieldErrors.lug_to_lug_mm} />
          <TextField label="Entrecorne" optional inputMode="decimal" suffix="mm" value={form.lug_width_mm} onChange={set('lug_width_mm')} error={fieldErrors.lug_width_mm} />
          <SelectField label="Cadran" optional options={o?.dialColors ?? []} value={form.dial_color} onChange={set('dial_color')} />
          <SelectField label="Boîtier" optional options={o?.materials ?? []} value={form.case_material} onChange={set('case_material')} />
          <SelectField label="Bracelet" optional options={o?.materials ?? []} value={form.bracelet_material} onChange={set('bracelet_material')} />
          <TextField label="Type de bracelet" optional value={form.bracelet_type} onChange={set('bracelet_type')} placeholder="Ex. Oyster, Nato" />
        </div>
      </fieldset>

      <fieldset className={s.group}>
        <legend>État et papiers</legend>
        <div className={s.grid2}>
          <SelectField label="État" optional options={o?.conditions ?? []} value={form.condition} onChange={set('condition')} />
          <SelectField label="Boîte et papiers" optional options={o?.boxPapers ?? []} value={form.box_papers_status} onChange={set('box_papers_status')} />
          <TextField label="Dernière révision" optional type="date" value={form.last_service_date} onChange={set('last_service_date')} />
        </div>
      </fieldset>

      <fieldset className={s.group}>
        <legend>Achat et valeur</legend>
        <p className={s.groupHint}>Ces montants ne sont visibles que par vous. Ils ne figurent jamais sur votre profil public ni dans la galerie.</p>
        <div className={s.grid2}>
          <TextField label="Prix d'achat" optional inputMode="decimal" suffix="€" value={form.purchase_price} onChange={set('purchase_price')} error={fieldErrors.purchase_price} />
          <TextField label="Date d'achat" optional type="date" value={form.purchase_date} onChange={set('purchase_date')} />
          <TextField label="Lieu d'achat" optional value={form.purchase_location} onChange={set('purchase_location')} placeholder="Boutique, particulier, enchères…" />
          <TextField label="Valeur estimée" optional inputMode="decimal" suffix="€" value={form.current_estimated_value} onChange={set('current_estimated_value')} error={fieldErrors.current_estimated_value} hint="Votre estimation actuelle. Chaque mise à jour est gardée dans l'historique." />
        </div>
      </fieldset>

      <fieldset className={s.group}>
        <legend>Histoire</legend>
        <TextArea label="Notes" optional value={form.notes_history} onChange={set('notes_history')} placeholder="D'où elle vient, pourquoi vous l'aimez, ce qu'il s'est passé avec elle…" rows={5} />
      </fieldset>
    </>
  );

  /* ---------- Modification : tout sur une page ---------- */
  if (isEdit) {
    const w = existing.data!;
    return (
      <div className="page page--narrow">
        <PageHeader title="Modifier" subtitle={`${w.brand} ${w.model}`} back={{ to: `/montre/${w.id}`, label: 'Retour à la montre' }} />
        <form onSubmit={submit} className={s.form} noValidate>
          {error && <Notice tone="error">{error}</Notice>}
          <fieldset className={s.group}>
            <legend>Photos</legend>
            <ExistingPhotos userId={uid} watch={w} onChange={existing.reload} />
            {photosBlock}
          </fieldset>
          <fieldset className={s.group}><legend>Identité</legend>{identityBlock}</fieldset>
          {detailsBlock}
          <div className={s.actions}>
            <Button type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
            <Button variant="ghost" onClick={() => navigate(`/montre/${w.id}`)}>Annuler</Button>
          </div>
        </form>
      </div>
    );
  }

  /* ---------- Ajout : trois étapes ---------- */
  const next = () => {
    if (step === 1 && Object.keys(validate('identity')).length) return;
    setStep(st => Math.min(st + 1, STEPS.length - 1));
    window.scrollTo(0, 0);
  };

  return (
    <div className="page page--narrow">
      <PageHeader title="Nouvelle montre" back={{ to: '/collection', label: 'Collection' }} />
      <ol className={s.steps} aria-label="Étapes">
        {STEPS.map((label, i) => (
          <li key={label} aria-current={i === step ? 'step' : undefined} data-done={i < step}>
            <span className={s.stepNum}>{i + 1}</span>{label}
          </li>
        ))}
      </ol>

      <form onSubmit={submit} className={s.form} noValidate>
        {error && <Notice tone="error">{error}</Notice>}
        {step === 0 && photosBlock}
        {step === 1 && identityBlock}
        {step === 2 && (
          <>
            <p className={s.lead}>Tout est facultatif. Remplissez ce que vous savez, vous pourrez compléter plus tard.</p>
            {detailsBlock}
          </>
        )}

        <div className={s.actions}>
          {step < STEPS.length - 1 ? (
            <>
              <Button onClick={next}>{step === 0 && !mainFile ? 'Continuer sans photo' : 'Continuer'}</Button>
              {step === 1 && <Button variant="ghost" type="submit" disabled={saving}>{saving ? 'Ajout…' : 'Ajouter maintenant'}</Button>}
            </>
          ) : (
            <Button type="submit" disabled={saving}>{saving ? 'Ajout…' : 'Ajouter à la collection'}</Button>
          )}
          {step > 0 && <Button variant="ghost" onClick={() => setStep(st => st - 1)}>Retour</Button>}
        </div>
      </form>

      <PremiumSheet
        open={limitOpen}
        onClose={() => setLimitOpen(false)}
        reason={`Votre collection gratuite est complète (${FREE_WATCH_LIMIT} montres). Premium la rend illimitée.`}
      />
    </div>
  );
}

function ExistingPhotos({ userId, watch, onChange }: { userId: string; watch: Watch; onChange: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const photos = watch.photos ?? [];
  if (!photos.length) return null;

  const act = async (p: Photo, fn: () => Promise<void>) => {
    setBusy(p.id);
    try { await fn(); onChange(); } finally { setBusy(null); }
  };

  return (
    <ul className={s.existing}>
      {photos.map(p => (
        <li key={p.id}>
          <Cushion src={photoUrl(p.storage_path)} alt={p.photo_type === 'wrist_shot' ? 'Photo au poignet' : 'Photo de la montre'} />
          <div className={s.existingBar}>
            <IconButton
              label={p.is_main_photo ? 'Photo principale' : 'Définir comme photo principale'}
              disabled={busy === p.id || p.is_main_photo}
              onClick={() => act(p, () => setMainPhoto(userId, watch.id, p.id))}
            >
              <Star size={18} strokeWidth={1.6} fill={p.is_main_photo ? 'currentColor' : 'none'} />
            </IconButton>
            <IconButton
              label="Supprimer la photo"
              disabled={busy === p.id}
              onClick={() => { if (window.confirm('Supprimer cette photo ?')) act(p, () => deletePhoto(userId, p)); }}
            >
              <Trash2 size={18} strokeWidth={1.6} />
            </IconButton>
          </div>
        </li>
      ))}
    </ul>
  );
}
