import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLoad } from '../../hooks/useLoad';
import { listMaintenance, listWatches, listWearLogs, mainPhoto, thumbSrc } from '../../lib/api';
import { FREE_WATCH_LIMIT } from '../../lib/features';
import { daysBetween, formatDate, formatEuros, plural, todayISO } from '../../lib/format';
import { listingBadge, statusKind } from '../../lib/listing';
import { Button, EmptyState, LinkButton, Notice, PageHeader, Stat } from '../../components/ui';
import WatchCard, { WatchGrid } from '../../components/WatchCard/WatchCard';
import PremiumSheet from '../../components/PremiumSheet/PremiumSheet';
import CostTeaser from '../../components/CostTeaser/CostTeaser';
import { analyseCosts } from '../../lib/costPerWear';
import { defineStrings, useStrings } from '../../i18n';
import { COMMON } from '../../i18n/common';
import s from './CollectionPage.module.css';
import { SkeletonGrid, SkeletonHeader } from '../../components/Skeleton/Skeleton';

const S = defineStrings({
  neverWorn: 'Jamais portée',
  wornToday: "Portée aujourd'hui",
  wornYesterday: 'Portée hier',
  wornDaysAgo: (d: number) => `Portée il y a ${plural(d, 'jour', 'jours')}`,
  opening: "Ouverture de l'écrin…",
  title: 'Collection',
  add: 'Ajouter',
  emptyTitle: 'Votre écrin est vide',
  addFirst: 'Ajouter ma première montre',
  emptyText: 'Commencez par la montre que vous portez le plus. Une photo, une marque, un modèle : le reste peut attendre.',
  summaryAria: 'Résumé de la collection',
  watches: (n: number) => (n > 1 ? 'montres' : 'montre'),
  declaredValue: 'valeur déclarée',
  brands: (n: number) => (n > 1 ? 'marques' : 'marque'),
  freeFull: 'Collection gratuite complète.',
  goPremium: 'Passer à Premium',
  quota: (n: number, max: number) => `${n} sur ${max} montres de la collection gratuite`,
  mostWorn: 'La plus portée',
  serviceOverdue: 'Entretien en retard depuis le',
  serviceDue: 'Entretien prévu le',
  premiumReason: (max: number) => `La collection gratuite accueille ${max} montres. Premium la rend illimitée et ajoute les outils du collectionneur.`,
}, {
  neverWorn: 'Never worn',
  wornToday: 'Worn today',
  wornYesterday: 'Worn yesterday',
  wornDaysAgo: d => `Worn ${plural(d, 'day', 'days')} ago`,
  opening: 'Opening your watch box…',
  title: 'Collection',
  add: 'Add',
  emptyTitle: 'Your watch box is empty',
  addFirst: 'Add my first watch',
  emptyText: 'Start with the watch you wear most. A photo, a brand, a model: the rest can wait.',
  summaryAria: 'Collection summary',
  watches: n => (n === 1 ? 'watch' : 'watches'),
  declaredValue: 'declared value',
  brands: n => (n === 1 ? 'brand' : 'brands'),
  freeFull: 'Your free collection is full.',
  goPremium: 'Go Premium',
  quota: (n, max) => `${n} of ${max} watches in the free collection`,
  mostWorn: 'Most worn',
  serviceOverdue: 'Service overdue since',
  serviceDue: 'Service due on',
  premiumReason: max => `The free collection holds ${max} watches. Premium makes it unlimited and adds the collector's tools.`,
});

function lastWornLabel(t: typeof S.fr, day: string | undefined) {
  if (!day) return t.neverWorn;
  const d = daysBetween(day);
  if (d <= 0) return t.wornToday;
  if (d === 1) return t.wornYesterday;
  return t.wornDaysAgo(d);
}

