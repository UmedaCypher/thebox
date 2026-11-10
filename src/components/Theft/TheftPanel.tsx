import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { FileText, ShieldAlert, Upload } from 'lucide-react';
import {
  createStolenReport, getStolenReport, theftProofUrl, updateStolenReport, updateWatch, uploadTheftProof,
} from '../../lib/api';
import type { StolenReport } from '../../lib/api';
import type { Watch } from '../../types';
import { Button, Notice, SelectField, Sheet, TextArea, TextField, Toggle } from '../ui';
import { useToast } from '../Toast/Toast';
import { formatDate, formatEuros, toISODate } from '../../lib/format';
import { defineStrings, useStrings } from '../../i18n';
import s from './Theft.module.css';

const KINDS = ['invoice', 'warranty', 'police', 'other'] as const;
type Kind = typeof KINDS[number];

const S = defineStrings({
  title: 'Déclarer un vol',
  intro: 'Une montre déclarée volée sort du Marché et ne peut plus y être proposée, ni par vous ni par quelqu’un d’autre avec le même numéro de série. Toute personne qui vérifie ce numéro sur Arcora est alertée.',
  open: 'Déclarer le vol de cette montre',
  serial: 'Numéro de série',
  serialHint: 'Indispensable : c’est lui qui identifie la montre. Il n’est jamais publié.',
  date: 'Date du vol',
  city: 'Ville ou lieu',
  police: 'Numéro de plainte',
  policeHint: 'Privé. Votre assureur vous le demandera.',
  description: 'Signes distinctifs',
  descriptionPh: 'Bracelet changé, rayure sur la lunette, gravure au dos…',
  public: 'Afficher dans la liste des montres volées',
  publicHint: 'Marque, modèle, ville et date seulement ; jamais le numéro de série.',
  proofsTitle: 'Votre dossier',
  proofsIntro: 'Ce qu’Arcora sait déjà de cette montre, et les justificatifs à joindre.',
  havePapers: (v: string) => `Boîte et papiers : ${v}`,
  noPapers: 'Boîte et papiers : non renseigné',
  havePurchase: (d: string, p: string, l: string) => `Achat : ${[d, p, l].filter(Boolean).join(' · ')}`,
  noPurchase: 'Achat : date, prix et lieu non renseignés',
  photos: (n: number) => (n ? `${n} photo${n > 1 ? 's' : ''} de la montre` : 'Aucune photo de la montre'),
  addProof: 'Joindre un justificatif',
  kind: 'Type de document',
  kinds: { invoice: 'Facture', warranty: 'Carte de garantie, papiers', police: 'Dépôt de plainte', other: 'Autre' } as Record<Kind, string>,
  submit: 'Déclarer le vol',
  saving: 'Enregistrement…',
  serialRequired: 'Le numéro de série est nécessaire.',
  declared: 'Vol déclaré. La montre est retirée du Marché.',
  activeTitle: 'Montre déclarée volée',
  active: (d: string, c: string | null) => `Volée le ${d}${c ? ` à ${c}` : ''}. Elle ne peut plus être vendue sur Arcora.`,
  proofs: 'Justificatifs',
  noProofs: 'Aucun justificatif joint.',
  recovered: 'Montre retrouvée',
  recoveredConfirm: 'Marquer la montre comme retrouvée ? Elle redevient normale sur Arcora.',
  recoveredDone: 'Bonne nouvelle : la montre est marquée comme retrouvée.',
  wasRecovered: (d: string) => `Déclarée volée, retrouvée le ${d}.`,
  seeList: 'Voir les montres volées',
  added: 'Justificatif ajouté.',
}, {
  title: 'Report a theft',
  intro: 'A watch reported stolen leaves the Market and can no longer be offered there, by you or by anyone else with the same serial number. Anyone who checks that number on Arcora is alerted.',
  open: 'Report this watch as stolen',
  serial: 'Serial number',
  serialHint: 'Required: it identifies the watch. It is never published.',
  date: 'Date of theft',
  city: 'City or place',
  police: 'Police report number',
  policeHint: 'Private. Your insurer will ask for it.',
  description: 'Distinguishing marks',
  descriptionPh: 'Changed strap, scratch on the bezel, engraving on the back…',
  public: 'Show in the stolen watches list',
  publicHint: 'Brand, model, city and date only; never the serial number.',
  proofsTitle: 'Your file',
  proofsIntro: 'What Arcora already knows about this watch, and the documents to attach.',
  havePapers: (v: string) => `Box and papers: ${v}`,
  noPapers: 'Box and papers: not filled in',
  havePurchase: (d: string, p: string, l: string) => `Purchase: ${[d, p, l].filter(Boolean).join(' · ')}`,
  noPurchase: 'Purchase: date, price and place not filled in',
  photos: (n: number) => (n ? `${n} photo${n > 1 ? 's' : ''} of the watch` : 'No photo of the watch'),
  addProof: 'Attach a document',
  kind: 'Document type',
  kinds: { invoice: 'Invoice', warranty: 'Warranty card, papers', police: 'Police report', other: 'Other' } as Record<Kind, string>,
  submit: 'Report the theft',
  saving: 'Saving…',
  serialRequired: 'The serial number is required.',
  declared: 'Theft reported. The watch has been removed from the Market.',
  activeTitle: 'Watch reported stolen',
  active: (d: string, c: string | null) => `Stolen on ${d}${c ? ` in ${c}` : ''}. It can no longer be sold on Arcora.`,
  proofs: 'Documents',
  noProofs: 'No document attached.',
  recovered: 'Watch recovered',
  recoveredConfirm: 'Mark the watch as recovered? It goes back to normal on Arcora.',
  recoveredDone: 'Good news: the watch is marked as recovered.',
  wasRecovered: (d: string) => `Reported stolen, recovered on ${d}.`,
  seeList: 'See stolen watches',
  added: 'Document added.',
});

