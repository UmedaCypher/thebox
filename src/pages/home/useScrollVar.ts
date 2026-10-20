import { useEffect } from 'react';
import type { RefObject } from 'react';

/**
 * Suit l'avancée du défilement à travers un élément (0 quand son haut atteint le haut de l'écran,
 * 1 quand son bas atteint le bas) et l'écrit dans la variable CSS --p de l'élément.
 * mode 'enter' : 0 quand l'élément entre par le bas, 1 quand son centre atteint le centre de l'écran.
 * Aucune mise à jour React à chaque image : le style suit directement.
 */
export function useScrollVar(ref: RefObject<HTMLElement | null>, opts: { mode?: 'pin' | 'enter'; onChange?: (p: number) => void } = {}) {
  const { mode = 'pin', onChange } = opts;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      let p: number;
      if (mode === 'pin') p = -r.top / Math.max(1, r.height - vh);
      else p = (vh - r.top) / (vh / 2 + r.height / 2);
      p = Math.min(1, Math.max(0, p));
      el.style.setProperty('--p', p.toFixed(4));
      onChange?.(p);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref, mode, onChange]);
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}
