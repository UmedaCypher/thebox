// client/src/contexts/AuthContext.tsx (Corrigé)
// import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'; // <--- AVANT pour ReactNode
import React, { createContext, useContext, useState, useEffect } from 'react';          // <--- APRÈS
import type { ReactNode } from 'react';                                                  // <--- APRÈS (ReactNode importé comme type)
// import type { Session, User, AuthChangeEvent, AuthError, Subscription } from '@supabase/supabase-js'; // <--- AVANT pour Subscription
import type { Session, User, AuthChangeEvent, AuthError } from '@supabase/supabase-js'; // <--- APRÈS (Subscription supprimé)
import { supabase } from '../lib/supabaseClient';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  authError: AuthError | null;
  refreshUser?: () => Promise<void>; // Ajouté pour l'erreur de UserProfilePage, marquez-le comme optionnel si pas toujours implémenté
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<AuthError | null>(null);

  const refreshUserData = async () => { // Exemple de fonction refreshUser
    const { data: { session: currentSession }, error } = await supabase.auth.refreshSession();
    // Ou supabase.auth.getUser() si vous voulez juste rafraîchir les données utilisateur
    if (error) {
      console.error("AuthContext: Erreur lors du rafraîchissement de la session:", error);
      setAuthError(error);
    }
    setSession(currentSession);
    setUser(currentSession?.user ?? null);
  };


  useEffect(() => {
    setLoading(true);
    setAuthError(null);

    supabase.auth.getSession().then(({ data: { session: currentSession }, error }) => {
      if (error) {
        console.error("AuthContext: Erreur lors de la récupération de la session initiale:", error);
        setAuthError(error);
      }
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    }).catch(error => {
      console.error("AuthContext: Catch - Erreur lors de la récupération de la session initiale:", error);
      setAuthError(error as AuthError);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, newSession: Session | null) => {
        console.log('AuthContext: Changement d\'état d\'authentification:', _event, newSession);
        setAuthError(null);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    setLoading(true);
    setAuthError(null);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('AuthContext: Erreur lors de la déconnexion:', error);
      setAuthError(error);
    }
    setLoading(false);
  };

  const value = {
    session,
    user,
    loading,
    signOut: handleSignOut,
    authError,
    refreshUser: refreshUserData, // Exposer la fonction refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
};