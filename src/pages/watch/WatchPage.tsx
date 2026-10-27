import { useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Check, Link2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLoad } from '../../hooks/useLoad';
import {
  addMaintenance, addWear, deleteMaintenance, deleteWatch, getWatch, listMaintenance, listValueHistory,
  listWearLogs, mainPhoto, photoUrl, removeWear, setPassportPublic, thumbSrc,
} from '../../lib/api';
import { formatDate, formatEuros, formatMm, plural, todayISO } from '../../lib/format';
import { defineStrings, getLocale, useStrings } from '../../i18n';
import { COMMON } from '../../i18n/common';
import { listingPrice, statusKind } from '../../lib/listing';
import type { MaintenanceEntry, MaintenanceKind, Watch } from '../../types';
import {
  Button, Cushion, IconButton, Notice, PageHeader, PremiumTag, Segmented, SelectField, Sheet, Stat, TextArea, TextField, Toggle,
} from '../../components/ui';
import WearStrip from '../../components/WearStrip/WearStrip';
import Sparkline from '../../components/Sparkline/Sparkline';
import PremiumSheet from '../../components/PremiumSheet/PremiumSheet';
import s from './WatchPage.module.css';
import { SkeletonDetail, SkeletonList } from '../../components/Skeleton/Skeleton';
import { useToast } from '../../components/Toast/Toast';

