// client/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Session, User, AuthChangeEvent, AuthError, Subscription } from '@supabase/supabase-js'; // Ajout de Subscription
import { supabase } from '../lib/supabaseClient'; // Assurez-vous que ce chemin est correct

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean; 
  signOut: () => Promise<void>;
  authError: AuthError | null; 
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

    // Écoute les changements d'état d'authentification
    // la variable 'authListener' ici est en fait l'objet contenant la souscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, newSession: Session | null) => {
        console.log('AuthContext: Changement d\'état d\'authentification:', _event, newSession);
        setAuthError(null); 
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false); 
      }
    );

    // Nettoyage de l'écouteur
    return () => {
      // On appelle unsubscribe sur l'objet 'subscription'
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
