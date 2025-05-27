// client/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Votre composant App principal
import { AuthProvider } from './contexts/AuthContext'; // Importez le AuthProvider
import './index.css'; // Vos styles globaux

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <AuthProvider> {/* Enveloppez App avec AuthProvider */}
        <App />
      </AuthProvider>
    </React.StrictMode>
  );
} else {
  console.error("L'élément racine avec l'ID 'root' n'a pas été trouvé dans le DOM.");
}
