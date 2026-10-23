import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import type { CostAnalysis } from '../../lib/costPerWear';
import { DORMANT_DAYS, premiumAnchor } from '../../lib/costPerWear';
import { formatEuros, plural } from '../../lib/format';
import { LinkButton } from '../ui';
import s from './CostTeaser.module.css';

/**
 * Aperçu gratuit du coût par port, calculé sur la collection du membre :
 * un vrai chiffre en clair, le reste flouté, et la comparaison avec le prix de Premium.
 */
export default function CostTeaser({ analysis, compact = false }: { analysis: CostAnalysis; compact?: boolean }) {
  const a = analysis;
  const hidden = a.rows.filter(r => r.costPerWear !== null && r !== a.priciest).slice(0, compact ? 2 : 4);

  // Pas encore de quoi calculer : on explique ce qui manque.
  if (!a.priciest && !a.dormant.length) {
    if (!a.rows.length) return null;
    return (
      <aside className={s.card} data-compact={compact}>
        <p className={s.kicker}>Coût par port</p>
        <h2 className={s.title}>Combien vous coûte chaque port ?</h2>
        <p className={s.text}>
          {a.pricedCount === 0
            ? "Renseignez le prix d'achat de vos montres et notez les jours où vous les portez : The Box calcule ce que chacune vous coûte vraiment."
            : 'Notez les jours où vous portez vos montres dans le calendrier : le coût par port apparaîtra ici.'}
        </p>
        <Link to={a.pricedCount === 0 ? '/collection' : '/portage'} className={s.link}>
          {a.pricedCount === 0 ? 'Compléter mes montres' : 'Ouvrir le calendrier'}
        </Link>
      </aside>
    );
  }

  return (
    <aside className={s.card} data-compact={compact}>
      <p className={s.kicker}>Coût par port, calculé sur votre collection</p>
      {a.priciest && (
        <h2 className={s.title}>
          Votre {a.priciest.watch.brand} {a.priciest.watch.model} vous coûte{' '}
          <span className={`${s.figure} num`}>{formatEuros(a.priciest.costPerWear!)}</span> à chaque port.
        </h2>
      )}
      {a.priciest && (
        <p className={s.text}>
          {formatEuros(a.priciest.price)} pour {plural(a.priciest.wears, 'jour', 'jours')} au poignet.
          Plus vous la portez, plus ce chiffre baisse.
        </p>
      )}
      {a.dormant.length > 0 && (
        <p className={s.text}>
          <strong>{plural(a.dormant.length, 'montre dort', 'montres dorment')}</strong> depuis plus de {DORMANT_DAYS} jours
          {a.dormantValue > 0 && <>, soit <strong className="num">{formatEuros(a.dormantValue)}</strong> au fond du tiroir</>}.
          {' '}De quoi financer la prochaine, ou éviter de l'acheter.
        </p>
      )}

      {hidden.length > 0 && (
        <ul className={s.locked} aria-label="Coût par port des autres montres, réservé à Premium">
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
        <LinkButton to="/stats" size="small">Voir le coût de chaque montre</LinkButton>
        {!compact && <LinkButton to="/premium" size="small" variant="ghost">Tout Premium</LinkButton>}
      </div>
    </aside>
  );
}
