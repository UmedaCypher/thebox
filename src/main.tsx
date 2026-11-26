import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LangProvider } from './i18n';
import { ToastProvider } from './components/Toast/Toast';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import { captureRef, captureSource } from './lib/source';
import { detectAndroidApp } from './lib/platform';
import './index.css';

captureSource();
captureRef();
detectAndroidApp();

// eslint-disable-next-line react-refresh/only-export-components
function WithLang() {
  const { profile } = useAuth();
  return <LangProvider profileChoice={profile?.preferred_language}><ToastProvider><App /></ToastProvider></LangProvider>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <WithLang />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);
