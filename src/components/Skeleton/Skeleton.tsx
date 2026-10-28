import type { CSSProperties } from 'react';
import { useStrings } from '../../i18n';
import { COMMON } from '../../i18n/common';
import s from './Skeleton.module.css';

/**
 * Silhouettes de chargement : la page garde sa forme pendant que les données arrivent
 * (pas de saut de mise en page, et une attente qui paraît plus courte).
 */
function Status() {
  const t = useStrings(COMMON);
  return <span className="visually-hidden" role="status">{t.loading}</span>;
}

export function Bone({ w, h, r, style }: { w?: string | number; h?: string | number; r?: string; style?: CSSProperties }) {
  return <span className={s.bone} aria-hidden="true" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

/** En-tête de page : un titre et une ligne. */
export function SkeletonHeader({ withStats = false }: { withStats?: boolean }) {
  return (
    <div className={s.header} aria-hidden="true">
      <Bone w="min(60%, 320px)" h={44} r="var(--r-sm)" />
      <Bone w="min(80%, 420px)" h={14} />
      {withStats && (
        <div className={s.stats}>{[0, 1, 2].map(i => <span key={i}><Bone w={64} h={30} /><Bone w={84} h={12} /></span>)}</div>
      )}
    </div>
  );
}

/** Grille de montres (collection, marché, profil public). */
export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className={s.grid}>
      <Status />
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={s.card} aria-hidden="true">
          <Bone h="auto" r="var(--r-cushion)" style={{ aspectRatio: '4 / 5', width: '100%' }} />
          <Bone w="40%" h={12} />
          <Bone w="75%" h={18} />
        </div>
      ))}
    </div>
  );
}

/** Liste avec vignette (messages, actualités, wishlist). */
export function SkeletonList({ rows = 5, thumb = 48, round = false }: { rows?: number; thumb?: number; round?: boolean }) {
  return (
    <div className={s.list}>
      <Status />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={s.row} aria-hidden="true">
          <Bone w={thumb} h={thumb} r={round ? '50%' : 'var(--r-md)'} style={{ flex: 'none' }} />
          <span className={s.rowText}><Bone w={`${70 - (i % 3) * 12}%`} h={14} /><Bone w={`${45 + (i % 2) * 20}%`} h={12} /></span>
        </div>
      ))}
    </div>
  );
}

/** Fiche : grande photo et blocs de texte (montre, passeport). */
export function SkeletonDetail() {
  return (
    <div className={s.detail}>
      <Status />
      <Bone h="auto" r="var(--r-cushion)" style={{ aspectRatio: '4 / 5', width: '100%', maxWidth: 460 }} />
      <div className={s.detailText} aria-hidden="true">
        <Bone w={90} h={12} />
        <Bone w="70%" h={42} r="var(--r-sm)" />
        <Bone w="40%" h={16} />
        <Bone w="100%" h={46} r="var(--r-pill)" style={{ marginTop: 'var(--sp-3)' }} />
        <div className={s.specs}>{Array.from({ length: 6 }, (_, i) => <span key={i}><Bone w="45%" h={10} /><Bone w="70%" h={14} /></span>)}</div>
      </div>
    </div>
  );
}

/** Calendrier de portage. */
export function SkeletonCalendar() {
  return (
    <div className={s.calendar}>
      <Status />
      {Array.from({ length: 35 }, (_, i) => <Bone key={i} h="auto" r="50%" style={{ aspectRatio: '1', width: '100%' }} />)}
    </div>
  );
}

/** Page complète par défaut : en-tête puis grille. */
export function SkeletonPage({ kind = 'grid' }: { kind?: 'grid' | 'list' | 'detail' }) {
  return (
    <div className="page">
      {kind === 'detail' ? <SkeletonDetail /> : <><SkeletonHeader />{kind === 'grid' ? <SkeletonGrid /> : <SkeletonList />}</>}
    </div>
  );
}