export default function CollectionPage() {
  const t = useStrings(S);
  const c = useStrings(COMMON);
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

  // Pièce maîtresse : la montre la plus portée sur 90 jours, mise en avant en grand quand la collection en compte au moins quatre.
  const featureId = useMemo(() => {
    if (watches.length < 4) return null;
    const since = new Date(); since.setDate(since.getDate() - 90);
    const from = since.toISOString().slice(0, 10);
    const counts = new Map<string, number>();
    for (const w of data?.wears ?? []) if (w.worn_on >= from) counts.set(w.watch_id, (counts.get(w.watch_id) ?? 0) + 1);
    let best: string | null = null; let max = 0;
    for (const [id, n] of counts) if (n > max) { best = id; max = n; }
    return best;
  }, [data, watches.length]);
  const ordered = useMemo(
    () => (featureId ? [...watches].sort((a, b) => Number(b.id === featureId) - Number(a.id === featureId)) : watches),
    [watches, featureId],
  );

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

  const costs = useMemo(() => (data && !isPremium ? analyseCosts(data.watches, data.wears) : null), [data, isPremium]);

  const onAdd = () => (atLimit ? setPremiumOpen(true) : navigate('/ajouter-montre'));

  if (loading && !data) return <div className="page"><SkeletonHeader withStats /><SkeletonGrid count={8} /></div>;
  if (error) return <div className="page"><Notice tone="error">{error}</Notice><Button variant="secondary" onClick={reload}>{c.retry}</Button></div>;

  return (
    <div className="page">
      <PageHeader
        title={t.title}
        action={watches.length > 0 && (
          <Button size="small" onClick={onAdd}><Plus size={16} strokeWidth={2} aria-hidden="true" />{t.add}</Button>
        )}
      />

      {watches.length === 0 ? (
        <EmptyState
          title={t.emptyTitle}
          action={<LinkButton to="/ajouter-montre">{t.addFirst}</LinkButton>}
        >
          {t.emptyText}
        </EmptyState>
      ) : (
        <>
          <section className={s.summary} aria-label={t.summaryAria}>
            <Stat value={<span className="num">{watches.length}</span>} label={t.watches(watches.length)} />
            <Stat value={<span className="num">{formatEuros(totalValue)}</span>} label={t.declaredValue} />
            <Stat value={<span className="num">{brands}</span>} label={t.brands(brands)} />
          </section>

          {!isPremium && (
            <div className={s.quota}>
              <span className={s.indices} aria-hidden="true">
                {Array.from({ length: FREE_WATCH_LIMIT }, (_, i) => <span key={i} data-filled={i < watches.length} />)}
              </span>
              <span className={s.quotaText}>
                {atLimit
                  ? <>{t.freeFull} <button className={s.inlineLink} onClick={() => setPremiumOpen(true)}>{t.goPremium}</button></>
                  : t.quota(watches.length, FREE_WATCH_LIMIT)}
              </span>
            </div>
          )}

          {costs && (costs.priciest || costs.dormant.length > 0) && <CostTeaser analysis={costs} compact />}

          {dueSoon.length > 0 && (
            <div className={s.reminders}>
              {dueSoon.map(m => (
                <Link key={m.id} to={`/montre/${m.watch_id}?onglet=entretien`} className={s.reminder}>
                  <strong>{m.watch!.brand} {m.watch!.model}</strong>
                  <span>{m.overdue ? t.serviceOverdue : t.serviceDue} {formatDate(m.next_due_on)}</span>
                </Link>
              ))}
            </div>
          )}

          <WatchGrid variant={featureId ? 'bento' : 'stagger'}>
            {ordered.map(w => (
              <WatchCard
                key={w.id}
                feature={w.id === featureId}
                featureLabel={t.mostWorn}
                metaTone={lastWorn.get(w.id) && daysBetween(lastWorn.get(w.id)!) <= 0 ? 'lume' : null}
                to={`/montre/${w.id}`}
                brand={w.brand}
                model={w.model}
                photo={thumbSrc(mainPhoto(w.photos)?.storage_path).src}
                photoFallback={thumbSrc(mainPhoto(w.photos)?.storage_path).fallback}
                meta={lastWornLabel(t, lastWorn.get(w.id))}
                badge={listingBadge(statusKind(w.current_status))}
              />
            ))}
          </WatchGrid>
        </>
      )}

      <PremiumSheet
        open={premiumOpen}
        onClose={() => setPremiumOpen(false)}
        reason={t.premiumReason(FREE_WATCH_LIMIT)}
      />
    </div>
  );
}