/** Bloc « vol » de la fiche d'une montre : déclaration, dossier de preuves, montre retrouvée. */
export default function TheftPanel({ watch, uid, onChange }: { watch: Watch; uid: string; onChange?: () => void }) {
  const t = useStrings(S);
  const toast = useToast();
  const [report, setReport] = useState<StolenReport | null | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<Kind>('invoice');
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => { getStolenReport(uid, watch.id).then(setReport); }, [uid, watch.id]);
  if (report === undefined) return null;

  const addProof = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f || !report) return;
    try {
      const proof = await uploadTheftProof(uid, report.id, f, kind);
      const proofs = [...report.proofs, proof];
      await updateStolenReport(report.id, { proofs });
      setReport({ ...report, proofs }); toast(t.added);
    } catch (err) { setError(err instanceof Error ? err.message : String(err)); }
  };
  const openProof = async (path: string) => { const url = await theftProofUrl(path); if (url) window.open(url, '_blank', 'noopener'); };
  const recover = async () => {
    if (!report || !window.confirm(t.recoveredConfirm)) return;
    try { await updateStolenReport(report.id, { status: 'recovered' }); setReport({ ...report, status: 'recovered', recovered_at: new Date().toISOString() }); toast(t.recoveredDone); onChange?.(); }
    catch (err) { setError(err instanceof Error ? err.message : String(err)); }
  };

  if (report && report.status === 'stolen') {
    return (
      <section className={s.active} aria-label={t.activeTitle}>
        <p className={s.activeHead}><ShieldAlert size={18} aria-hidden="true" />{t.activeTitle}</p>
        <p>{t.active(formatDate(report.stolen_on), report.city)}</p>
        <div>
          <p className={s.label}>{t.proofs}</p>
          {report.proofs.length === 0 ? <p className={s.muted}>{t.noProofs}</p> : (
            <ul className={s.proofs}>
              {report.proofs.map(p => (
                <li key={p.path}><button type="button" onClick={() => openProof(p.path)}><FileText size={14} aria-hidden="true" />{t.kinds[p.kind as Kind] ?? p.kind} · {p.name}</button></li>
              ))}
            </ul>
          )}
        </div>
        {error && <Notice tone="error">{error}</Notice>}
        <div className={s.actions}>
          <SelectField label={t.kind} value={kind} onChange={e => setKind(e.target.value as Kind)} options={KINDS.map(k => ({ value: k, label: t.kinds[k] }))} />
          <Button variant="secondary" size="small" onClick={() => file.current?.click()}><Upload size={16} aria-hidden="true" />{t.addProof}</Button>
          <input ref={file} type="file" accept="image/*,application/pdf" hidden onChange={addProof} />
          <Button variant="ghost" size="small" onClick={recover}>{t.recovered}</Button>
        </div>
        <Link to="/montres-volees" className={s.link}>{t.seeList}</Link>
      </section>
    );
  }

  return (
    <section className={s.panel}>
      {report?.status === 'recovered' && report.recovered_at && <p className={s.muted}>{t.wasRecovered(formatDate(report.recovered_at))}</p>}
      <button type="button" className={s.open} onClick={() => setOpen(true)}><ShieldAlert size={16} aria-hidden="true" />{t.open}</button>
      {open && <ReportSheet watch={watch} uid={uid} onClose={() => setOpen(false)}
        onDone={r => { setReport(r); setOpen(false); toast(t.declared); onChange?.(); }} />}
    </section>
  );
}

