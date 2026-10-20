import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthError, Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { fetchProfile } from '../lib/api';
import type { Profile } from '../types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  authError: AuthError | null;
  profile: Profile | null;
  isPremium: boolean;
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
    isPremium: profile?.plan === 'premium' || profile?.account_type === 'admin',
    signOut, refreshUser, refreshProfile,
  }), [session, user, loading, authError, profile, signOut, refreshUser, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
  return ctx;
}
