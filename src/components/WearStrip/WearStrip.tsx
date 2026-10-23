import { defineStrings, useStrings } from '../../i18n';
import { formatDate, toISODate } from '../../lib/format';
import s from './WearStrip.module.css';

const S = defineStrings({
  aria: (worn: number, weeks: number) => `Portée ${worn} jours sur les ${weeks} dernières semaines`,
  ago: (weeks: number) => `Il y a ${weeks} semaines`,
  thisWeek: 'Cette semaine',
}, {
  aria: (worn, weeks) => `Worn ${worn} ${worn === 1 ? 'day' : 'days'} in the last ${weeks} weeks`,
  ago: weeks => `${weeks} weeks ago`,
  thisWeek: 'This week',
});

/** Les N dernières semaines, un carré par jour : rempli si la montre a été portée. */
export default function WearStrip({ days, weeks = 12 }: { days: Set<string>; weeks?: number }) {
  const t = useStrings(S);
  const today = new Date();
  const end = new Date(today);
  end.setDate(end.getDate() + ((7 - end.getDay()) % 7)); // dimanche de la semaine courante
  const cells: { iso: string; future: boolean }[] = [];
  const start = new Date(end);
  start.setDate(start.getDate() - weeks * 7 + 1);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    cells.push({ iso: toISODate(d), future: d > today });
  }
  const worn = cells.filter(c => days.has(c.iso)).length;
  return (
    <div className={s.wrap}>
      <div className={s.grid} role="img" aria-label={t.aria(worn, weeks)}>
        {cells.map(c => <span key={c.iso} data-on={days.has(c.iso)} data-future={c.future} title={formatDate(c.iso)} />)}
      </div>
      <div className={s.legend}><span>{t.ago(weeks)}</span><span>{t.thisWeek}</span></div>
    </div>
  );
}