function ReportSheet({ watch, uid, onClose, onDone }: { watch: Watch; uid: string; onClose: () => void; onDone: (r: StolenReport) => void }) {
  const t = useStrings(S);
  const [f, setF] = useState({
    serial: watch.serial_number ?? '', date: toISODate(new Date()), city: '', police: '', description: '', isPublic: true,
  });
  const [files, setFiles] = useState<{ file: File; kind: Kind }[]>([]);
  const [kind, setKind] = useState<Kind>('invoice');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const photos = (watch.photos ?? []).filter(p => p.photo_type !== 'wrist_shot').length;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (f.serial.trim().length < 3) { setError(t.serialRequired); return; }
    setBusy(true); setError(null);
    try {
      if (!watch.serial_number) await updateWatch(uid, watch.id, { serial_number: f.serial.trim() });
      let report = await createStolenReport(uid, {
        watch_id: watch.id, brand: watch.brand, model: watch.model, reference_number: watch.reference_number,
        serial_number: f.serial.trim(), stolen_on: f.date, city: f.city.trim() || null, police_report_ref: f.police.trim() || null,
        description: f.description.trim() || null, is_public: f.isPublic,
      });
      if (files.length) {
        const proofs = [];
        for (const x of files) proofs.push(await uploadTheftProof(uid, report.id, x.file, x.kind));
        await updateStolenReport(report.id, { proofs });
        report = { ...report, proofs };
      }
      onDone(report);
    } catch (err) { setError(err instanceof Error ? err.message : String(err)); setBusy(false); }
  };

  return createPortal(
    <Sheet open onClose={() => !busy && onClose()} title={t.title}>
      <form className={s.form} onSubmit={submit}>
        <p className={s.muted}>{t.intro}</p>
        <TextField label={t.serial} value={f.serial} onChange={e => setF({ ...f, serial: e.target.value })} hint={t.serialHint} autoCapitalize="characters" required />
        <TextField label={t.date} type="date" value={f.date} max={toISODate(new Date())} onChange={e => setF({ ...f, date: e.target.value })} required />
        <TextField label={t.city} optional value={f.city} onChange={e => setF({ ...f, city: e.target.value })} />
        <TextField label={t.police} optional value={f.police} onChange={e => setF({ ...f, police: e.target.value })} hint={t.policeHint} />
        <TextArea label={t.description} optional rows={2} value={f.description} placeholder={t.descriptionPh} onChange={e => setF({ ...f, description: e.target.value.slice(0, 1000) })} />
        <Toggle label={t.public} description={t.publicHint} checked={f.isPublic} onChange={v => setF({ ...f, isPublic: v })} />

        <div className={s.file}>
          <p className={s.label}>{t.proofsTitle}</p>
          <p className={s.muted}>{t.proofsIntro}</p>
          <ul className={s.facts}>
            <li data-ok={Boolean(watch.box_papers_status)}>{watch.box_papers_status ? t.havePapers(watch.box_papers_status) : t.noPapers}</li>
            <li data-ok={Boolean(watch.purchase_date || watch.purchase_price)}>
              {watch.purchase_date || watch.purchase_price || watch.purchase_location
                ? t.havePurchase(watch.purchase_date ? formatDate(watch.purchase_date) : '', watch.purchase_price ? formatEuros(Number(watch.purchase_price)) : '', watch.purchase_location ?? '')
                : t.noPurchase}
            </li>
            <li data-ok={photos > 0}>{t.photos(photos)}</li>
            {files.map((x, i) => <li key={i} data-ok="true">{t.kinds[x.kind]} · {x.file.name}</li>)}
          </ul>
          <div className={s.actions}>
            <SelectField label={t.kind} value={kind} onChange={e => setKind(e.target.value as Kind)} options={KINDS.map(k => ({ value: k, label: t.kinds[k] }))} />
            <Button variant="secondary" size="small" onClick={() => input.current?.click()}><Upload size={16} aria-hidden="true" />{t.addProof}</Button>
            <input ref={input} type="file" accept="image/*,application/pdf" hidden
              onChange={e => { const x = e.target.files?.[0]; e.target.value = ''; if (x) setFiles([...files, { file: x, kind }]); }} />
          </div>
        </div>

        {error && <Notice tone="error">{error}</Notice>}
        <Button type="submit" block disabled={busy}>{busy ? t.saving : t.submit}</Button>
      </form>
    </Sheet>,
    document.body,
  );
}
