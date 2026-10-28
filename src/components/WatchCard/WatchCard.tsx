import { Link } from 'react-router-dom';
import { Watch as WatchIcon } from 'lucide-react';
import { Img } from '../ui';
import s from './WatchCard.module.css';

export type CardTone = 'brass' | 'saphir' | 'lume';

interface Props {
  to: string;
  brand: string;
  model: string;
  photo: string | null;
  photoFallback?: string | null;
  meta?: string | null;
  /** Couleur de la puce devant la ligne d'information (ex. lume pour « portée aujourd'hui »). */
  metaTone?: CardTone | null;
  /** Étiquette posée sur la photo, ex. « À vendre ». */
  badge?: string | null;
  badgeTone?: CardTone;
  /** Ligne mise en avant sous le nom, ex. le prix demandé. */
  price?: string | null;
  /** Pièce maîtresse : la carte occupe deux colonnes et deux rangées. */
  feature?: boolean;
  /** Petite mention au-dessus du nom de la pièce maîtresse. */
  featureLabel?: string | null;
}

/**
 * Une montre en plein cadre : la photo remplit la carte, le nom repose sur un voile de verre dépoli,
 * et la photo diffuse sa propre couleur autour de la carte.
 */
export default function WatchCard({ to, brand, model, photo, photoFallback, meta, metaTone, badge, badgeTone = 'saphir', price, feature, featureLabel }: Props) {
  return (
    <Link to={to} className={s.card} data-feature={feature || undefined}>
      {photo && <img className={s.glow} src={photo} alt="" aria-hidden="true" loading="lazy" decoding="async" />}
      <span className={s.frame}>
        {photo
          ? <Img key={photo} src={photo} fallback={photoFallback} alt={`${brand} ${model}`} className={s.photo} />
          : <span className={s.empty}><WatchIcon size={feature ? 56 : 36} strokeWidth={1.1} aria-hidden="true" /></span>}
        {(badge || price || (feature && featureLabel)) && (
          <span className={s.top}>
            {feature && featureLabel && <span className={s.badge} data-tone="lume"><i aria-hidden="true" />{featureLabel}</span>}
            {badge && <span className={s.badge} data-tone={badgeTone}><i aria-hidden="true" />{badge}</span>}
            {price && <span className={`${s.price} num`}>{price}</span>}
          </span>
        )}
        <span className={s.caption}>
          <span className={s.brand}>{brand}</span>
          <span className={s.model}>{model}</span>
          {meta && (
            <span className={s.footer}>
              <span className={s.meta} data-tone={metaTone || undefined}>{meta}</span>
            </span>
          )}
        </span>
      </span>
    </Link>
  );
}

export function WatchGrid({ children, variant, cols }: { children: React.ReactNode; variant?: 'stagger' | 'bento'; cols?: 3 }) {
  return <div className={s.grid} data-variant={variant} data-cols={cols}>{children}</div>;
}
