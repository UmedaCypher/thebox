import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, Share2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLoad } from '../../hooks/useLoad';
import { addWear, listWatches, listWearLogs, mainPhoto, photoUrl, removeWear, thumbSrc } from '../../lib/api';
import { formatDate, formatNumber, plural, toISODate, todayISO } from '../../lib/format';
import { drawMonthCard, shareImage } from '../../lib/shareCard';
import type { Watch } from '../../types';
import { Button, Cushion, EmptyState, IconButton, Img, LinkButton, Notice, PageHeader, Sheet, Stat } from '../../components/ui';
import { defineStrings, getLocale, useStrings } from '../../i18n';
import NewsTeaser from '../../components/NewsTeaser/NewsTeaser';
import s from './WearPage.module.css';
import { SkeletonCalendar, SkeletonHeader } from '../../components/Skeleton/Skeleton';

const S = defineStrings({
  weekdays: ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'],
  saveFailed: 'Enregistrement impossible.',
  daysLogged: (n: number) => (n > 1 ? 'jours notés' : 'jour noté'),
  watchesWorn: (n: number) => (n > 1 ? 'montres portées' : 'montre portée'),
  mostWorn: 'la plus portée',
  mostWornDays: (n: number) => `la plus portée (${plural(n, 'jour', 'jours')})`,
  shareText: (month: string) => `Mon mois au poignet, ${month}`,
  shareFailed: 'Partage impossible.',
  title: 'Portage',
  emptyTitle: "Rien à porter pour l'instant",
  addWatch: 'Ajouter une montre',
  emptyText: "Le calendrier note chaque jour la montre que vous portez. Ajoutez d'abord une montre à votre collection.",
  todayTitle: "Au poignet aujourd'hui",
  prevMonth: 'Mois précédent',
  nextMonth: 'Mois suivant',
  calendarOf: (month: string) => `Calendrier de ${month}`,
  preparing: 'Préparation…',
  shareMonth: 'Partager le mois',
  detailedStats: 'Statistiques détaillées',
  costQuestion: 'Combien vous coûte chaque port ?',
}, {
  weekdays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  saveFailed: "Couldn't save.",
  daysLogged: n => (n === 1 ? 'day logged' : 'days logged'),
  watchesWorn: n => (n === 1 ? 'watch worn' : 'watches worn'),
  mostWorn: 'most worn',
  mostWornDays: n => `most worn (${plural(n, 'day', 'days')})`,
  shareText: month => `My month on the wrist, ${month}`,
  shareFailed: "Couldn't share.",
  title: 'Wear',
  emptyTitle: 'Nothing to wear yet',
  addWatch: 'Add a watch',
  emptyText: 'The calendar records the watch you wear each day. Start by adding a watch to your collection.',
  todayTitle: 'On the wrist today',
  prevMonth: 'Previous month',
  nextMonth: 'Next month',
  calendarOf: month => `Calendar for ${month}`,
  preparing: 'Preparing…',
  shareMonth: 'Share the month',
  detailedStats: 'Detailed stats',
  costQuestion: 'What does each wear really cost you?',
});

export default function WearPage() {
  const t = useStrings(S);
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
      setError(e instanceof Error ? e.message : t.saveFailed);
      logsQ.reload();
    }
  };

  // Mois affiché
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const monthLabel = cursor.toLocaleDateString(getLocale(), { month: 'long', year: 'numeric' });
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
          { value: formatNumber(monthStats.daysWorn), label: t.daysLogged(monthStats.daysWorn) },
          { value: formatNumber(monthStats.distinct), label: t.watchesWorn(monthStats.distinct) },
          ...(monthStats.top?.watch ? [{ value: monthStats.top.watch.brand, label: t.mostWorn }] : []),
        ],
      });
      await shareImage(blob, `the-box-${toISODate(cursor).slice(0, 7)}.png`, t.shareText(monthLabel));
    } catch (e) {
      setError(e instanceof Error ? e.message : t.shareFailed);
    } finally {
      setSharing(false);
    }
  };

  if (watchesQ.loading || logsQ.loading) return <div className="page"><SkeletonHeader /><SkeletonCalendar /></div>;
  if (watchesQ.error) return <div className="page"><Notice tone="error">{watchesQ.error}</Notice></div>;

  if (!watches.length) {
    return (
      <div className="page">
        <PageHeader title={t.title} />
        <EmptyState title={t.emptyTitle} action={<LinkButton to="/ajouter-montre">{t.addWatch}</LinkButton>}>
          {t.emptyText}
        </EmptyState>
      </div>
    );
  }

  const todayIds = byDay.get(today) ?? [];

  return (
    <div className="page">
      <PageHeader title={t.title} subtitle={formatDate(today, { weekday: 'long', day: 'numeric', month: 'long' })} />
      {error && <Notice tone="error">{error}</Notice>}

      <section className={s.today} aria-labelledby="today-title">
        <h2 id="today-title" className={s.sectionTitle}>{t.todayTitle}</h2>
        <ul className={s.picker}>
          {watches.map(w => {
            const on = todayIds.includes(w.id);
            return (
              <li key={w.id}>
                <button className={s.pick} aria-pressed={on} onClick={() => toggle(w.id, today)}>
                  <Cushion src={thumbFor(w).src} fallbackSrc={thumbFor(w).fallback} alt="" ratio="portrait" className={s.pickFrame}>
                    {on && <span className={s.check}><Check size={16} strokeWidth={2.6} /></span>}
                    <span className={s.pickVeil} aria-hidden="true" />
                    <span className={s.pickText}>
                      <span className={s.pickBrand}>{w.brand}</span>
                      <span className={s.pickName}>{w.model}</span>
                    </span>
                  </Cushion>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={s.month} aria-labelledby="month-title" data-reveal>
        <div className={s.monthHead}>
          <IconButton label={t.prevMonth} onClick={() => setCursor(new Date(year, month - 1, 1))}><ChevronLeft size={20} strokeWidth={1.6} /></IconButton>
          <h2 id="month-title" className={s.monthTitle}>{monthTitle}</h2>
          <IconButton label={t.nextMonth} disabled={isCurrentMonth} onClick={() => setCursor(new Date(year, month + 1, 1))}><ChevronRight size={20} strokeWidth={1.6} /></IconButton>
        </div>

        <div className={s.calendar} role="grid" aria-label={t.calendarOf(monthLabel)}>
          {t.weekdays.map(d => <span key={d} className={s.weekday} role="columnheader">{d}</span>)}
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
            <Stat value={<span className="num">{monthStats.daysWorn}</span>} label={t.daysLogged(monthStats.daysWorn)} />
            <Stat value={<span className="num">{monthStats.distinct}</span>} label={t.watchesWorn(monthStats.distinct)} />
            {monthStats.top?.watch && <Stat value={monthStats.top.watch.model} label={t.mostWornDays(monthStats.top.n)} />}
          </div>
          <div className={s.monthActions}>
            <Button variant="secondary" size="small" onClick={share} disabled={sharing || monthStats.daysWorn === 0}>
              <Share2 size={16} aria-hidden="true" />{sharing ? t.preparing : t.shareMonth}
            </Button>
            <Link to="/stats" className={s.statsLink}>
              {isPremium ? t.detailedStats : t.costQuestion}
            </Link>
          </div>
        </div>
      </section>

      <NewsTeaser />

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
