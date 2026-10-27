import { useState } from 'react';
import type { FormEvent } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLoad } from '../../hooks/useLoad';
import { addWishlistItem, deleteWishlistItem, listWishlist, updateWishlistItem } from '../../lib/api';
import { formatEuros } from '../../lib/format';
import type { WishlistItem } from '../../types';
import { Button, EmptyState, IconButton, Notice, PageHeader, Segmented, Sheet, TextArea, TextField } from '../../components/ui';
import PremiumGate from '../../components/PremiumGate/PremiumGate';
import { defineStrings, useStrings } from '../../i18n';
import { useToast } from '../../components/Toast/Toast';
import { COMMON } from '../../i18n/common';
import s from './WishlistPage.module.css';
import { SkeletonList } from '../../components/Skeleton/Skeleton';

const S = defineStrings({
  title: 'Wishlist',
  subtitle: 'Les montres que vous cherchez, et le prix auquel vous seriez prêt à sauter le pas.',
  pitch: 'Gardez la liste des montres que vous cherchez, avec la référence exacte et votre prix cible.',
  priorities: { 1: 'Graal', 2: 'Envie', 3: 'Un jour' },
  brandModelRequired: 'Indiquez la marque et le modèle.',
  addError: 'Ajout impossible.',
  add: 'Ajouter',
  emptyTitle: 'Aucune montre en vue',
  addWanted: 'Ajouter une montre recherchée',
  emptyText: 'Notez la référence exacte et votre prix cible : vous saurez quoi répondre le jour où elle passe sous vos yeux.',
  target: (price: string) => `cible ${price}`,
  markFound: 'Marquer comme trouvée',
  remove: 'Retirer de la wishlist',
  removeConfirm: 'Retirer cette montre ?',
  found: 'Trouvées',
  sheetTitle: 'Montre recherchée',
  brand: 'Marque',
  model: 'Modèle',
  reference: 'Référence',
  targetPrice: 'Prix cible',
  priority: 'Priorité',
  notes: 'Notes',
  notesPlaceholder: 'Année souhaitée, état, avec ou sans papiers…',
  addToWishlist: 'Ajouter à la wishlist',
}, {
  title: 'Wishlist',
  subtitle: 'The watches you are looking for, and the price at which you would take the plunge.',
  pitch: 'Keep a list of the watches you are looking for, with the exact reference and your target price.',
  priorities: { 1: 'Grail', 2: 'Want', 3: 'Someday' },
  brandModelRequired: 'Please enter the brand and model.',
  addError: 'We couldn’t add this watch.',
  add: 'Add',
  emptyTitle: 'No watches in sight',
  addWanted: 'Add a watch you’re looking for',
  emptyText: 'Note the exact reference and your target price. You will know what to say the day one crosses your path.',
  target: price => `target ${price}`,
  markFound: 'Mark as found',
  remove: 'Remove from wishlist',
  removeConfirm: 'Remove this watch?',
  found: 'Found',
  sheetTitle: 'Wanted watch',
  brand: 'Brand',
  model: 'Model',
  reference: 'Reference',
  targetPrice: 'Target price',
  priority: 'Priority',
  notes: 'Notes',
  notesPlaceholder: 'Preferred year, condition, with or without papers…',
  addToWishlist: 'Add to wishlist',
});


