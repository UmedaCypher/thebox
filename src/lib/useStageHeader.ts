import { useEffect } from 'react';

/**
 * En-tête discret au-dessus d'une photo pleine largeur (accueil, fiche montre) sur téléphone :
 * transparent en haut de page, il reprend son verre dès qu'on a fait défiler la photo.
 */
export function useStageHeader(active: boolean, threshold = 120) {
  useEffect(() => {
    if (!active) return;
    const root = document.documentElement;
    root.dataset.homeStage = '';
    const onScroll = () => { root.toggleAttribute('data-home-scrolled', window.scrollY > threshold); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      delete root.dataset.homeStage;
      root.removeAttribute('data-home-scrolled');
    };
  }, [active, threshold]);
}
