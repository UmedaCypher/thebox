import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Star, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLoad } from '../../hooks/useLoad';
import {
  addWatchPhoto, createWatch, deletePhoto, fetchReferenceOptions, getWatch, setMainPhoto, thumbSrc, updateWatch, WatchLimitError,
} from '../../lib/api';
import type { Photo, Watch, WatchInput, WatchStatus } from '../../types';
import { Button, Cushion, IconButton, Loading, Notice, PageHeader, Segmented, SelectField, TextArea, TextField, Toggle } from '../../components/ui';
import PhotoPicker from '../../components/PhotoPicker/PhotoPicker';
import PremiumSheet from '../../components/PremiumSheet/PremiumSheet';
import { FREE_WATCH_LIMIT } from '../../lib/features';
import { formatDecimal } from '../../lib/format';
import { defineStrings, useStrings } from '../../i18n';
import { COMMON } from '../../i18n/common';
import s from './WatchEditorPage.module.css';

type Form = Record<
  'brand' | 'model' | 'reference_number' | 'year_of_production' | 'movement' | 'case_diameter_mm' | 'lug_to_lug_mm' |
  'lug_width_mm' | 'dial_color' | 'case_material' | 'bracelet_material' | 'bracelet_type' | 'condition' |
  'box_papers_status' | 'purchase_price' | 'purchase_date' | 'purchase_location' | 'current_estimated_value' |
  'last_service_date' | 'notes_history' | 'sale_price' | 'sale_city' | 'sale_note', string>;

const EMPTY: Form = {
  brand: '', model: '', reference_number: '', year_of_production: '', movement: '', case_diameter_mm: '', lug_to_lug_mm: '',
  lug_width_mm: '', dial_color: '', case_material: '', bracelet_material: '', bracelet_type: '', condition: '',
  box_papers_status: '', purchase_price: '', purchase_date: '', purchase_location: '', current_estimated_value: '',
  last_service_date: '', notes_history: '', sale_price: '', sale_city: '', sale_note: '',
};

/** Statut proposé à l'utilisateur ; les anciens statuts « pro » sont conservés tels quels. */
type ListingStatus = 'in_collection' | 'for_sale' | 'for_exchange';
const LISTING_VALUES: ListingStatus[] = ['in_collection', 'for_sale', 'for_exchange'];

/** Valeurs enregistrées en base (en français) ; seul le libellé est traduit. */
const MOVEMENTS = ['Automatique', 'Manuel', 'Quartz', 'Solaire', 'Spring Drive', 'Mécanique connecté'] as const;

