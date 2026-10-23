import { useEffect, useState } from 'react';
import { getUnreadCount, subscribeToMessages, UNREAD_REFRESH } from '../lib/api';

/** Nombre de messages non lus : en direct, au retour sur l'onglet, et toutes les minutes en secours. */
export function useUnreadCount(enabled: boolean, pathname: string) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) { setCount(0); return; }
    let alive = true;
    const refresh = () => { getUnreadCount().then(n => { if (alive) setCount(n); }); };
    refresh();
    const unsub = subscribeToMessages(() => setTimeout(refresh, 400));
    const id = setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, 60_000);
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener(UNREAD_REFRESH, refresh);
    return () => {
      alive = false; unsub(); clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener(UNREAD_REFRESH, refresh);
    };
  }, [enabled]);

  // Changement de page : petit rafraîchissement (ex. après lecture d'une conversation).
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    getUnreadCount().then(n => { if (alive) setCount(n); });
    return () => { alive = false; };
  }, [enabled, pathname]);

  return count;
}
