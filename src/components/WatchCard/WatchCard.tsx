import { Children, cloneElement, isValidElement, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { Watch as WatchIcon } from 'lucide-react';
import { Img } from '../ui';
import s from './WatchCard.module.css';

export type CardTone = 'brass' | 'ruby' | 'lume';

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
  /** Grande case de la mosaïque : on charge la photo en pleine définition plutôt que la miniature. */
  large?: boolean;
}

/** Reflet qui suit la souris sur le verre de la carte (ordinateur). */
function sheen(e: React.PointerEvent<HTMLAnchorElement>) {
  if (e.pointerType !== 'mouse') return;
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
  e.currentTarget.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
}

/**
 * Une montre en plein cadre : la photo remplit la carte, le nom repose sur un voile de verre dépoli,
 * et la photo diffuse sa propre couleur autour de la carte.
 */
export default function WatchCard({ to, brand, model, photo, photoFallback, meta, metaTone, badge, badgeTone = 'ruby', price, feature, featureLabel, large }: Props) {
  return (
    <Link to={to} className={s.card} data-feature={feature || undefined} data-reveal onPointerMove={sheen}>
      {photo && <img className={s.glow} src={photo} alt="" aria-hidden="true" loading="lazy" decoding="async" />}
      <span className={s.frame} data-parallax>
        {photo
          ? (large && photoFallback
            ? <Img key={photoFallback} src={photoFallback} fallback={photo} alt={`${brand} ${model}`} className={s.photo} />
            : <Img key={photo} src={photo} fallback={photoFallback} alt={`${brand} ${model}`} className={s.photo} />)
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

/** Grille de cartes : en mosaïque (grandes et petites cartes) dès cinq montres, simple en dessous. */
export function WatchGrid({ children, cols }: { children: React.ReactNode; cols?: 3 }) {
  const mosaic = Children.count(children) >= 5;
  return (
    <div className={s.wrap}>
      <div className={s.grid} data-variant={mosaic ? 'mosaic' : undefined} data-cols={cols}>
        {mosaic
          ? Children.map(children, (child, i) => (isValidElement(child) && (i % 10 === 0 || i % 10 === 6)
            ? cloneElement(child as ReactElement<Props>, { large: true })
            : child))
          : children}
      </div>
    </div>
  );
}
