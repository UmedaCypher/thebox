import { Check } from 'lucide-react';
import type { WearStreak } from '../../types';
import { useStrings } from '../../i18n';
import { STREAK_MILESTONES, STREAK_STRINGS } from './streak';
import s from './WristCheck.module.css';

/**
 * Frise des paliers : la barre se remplit au fil de la série, les paliers atteints sont cochés,
 * le prochain brille. On montre le dernier palier atteint (ou le départ) et les trois suivants,
 * pour que ça tienne sur un téléphone.
 */
export default function StreakTrack({ streak }: { streak: WearStreak }) {
  const t = useStrings(STREAK_STRINGS);
  const alive = streak.status === 'done' || streak.status === 'open';
  const current = alive ? streak.current : 0;
  const all = [0, ...STREAK_MILESTONES];
  const nextIdx = all.findIndex(m => m > current);
  const start = nextIdx === -1 ? all.length - 4 : Math.max(0, Math.min(nextIdx - 1, all.length - 4));
  const nodes = all.slice(start, start + 4);

  // Remplissage : segments complets jusqu'au dernier palier atteint, puis la part du segment en cours
  const seg = 1 / (nodes.length - 1);
  let fill = 0;
  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i], b = nodes[i + 1];
    if (current >= b) fill += seg;
    else { fill += seg * Math.max(0, (current - a) / (b - a)); break; }
  }

  return (
    <div className={s.track} data-paused={!alive}>
      <div className={s.trackRail}>
        <span className={s.trackFill} style={{ width: `calc(${(fill * 100).toFixed(2)}% + var(--node) / 2)` }} />
        {nodes.map((m, i) => {
          const reached = current >= m && m > 0;
          const isNext = m === all[nextIdx] && alive;
          return (
            <span key={m} className={s.node} style={{ left: `${i * seg * 100}%` }}
              data-state={reached ? 'done' : isNext ? 'next' : m === 0 ? 'start' : 'todo'}>
              {reached ? <Check size={14} strokeWidth={3} aria-hidden="true" /> : m === 0 ? '' : m}
            </span>
          );
        })}
      </div>
      <div className={s.trackLabels}>
        {nodes.map((m, i) => (
          <span key={m} style={{ left: `${i * seg * 100}%` }} data-state={current >= m && m > 0 ? 'done' : m === all[nextIdx] && alive ? 'next' : 'todo'}>
            {m === 0 ? t.start : t.short[m]}
          </span>
        ))}
      </div>
    </div>
  );
}
