import { useCallback, useState } from 'react';

export type Theme = 'ecrin' | 'soie';
const KEY = 'thebox-theme';

const read = (): Theme => {
  try { return localStorage.getItem(KEY) === 'soie' ? 'soie' : 'ecrin'; } catch { return 'ecrin'; }
};

/** Thème « écrin » (sombre, par défaut) ou « soie » (clair), mémorisé sur l'appareil. */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(read);
  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try { localStorage.setItem(KEY, t); } catch { /* stockage indisponible */ }
    if (t === 'soie') document.documentElement.setAttribute('data-theme', 'soie');
    else document.documentElement.removeAttribute('data-theme');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'soie' ? '#efe8dc' : '#1f0e11');
  }, []);
  return { theme, setTheme };
}
