import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLoad } from '../../hooks/useLoad';
import { listMaintenance, listWatches, listWearLogs, mainPhoto, photoUrl } from '../../lib/api';
import { FREE_WATCH_LIMIT } from '../../lib/features';
import { daysBetween, formatDate, formatEuros, plural, todayISO } from '../../lib/format';
import { Button, EmptyState, LinkButton, Loading, Notice, PageHeader, Stat } from '../../components/ui';
import WatchCard, { WatchGrid } from '../../components/WatchCard/WatchCard';
import PremiumSheet from '../../components/PremiumSheet/PremiumSheet';
import s from './CollectionPage.module.css';

function lastWornLabel(day: string | undefined) {
  if (!day) return 'Jamais portée';
  const d = daysBetween(day);
  if (d <= 0) return "Portée aujourd'hui";
  if (d === 1) return 'Portée hier';
  return `Portée il y a ${plural(d, 'jour', 'jours')}`;
}

export default function CollectionPage() {
  const { user, isPremium } = useAuth();
  const navigate = useNavigate();
  const [premiumOpen, setPremiumOpen] = useState(false);
  const uid = user!.id;

  const { data, loading, error, reload } = useLoad(async () => {
    const [watches, wears, maintenance] = await Promise.all([
      listWatches(uid),
      listWearLogs(uid).catch(() => []),
      isPremium ? listMaintenance(uid).catch(() => []) : Promise.resolve([]),
    ]);
    return { watches, wears, maintenance };
  }, [uid, isPremium]);

  const watches = useMemo(() => data?.watches ?? [], [data]);
  const lastWorn = useMemo(() => {
    const m = new Map<string, string>();
    for (const w of data?.wears ?? []) if (!m.has(w.watch_id) || m.get(w.watch_id)! < w.worn_on) m.set(w.watch_id, w.worn_on);
    return m;
  }, [data]);

  const totalValue = watches.reduce((sum, w) => sum + (Number(w.current_estimated_value) || 0), 0);
  const brands = new Set(watches.map(w => w.brand)).size;
  const atLimit = !isPremium && watches.length >= FREE_WATCH_LIMIT;

  const dueSoon = useMemo(() => {
    const today = todayISO();
    const horizon = new Date(); horizon.setDate(horizon.getDate() + 45);
    const h = horizon.toISOString().slice(0, 10);
    return (data?.maintenance ?? [])
      .filter(m => m.next_due_on && m.next_due_on <= h)
      .map(m => ({ ...m, watch: watches.find(w => w.id === m.watch_id), overdue: m.next_due_on! < today }))
      .filter(m => m.watch);
  }, [data, watches]);

  const onAdd = () => (atLimit ? setPremiumOpen(true) : navigate('/ajouter-montre'));

  if (loading && !data) return <div className="page"><Loading label="Ouverture de l'écrin…" /></div>;
  if (error) return <div className="page"><Notice tone="error">{error}</Notice><Button variant="secondary" onClick={reload}>Réessayer</Button></div>;

  return (
    <div className="page">
      <PageHeader
        title="Collection"
        action={watches.length > 0 && (
          <Button size="small" onClick={onAdd}><Plus size={16} strokeWidth={2} aria-hidden="true" />Ajouter</Button>
        )}
      />

      {watches.length === 0 ? (
        <EmptyState
          title="Votre écrin est vide"
          action={<LinkButton to="/ajouter-montre">Ajouter ma première montre</LinkButton>}
        >
          Commencez par la montre que vous portez le plus. Une photo, une marque, un modèle : le reste peut attendre.
        </EmptyState>
      ) : (
        <>
          <section className={s.summary} aria-label="Résumé de la collection">
            <Stat value={<span className="num">{watches.length}</span>} label={watches.length > 1 ? 'montres' : 'montre'} />
            <Stat value={<span className="num">{formatEuros(totalValue)}</span>} label="valeur déclarée" />
            <Stat value={<span className="num">{brands}</span>} label={brands > 1 ? 'marques' : 'marque'} />
          </section>

          {!isPremium && (
            <div className={s.quota}>
              <span className={s.indices} aria-hidden="true">
                {Array.from({ length: FREE_WATCH_LIMIT }, (_, i) => <span key={i} data-filled={i < watches.length} />)}
              </span>
              <span className={s.quotaText}>
                {atLimit
                  ? <>Collection gratuite complète. <button className={s.inlineLink} onClick={() => setPremiumOpen(true)}>Passer à Premium</button></>
                  : `${watches.length} sur ${FREE_WATCH_LIMIT} montres de la collection gratuite`}
              </span>
            </div>
          )}

          {dueSoon.length > 0 && (
            <div className={s.reminders}>
              {dueSoon.map(m => (
                <Link key={m.id} to={`/montre/${m.watch_id}?onglet=entretien`} className={s.reminder}>
                  <strong>{m.watch!.brand} {m.watch!.model}</strong>
                  <span>{m.overdue ? 'Entretien en retard depuis le' : 'Entretien prévu le'} {formatDate(m.next_due_on)}</span>
                </Link>
              ))}
            </div>
          )}

          <WatchGrid>
            {watches.map(w => (
              <WatchCard
                key={w.id}
                to={`/montre/${w.id}`}
                brand={w.brand}
                model={w.model}
                photo={photoUrl(mainPhoto(w.photos)?.storage_path)}
                meta={lastWornLabel(lastWorn.get(w.id))}
              />
            ))}
          </WatchGrid>
        </>
      )}

      <PremiumSheet
        open={premiumOpen}
        onClose={() => setPremiumOpen(false)}
        reason={`La collection gratuite accueille ${FREE_WATCH_LIMIT} montres. Premium la rend illimitée et ajoute les outils du collectionneur.`}
      />
    </div>
  );
}
