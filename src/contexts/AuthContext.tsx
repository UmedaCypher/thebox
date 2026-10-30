import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthError, Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { fetchProfile, getMyReferrals, recordSignup } from '../lib/api';
import { readRef, readSource } from '../lib/source';
import type { Profile } from '../types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  authError: AuthError | null;
  profile: Profile | null;
  isPremium: boolean;
  /** Fin du Premium offert (parrainage, geste), s'il y en a un en cours. */
  premiumUntil: string | null;
  /** Inscrit pendant la bêta : badge « membre fondateur ». */
  founder: boolean;
  refreshPerks: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const user = session?.user ?? null;

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) setAuthError(error);
      setSession(data.session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) { setProfile(null); return; }
    try {
      setProfile(await fetchProfile(user.id));
    } catch {
      setProfile(null);
    }
  }, [user]);

  useEffect(() => { refreshProfile(); }, [refreshProfile]);

  // Premium offert et statut fondateur. À la première connexion, on enregistre l'inscription
  // (provenance, lien de parrainage suivi) : c'est elle qui déclenche le Premium de bienvenue.
  const [perks, setPerks] = useState<{ premiumUntil: string | null; founder: boolean }>({ premiumUntil: null, founder: false });
  const refreshPerks = useCallback(async () => {
    if (!user) { setPerks({ premiumUntil: null, founder: false }); return; }
    const flag = `arcora-signup-${user.id}`;
    let recorded = false;
    try { recorded = localStorage.getItem(flag) === '1'; } catch { /* stockage indisponible */ }
    if (!recorded && await recordSignup(readRef(), readSource())) {
      try { localStorage.setItem(flag, '1'); } catch { /* stockage indisponible */ }
    }
    const r = await getMyReferrals();
    setPerks({ premiumUntil: r?.premium_until ?? null, founder: Boolean(r?.founder) });
  }, [user]);
  useEffect(() => { refreshPerks(); }, [refreshPerks]);

  const refreshUser = useCallback(async () => {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) setAuthError(error);
    if (data.session) setSession(data.session);
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) setAuthError(error);
    setProfile(null);
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    session, user, loading, authError, profile,
    isPremium: profile?.plan === 'premium' || profile?.account_type === 'admin'
      || (perks.premiumUntil !== null && new Date(perks.premiumUntil).getTime() > Date.now()),
    premiumUntil: perks.premiumUntil,
    founder: perks.founder,
    signOut, refreshUser, refreshProfile, refreshPerks,
  }), [session, user, loading, authError, profile, perks, signOut, refreshUser, refreshProfile, refreshPerks]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
  return ctx;
}