function WishlistContent() {
  const t = useStrings(S);
  const c = useStrings(COMMON);
  const toast = useToast();
  const PRIORITY = t.priorities;
  const { user } = useAuth();
  const uid = user!.id;
  const list = useLoad(() => listWishlist(uid), [uid]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ brand: '', model: '', reference_number: '', target_price: '', priority: '2' as '1' | '2' | '3', notes: '' });
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!f.brand.trim() || !f.model.trim()) { setErr(t.brandModelRequired); return; }
    try {
      await addWishlistItem(uid, {
        brand: f.brand.trim(), model: f.model.trim(), reference_number: f.reference_number.trim() || null,
        target_price: f.target_price ? Number(f.target_price.replace(',', '.').replace(/\s/g, '')) : null,
        priority: Number(f.priority) as WishlistItem['priority'], notes: f.notes.trim() || null,
      });
      setOpen(false);
      setF({ brand: '', model: '', reference_number: '', target_price: '', priority: '2', notes: '' });
      toast(c.toast.wishAdded);
      list.reload();
    } catch (x) { setErr(x instanceof Error ? x.message : t.addError); }
  };

  const items = list.data ?? [];
  const active = items.filter(i => !i.acquired_at);
  const acquired = items.filter(i => i.acquired_at);

  return (
    <div className="page page--narrow">
      <PageHeader title={t.title} subtitle={t.subtitle}
        action={<Button size="small" onClick={() => { setErr(null); setOpen(true); }}><Plus size={16} aria-hidden="true" />{t.add}</Button>} />

      {list.loading ? <SkeletonList rows={4} thumb={0} /> : list.error ? <Notice tone="error">{list.error}</Notice> : !items.length ? (
        <EmptyState title={t.emptyTitle} action={<Button onClick={() => setOpen(true)}>{t.addWanted}</Button>}>
          {t.emptyText}
        </EmptyState>
      ) : (
        <>
          <ul className={s.list}>
            {active.map(i => (
              <li key={i.id} className={s.item}>
                <span className={s.priority} data-p={i.priority}>{PRIORITY[i.priority]}</span>
                <div className={s.main}>
                  <strong>{i.brand} {i.model}</strong>
                  <span>{[i.reference_number, i.target_price !== null ? t.target(formatEuros(Number(i.target_price))) : null].filter(Boolean).join(', ')}</span>
                  {i.notes && <p>{i.notes}</p>}
                </div>
                <div className={s.actions}>
                  <IconButton label={t.markFound} onClick={async () => { await updateWishlistItem(uid, i.id, { acquired_at: new Date().toISOString() }); toast(c.toast.wishDone); list.reload(); }}><Check size={18} strokeWidth={1.8} /></IconButton>
                  <IconButton label={t.remove} onClick={async () => { if (window.confirm(t.removeConfirm)) { await deleteWishlistItem(uid, i.id); list.reload(); } }}><Trash2 size={18} strokeWidth={1.6} /></IconButton>
                </div>
              </li>
            ))}
          </ul>
          {acquired.length > 0 && (
            <section className={s.found}>
              <h2>{t.found}</h2>
              <ul>{acquired.map(i => <li key={i.id}>{i.brand} {i.model}</li>)}</ul>
            </section>
          )}
        </>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title={t.sheetTitle}>
        <form onSubmit={submit} className={s.form}>
          {err && <Notice tone="error">{err}</Notice>}
          <TextField label={t.brand} value={f.brand} onChange={e => setF({ ...f, brand: e.target.value })} required />
          <TextField label={t.model} value={f.model} onChange={e => setF({ ...f, model: e.target.value })} required />
          <TextField label={t.reference} optional value={f.reference_number} onChange={e => setF({ ...f, reference_number: e.target.value })} />
          <TextField label={t.targetPrice} optional inputMode="decimal" suffix="€" value={f.target_price} onChange={e => setF({ ...f, target_price: e.target.value })} />
          <div className={s.field}>
            <span className={s.label}>{t.priority}</span>
            <Segmented label={t.priority} value={f.priority} onChange={v => setF({ ...f, priority: v })}
              options={[{ value: '1', label: PRIORITY[1] }, { value: '2', label: PRIORITY[2] }, { value: '3', label: PRIORITY[3] }]} />
          </div>
          <TextArea label={t.notes} optional rows={3} value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} placeholder={t.notesPlaceholder} />
          <Button type="submit" block>{t.addToWishlist}</Button>
        </form>
      </Sheet>
    </div>
  );
}

export default function WishlistPage() {
  const t = useStrings(S);
  return (
    <PremiumGate title={t.title} pitch={t.pitch}>
      <WishlistContent />
    </PremiumGate>
  );
}
