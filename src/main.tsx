import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LangProvider } from './i18n';
import { captureSource } from './lib/source';
import './index.css';

captureSource();

// eslint-disable-next-line react-refresh/only-export-components
function WithLang() {
  const { profile } = useAuth();
  return <LangProvider profileChoice={profile?.preferred_language}><App /></LangProvider>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <WithLang />
    </AuthProvider>
  </StrictMode>,
);
