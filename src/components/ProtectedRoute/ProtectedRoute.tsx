// client/src/components/ProtectedRoute/ProtectedRoute.tsx
// ASSUREZ-VOUS QUE CE FICHIER EST BIEN À CET EMPLACEMENT

import React, { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
// Le chemin vers AuthContext dépend de l'endroit où vous avez placé AuthContext.tsx
// Si AuthContext.tsx est dans src/contexts/AuthContext.tsx, alors :
import { useAuth } from '../../contexts/AuthContext'; 

interface ProtectedRouteProps {
  children: ReactElement; 
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth(); 
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <p>Vérification de l'authentification...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute; // Assurez-vous de l'export par défaut