const S = defineStrings({
  listing: { in_collection: 'Dans ma collection', for_sale: 'À vendre', for_exchange: 'À échanger' },
  movements: {
    Automatique: 'Automatique', Manuel: 'Manuel', Quartz: 'Quartz', Solaire: 'Solaire',
    'Spring Drive': 'Spring Drive', 'Mécanique connecté': 'Mécanique connecté',
  },
  steps: ['Photos', 'Identité', 'Détails'],
  brandRequired: 'Indiquez la marque.',
  modelRequired: 'Indiquez le modèle.',
  yearInvalid: 'Année invalide.',
  notNumber: 'Saisissez un nombre.',
  negative: 'Le montant ne peut pas être négatif.',
  usernameFirst: "Choisissez d'abord un pseudo dans votre profil : c'est lui qui s'affiche dans le Marché.",
  saveFailed: 'Enregistrement impossible.',
  notFound: 'Montre introuvable.',
  photosLead: "Une belle photo de face, de préférence sur fond neutre. Vous pourrez en ajouter d'autres ensuite.",
  newMainPhoto: 'Nouvelle photo principale',
  theWatch: 'La montre',
  onWrist: 'Au poignet',
  optionalHint: 'Facultatif',
  showInGallery: 'Montrer cette photo dans la galerie',
  galleryWithWrist: (cm: string) => `Elle apparaîtra avec votre tour de poignet (${cm} cm), sans prix ni détails d'achat.`,
  galleryNoWrist: "Ajoutez votre tour de poignet dans votre profil pour qu'elle apparaisse dans les filtres.",
  brand: 'Marque',
  model: 'Modèle',
  modelPh: 'Ex. Submariner Date',
  reference: 'Référence',
  referencePh: 'Ex. 126610LN',
  year: 'Année',
  yearPh: 'Ex. 2021',
  specs: 'Caractéristiques',
  movement: 'Mouvement',
  diameter: 'Diamètre',
  lugToLug: 'Corne à corne',
  lugWidth: 'Entrecorne',
  dial: 'Cadran',
  case: 'Boîtier',
  bracelet: 'Bracelet',
  braceletType: 'Type de bracelet',
  braceletTypePh: 'Ex. Oyster, Nato',
  conditionPapers: 'État et papiers',
  condition: 'État',
  boxPapers: 'Boîte et papiers',
  lastService: 'Dernière révision',
  purchaseValue: 'Achat et valeur',
  purchaseHint: 'Ces montants ne sont visibles que par vous. Ils ne figurent jamais sur votre profil public ni dans la galerie.',
  purchasePrice: "Prix d'achat",
  purchaseDate: "Date d'achat",
  purchaseLocation: "Lieu d'achat",
  purchaseLocationPh: 'Boutique, particulier, enchères…',
  estimatedValue: 'Valeur estimée',
  estimatedValueHint: "Votre estimation actuelle. Chaque mise à jour est gardée dans l'historique.",
  listingTitle: 'Annonce',
  listingHintBefore: 'Une montre à vendre ou à échanger apparaît dans le ',
  market: 'Marché',
  listingHintAfter: " avec ses photos et ses caractéristiques. Le prix d'achat, la valeur estimée et le lieu d'achat restent privés.",
  status: 'Statut',
  needUsernameBefore: 'Choisissez un pseudo dans votre ',
  profile: 'profil',
  needUsernameAfter: ' pour publier une annonce.',
  messagesOffBefore: 'Vous avez désactivé les messages dans votre ',
  messagesOffAfter: ' : les intéressés ne pourront pas vous écrire.',
  askingPrice: 'Prix demandé',
  askingPriceHint: "Sans prix, l'annonce affiche « Prix sur demande ».",
  city: 'Ville',
  cityPh: 'Pour une remise en main propre',
  note: 'Un mot pour les intéressés',
  noteSalePh: 'État, révision récente, accessoires fournis…',
  noteTradePh: 'Ce que vous recherchez en échange…',
  story: 'Histoire',
  notes: 'Notes',
  notesPh: "D'où elle vient, pourquoi vous l'aimez, ce qu'il s'est passé avec elle…",
  editTitle: 'Modifier',
  backToWatch: 'Retour à la montre',
  photos: 'Photos',
  identity: 'Identité',
  newWatch: 'Nouvelle montre',
  collection: 'Collection',
  stepsAria: 'Étapes',
  detailsLead: 'Tout est facultatif. Remplissez ce que vous savez, vous pourrez compléter plus tard.',
  continueNoPhoto: 'Continuer sans photo',
  continue: 'Continuer',
  adding: 'Ajout…',
  addNow: 'Ajouter maintenant',
  addToCollection: 'Ajouter à la collection',
  limitReason: (n: number) => `Votre collection gratuite est complète (${n} montres). Premium la rend illimitée.`,
  wristPhoto: 'Photo au poignet',
  watchPhoto: 'Photo de la montre',
  mainPhoto: 'Photo principale',
  setMain: 'Définir comme photo principale',
  deletePhoto: 'Supprimer la photo',
  confirmDeletePhoto: 'Supprimer cette photo ?',
}, {
  listing: { in_collection: 'In my collection', for_sale: 'For sale', for_exchange: 'For trade' },
  movements: {
    Automatique: 'Automatic', Manuel: 'Manual wind', Quartz: 'Quartz', Solaire: 'Solar',
    'Spring Drive': 'Spring Drive', 'Mécanique connecté': 'Hybrid smartwatch',
  },
  steps: ['Photos', 'Identity', 'Details'],
  brandRequired: 'Please enter the brand.',
  modelRequired: 'Please enter the model.',
  yearInvalid: 'Invalid year.',
  notNumber: 'Please enter a number.',
  negative: 'The amount cannot be negative.',
  usernameFirst: 'Choose a username in your profile first: it is what appears in the Market.',
  saveFailed: "Couldn't save.",
  notFound: 'Watch not found.',
  photosLead: 'A nice photo from the front, ideally on a plain background. You can add more later.',
  newMainPhoto: 'New main photo',
  theWatch: 'The watch',
  onWrist: 'On the wrist',
  optionalHint: 'Optional',
  showInGallery: 'Show this photo in the gallery',
  galleryWithWrist: cm => `It will appear with your wrist size (${cm} cm), with no price or purchase details.`,
  galleryNoWrist: 'Add your wrist size in your profile so it shows up in the filters.',
  brand: 'Brand',
  model: 'Model',
  modelPh: 'e.g. Submariner Date',
  reference: 'Reference',
  referencePh: 'e.g. 126610LN',
  year: 'Year',
  yearPh: 'e.g. 2021',
  specs: 'Specifications',
  movement: 'Movement',
  diameter: 'Diameter',
  lugToLug: 'Lug to lug',
  lugWidth: 'Lug width',
  dial: 'Dial',
  case: 'Case',
  bracelet: 'Strap',
  braceletType: 'Strap type',
  braceletTypePh: 'e.g. Oyster, NATO',
  conditionPapers: 'Condition & papers',
  condition: 'Condition',
  boxPapers: 'Box & papers',
  lastService: 'Last service',
  purchaseValue: 'Purchase & value',
  purchaseHint: 'Only you can see these amounts. They never appear on your public profile or in the gallery.',
  purchasePrice: 'Purchase price',
  purchaseDate: 'Purchase date',
  purchaseLocation: 'Bought from',
  purchaseLocationPh: 'Boutique, private seller, auction…',
  estimatedValue: 'Estimated value',
  estimatedValueHint: 'Your current estimate. Every update is kept in the history.',
  listingTitle: 'Listing',
  listingHintBefore: 'A watch for sale or for trade appears in the ',
  market: 'Market',
  listingHintAfter: ' with its photos and specs. The purchase price, estimated value and where you bought it stay private.',
  status: 'Status',
  needUsernameBefore: 'Choose a username in your ',
  profile: 'profile',
  needUsernameAfter: ' to publish a listing.',
  messagesOffBefore: 'You have turned off messages in your ',
  messagesOffAfter: ': interested members won’t be able to write to you.',
  askingPrice: 'Asking price',
  askingPriceHint: 'Without a price, the listing shows "Price on request".',
  city: 'City',
  cityPh: 'For a hand-to-hand exchange',
  note: 'A note for interested members',
  noteSalePh: 'Condition, recent service, accessories included…',
  noteTradePh: 'What you are looking for in exchange…',
  story: 'Story',
  notes: 'Notes',
  notesPh: 'Where it comes from, why you love it, what you have lived through together…',
  editTitle: 'Edit',
  backToWatch: 'Back to the watch',
  photos: 'Photos',
  identity: 'Identity',
  newWatch: 'New watch',
  collection: 'Collection',
  stepsAria: 'Steps',
  detailsLead: 'Everything is optional. Fill in what you know, you can complete it later.',
  continueNoPhoto: 'Continue without a photo',
  continue: 'Continue',
  adding: 'Adding…',
  addNow: 'Add now',
  addToCollection: 'Add to collection',
  limitReason: n => `Your free collection is full (${n} watches). Premium makes it unlimited.`,
  wristPhoto: 'Wrist shot',
  watchPhoto: 'Photo of the watch',
  mainPhoto: 'Main photo',
  setMain: 'Set as main photo',
  deletePhoto: 'Delete photo',
  confirmDeletePhoto: 'Delete this photo?',
});

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
  sale_price: num(f.sale_price), sale_city: txt(f.sale_city), sale_note: txt(f.sale_note),
});

