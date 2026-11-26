import { Component, type ErrorInfo, type ReactNode } from 'react';
import s from './ErrorBoundary.module.css';

/**
 * Filet de sécurité : une erreur dans un écran ne laisse plus une page blanche.
 * React n'offre ce mécanisme qu'en composant de classe (exception à la règle « composants fonction »).
 * Cas fréquent après une mise en ligne : un morceau de l'ancienne version n'existe plus
 * (« Failed to fetch dynamically imported module ») ; recharger suffit.
 */
interface Props { children: ReactNode }
interface State { error: Error | null }

const fr = navigator.language?.toLowerCase().startsWith('fr') ?? true;
const T = fr
  ? { title: 'Un souci est survenu', body: 'Cet écran n’a pas pu s’afficher. Rechargez la page ; si le problème revient, écrivez-nous.', reload: 'Recharger', home: 'Retour à l’accueil' }
  : { title: 'Something went wrong', body: 'This screen could not be displayed. Reload the page; if it happens again, write to us.', reload: 'Reload', home: 'Back to home' };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Arcora] Erreur d’affichage', error, info.componentStack);
    // Nouvelle version en ligne pendant la visite : un seul rechargement automatique
    if (/dynamically imported module|Importing a module script failed|ChunkLoadError/i.test(error.message)) {
      try {
        if (!sessionStorage.getItem('arcora-chunk-reload')) {
          sessionStorage.setItem('arcora-chunk-reload', '1');
          window.location.reload();
        }
      } catch { /* stockage indisponible : l'écran d'erreur reste affiché */ }
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className={s.wrap} role="alert">
        <h1 className={s.title}>{T.title}</h1>
        <p className={s.body}>{T.body}</p>
        <div className={s.actions}>
          <button type="button" className={s.primary} onClick={() => window.location.reload()}>{T.reload}</button>
          <a className={s.link} href="/">{T.home}</a>
        </div>
      </main>
    );
  }
}
