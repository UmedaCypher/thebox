import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, Share2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLoad } from '../../hooks/useLoad';
import { addWear, listWatches, listWearLogs, mainPhoto, photoUrl, removeWear, thumbSrc } from '../../lib/api';
import { formatDate, plural, toISODate, todayISO } from '../../lib/format';
import { drawMonthCard, shareImage } from '../../lib/shareCard';
import type { Watch } from '../../types';
import { Button, Cushion, EmptyState, IconButton, Img, LinkButton, Loading, Notice, PageHeader, Sheet, Stat } from '../../components/ui';
import s from './WearPage.module.css';

const WEEKDAYS = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'];

export default function WearPage() {
  const { user, profile, isPremium } = useAuth();
  const uid = user!.id;
  const today = todayISO();
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const watchesQ = useLoad(() => listWatches(uid), [uid]);
  const logsQ = useLoad(() => listWearLogs(uid), [uid]);

  const watches = useMemo(() => watchesQ.data ?? [], [watchesQ.data]);
  const byId = useMemo(() => new Map(watches.map(w => [w.id, w])), [watches]);

  const byDay = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const l of logsQ.data ?? []) m.set(l.worn_on, [...(m.get(l.worn_on) ?? []), l.watch_id]);
    return m;
  }, [logsQ.data]);

  const toggle = async (watchId: string, day: string) => {
    setError(null);
    const worn = (byDay.get(day) ?? []).includes(watchId);
    // Mise à jour immédiate, puis synchronisation.
    logsQ.setData(prev => {
      const list = prev ?? [];
      return worn ? list.filter(l => !(l.watch_id === watchId && l.worn_on === day))
        : [{ id: `tmp-${watchId}-${day}`, watch_id: watchId, worn_on: day, note: null }, ...list];
    });
    try {
      if (worn) await removeWear(uid, watchId, day); else await addWear(uid, watchId, day);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Enregistrement impossible.');
      logsQ.reload();
    }
  };

  // Mois affiché
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const monthLabel = cursor.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const monthTitle = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
  const isCurrentMonth = toISODate(cursor).slice(0, 7) === today.slice(0, 7);

  const monthStats = useMemo(() => {
    const prefix = toISODate(cursor).slice(0, 7);
    const counts = new Map<string, number>();
    let daysWorn = 0;
    for (const [day, ids] of byDay) {
      if (!day.startsWith(prefix)) continue;
      daysWorn++;
      ids.forEach(id => counts.set(id, (counts.get(id) ?? 0) + 1));
    }
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    return { daysWorn, distinct: counts.size, top: top ? { watch: byId.get(top[0]), n: top[1] } : null };
  }, [byDay, byId, cursor]);

  const pathFor = (w: Watch | undefined) => (w ? mainPhoto(w.photos)?.storage_path ?? null : null);
  const thumbFor = (w: Watch | undefined) => thumbSrc(pathFor(w));
  const fullFor = (w: Watch | undefined) => photoUrl(pathFor(w));

  const share = async () => {
    setSharing(true);
    try {
      const photoByDay = new Map<number, string | null>();
      for (let d = 1; d <= daysInMonth; d++) {
        const ids = byDay.get(toISODate(new Date(year, month, d)));
        if (ids?.length) photoByDay.set(d, fullFor(byId.get(ids[0])));
      }
      const blob = await drawMonthCard({
        title: monthTitle, year, month, photoByDay, username: profile?.username ?? null,
        stats: [
          { value: String(monthStats.daysWorn), label: 'jours notés' },
          { value: String(monthStats.distinct), label: monthStats.distinct > 1 ? 'montres portées' : 'montre portée' },
          ...(monthStats.top?.watch ? [{ value: monthStats.top.watch.brand, label: 'la plus portée' }] : []),
        ],
      });
      await shareImage(blob, `the-box-${toISODate(cursor).slice(0, 7)}.png`, `Mon mois au poignet, ${monthLabel}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Partage impossible.');
    } finally {
      setSharing(false);
    }
  };

  if (watchesQ.loading || logsQ.loading) return <div className="page"><Loading /></div>;
  if (watchesQ.error) return <div className="page"><Notice tone="error">{watchesQ.error}</Notice></div>;

  if (!watches.length) {
    return (
      <div className="page">
        <PageHeader title="Portage" />
        <EmptyState title="Rien à porter pour l'instant" action={<LinkButton to="/ajouter-montre">Ajouter une montre</LinkButton>}>
          Le calendrier note chaque jour la montre que vous portez. Ajoutez d'abord une montre à votre collection.
        </EmptyState>
      </div>
    );
  }

  const todayIds = byDay.get(today) ?? [];

  return (
    <div className="page">
      <PageHeader title="Portage" subtitle={formatDate(today, { weekday: 'long', day: 'numeric', month: 'long' })} />
      {error && <Notice tone="error">{error}</Notice>}

      <section className={s.today} aria-labelledby="today-title">
        <h2 id="today-title" className={s.sectionTitle}>Au poignet aujourd'hui</h2>
        <ul className={s.picker}>
          {watches.map(w => {
            const on = todayIds.includes(w.id);
            return (
              <li key={w.id}>
                <button className={s.pick} aria-pressed={on} onClick={() => toggle(w.id, today)}>
                  <Cushion src={thumbFor(w).src} fallbackSrc={thumbFor(w).fallback} alt="">{on && <span className={s.check}><Check size={18} strokeWidth={2.4} /></span>}</Cushion>
                  <span className={s.pickName}>{w.model}</span>
                  <span className={s.pickBrand}>{w.brand}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={s.month} aria-labelledby="month-title">
        <div className={s.monthHead}>
          <IconButton label="Mois précédent" onClick={() => setCursor(new Date(year, month - 1, 1))}><ChevronLeft size={20} strokeWidth={1.6} /></IconButton>
          <h2 id="month-title" className={s.monthTitle}>{monthTitle}</h2>
          <IconButton label="Mois suivant" disabled={isCurrentMonth} onClick={() => setCursor(new Date(year, month + 1, 1))}><ChevronRight size={20} strokeWidth={1.6} /></IconButton>
        </div>

        <div className={s.calendar} role="grid" aria-label={`Calendrier de ${monthLabel}`}>
          {WEEKDAYS.map(d => <span key={d} className={s.weekday} role="columnheader">{d}</span>)}
          {Array.from({ length: offset }, (_, i) => <span key={`x${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const iso = toISODate(new Date(year, month, i + 1));
            const ids = byDay.get(iso) ?? [];
            const future = iso > today;
            const first = byId.get(ids[0]);
            return (
              <button
                key={iso}
                role="gridcell"
                className={s.day}
                data-today={iso === today}
                data-worn={ids.length > 0}
                disabled={future}
                onClick={() => setOpenDay(iso)}
                aria-label={`${formatDate(iso, { day: 'numeric', month: 'long' })}${ids.length ? `, ${ids.map(id => byId.get(id)?.model).join(', ')}` : ''}`}
              >
                {first ? (
                  <span className={s.dayPhoto}>
                    {thumbFor(first).src ? <Img src={thumbFor(first).src!} fallback={thumbFor(first).fallback} alt="" /> : <span>{i + 1}</span>}
                    {ids.length > 1 && <span className={s.more}>+{ids.length - 1}</span>}
                  </span>
                ) : <span className={s.dayNum}>{i + 1}</span>}
              </button>
            );
          })}
        </div>

        <div className={s.monthFoot}>
          <div className={s.monthStats}>
            <Stat value={<span className="num">{monthStats.daysWorn}</span>} label={`jour${monthStats.daysWorn > 1 ? 's' : ''} noté${monthStats.daysWorn > 1 ? 's' : ''}`} />
            <Stat value={<span className="num">{monthStats.distinct}</span>} label={monthStats.distinct > 1 ? 'montres portées' : 'montre portée'} />
            {monthStats.top?.watch && <Stat value={monthStats.top.watch.model} label={`la plus portée (${plural(monthStats.top.n, 'jour', 'jours')})`} />}
          </div>
          <div className={s.monthActions}>
            <Button variant="secondary" size="small" onClick={share} disabled={sharing || monthStats.daysWorn === 0}>
              <Share2 size={16} aria-hidden="true" />{sharing ? 'Préparation…' : 'Partager le mois'}
            </Button>
            <Link to="/stats" className={s.statsLink}>
              {isPremium ? 'Statistiques détaillées' : 'Combien vous coûte chaque port ?'}
            </Link>
          </div>
        </div>
      </section>

      <Sheet open={Boolean(openDay)} onClose={() => setOpenDay(null)} title={openDay ? formatDate(openDay, { weekday: 'long', day: 'numeric', month: 'long' }) : ''}>
        {openDay && (
          <ul className={s.dayList}>
            {watches.map(w => {
              const on = (byDay.get(openDay) ?? []).includes(w.id);
              return (
                <li key={w.id}>
                  <button className={s.dayRow} aria-pressed={on} onClick={() => toggle(w.id, openDay)}>
                    <Cushion src={thumbFor(w).src} fallbackSrc={thumbFor(w).fallback} alt="" className={s.dayRowPhoto} />
                    <span className={s.dayRowText}><strong>{w.model}</strong><span>{w.brand}</span></span>
                    <span className={s.dayRowCheck} aria-hidden="true">{on && <Check size={18} strokeWidth={2.4} />}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Sheet>
    </div>
  );
}
