import { Camera } from 'lucide-react';
import type { WearStreak } from '../../types';
import { Button } from '../ui';
import { useStrings } from '../../i18n';
import { formatDate } from '../../lib/format';
import { PHOTO_MILESTONES, STREAK_MILESTONES, STREAK_STRINGS } from './streak';
import StreakTrack from './StreakTrack';
import s from './WristCheck.module.css';

/** Progression vers le prochain palier, de 0 à 1. */
export function streakProgress(st: WearStreak) {
  if (!st.next_milestone) return 1;
  const prev = [...STREAK_MILESTONES].reverse().find(m => m <= st.current) ?? 0;
  return Math.min(1, Math.max(0, (st.current - prev) / (st.next_milestone - prev)));
}

/** Message toujours positif selon l'état de la série. */
export function useStreakMessage(st: WearStreak | null) {
  const t = useStrings(STREAK_STRINGS);
  if (!st || st.status === 'none') return t.firstDay;
  if (st.status === 'paused') return t.paused(st.paused_length);
  if (st.status === 'done') return t.doneToday;
  return t.openToday;
}

/** Ligne compacte pour l'accueil : la série, et la barre vers le prochain palier. */
export function StreakLine({ streak }: { streak: WearStreak | null }) {
  const t = useStrings(STREAK_STRINGS);
  if (!streak || streak.status === 'none') return null;
  if (streak.status === 'paused') return <p className={s.lineMuted}>{t.pausedShort}</p>;
  return (
    <div className={s.line}>
      <span className={s.lineCount}><span className={s.dot} aria-hidden="true" />{t.series(streak.current)}</span>
      {streak.next_milestone && (
        <span className={s.lineNext}>
          <span className={s.bar} aria-hidden="true"><i style={{ width: `${streakProgress(streak) * 100}%` }} /></span>
          {streak.next_milestone}&nbsp;j
        </span>
      )}
    </div>
  );
}

/**
 * Bloc complet (portage, profil) : série, meilleure série, prochain palier, rattrapage, badges.
 * `onCheck(day)` ouvre le Wrist Check, sur le jour à rattraper le cas échéant.
 */
export default function StreakPanel({ streak, onCheck, showBadges = true, showButton = true }: {
  streak: WearStreak | null; onCheck?: (day?: string) => void; showBadges?: boolean;
  /** false quand la page a déjà son propre bouton Wrist Check */
  showButton?: boolean;
}) {
  const t = useStrings(STREAK_STRINGS);
  const message = useStreakMessage(streak);
  if (!streak) return null;
  const earned = new Map(streak.badges.map(b => [b.days, b.earned_on]));
  const alive = streak.status === 'done' || streak.status === 'open';

  return (
    <section className={`panel ${s.panel}`} data-tone="lume">
      <div className={s.head}>
        <div>
          <p className="panel-kicker">Wrist Check</p>
          <p className={s.big}>{alive ? t.series(streak.current) : streak.status === 'paused' ? t.days(streak.paused_length) : '—'}</p>
          <p className={s.msg}>{message}</p>
        </div>
        {onCheck && showButton && streak.status !== 'done' && (
          <Button onClick={() => onCheck()}><Camera size={16} strokeWidth={1.8} aria-hidden="true" />Wrist Check</Button>
        )}
      </div>

      {streak.status !== 'none' && <StreakTrack streak={streak} />}
      {alive && streak.next_milestone && (
        <span className={s.hint}>{t.toNext(streak.next_milestone - streak.current, t.badge[streak.next_milestone])}</span>
      )}
      {alive && !streak.next_milestone && <p className={s.hint}>{t.allDone}</p>}

      {streak.status === 'open' && streak.catch_up.length > 0 && onCheck && (
        <div className={s.catchUp}>
          <span>{t.catchUp(streak.catch_up.length)}</span>
          <div className={s.catchBtns}>
            {[...streak.catch_up].reverse().map(d => (
              <Button key={d} size="small" variant="secondary" onClick={() => onCheck(d)}>
                {t.catchUpBtn} {formatDate(d, { weekday: 'short', day: 'numeric' })}
              </Button>
            ))}
          </div>
        </div>
      )}

      {streak.best > 0 && <p className={s.hint}>{t.best(streak.best)}</p>}

      {showBadges && (
        <ul className={s.badges} aria-label="Badges">
          {STREAK_MILESTONES.map(m => (
            <li key={m} className={s.badge} data-earned={earned.has(m)} title={earned.has(m) ? formatDate(earned.get(m)!) : undefined}>
              <span className={s.badgeNum}>{m}</span>
              <span className={s.badgeLabel}>{t.badge[m]}</span>
            </li>
          ))}
          {PHOTO_MILESTONES.map(m => (
            <li key={`p${m}`} className={s.badge} data-earned={streak.photos >= m} data-kind="photo">
              <span className={s.badgeNum}><Camera size={14} strokeWidth={2} aria-hidden="true" />{m}</span>
              <span className={s.badgeLabel}>{t.photoBadge(m)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