const S = defineStrings({
  tabs: { passeport: 'Passeport', portage: 'Portage', entretien: 'Entretien', valeur: 'Valeur' },
  kinds: {
    revision: 'Révision complète',
    reglage: 'Réglage',
    etancheite: "Contrôle d'étanchéité",
    polissage: 'Polissage',
    reparation: 'Réparation',
    pile: 'Changement de pile',
    bracelet: 'Bracelet',
    autre: 'Autre',
  },
  /** Valeurs de mouvement enregistrées en base (en français) et leur libellé. */
  movements: {
    Automatique: 'Automatique', Manuel: 'Manuel', Quartz: 'Quartz', Solaire: 'Solaire',
    'Spring Drive': 'Spring Drive', 'Mécanique connecté': 'Mécanique connecté',
  },
  notFound: "Cette montre n'existe pas ou n'est pas dans votre collection.",
  confirmDelete: (name: string) => `Supprimer ${name} et toutes ses photos ? Cette action est définitive.`,
  photos: 'Photos',
  photoN: (i: number) => `Photo ${i}`,
  collection: 'Collection',
  wornToday: "Portée aujourd'hui",
  wearToday: 'Je la porte aujourd’hui',
  edit: 'Modifier',
  forSale: 'En vente',
  seeListing: "Voir l'annonce",
  sellOrTrade: "Mettre en vente ou proposer à l'échange",
  glanceDays: (n: number) => (n > 1 ? `${n} jours au poignet` : `${n} jour au poignet`),
  glanceNever: 'Jamais portée',
  glanceLast: (d: string) => `dernier port ${d}`,
  glanceToday: "portée aujourd'hui",
  sections: 'Sections',
  premiumCost: 'Le coût par port fait partie des statistiques Premium.',
  premiumService: "Le carnet d'entretien et ses rappels font partie de Premium.",
  premiumValue: "L'historique de valeur fait partie de Premium.",
  deleteWatch: 'Supprimer cette montre',
  specs: {
    reference: 'Référence', year: 'Année', movement: 'Mouvement', diameter: 'Diamètre', lugToLug: 'Corne à corne',
    lugWidth: 'Entrecorne', case: 'Boîtier', dial: 'Cadran', bracelet: 'Bracelet', condition: 'État', boxPapers: 'Boîte et papiers',
    lastService: 'Dernière révision',
  },
  story: 'Histoire',
  sharePassport: 'Partager le passeport',
  sharePassportHint: "Toute personne ayant le lien voit les photos et les caractéristiques. Jamais les prix, la valeur ni le lieu d'achat.",
  linkCopied: 'Lien copié',
  shareLink: 'Partager le lien',
  seePublic: 'Voir la page publique',
  daysWorn: (n: number) => (n > 1 ? 'jours portée' : 'jour portée'),
  lastWear: 'dernier port',
  costPerWear: 'coût par port',
  costPerWearLocked: 'Coût par port',
  logHintBefore: "Notez vos ports depuis l'onglet ",
  logHintTab: 'Portage',
  logHintAfter: ' ou avec le bouton ci-dessus.',
  nextDue: 'Prochaine échéance : ',
  noneDue: 'Aucune échéance prévue.',
  noService: "Aucun entretien noté pour l'instant.",
  add: 'Ajouter',
  deleteService: 'Supprimer cet entretien',
  confirmDeleteService: 'Supprimer cet entretien ?',
  saveFailed: 'Enregistrement impossible.',
  newService: 'Nouvel entretien',
  intervention: 'Intervention',
  date: 'Date',
  provider: 'Horloger ou atelier',
  cost: 'Coût',
  nextDueLabel: 'Prochaine échéance',
  nextDueHint: 'Elle apparaîtra en rappel dans votre collection.',
  notes: 'Notes',
  saveService: "Enregistrer l'entretien",
  purchasePrice: "prix d'achat",
  estimatedValue: 'valeur estimée',
  sincePurchase: "depuis l'achat",
  valueChart: 'Évolution de la valeur estimée',
  historyEmpty: "L'historique se construit à chaque fois que vous mettez à jour la valeur estimée.",
  valueHistory: 'Historique de valeur',
  valuesPrivate: 'Valeurs déclarées par vous, visibles par vous seul.',
  update: 'Mettre à jour',
  estimates: (n: number) => ` (${plural(n, 'estimation', 'estimations')})`,
}, {
  tabs: { passeport: 'Passport', portage: 'Wear', entretien: 'Service', valeur: 'Value' },
  kinds: {
    revision: 'Full service',
    reglage: 'Regulation',
    etancheite: 'Water resistance test',
    polissage: 'Polishing',
    reparation: 'Repair',
    pile: 'Battery change',
    bracelet: 'Strap or bracelet',
    autre: 'Other',
  },
  movements: {
    Automatique: 'Automatic', Manuel: 'Manual wind', Quartz: 'Quartz', Solaire: 'Solar',
    'Spring Drive': 'Spring Drive', 'Mécanique connecté': 'Hybrid smartwatch',
  },
  notFound: "This watch doesn't exist or isn't in your collection.",
  confirmDelete: name => `Delete ${name} and all its photos? This cannot be undone.`,
  photos: 'Photos',
  photoN: i => `Photo ${i}`,
  collection: 'Collection',
  wornToday: 'Worn today',
  wearToday: 'Wearing it today',
  edit: 'Edit',
  forSale: 'For sale',
  seeListing: 'View listing',
  glanceDays: n => (n === 1 ? '1 day on the wrist' : `${n} days on the wrist`),
  glanceNever: 'Never worn',
  glanceLast: d => `last worn ${d}`,
  glanceToday: 'worn today',
  sellOrTrade: 'Sell it or offer it for trade',
  sections: 'Sections',
  premiumCost: 'Cost per wear is part of the Premium stats.',
  premiumService: 'The service log and its reminders are part of Premium.',
  premiumValue: 'Value history is part of Premium.',
  deleteWatch: 'Delete this watch',
  specs: {
    reference: 'Reference', year: 'Year', movement: 'Movement', diameter: 'Diameter', lugToLug: 'Lug to lug',
    lugWidth: 'Lug width', case: 'Case', dial: 'Dial', bracelet: 'Strap', condition: 'Condition', boxPapers: 'Box & papers',
    lastService: 'Last service',
  },
  story: 'Story',
  sharePassport: 'Share the passport',
  sharePassportHint: 'Anyone with the link can see the photos and specs. Never the prices, the value or where you bought it.',
  linkCopied: 'Link copied',
  shareLink: 'Share the link',
  seePublic: 'View the public page',
  daysWorn: n => (n === 1 ? 'day worn' : 'days worn'),
  lastWear: 'last worn',
  costPerWear: 'cost per wear',
  costPerWearLocked: 'Cost per wear',
  logHintBefore: 'Log your wears from the ',
  logHintTab: 'Wear',
  logHintAfter: ' tab or with the button above.',
  nextDue: 'Next service due: ',
  noneDue: 'No service scheduled.',
  noService: 'No service logged yet.',
  add: 'Add',
  deleteService: 'Delete this service entry',
  confirmDeleteService: 'Delete this service entry?',
  saveFailed: "Couldn't save.",
  newService: 'New service entry',
  intervention: 'Work done',
  date: 'Date',
  provider: 'Watchmaker or workshop',
  cost: 'Cost',
  nextDueLabel: 'Next service due',
  nextDueHint: 'It will show up as a reminder in your collection.',
  notes: 'Notes',
  saveService: 'Save service entry',
  purchasePrice: 'purchase price',
  estimatedValue: 'estimated value',
  sincePurchase: 'since purchase',
  valueChart: 'Estimated value over time',
  historyEmpty: 'The history builds up each time you update the estimated value.',
  valueHistory: 'Value history',
  valuesPrivate: 'Values you entered, visible only to you.',
  update: 'Update',
  estimates: n => ` (${plural(n, 'estimate', 'estimates')})`,
});
type T = typeof S.fr;

