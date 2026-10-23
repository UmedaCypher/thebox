import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AppError, startConversation } from '../../lib/api';
import { defineStrings, useStrings } from '../../i18n';
import { Button, LinkButton, Notice } from '../ui';

const S = defineStrings({
  signIn: 'Se connecter pour écrire',
  openError: 'Impossible d\'ouvrir la conversation.',
  opening: 'Ouverture…',
  chooseUsername: 'Choisir un pseudo',
}, {
  signIn: 'Sign in to send a message',
  openError: 'We couldn’t open the conversation.',
  opening: 'Opening…',
  chooseUsername: 'Choose a username',
});

/** Ouvre la conversation avec le vendeur d'une montre ou avec un membre au profil public. */
export default function ContactButton({ watchId, username, label, variant = 'primary' }:
  { watchId?: string; username?: string; label: string; variant?: 'primary' | 'secondary' }) {
  const t = useStrings(S);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AppError | Error | null>(null);

  if (!user) {
    return (
      <LinkButton to="/login" state={{ from: location }} variant={variant}>
        <MessageCircle size={18} strokeWidth={1.8} aria-hidden="true" />{t.signIn}
      </LinkButton>
    );
  }

  const go = async () => {
    setBusy(true); setError(null);
    try {
      const id = await startConversation({ watchId, username });
      navigate(`/messages/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(t.openError));
      setBusy(false);
    }
  };

  return (
    <>
      <Button variant={variant} onClick={go} disabled={busy}>
        <MessageCircle size={18} strokeWidth={1.8} aria-hidden="true" />{busy ? t.opening : label}
      </Button>
      {error && (
        <Notice tone="error">
          {error.message}{' '}
          {error instanceof AppError && error.code === 'USERNAME_REQUIRED' && <Link to="/profil">{t.chooseUsername}</Link>}
        </Notice>
      )}
    </>
  );
}
