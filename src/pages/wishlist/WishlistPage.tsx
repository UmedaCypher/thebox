import { useState } from 'react';
import type { FormEvent } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLoad } from '../../hooks/useLoad';
import { addWishlistItem, deleteWishlistItem, listWishlist, updateWishlistItem } from '../../lib/api';
import { formatEuros } from '../../lib/format';
import type { WishlistItem } from '../../types';
import { Button, EmptyState, IconButton, Loading, Notice, PageHeader, Segmented, Sheet, TextArea, TextField } from '../../components/ui';
import PremiumGate from '../../components/PremiumGate/PremiumGate';
import s from './WishlistPage.module.css';

const PRIORITY = { 1: 'Graal', 2: 'Envie', 3: 'Un jour' } as const;

function WishlistContent() {
  const { user } = useAuth();
  const uid = user!.id;
  const list = useLoad(() => listWishlist(uid), [uid]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ brand: '', model: '', reference_number: '', target_price: '', priority: '2' as '1' | '2' | '3', notes: '' });
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!f.brand.trim() || !f.model.trim()) { setErr('Indiquez la marque et le modèle.'); return; }
    try {
      await addWishlistItem(uid, {
        brand: f.brand.trim(), model: f.model.trim(), reference_number: f.reference_number.trim() || null,
        target_price: f.target_price ? Number(f.target_price.replace(',', '.').replace(/\s/g, '')) : null,
        priority: Number(f.priority) as WishlistItem['priority'], notes: f.notes.trim() || null,
      });
      setOpen(false);
      setF({ brand: '', model: '', reference_number: '', target_price: '', priority: '2', notes: '' });
      list.reload();
    } catch (x) { setErr(x instanceof Error ? x.message : 'Ajout impossible.'); }
  };

  const items = list.data ?? [];
  const active = items.filter(i => !i.acquired_at);
  const acquired = items.filter(i => i.acquired_at);

  return (
    <div className="page page--narrow">
      <PageHeader title="Wishlist" subtitle="Les montres que vous cherchez, et le prix auquel vous seriez prêt à sauter le pas."
        action={<Button size="small" onClick={() => { setErr(null); setOpen(true); }}><Plus size={16} aria-hidden="true" />Ajouter</Button>} />

      {list.loading ? <Loading /> : list.error ? <Notice tone="error">{list.error}</Notice> : !items.length ? (
        <EmptyState title="Aucune montre en vue" action={<Button onClick={() => setOpen(true)}>Ajouter une montre recherchée</Button>}>
          Notez la référence exacte et votre prix cible : vous saurez quoi répondre le jour où elle passe sous vos yeux.
        </EmptyState>
      ) : (
        <>
          <ul className={s.list}>
            {active.map(i => (
              <li key={i.id} className={s.item}>
                <span className={s.priority} data-p={i.priority}>{PRIORITY[i.priority]}</span>
                <div className={s.main}>
                  <strong>{i.brand} {i.model}</strong>
                  <span>{[i.reference_number, i.target_price !== null ? `cible ${formatEuros(Number(i.target_price))}` : null].filter(Boolean).join(', ')}</span>
                  {i.notes && <p>{i.notes}</p>}
                </div>
                <div className={s.actions}>
                  <IconButton label="Marquer comme trouvée" onClick={async () => { await updateWishlistItem(uid, i.id, { acquired_at: new Date().toISOString() }); list.reload(); }}><Check size={18} strokeWidth={1.8} /></IconButton>
                  <IconButton label="Retirer de la wishlist" onClick={async () => { if (window.confirm('Retirer cette montre ?')) { await deleteWishlistItem(uid, i.id); list.reload(); } }}><Trash2 size={18} strokeWidth={1.6} /></IconButton>
                </div>
              </li>
            ))}
          </ul>
          {acquired.length > 0 && (
            <section className={s.found}>
              <h2>Trouvées</h2>
              <ul>{acquired.map(i => <li key={i.id}>{i.brand} {i.model}</li>)}</ul>
            </section>
          )}
        </>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="Montre recherchée">
        <form onSubmit={submit} className={s.form}>
          {err && <Notice tone="error">{err}</Notice>}
          <TextField label="Marque" value={f.brand} onChange={e => setF({ ...f, brand: e.target.value })} required />
          <TextField label="Modèle" value={f.model} onChange={e => setF({ ...f, model: e.target.value })} required />
          <TextField label="Référence" optional value={f.reference_number} onChange={e => setF({ ...f, reference_number: e.target.value })} />
          <TextField label="Prix cible" optional inputMode="decimal" suffix="€" value={f.target_price} onChange={e => setF({ ...f, target_price: e.target.value })} />
          <div className={s.field}>
            <span className={s.label}>Priorité</span>
            <Segmented label="Priorité" value={f.priority} onChange={v => setF({ ...f, priority: v })}
              options={[{ value: '1', label: PRIORITY[1] }, { value: '2', label: PRIORITY[2] }, { value: '3', label: PRIORITY[3] }]} />
          </div>
          <TextArea label="Notes" optional rows={3} value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} placeholder="Année souhaitée, état, avec ou sans papiers…" />
          <Button type="submit" block>Ajouter à la wishlist</Button>
        </form>
      </Sheet>
    </div>
  );
}

export default function WishlistPage() {
  return (
    <PremiumGate title="Wishlist" pitch="Gardez la liste des montres que vous cherchez, avec la référence exacte et votre prix cible.">
      <WishlistContent />
    </PremiumGate>
  );
}
