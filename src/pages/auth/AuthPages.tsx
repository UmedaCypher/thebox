import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Button, Notice, TextField } from '../../components/ui';
import s from './AuthPages.module.css';

function AuthShell({ title, children, foot }: { title: string; children: ReactNode; foot?: ReactNode }) {
  return (
    <div className={s.wrap}>
      <div className={s.card}>
        <h1 className={s.title}>{title}</h1>
        {children}
      </div>
      {foot && <p className={s.foot}>{foot}</p>}
    </div>
  );
}

const translate = (m: string) => {
  if (m === 'Invalid login credentials') return 'Adresse e-mail ou mot de passe incorrect.';
  if (m === 'Email not confirmed') return "Confirmez d'abord votre adresse avec le lien reçu par e-mail.";
  if (m.includes('already registered')) return 'Un compte existe déjà avec cette adresse.';
  if (m.includes('Password should be')) return 'Le mot de passe doit contenir au moins 8 caractères.';
  return m;
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/collection';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (err) setError(translate(err.message));
    else navigate(from, { replace: true });
  };

  return (
    <AuthShell title="Se connecter" foot={<>Pas encore de compte ? <Link to="/signup">Créer un compte</Link></>}>
      <form onSubmit={submit} className={s.form}>
        {error && <Notice tone="error">{error}</Notice>}
        <TextField label="Adresse e-mail" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required />
        <TextField label="Mot de passe" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required />
        <Button type="submit" block disabled={busy}>{busy ? 'Connexion…' : 'Se connecter'}</Button>
        <Link to="/mot-de-passe-oublie" className={s.subtle}>Mot de passe oublié</Link>
      </form>
    </AuthShell>
  );
}

export function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return; }
    setBusy(true); setError(null);
    const { error: err } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: `${window.location.origin}/collection` } });
    setBusy(false);
    if (err) setError(translate(err.message)); else setSent(true);
  };

  if (sent) {
    return (
      <AuthShell title="Vérifiez vos e-mails" foot={<Link to="/login">Retour à la connexion</Link>}>
        <p className={s.text}>Un lien de confirmation a été envoyé à <strong>{email.trim()}</strong>. Ouvrez-le pour activer votre compte.</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Créer un compte" foot={<>Déjà inscrit ? <Link to="/login">Se connecter</Link></>}>
      <form onSubmit={submit} className={s.form}>
        {error && <Notice tone="error">{error}</Notice>}
        <TextField label="Adresse e-mail" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required />
        <TextField label="Mot de passe" type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} hint="Au moins 8 caractères." required />
        <Button type="submit" block disabled={busy}>{busy ? 'Création…' : 'Créer mon compte'}</Button>
        <p className={s.legal}>En créant un compte, vous acceptez les <Link to="/cgu">conditions d'utilisation</Link> et la <Link to="/confidentialite">politique de confidentialité</Link>.</p>
      </form>
    </AuthShell>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/nouveau-mot-de-passe` });
    setBusy(false);
    if (err) setError(err.message); else setSent(true);
  };

  return (
    <AuthShell title="Mot de passe oublié" foot={<Link to="/login">Retour à la connexion</Link>}>
      {sent ? (
        <p className={s.text}>Si un compte existe pour <strong>{email.trim()}</strong>, vous allez recevoir un lien pour choisir un nouveau mot de passe.</p>
      ) : (
        <form onSubmit={submit} className={s.form}>
          {error && <Notice tone="error">{error}</Notice>}
          <TextField label="Adresse e-mail" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <Button type="submit" block disabled={busy}>{busy ? 'Envoi…' : 'Recevoir le lien'}</Button>
        </form>
      )}
    </AuthShell>
  );
}

export function NewPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return; }
    setBusy(true); setError(null);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) setError(err.message.includes('session') ? 'Ce lien a expiré. Demandez-en un nouveau.' : err.message);
    else navigate('/collection', { replace: true });
  };

  return (
    <AuthShell title="Nouveau mot de passe" foot={<Link to="/mot-de-passe-oublie">Demander un nouveau lien</Link>}>
      <form onSubmit={submit} className={s.form}>
        {error && <Notice tone="error">{error}</Notice>}
        <TextField label="Nouveau mot de passe" type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} hint="Au moins 8 caractères." required />
        <Button type="submit" block disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer le mot de passe'}</Button>
      </form>
    </AuthShell>
  );
}