type Tab = 'passeport' | 'portage' | 'entretien' | 'valeur';
const TAB_VALUES: Tab[] = ['passeport', 'portage', 'entretien', 'valeur'];
const KIND_VALUES: MaintenanceKind[] = ['revision', 'reglage', 'etancheite', 'polissage', 'reparation', 'pile', 'bracelet', 'autre'];
const kindLabel = (t: T, k: MaintenanceKind) => t.kinds[k] ?? k;
const movementLabel = (t: T, v: string | null) => (v ? t.movements[v as keyof T['movements']] ?? v : v);
const formatPercent = (n: number) =>
  new Intl.NumberFormat(getLocale(), { style: 'percent', maximumFractionDigits: 0, signDisplay: 'exceptZero' }).format(n / 100);

export default function WatchPage() {
  const t = useStrings(S);
  const c = useStrings(COMMON);
  const toast = useToast();
  const { watchId } = useParams();
  const { user, isPremium } = useAuth();
  const uid = user!.id;
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = (TAB_VALUES.some(v => v === params.get('onglet')) ? params.get('onglet') : 'passeport') as Tab;
  const setTab = (v: Tab) => setParams(v === 'passeport' ? {} : { onglet: v }, { replace: true });

  const { data: watch, setData: setWatch, loading, error } = useLoad(() => getWatch(uid, watchId!), [uid, watchId]);
  const wears = useLoad(() => listWearLogs(uid).then(l => l.filter(w => w.watch_id === watchId)), [uid, watchId]);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [premiumReason, setPremiumReason] = useState<string | null>(null);

  const wornDays = useMemo(() => new Set((wears.data ?? []).map(w => w.worn_on)), [wears.data]);
  const wornToday = wornDays.has(todayISO());

  if (loading) return <div className="page"><SkeletonDetail /></div>;
  if (error || !watch) return <div className="page"><Notice tone="error">{error ?? t.notFound}</Notice></div>;

  const photos = [...(watch.photos ?? [])].sort((a, b) => Number(b.is_main_photo) - Number(a.is_main_photo));
  const current = photos[photoIndex] ?? mainPhoto(photos);

  const toggleToday = async () => {
    const day = todayISO();
    if (wornToday) await removeWear(uid, watch.id, day);
    else await addWear(uid, watch.id, day);
    toast(wornToday ? c.toast.unworn : c.toast.wornToday);
    wears.reload();
  };

  const onDelete = async () => {
    if (!window.confirm(t.confirmDelete(`${watch.brand} ${watch.model}`))) return;
    await deleteWatch(uid, watch);
    toast(c.toast.watchDeleted);
    navigate('/collection', { replace: true });
  };

  return (
    <div className="page">
      <div className={s.layout}>
        <div className={s.media}>
          <Cushion src={photoUrl(current?.storage_path)} alt={`${watch.brand} ${watch.model}`} ratio="portrait" className={s.hero} />
          {photos.length > 1 && (
            <div className={s.thumbs} role="tablist" aria-label={t.photos}>
              {photos.map((p, i) => (
                <button key={p.id} role="tab" aria-selected={p === current} aria-label={t.photoN(i + 1)} onClick={() => setPhotoIndex(i)} className={s.thumb}>
                  <Cushion src={thumbSrc(p.storage_path).src} fallbackSrc={thumbSrc(p.storage_path).fallback} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={s.body}>
          <PageHeader
            back={{ to: '/collection', label: t.collection }}
            title={watch.model}
            subtitle={[watch.brand, watch.reference_number, watch.year_of_production].filter(Boolean).join(', ')}
          />

          {/* En un coup d'œil : combien de fois portée, et quand pour la dernière fois */}
          <p className={s.glance}>
            {wornDays.size === 0 ? t.glanceNever : (
              <>
                <strong className="num">{t.glanceDays(wornDays.size)}</strong>
                <span aria-hidden="true">·</span>
                <span>{wornToday ? t.glanceToday : t.glanceLast(formatDate([...wornDays].sort().pop()!, { day: 'numeric', month: 'long' }))}</span>
              </>
            )}
          </p>

          <div className={s.quick}>
            <Button variant={wornToday ? 'secondary' : 'primary'} onClick={toggleToday}>
              {wornToday ? <><Check size={18} strokeWidth={2} aria-hidden="true" />{t.wornToday}</> : t.wearToday}
            </Button>
            <Link to={`/montre/${watch.id}/modifier`} className={s.edit}><Pencil size={16} strokeWidth={1.6} aria-hidden="true" />{t.edit}</Link>
          </div>

          {statusKind(watch.current_status) ? (
            <div className={s.listingBanner}>
              <span>
                <strong>{statusKind(watch.current_status) === 'sale' ? t.forSale : c.listing.forTrade}</strong>
                <span className="num">{listingPrice(statusKind(watch.current_status), watch.sale_price)}</span>
              </span>
              <span className={s.listingLinks}>
                <Link to={`/passeport/${watch.id}`}>{t.seeListing}</Link>
                <Link to={`/montre/${watch.id}/modifier`}>{t.edit}</Link>
              </span>
            </div>
          ) : (
            <Link to={`/montre/${watch.id}/modifier`} className={s.sellLink}>{t.sellOrTrade}</Link>
          )}

          <Segmented label={t.sections} value={tab} onChange={setTab} options={TAB_VALUES.map(v => ({ value: v, label: t.tabs[v] }))} />

          <div className={s.panel}>
            {tab === 'passeport' && <PassportTab watch={watch} uid={uid} onUpdate={setWatch} />}
            {tab === 'portage' && (
              <WearTab watch={watch} days={wornDays} isPremium={isPremium} onPremium={() => setPremiumReason(t.premiumCost)} />
            )}
            {tab === 'entretien' && (
              <MaintenanceTab watch={watch} uid={uid} isPremium={isPremium} onPremium={() => setPremiumReason(t.premiumService)} />
            )}
            {tab === 'valeur' && (
              <ValueTab watch={watch} uid={uid} isPremium={isPremium} onPremium={() => setPremiumReason(t.premiumValue)} />
            )}
          </div>

          <hr className="seam" />
          <Button variant="ghost" onClick={onDelete} className={s.delete}><Trash2 size={16} strokeWidth={1.6} aria-hidden="true" />{t.deleteWatch}</Button>
        </div>
      </div>

      <PremiumSheet open={Boolean(premiumReason)} reason={premiumReason ?? undefined} onClose={() => setPremiumReason(null)} />
    </div>
  );
}

/* ---------- Passeport ---------- */

function Specs({ rows }: { rows: [string, ReactNode][] }) {
  const shown = rows.filter(([, v]) => v !== null && v !== undefined && v !== '');
  if (!shown.length) return null;
  return (
    <dl className={s.specs}>
      {shown.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}
    </dl>
  );
}

function passportRows(t: T, w: Pick<Watch, 'movement' | 'case_diameter_mm' | 'lug_to_lug_mm' | 'lug_width_mm' | 'case_material' | 'dial_color' | 'bracelet_material' | 'bracelet_type' | 'condition' | 'box_papers_status' | 'reference_number' | 'year_of_production'>): [string, ReactNode][] {
  return [
    [t.specs.reference, w.reference_number],
    [t.specs.year, w.year_of_production],
    [t.specs.movement, movementLabel(t, w.movement)],
    [t.specs.diameter, formatMm(w.case_diameter_mm)],
    [t.specs.lugToLug, formatMm(w.lug_to_lug_mm)],
    [t.specs.lugWidth, formatMm(w.lug_width_mm)],
    [t.specs.case, w.case_material],
    [t.specs.dial, w.dial_color],
    [t.specs.bracelet, [w.bracelet_material, w.bracelet_type].filter(Boolean).join(', ')],
    [t.specs.condition, w.condition],
    [t.specs.boxPapers, w.box_papers_status],
  ];
}

function PassportTab({ watch, uid, onUpdate }: { watch: Watch; uid: string; onUpdate: (w: Watch) => void }) {
  const toast = useToast();
  const tc = useStrings(COMMON);
  const t = useStrings(S);
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/passeport/${watch.id}`;

  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: `${watch.brand} ${watch.model}`, url }); return; } catch { /* annulé */ }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast(tc.toast.linkCopied);
    setTimeout(() => setCopied(false), 2000);
  };

  const togglePublic = async (v: boolean) => {
    onUpdate({ ...watch, passport_public: v });
    try { await setPassportPublic(uid, watch.id, v); } catch { onUpdate({ ...watch, passport_public: !v }); }
  };

  return (
    <div className={s.stack}>
      <Specs rows={[...passportRows(t, watch), [t.specs.lastService, watch.last_service_date ? formatDate(watch.last_service_date) : null]]} />
      {watch.notes_history && (
        <section className={s.story}>
          <h3>{t.story}</h3>
          <p>{watch.notes_history}</p>
        </section>
      )}
      <section className={s.shareBox}>
        <Toggle
          label={t.sharePassport}
          description={t.sharePassportHint}
          checked={Boolean(watch.passport_public)}
          onChange={togglePublic}
        />
        {watch.passport_public && (
          <div className={s.shareRow}>
            <Button variant="secondary" size="small" onClick={share}>
              {copied ? <><Check size={16} aria-hidden="true" />{t.linkCopied}</> : <><Link2 size={16} aria-hidden="true" />{t.shareLink}</>}
            </Button>
            <Link to={`/passeport/${watch.id}`} className={s.subtle}>{t.seePublic}</Link>
          </div>
        )}
      </section>
    </div>
  );
}

/* ---------- Portage ---------- */

function WearTab({ watch, days, isPremium, onPremium }: { watch: Watch; days: Set<string>; isPremium: boolean; onPremium: () => void }) {
  const t = useStrings(S);
  const sorted = [...days].sort();
  const last = sorted[sorted.length - 1];
  const costPerWear = watch.purchase_price && days.size ? Number(watch.purchase_price) / days.size : null;
  return (
    <div className={s.stack}>
      <div className={s.statsRow}>
        <Stat value={<span className="num">{days.size}</span>} label={t.daysWorn(days.size)} />
        <Stat value={last ? formatDate(last, { day: 'numeric', month: 'short' }) : '—'} label={t.lastWear} />
        {isPremium
          ? <Stat value={<span className="num">{costPerWear ? formatEuros(costPerWear) : '—'}</span>} label={t.costPerWear} />
          : <button className={s.lockedStat} onClick={onPremium}><span className={s.lockedValue}>{t.costPerWearLocked}</span><PremiumTag /></button>}
      </div>
      <WearStrip days={days} />
      <p className={s.subtle}>{t.logHintBefore}<Link to="/portage">{t.logHintTab}</Link>{t.logHintAfter}</p>
    </div>
  );
}

/* ---------- Entretien ---------- */

function MaintenanceTab({ watch, uid, isPremium, onPremium }: { watch: Watch; uid: string; isPremium: boolean; onPremium: () => void }) {
  const toast = useToast();
  const tc = useStrings(COMMON);
  const t = useStrings(S);
  const list = useLoad(() => listMaintenance(uid, watch.id), [uid, watch.id]);
  const [open, setOpen] = useState(false);

  const entries = list.data ?? [];
  const next = entries.map(e => e.next_due_on).filter(Boolean).sort()[0] as string | undefined;

  return (
    <div className={s.stack}>
      <div className={s.rowBetween}>
        <p className={s.subtle}>
          {next ? <>{t.nextDue}<strong>{formatDate(next)}</strong></> : entries.length ? t.noneDue : t.noService}
        </p>
        <Button size="small" variant="secondary" onClick={() => (isPremium ? setOpen(true) : onPremium())}>
          <Plus size={16} aria-hidden="true" />{t.add}{!isPremium && <PremiumTag />}
        </Button>
      </div>

      {list.loading ? <SkeletonList rows={2} thumb={0} /> : entries.length > 0 && (
        <ol className={`${s.timeline} reveal`}>
          {entries.map(e => (
            <li key={e.id}>
              <div className={s.timelineHead}>
                <strong>{kindLabel(t, e.kind)}</strong>
                <span className="num">{formatDate(e.performed_on)}</span>
              </div>
              <div className={s.subtle}>
                {[e.provider, e.cost !== null ? formatEuros(Number(e.cost)) : null].filter(Boolean).join(', ')}
              </div>
              {e.notes && <p>{e.notes}</p>}
              <IconButton label={t.deleteService} className={s.timelineDelete}
                onClick={async () => { if (window.confirm(t.confirmDeleteService)) { await deleteMaintenance(uid, e.id); list.reload(); } }}>
                <Trash2 size={16} strokeWidth={1.6} />
              </IconButton>
            </li>
          ))}
        </ol>
      )}

      <MaintenanceSheet open={open} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); list.reload(); toast(tc.toast.serviceAdded); }} uid={uid} watchId={watch.id} />
    </div>
  );
}

function MaintenanceSheet({ open, onClose, onSaved, uid, watchId }: { open: boolean; onClose: () => void; onSaved: () => void; uid: string; watchId: string }) {
  const t = useStrings(S);
  const c = useStrings(COMMON);
  const [f, setF] = useState({ performed_on: todayISO(), kind: 'revision' as MaintenanceKind, provider: '', cost: '', next_due_on: '', notes: '' });
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true); setErr(null);
    try {
      const entry: Omit<MaintenanceEntry, 'id'> = {
        watch_id: watchId, performed_on: f.performed_on, kind: f.kind, provider: f.provider.trim() || null,
        cost: f.cost ? Number(f.cost.replace(',', '.')) : null, next_due_on: f.next_due_on || null, notes: f.notes.trim() || null,
      };
      await addMaintenance(uid, entry);
      onSaved();
    } catch (x) {
      setErr(x instanceof Error ? x.message : t.saveFailed);
    } finally { setSaving(false); }
  };

  return (
    <Sheet open={open} onClose={onClose} title={t.newService}>
      <form onSubmit={submit} className={s.stack}>
        {err && <Notice tone="error">{err}</Notice>}
        <SelectField label={t.intervention} options={KIND_VALUES.map(k => ({ value: k, label: t.kinds[k] }))} placeholder={c.choose} value={f.kind} onChange={e => setF({ ...f, kind: e.target.value as MaintenanceKind })} required />
        <TextField label={t.date} type="date" value={f.performed_on} onChange={e => setF({ ...f, performed_on: e.target.value })} required />
        <TextField label={t.provider} optional value={f.provider} onChange={e => setF({ ...f, provider: e.target.value })} />
        <TextField label={t.cost} optional inputMode="decimal" suffix="€" value={f.cost} onChange={e => setF({ ...f, cost: e.target.value })} />
        <TextField label={t.nextDueLabel} optional type="date" value={f.next_due_on} onChange={e => setF({ ...f, next_due_on: e.target.value })} hint={t.nextDueHint} />
        <TextArea label={t.notes} optional rows={3} value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} />
        <Button type="submit" block disabled={saving}>{saving ? c.saving : t.saveService}</Button>
      </form>
    </Sheet>
  );
}

/* ---------- Valeur ---------- */

function ValueTab({ watch, uid, isPremium, onPremium }: { watch: Watch; uid: string; isPremium: boolean; onPremium: () => void }) {
  const t = useStrings(S);
  const history = useLoad(() => listValueHistory(uid, watch.id), [uid, watch.id], isPremium);
  const bought = watch.purchase_price !== null ? Number(watch.purchase_price) : null;
  const now = watch.current_estimated_value !== null ? Number(watch.current_estimated_value) : null;
  const delta = bought && now !== null ? ((now - bought) / bought) * 100 : null;

  const points = (history.data ?? []).map(p => ({ t: new Date(p.recorded_at).getTime(), v: p.value }));
  if (points.length && bought && watch.purchase_date) points.unshift({ t: new Date(watch.purchase_date).getTime(), v: bought });

  return (
    <div className={s.stack}>
      <div className={s.statsRow}>
        <Stat value={<span className="num">{formatEuros(bought)}</span>} label={t.purchasePrice} />
        <Stat value={<span className="num">{formatEuros(now)}</span>} label={t.estimatedValue} />
        {delta !== null && <Stat value={<span className="num">{formatPercent(delta)}</span>} label={t.sincePurchase} />}
      </div>
      {isPremium ? (
        points.length >= 2
          ? <Sparkline points={points} label={t.valueChart} />
          : <p className={s.subtle}>{t.historyEmpty}</p>
      ) : (
        <button className={s.lockedStat} onClick={onPremium}><span className={s.lockedValue}>{t.valueHistory}</span><PremiumTag /></button>
      )}
      <p className={s.subtle}>
        {t.valuesPrivate} <Link to={`/montre/${watch.id}/modifier`}>{t.update}</Link>
        {history.data && history.data.length > 1 && t.estimates(history.data.length)}
      </p>
    </div>
  );
}
