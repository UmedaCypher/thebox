import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { saveProfile } from '../lib/api';
import { syncPushLanguage } from '../lib/push';
import { useLang } from '.';
import type { LangChoice } from '.';

/** Change la langue : sur l'appareil tout de suite, et dans le profil pour les membres (suivi d'un appareil à l'autre). */
export function useLanguageSetting() {
  const { user, profile, refreshProfile } = useAuth();
  const { choice, setChoice } = useLang();

  const change = useCallback(async (c: LangChoice) => {
    setChoice(c);
    if (!user) return;
    // Les notifications de cet appareil suivent la nouvelle langue (une fois l'app remontée dans cette langue).
    setTimeout(() => { syncPushLanguage().catch(() => {}); }, 0);
    try {
      await saveProfile(user.id, { preferred_language: c === 'auto' ? null : c }, Boolean(profile));
      await refreshProfile();
    } catch { /* la langue reste changée sur cet appareil */ }
  }, [user, profile, setChoice, refreshProfile]);

  return { choice, change };
}
