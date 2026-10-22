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
import type { MaintenanceEntry, MaintenanceKind, Watch } from '../../types';
import {
  Button, Cushion, IconButton, Loading, Notice, PageHeader, PremiumTag, Segmented, SelectField, Sheet, Stat, TextArea, TextField, Toggle,
} from '../../components/ui';
import WearStrip from '../../components/WearStrip/WearStrip';
import Sparkline from '../../components/Sparkline/Sparkline';
import PremiumSheet from '../../components/PremiumSheet/PremiumSheet';
import s from './WatchPage.module.css';

type Tab = 'passeport' | 'portage' | 'entretien' | 'valeur';
const TABS: { value: Tab; label: string }[] = [
  { value: 'passeport', label: 'Passeport' },
  { value: 'portage', label: 'Portage' },
  { value: 'entretien', label: 'Entretien' },
  { value: 'valeur', label: 'Valeur' },
];

const MAINTENANCE_KINDS: { value: MaintenanceKind; label: string }[] = [
  { value: 'revision', label: 'Révision complète' },
  { value: 'reglage', label: 'Réglage' },
  { value: 'etancheite', label: "Contrôle d'étanchéité" },
  { value: 'polissage', label: 'Polissage' },
  { value: 'reparation', label: 'Réparation' },
  { value: 'pile', label: 'Changement de pile' },
  { value: 'bracelet', label: 'Bracelet' },
  { value: 'autre', label: 'Autre' },
];
const kindLabel = (k: MaintenanceKind) => MAINTENANCE_KINDS.find(m => m.value === k)?.label ?? k;

