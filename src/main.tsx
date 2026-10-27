import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LangProvider } from './i18n';
import { ToastProvider } from './components/Toast/Toast';
import { captureSource } from './lib/source';
import './index.css';

captureSource();

// eslint-disable-next-line react-refresh/only-export-components
function WithLang() {
  const { profile } = useAuth();
  return <LangProvider profileChoice={profile?.preferred_language}><ToastProvider><App /></ToastProvider></LangProvider>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <WithLang />
    </AuthProvider>
  </StrictMode>,
);
