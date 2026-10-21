import { toISODate } from '../../lib/format';
import s from './WearStrip.module.css';

/** Les N dernières semaines, un carré par jour : rempli si la montre a été portée. */
export default function WearStrip({ days, weeks = 12 }: { days: Set<string>; weeks?: number }) {
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
      <div className={s.grid} role="img" aria-label={`Portée ${worn} jours sur les ${weeks} dernières semaines`}>
        {cells.map(c => <span key={c.iso} data-on={days.has(c.iso)} data-future={c.future} title={c.iso} />)}
      </div>
      <div className={s.legend}><span>Il y a {weeks} semaines</span><span>Cette semaine</span></div>
    </div>
  );
}