export default function WatchPage() {
  const { watchId } = useParams();
  const { user, isPremium } = useAuth();
  const uid = user!.id;
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = (TABS.some(t => t.value === params.get('onglet')) ? params.get('onglet') : 'passeport') as Tab;
  const setTab = (t: Tab) => setParams(t === 'passeport' ? {} : { onglet: t }, { replace: true });

  const { data: watch, setData: setWatch, loading, error } = useLoad(() => getWatch(uid, watchId!), [uid, watchId]);
  const wears = useLoad(() => listWearLogs(uid).then(l => l.filter(w => w.watch_id === watchId)), [uid, watchId]);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [premiumReason, setPremiumReason] = useState<string | null>(null);

  const wornDays = useMemo(() => new Set((wears.data ?? []).map(w => w.worn_on)), [wears.data]);
  const wornToday = wornDays.has(todayISO());

  if (loading) return <div className="page"><Loading /></div>;
  if (error || !watch) return <div className="page"><Notice tone="error">{error ?? "Cette montre n'existe pas ou n'est pas dans votre collection."}</Notice></div>;

  const photos = [...(watch.photos ?? [])].sort((a, b) => Number(b.is_main_photo) - Number(a.is_main_photo));
  const current = photos[photoIndex] ?? mainPhoto(photos);

  const toggleToday = async () => {
    const day = todayISO();
    if (wornToday) await removeWear(uid, watch.id, day);
    else await addWear(uid, watch.id, day);
    wears.reload();
  };

  const onDelete = async () => {
    if (!window.confirm(`Supprimer ${watch.brand} ${watch.model} et toutes ses photos ? Cette action est définitive.`)) return;
    await deleteWatch(uid, watch);
    navigate('/collection', { replace: true });
  };

  return (
    <div className="page">
      <div className={s.layout}>
        <div className={s.media}>
          <Cushion src={photoUrl(current?.storage_path)} alt={`${watch.brand} ${watch.model}`} ratio="portrait" className={s.hero} />
          {photos.length > 1 && (
            <div className={s.thumbs} role="tablist" aria-label="Photos">
              {photos.map((p, i) => (
                <button key={p.id} role="tab" aria-selected={p === current} aria-label={`Photo ${i + 1}`} onClick={() => setPhotoIndex(i)} className={s.thumb}>
                  <Cushion src={thumbSrc(p.storage_path).src} fallbackSrc={thumbSrc(p.storage_path).fallback} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={s.body}>
          <PageHeader
            back={{ to: '/collection', label: 'Collection' }}
            title={watch.model}
            subtitle={[watch.brand, watch.reference_number, watch.year_of_production].filter(Boolean).join(', ')}
          />

          <div className={s.quick}>
            <Button variant={wornToday ? 'secondary' : 'primary'} onClick={toggleToday}>
              {wornToday ? <><Check size={18} strokeWidth={2} aria-hidden="true" />Portée aujourd'hui</> : 'Je la porte aujourd’hui'}
            </Button>
            <Link to={`/montre/${watch.id}/modifier`} className={s.edit}><Pencil size={16} strokeWidth={1.6} aria-hidden="true" />Modifier</Link>
          </div>

          <Segmented label="Sections" value={tab} onChange={setTab} options={TABS} />

          <div className={s.panel}>
            {tab === 'passeport' && <PassportTab watch={watch} uid={uid} onUpdate={setWatch} />}
            {tab === 'portage' && (
              <WearTab watch={watch} days={wornDays} isPremium={isPremium} onPremium={() => setPremiumReason('Le coût par port fait partie des statistiques Premium.')} />
            )}
            {tab === 'entretien' && (
              <MaintenanceTab watch={watch} uid={uid} isPremium={isPremium} onPremium={() => setPremiumReason("Le carnet d'entretien et ses rappels font partie de Premium.")} />
            )}
            {tab === 'valeur' && (
              <ValueTab watch={watch} uid={uid} isPremium={isPremium} onPremium={() => setPremiumReason("L'historique de valeur fait partie de Premium.")} />
            )}
          </div>

          <hr className="seam" />
          <Button variant="ghost" onClick={onDelete} className={s.delete}><Trash2 size={16} strokeWidth={1.6} aria-hidden="true" />Supprimer cette montre</Button>
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

function passportRows(w: Pick<Watch, 'movement' | 'case_diameter_mm' | 'lug_to_lug_mm' | 'lug_width_mm' | 'case_material' | 'dial_color' | 'bracelet_material' | 'bracelet_type' | 'condition' | 'box_papers_status' | 'reference_number' | 'year_of_production'>): [string, ReactNode][] {
  return [
    ['Référence', w.reference_number],
    ['Année', w.year_of_production],
    ['Mouvement', w.movement],
    ['Diamètre', formatMm(w.case_diameter_mm)],
    ['Corne à corne', formatMm(w.lug_to_lug_mm)],
    ['Entrecorne', formatMm(w.lug_width_mm)],
    ['Boîtier', w.case_material],
    ['Cadran', w.dial_color],
    ['Bracelet', [w.bracelet_material, w.bracelet_type].filter(Boolean).join(', ')],
    ['État', w.condition],
    ['Boîte et papiers', w.box_papers_status],
  ];
}

function PassportTab({ watch, uid, onUpdate }: { watch: Watch; uid: string; onUpdate: (w: Watch) => void }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/passeport/${watch.id}`;

  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: `${watch.brand} ${watch.model}`, url }); return; } catch { /* annulé */ }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const togglePublic = async (v: boolean) => {
    onUpdate({ ...watch, passport_public: v });
    try { await setPassportPublic(uid, watch.id, v); } catch { onUpdate({ ...watch, passport_public: !v }); }
  };

  return (
    <div className={s.stack}>
      <Specs rows={[...passportRows(watch), ['Dernière révision', watch.last_service_date ? formatDate(watch.last_service_date) : null]]} />
      {watch.notes_history && (
        <section className={s.story}>
          <h3>Histoire</h3>
          <p>{watch.notes_history}</p>
        </section>
      )}
      <section className={s.shareBox}>
        <Toggle
          label="Partager le passeport"
          description="Toute personne ayant le lien voit les photos et les caractéristiques. Jamais les prix, la valeur ni le lieu d'achat."
          checked={Boolean(watch.passport_public)}
          onChange={togglePublic}
        />
        {watch.passport_public && (
          <div className={s.shareRow}>
            <Button variant="secondary" size="small" onClick={share}>
              {copied ? <><Check size={16} aria-hidden="true" />Lien copié</> : <><Link2 size={16} aria-hidden="true" />Partager le lien</>}
            </Button>
            <Link to={`/passeport/${watch.id}`} className={s.subtle}>Voir la page publique</Link>
          </div>
        )}
      </section>
    </div>
  );
}

/* ---------- Portage ---------- */

function WearTab({ watch, days, isPremium, onPremium }: { watch: Watch; days: Set<string>; isPremium: boolean; onPremium: () => void }) {
  const sorted = [...days].sort();
  const last = sorted[sorted.length - 1];
  const costPerWear = watch.purchase_price && days.size ? Number(watch.purchase_price) / days.size : null;
  return (
    <div className={s.stack}>
      <div className={s.statsRow}>
        <Stat value={<span className="num">{days.size}</span>} label={days.size > 1 ? 'jours portée' : 'jour portée'} />
        <Stat value={last ? formatDate(last, { day: 'numeric', month: 'short' }) : '—'} label="dernier port" />
        {isPremium
          ? <Stat value={<span className="num">{costPerWear ? formatEuros(costPerWear) : '—'}</span>} label="coût par port" />
          : <button className={s.lockedStat} onClick={onPremium}><span className={s.lockedValue}>Coût par port</span><PremiumTag /></button>}
      </div>
      <WearStrip days={days} />
      <p className={s.subtle}>Notez vos ports depuis l'onglet <Link to="/portage">Portage</Link> ou avec le bouton ci-dessus.</p>
    </div>
  );
}

/* ---------- Entretien ---------- */

function MaintenanceTab({ watch, uid, isPremium, onPremium }: { watch: Watch; uid: string; isPremium: boolean; onPremium: () => void }) {
  const list = useLoad(() => listMaintenance(uid, watch.id), [uid, watch.id]);
  const [open, setOpen] = useState(false);

  const entries = list.data ?? [];
  const next = entries.map(e => e.next_due_on).filter(Boolean).sort()[0] as string | undefined;

  return (
    <div className={s.stack}>
      <div className={s.rowBetween}>
        <p className={s.subtle}>
          {next ? <>Prochaine échéance : <strong>{formatDate(next)}</strong></> : entries.length ? 'Aucune échéance prévue.' : "Aucun entretien noté pour l'instant."}
        </p>
        <Button size="small" variant="secondary" onClick={() => (isPremium ? setOpen(true) : onPremium())}>
          <Plus size={16} aria-hidden="true" />Ajouter{!isPremium && <PremiumTag />}
        </Button>
      </div>

      {list.loading ? <Loading /> : entries.length > 0 && (
        <ol className={s.timeline}>
          {entries.map(e => (
            <li key={e.id}>
              <div className={s.timelineHead}>
                <strong>{kindLabel(e.kind)}</strong>
                <span className="num">{formatDate(e.performed_on)}</span>
              </div>
              <div className={s.subtle}>
                {[e.provider, e.cost !== null ? formatEuros(Number(e.cost)) : null].filter(Boolean).join(', ')}
              </div>
              {e.notes && <p>{e.notes}</p>}
              <IconButton label="Supprimer cet entretien" className={s.timelineDelete}
                onClick={async () => { if (window.confirm('Supprimer cet entretien ?')) { await deleteMaintenance(uid, e.id); list.reload(); } }}>
                <Trash2 size={16} strokeWidth={1.6} />
              </IconButton>
            </li>
          ))}
        </ol>
      )}

      <MaintenanceSheet open={open} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); list.reload(); }} uid={uid} watchId={watch.id} />
    </div>
  );
}

function MaintenanceSheet({ open, onClose, onSaved, uid, watchId }: { open: boolean; onClose: () => void; onSaved: () => void; uid: string; watchId: string }) {
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
      setErr(x instanceof Error ? x.message : 'Enregistrement impossible.');
    } finally { setSaving(false); }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Nouvel entretien">
      <form onSubmit={submit} className={s.stack}>
        {err && <Notice tone="error">{err}</Notice>}
        <SelectField label="Intervention" options={MAINTENANCE_KINDS} placeholder="Choisir…" value={f.kind} onChange={e => setF({ ...f, kind: e.target.value as MaintenanceKind })} required />
        <TextField label="Date" type="date" value={f.performed_on} onChange={e => setF({ ...f, performed_on: e.target.value })} required />
        <TextField label="Horloger ou atelier" optional value={f.provider} onChange={e => setF({ ...f, provider: e.target.value })} />
        <TextField label="Coût" optional inputMode="decimal" suffix="€" value={f.cost} onChange={e => setF({ ...f, cost: e.target.value })} />
        <TextField label="Prochaine échéance" optional type="date" value={f.next_due_on} onChange={e => setF({ ...f, next_due_on: e.target.value })} hint="Elle apparaîtra en rappel dans votre collection." />
        <TextArea label="Notes" optional rows={3} value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} />
        <Button type="submit" block disabled={saving}>{saving ? 'Enregistrement…' : "Enregistrer l'entretien"}</Button>
      </form>
    </Sheet>
  );
}

/* ---------- Valeur ---------- */

function ValueTab({ watch, uid, isPremium, onPremium }: { watch: Watch; uid: string; isPremium: boolean; onPremium: () => void }) {
  const history = useLoad(() => listValueHistory(uid, watch.id), [uid, watch.id], isPremium);
  const bought = watch.purchase_price !== null ? Number(watch.purchase_price) : null;
  const now = watch.current_estimated_value !== null ? Number(watch.current_estimated_value) : null;
  const delta = bought && now !== null ? ((now - bought) / bought) * 100 : null;

  const points = (history.data ?? []).map(p => ({ t: new Date(p.recorded_at).getTime(), v: p.value }));
  if (points.length && bought && watch.purchase_date) points.unshift({ t: new Date(watch.purchase_date).getTime(), v: bought });

  return (
    <div className={s.stack}>
      <div className={s.statsRow}>
        <Stat value={<span className="num">{formatEuros(bought)}</span>} label="prix d'achat" />
        <Stat value={<span className="num">{formatEuros(now)}</span>} label="valeur estimée" />
        {delta !== null && <Stat value={<span className="num">{delta > 0 ? '+' : ''}{delta.toFixed(0)} %</span>} label="depuis l'achat" />}
      </div>
      {isPremium ? (
        points.length >= 2
          ? <Sparkline points={points} label="Évolution de la valeur estimée" />
          : <p className={s.subtle}>L'historique se construit à chaque fois que vous mettez à jour la valeur estimée.</p>
      ) : (
        <button className={s.lockedStat} onClick={onPremium}><span className={s.lockedValue}>Historique de valeur</span><PremiumTag /></button>
      )}
      <p className={s.subtle}>
        Valeurs déclarées par vous, visibles par vous seul. <Link to={`/montre/${watch.id}/modifier`}>Mettre à jour</Link>
        {history.data && history.data.length > 1 && ` (${plural(history.data.length, 'estimation', 'estimations')})`}
      </p>
    </div>
  );
}