const STEP_COUNT = 3;

export default function WatchEditorPage() {
  const t = useStrings(S);
  const c = useStrings(COMMON);
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
  const [status, setStatus] = useState<WatchStatus>('in_collection');

  const options = useLoad(fetchReferenceOptions, []);
  const existing = useLoad(() => getWatch(uid, watchId!), [uid, watchId], isEdit);

  useEffect(() => {
    if (existing.data) { setForm(fromWatch(existing.data)); setStatus(existing.data.current_status); }
  }, [existing.data]);
  const listed = status === 'for_sale' || status === 'for_exchange';

  const set = (k: keyof Form) => (e: { target: { value: string } }) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setFieldErrors(fe => ({ ...fe, [k]: undefined }));
  };

  const validate = (only?: 'identity') => {
    const fe: Partial<Record<keyof Form, string>> = {};
    if (!form.brand.trim()) fe.brand = t.brandRequired;
    if (!form.model.trim()) fe.model = t.modelRequired;
    if (!only) {
      const y = num(form.year_of_production);
      if (form.year_of_production && (y === null || y < 1700 || y > new Date().getFullYear())) fe.year_of_production = t.yearInvalid;
      for (const k of ['case_diameter_mm', 'lug_to_lug_mm', 'lug_width_mm', 'purchase_price', 'current_estimated_value', 'sale_price'] as const) {
        if (form[k] && num(form[k]) === null) fe[k] = t.notNumber;
        else if (form[k] && (num(form[k]) as number) < 0) fe[k] = t.negative;
      }
    }
    setFieldErrors(fe);
    return fe;
  };

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    const fe = validate();
    if (Object.keys(fe).length) { if (!isEdit) setStep(fe.brand || fe.model ? 1 : 2); return; }
    if (listed && !profile?.username) { setError(t.usernameFirst); return; }
    setSaving(true);
    setError(null);
    try {
      let id = watchId;
      const input = { ...toInput(form), current_status: status };
      if (status === 'for_exchange') input.sale_price = null;
      if (isEdit) await updateWatch(uid, id!, input);
      else id = (await createWatch(uid, input)).id;

      if (mainFile) await addWatchPhoto(uid, id!, mainFile, { type: 'watch_only', isMain: true });
      if (wristFile) await addWatchPhoto(uid, id!, wristFile, { type: 'wrist_shot', inGallery: wristInGallery, wristSizeCm: profile?.wrist_size_cm ?? null });
      navigate(`/montre/${id}`, { replace: !isEdit });
    } catch (err) {
      if (err instanceof WatchLimitError) setLimitOpen(true);
      else setError(err instanceof Error ? err.message : t.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  const o = options.data;
  const brandList = useMemo(() => o?.brands ?? [], [o]);

  if (isEdit && existing.loading) return <div className="page"><Loading /></div>;
  if (isEdit && !existing.loading && !existing.data) return <div className="page"><Notice tone="error">{existing.error ?? t.notFound}</Notice></div>;

  const photosBlock = (
    <section className={s.section}>
      {!isEdit && <p className={s.lead}>{t.photosLead}</p>}
      <div className={s.photoGrid}>
        <PhotoPicker label={isEdit ? t.newMainPhoto : t.theWatch} file={mainFile} onChange={setMainFile} />
        <PhotoPicker label={t.onWrist} hint={t.optionalHint} file={wristFile} onChange={setWristFile} />
      </div>
      {wristFile && (
        <Toggle
          label={t.showInGallery}
          description={profile?.wrist_size_cm
            ? t.galleryWithWrist(formatDecimal(profile.wrist_size_cm))
            : t.galleryNoWrist}
          checked={wristInGallery}
          onChange={setWristInGallery}
        />
      )}
    </section>
  );

  const identityBlock = (
    <section className={s.section}>
      <div className={s.grid2}>
        <TextField label={t.brand} list="brand-options" value={form.brand} onChange={set('brand')} error={fieldErrors.brand} autoComplete="off" required />
        <datalist id="brand-options">{brandList.map(b => <option key={b} value={b} />)}</datalist>
        <TextField label={t.model} value={form.model} onChange={set('model')} error={fieldErrors.model} placeholder={t.modelPh} required />
        <TextField label={t.reference} optional value={form.reference_number} onChange={set('reference_number')} placeholder={t.referencePh} />
        <TextField label={t.year} optional inputMode="numeric" value={form.year_of_production} onChange={set('year_of_production')} error={fieldErrors.year_of_production} placeholder={t.yearPh} />
      </div>
    </section>
  );

  const detailsBlock = (
    <>
      <fieldset className={s.group}>
        <legend>{t.specs}</legend>
        <div className={s.grid2}>
          <SelectField label={t.movement} optional options={MOVEMENTS.map(m => ({ value: m, label: t.movements[m] }))} value={form.movement} onChange={set('movement')} />
          <TextField label={t.diameter} optional inputMode="decimal" suffix="mm" value={form.case_diameter_mm} onChange={set('case_diameter_mm')} error={fieldErrors.case_diameter_mm} />
          <TextField label={t.lugToLug} optional inputMode="decimal" suffix="mm" value={form.lug_to_lug_mm} onChange={set('lug_to_lug_mm')} error={fieldErrors.lug_to_lug_mm} />
          <TextField label={t.lugWidth} optional inputMode="decimal" suffix="mm" value={form.lug_width_mm} onChange={set('lug_width_mm')} error={fieldErrors.lug_width_mm} />
          <SelectField label={t.dial} optional options={o?.dialColors ?? []} value={form.dial_color} onChange={set('dial_color')} />
          <SelectField label={t.case} optional options={o?.materials ?? []} value={form.case_material} onChange={set('case_material')} />
          <SelectField label={t.bracelet} optional options={o?.materials ?? []} value={form.bracelet_material} onChange={set('bracelet_material')} />
          <TextField label={t.braceletType} optional value={form.bracelet_type} onChange={set('bracelet_type')} placeholder={t.braceletTypePh} />
        </div>
      </fieldset>

      <fieldset className={s.group}>
        <legend>{t.conditionPapers}</legend>
        <div className={s.grid2}>
          <SelectField label={t.condition} optional options={o?.conditions ?? []} value={form.condition} onChange={set('condition')} />
          <SelectField label={t.boxPapers} optional options={o?.boxPapers ?? []} value={form.box_papers_status} onChange={set('box_papers_status')} />
          <TextField label={t.lastService} optional type="date" value={form.last_service_date} onChange={set('last_service_date')} />
        </div>
      </fieldset>

      <fieldset className={s.group}>
        <legend>{t.purchaseValue}</legend>
        <p className={s.groupHint}>{t.purchaseHint}</p>
        <div className={s.grid2}>
          <TextField label={t.purchasePrice} optional inputMode="decimal" suffix="€" value={form.purchase_price} onChange={set('purchase_price')} error={fieldErrors.purchase_price} />
          <TextField label={t.purchaseDate} optional type="date" value={form.purchase_date} onChange={set('purchase_date')} />
          <TextField label={t.purchaseLocation} optional value={form.purchase_location} onChange={set('purchase_location')} placeholder={t.purchaseLocationPh} />
          <TextField label={t.estimatedValue} optional inputMode="decimal" suffix="€" value={form.current_estimated_value} onChange={set('current_estimated_value')} error={fieldErrors.current_estimated_value} hint={t.estimatedValueHint} />
        </div>
      </fieldset>

      <fieldset className={s.group}>
        <legend>{t.listingTitle}</legend>
        <p className={s.groupHint}>
          {t.listingHintBefore}<Link to="/marche">{t.market}</Link>{t.listingHintAfter}
        </p>
        <Segmented label={t.status} value={(LISTING_VALUES.some(v => v === status) ? status : 'in_collection') as ListingStatus}
          onChange={v => setStatus(v)} options={LISTING_VALUES.map(v => ({ value: v, label: t.listing[v] }))} />
        {listed && (
          <>
            {!profile?.username && (
              <Notice tone="error">{t.needUsernameBefore}<Link to="/profil">{t.profile}</Link>{t.needUsernameAfter}</Notice>
            )}
            {profile && profile.allow_private_messages === false && (
              <Notice>{t.messagesOffBefore}<Link to="/profil">{t.profile}</Link>{t.messagesOffAfter}</Notice>
            )}
            <div className={s.grid2}>
              {status === 'for_sale' && (
                <TextField label={t.askingPrice} optional inputMode="decimal" suffix="€" value={form.sale_price} onChange={set('sale_price')}
                  error={fieldErrors.sale_price} hint={t.askingPriceHint} />
              )}
              <TextField label={t.city} optional value={form.sale_city} onChange={set('sale_city')} maxLength={80} placeholder={t.cityPh} />
            </div>
            <TextArea label={t.note} optional rows={3} maxLength={1000} value={form.sale_note} onChange={set('sale_note')}
              placeholder={status === 'for_sale' ? t.noteSalePh : t.noteTradePh} />
          </>
        )}
      </fieldset>

      <fieldset className={s.group}>
        <legend>{t.story}</legend>
        <TextArea label={t.notes} optional value={form.notes_history} onChange={set('notes_history')} placeholder={t.notesPh} rows={5} />
      </fieldset>
    </>
  );

  /* ---------- Modification : tout sur une page ---------- */
  if (isEdit) {
    const w = existing.data!;
    return (
      <div className="page page--narrow">
        <PageHeader title={t.editTitle} subtitle={`${w.brand} ${w.model}`} back={{ to: `/montre/${w.id}`, label: t.backToWatch }} />
        <form onSubmit={submit} className={s.form} noValidate>
          {error && <Notice tone="error">{error}</Notice>}
          <fieldset className={s.group}>
            <legend>{t.photos}</legend>
            <ExistingPhotos userId={uid} watch={w} onChange={existing.reload} />
            {photosBlock}
          </fieldset>
          <fieldset className={s.group}><legend>{t.identity}</legend>{identityBlock}</fieldset>
          {detailsBlock}
          <div className={s.actions}>
            <Button type="submit" disabled={saving}>{saving ? c.saving : c.save}</Button>
            <Button variant="ghost" onClick={() => navigate(`/montre/${w.id}`)}>{c.cancel}</Button>
          </div>
        </form>
      </div>
    );
  }

  /* ---------- Ajout : trois étapes ---------- */
  const next = () => {
    if (step === 1 && Object.keys(validate('identity')).length) return;
    setStep(st => Math.min(st + 1, STEP_COUNT - 1));
    window.scrollTo(0, 0);
  };

  return (
    <div className="page page--narrow">
      <PageHeader title={t.newWatch} back={{ to: '/collection', label: t.collection }} />
      <ol className={s.steps} aria-label={t.stepsAria}>
        {t.steps.map((label, i) => (
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
            <p className={s.lead}>{t.detailsLead}</p>
            {detailsBlock}
          </>
        )}

        <div className={s.actions}>
          {step < STEP_COUNT - 1 ? (
            <>
              <Button onClick={next}>{step === 0 && !mainFile ? t.continueNoPhoto : t.continue}</Button>
              {step === 1 && <Button variant="ghost" type="submit" disabled={saving}>{saving ? t.adding : t.addNow}</Button>}
            </>
          ) : (
            <Button type="submit" disabled={saving}>{saving ? t.adding : t.addToCollection}</Button>
          )}
          {step > 0 && <Button variant="ghost" onClick={() => setStep(st => st - 1)}>{c.back}</Button>}
        </div>
      </form>

      <PremiumSheet
        open={limitOpen}
        onClose={() => setLimitOpen(false)}
        reason={t.limitReason(FREE_WATCH_LIMIT)}
      />
    </div>
  );
}

function ExistingPhotos({ userId, watch, onChange }: { userId: string; watch: Watch; onChange: () => void }) {
  const t = useStrings(S);
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
          <Cushion src={thumbSrc(p.storage_path).src} fallbackSrc={thumbSrc(p.storage_path).fallback} alt={p.photo_type === 'wrist_shot' ? t.wristPhoto : t.watchPhoto} />
          <div className={s.existingBar}>
            <IconButton
              label={p.is_main_photo ? t.mainPhoto : t.setMain}
              disabled={busy === p.id || p.is_main_photo}
              onClick={() => act(p, () => setMainPhoto(userId, watch.id, p.id))}
            >
              <Star size={18} strokeWidth={1.6} fill={p.is_main_photo ? 'currentColor' : 'none'} />
            </IconButton>
            <IconButton
              label={t.deletePhoto}
              disabled={busy === p.id}
              onClick={() => { if (window.confirm(t.confirmDeletePhoto)) act(p, () => deletePhoto(userId, p)); }}
            >
              <Trash2 size={18} strokeWidth={1.6} />
            </IconButton>
          </div>
        </li>
      ))}
    </ul>
  );
}
