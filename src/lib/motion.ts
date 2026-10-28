import { useEffect } from 'react';
import Lenis from 'lenis';

/**
 * Mouvement « premium » :
 * - ordinateur (souris, écran large) : défilement avec inertie et parallaxe des photos ;
 * - partout : les éléments marqués data-reveal apparaissent quand ils entrent à l'écran.
 * Rien de tout cela si l'utilisateur a demandé à réduire les animations.
 */

const DESKTOP = '(min-width: 860px) and (hover: hover) and (pointer: fine)';
const REDUCED = '(prefers-reduced-motion: reduce)';

let lenis: Lenis | null = null;

/** Remonte en haut de page, en tenant compte du défilement avec inertie. */
export function scrollToTop() {
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  else window.scrollTo(0, 0);
}

export function scrollToElement(el: Element) {
  if (lenis) lenis.scrollTo(el as HTMLElement, { offset: -100 });
  else el.scrollIntoView({ behavior: 'smooth' });
}

/** Bloque le défilement de la page (feuille ouverte). */
export function lockScroll(on: boolean) {
  if (!lenis) return;
  if (on) lenis.stop(); else lenis.start();
}

export function useMotion() {
  useEffect(() => {
    const root = document.documentElement;
    if (window.matchMedia(REDUCED).matches) return;
    root.classList.add('motion');

    // --- Apparition au défilement (mobile et ordinateur) ---
    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        // Léger décalage selon la position horizontale : les cartes d'une même rangée arrivent en vague.
        const delay = Math.min(240, Math.round((e.boundingClientRect.left / window.innerWidth) * 260));
        el.style.setProperty('--reveal-delay', `${delay}ms`);
        el.dataset.in = 'true';
        io.unobserve(el);
      }
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });

    const watched = new WeakSet<Element>();
    const scan = () => {
      document.querySelectorAll('[data-reveal]:not([data-in])').forEach(el => {
        if (!watched.has(el)) { watched.add(el); io.observe(el); }
      });
    };
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });

    // --- Inertie et parallaxe (ordinateur seulement) ---
    let raf = 0;
    const desktop = window.matchMedia(DESKTOP).matches;
    if (desktop) {
      root.classList.add('parallax');
      lenis = new Lenis({
        lerp: 0.11, wheelMultiplier: 0.95, smoothWheel: true,
        // Les zones qui défilent seules (feuilles, listes de messages, panneau de recherche) gardent leur défilement natif.
        prevent: node => {
          if (!(node instanceof HTMLElement)) return false;
          if (node.matches('[role="dialog"], [data-scroll-own], textarea')) return true;
          if (node.scrollHeight <= node.clientHeight + 1) return false;
          return /(auto|scroll)/.test(getComputedStyle(node).overflowY);
        },
      });
      const tick = (time: number) => {
        lenis?.raf(time);
        const vh = window.innerHeight;
        document.querySelectorAll<HTMLElement>('[data-parallax]').forEach(el => {
          const r = el.getBoundingClientRect();
          if (r.bottom < -100 || r.top > vh + 100) return;
          // -1 en haut de l'écran, +1 en bas
          const p = Math.max(-1, Math.min(1, ((r.top + r.height / 2) - vh / 2) / (vh / 2 + r.height / 2)));
          el.style.setProperty('--p', p.toFixed(3));
        });
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }

    return () => {
      io.disconnect(); mo.disconnect(); cancelAnimationFrame(raf);
      lenis?.destroy(); lenis = null;
      root.classList.remove('motion', 'parallax');
    };
  }, []);
}
