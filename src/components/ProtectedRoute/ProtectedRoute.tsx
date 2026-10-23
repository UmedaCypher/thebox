import type { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loading } from '../ui';

export default function ProtectedRoute({ children }: { children: ReactElement }) {
  const { user, loading, profile } = useAuth();
  const location = useLocation();
  if (loading) return <div className="page"><Loading /></div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  // Première connexion : l'accueil passe avant le reste (onboarded_at vide ; absent si la migration n'est pas passée).
  if (profile && profile.onboarded_at === null && location.pathname !== '/bienvenue') return <Navigate to="/bienvenue" replace />;
  return children;
}
