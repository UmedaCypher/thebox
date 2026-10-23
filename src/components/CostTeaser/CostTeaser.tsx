import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import type { CostAnalysis } from '../../lib/costPerWear';
import { DORMANT_DAYS, premiumAnchor } from '../../lib/costPerWear';
import { formatEuros, plural } from '../../lib/format';
import { defineStrings, useStrings } from '../../i18n';
import { LinkButton } from '../ui';
import s from './CostTeaser.module.css';

const S = defineStrings({
  kicker: 'Coût par port',
  emptyTitle: 'Combien vous coûte chaque port ?',
  needPrice: "Renseignez le prix d'achat de vos montres et notez les jours où vous les portez : The Box calcule ce que chacune vous coûte vraiment.",
  needWears: 'Notez les jours où vous portez vos montres dans le calendrier : le coût par port apparaîtra ici.',
  completeWatches: 'Compléter mes montres',
  openCalendar: 'Ouvrir le calendrier',
  kickerFull: 'Coût par port, calculé sur votre collection',
  costBefore: (name: string) => `Votre ${name} vous coûte `,
  costAfter: ' à chaque port.',
  priceFor: (price: string, wears: number) => `${price} pour ${plural(wears, 'jour', 'jours')} au poignet.`,
  lowerWithWear: 'Plus vous la portez, plus ce chiffre baisse.',
  dormant: (n: number) => plural(n, 'montre dort', 'montres dorment'),
  dormantSince: (days: number) => ` depuis plus de ${days} jours`,
  dormantValueBefore: ', soit ',
  dormantValueAfter: ' au fond du tiroir',
  dormantEnd: "De quoi financer la prochaine, ou éviter de l'acheter.",
  lockedAria: 'Coût par port des autres montres, réservé à Premium',
  seeEach: 'Voir le coût de chaque montre',
  allPremium: 'Tout Premium',
}, {
  kicker: 'Cost per wear',
  emptyTitle: 'What does each wear really cost you?',
  needPrice: 'Add the purchase price of your watches and log the days you wear them: The Box works out what each one really costs you.',
  needWears: 'Log the days you wear your watches in the calendar: your cost per wear will appear here.',
  completeWatches: 'Complete my watches',
  openCalendar: 'Open the calendar',
  kickerFull: 'Cost per wear, based on your collection',
  costBefore: name => `Your ${name} costs you `,
  costAfter: ' every time you wear it.',
  priceFor: (price, wears) => `${price} for ${plural(wears, 'day', 'days')} on the wrist.`,
  lowerWithWear: 'The more you wear it, the lower this figure gets.',
  dormant: n => plural(n, 'watch has', 'watches have'),
  dormantSince: days => ` not been worn for over ${days} days`,
  dormantValueBefore: ', that is ',
  dormantValueAfter: ' sitting in a drawer',
  dormantEnd: 'Enough to fund your next one, or a reason not to buy it.',
  lockedAria: 'Cost per wear for your other watches, a Premium feature',
  seeEach: 'See the cost of each watch',
  allPremium: 'All of Premium',
});

/**
 * Aperçu gratuit du coût par port, calculé sur la collection du membre :
 * un vrai chiffre en clair, le reste flouté, et la comparaison avec le prix de Premium.
 */
export default function CostTeaser({ analysis, compact = false }: { analysis: CostAnalysis; compact?: boolean }) {
  const t = useStrings(S);
  const a = analysis;
  const hidden = a.rows.filter(r => r.costPerWear !== null && r !== a.priciest).slice(0, compact ? 2 : 4);

  // Pas encore de quoi calculer : on explique ce qui manque.
  if (!a.priciest && !a.dormant.length) {
    if (!a.rows.length) return null;
    return (
      <aside className={s.card} data-compact={compact}>
        <p className={s.kicker}>{t.kicker}</p>
        <h2 className={s.title}>{t.emptyTitle}</h2>
        <p className={s.text}>
          {a.pricedCount === 0
            ? t.needPrice
            : t.needWears}
        </p>
        <Link to={a.pricedCount === 0 ? '/collection' : '/portage'} className={s.link}>
          {a.pricedCount === 0 ? t.completeWatches : t.openCalendar}
        </Link>
      </aside>
    );
  }

  return (
    <aside className={s.card} data-compact={compact}>
      <p className={s.kicker}>{t.kickerFull}</p>
      {a.priciest && (
        <h2 className={s.title}>
          {t.costBefore(`${a.priciest.watch.brand} ${a.priciest.watch.model}`)}
          <span className={`${s.figure} num`}>{formatEuros(a.priciest.costPerWear!)}</span>{t.costAfter}
        </h2>
      )}
      {a.priciest && (
        <p className={s.text}>
          {t.priceFor(formatEuros(a.priciest.price), a.priciest.wears)}{' '}
          {t.lowerWithWear}
        </p>
      )}
      {a.dormant.length > 0 && (
        <p className={s.text}>
          <strong>{t.dormant(a.dormant.length)}</strong>{t.dormantSince(DORMANT_DAYS)}
          {a.dormantValue > 0 && <>{t.dormantValueBefore}<strong className="num">{formatEuros(a.dormantValue)}</strong>{t.dormantValueAfter}</>}.
          {' '}{t.dormantEnd}
        </p>
      )}

      {hidden.length > 0 && (
        <ul className={s.locked} aria-label={t.lockedAria}>
          {hidden.map(r => (
            <li key={r.watch.id}>
              <span>{r.watch.brand} {r.watch.model}</span>
              <span className={s.blur} aria-hidden="true">000 €</span>
              <Lock size={14} strokeWidth={1.8} aria-hidden="true" />
            </li>
          ))}
        </ul>
      )}

      <p className={s.anchor}>{premiumAnchor(a)}</p>
      <div className={s.actions}>
        <LinkButton to="/stats" size="small">{t.seeEach}</LinkButton>
        {!compact && <LinkButton to="/premium" size="small" variant="ghost">{t.allPremium}</LinkButton>}
      </div>
    </aside>
  );
}
