import { Link } from 'react-router-dom';
import { Cushion } from '../ui';
import s from './WatchCard.module.css';

interface Props {
  to: string;
  brand: string;
  model: string;
  photo: string | null;
  photoFallback?: string | null;
  meta?: string | null;
}

/** Une montre posée dans son coussin, son nom dessous. */
export default function WatchCard({ to, brand, model, photo, photoFallback, meta }: Props) {
  return (
    <Link to={to} className={s.card}>
      <Cushion src={photo} fallbackSrc={photoFallback} alt={`${brand} ${model}`} ratio="portrait" />
      <span className={s.text}>
        <span className={s.brand}>{brand}</span>
        <span className={s.model}>{model}</span>
        {meta && <span className={s.meta}>{meta}</span>}
      </span>
    </Link>
  );
}

export function WatchGrid({ children }: { children: React.ReactNode }) {
  return <div className={s.grid}>{children}</div>;
}
