import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Button, Notice, TextField } from '../../components/ui';
import { defineStrings, tr, useStrings } from '../../i18n';
import { COMMON } from '../../i18n/common';
import s from './AuthPages.module.css';

const S = defineStrings({
  errors: {
    invalidLogin: 'Adresse e-mail ou mot de passe incorrect.',
    notConfirmed: "Confirmez d'abord votre adresse avec le lien reçu par e-mail.",
    alreadyRegistered: 'Un compte existe déjà avec cette adresse.',
    passwordShort: 'Le mot de passe doit contenir au moins 8 caractères.',
    linkExpired: 'Ce lien a expiré. Demandez-en un nouveau.',
  },
  email: 'Adresse e-mail',
  password: 'Mot de passe',
  passwordHint: 'Au moins 8 caractères.',
  login: {
    title: 'Se connecter',
    noAccount: 'Pas encore de compte ?',
    createAccount: 'Créer un compte',
    busy: 'Connexion…',
    submit: 'Se connecter',
    forgot: 'Mot de passe oublié',
  },
  signup: {
    checkTitle: 'Vérifiez vos e-mails',
    backToLogin: 'Retour à la connexion',
    sentBefore: 'Un lien de confirmation a été envoyé à ',
    sentAfter: '. Ouvrez-le pour activer votre compte.',
    title: 'Créer un compte',
    already: 'Déjà inscrit ?',
    login: 'Se connecter',
    busy: 'Création…',
    submit: 'Créer mon compte',
    legalBefore: 'En créant un compte, vous confirmez avoir 18 ans ou plus et acceptez les ',
    terms: "conditions d'utilisation",
    legalMiddle: ' et la ',
    privacy: 'politique de confidentialité',
    legalAfter: '.',
  },
  forgot: {
    title: 'Mot de passe oublié',
    sentBefore: 'Si un compte existe pour ',
    sentAfter: ', vous allez recevoir un lien pour choisir un nouveau mot de passe.',
    busy: 'Envoi…',
    submit: 'Recevoir le lien',
  },
  reset: {
    title: 'Nouveau mot de passe',
    newLink: 'Demander un nouveau lien',
    label: 'Nouveau mot de passe',
    submit: 'Enregistrer le mot de passe',
  },
}, {
  errors: {
    invalidLogin: 'Incorrect email address or password.',
    notConfirmed: 'Please confirm your email address first, using the link we sent you.',
    alreadyRegistered: 'An account already exists with this email address.',
    passwordShort: 'Your password must be at least 8 characters long.',
    linkExpired: 'This link has expired. Please request a new one.',
  },
  email: 'Email address',
  password: 'Password',
  passwordHint: 'At least 8 characters.',
  login: {
    title: 'Sign in',
    noAccount: 'No account yet?',
    createAccount: 'Create an account',
    busy: 'Signing in…',
    submit: 'Sign in',
    forgot: 'Forgot your password?',
  },
  signup: {
    checkTitle: 'Check your inbox',
    backToLogin: 'Back to sign in',
    sentBefore: 'We sent a confirmation link to ',
    sentAfter: '. Open it to activate your account.',
    title: 'Create an account',
    already: 'Already have an account?',
    login: 'Sign in',
    busy: 'Creating…',
    submit: 'Create my account',
    legalBefore: 'By creating an account, you confirm you are 18 or older and accept the ',
    terms: 'terms of use',
    legalMiddle: ' and the ',
    privacy: 'privacy policy',
    legalAfter: '.',
  },
  forgot: {
    title: 'Forgot your password?',
    sentBefore: 'If an account exists for ',
    sentAfter: ", you'll receive a link to choose a new password.",
    busy: 'Sending…',
    submit: 'Send me the link',
  },
  reset: {
    title: 'New password',
    newLink: 'Request a new link',
    label: 'New password',
    submit: 'Save password',
  },
});

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
  const e = tr(S).errors;
  if (m === 'Invalid login credentials') return e.invalidLogin;
  if (m === 'Email not confirmed') return e.notConfirmed;
  if (m.includes('already registered')) return e.alreadyRegistered;
  if (m.includes('Password should be')) return e.passwordShort;
  return m;
};

export function LoginPage() {
  const t = useStrings(S);
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
    <AuthShell title={t.login.title} foot={<>{t.login.noAccount} <Link to="/signup">{t.login.createAccount}</Link></>}>
      <form onSubmit={submit} className={s.form}>
        {error && <Notice tone="error">{error}</Notice>}
        <TextField label={t.email} type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required />
        <TextField label={t.password} type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required />
        <Button type="submit" block disabled={busy}>{busy ? t.login.busy : t.login.submit}</Button>
        <Link to="/mot-de-passe-oublie" className={s.subtle}>{t.login.forgot}</Link>
      </form>
    </AuthShell>
  );
}

export function SignupPage() {
  const t = useStrings(S);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError(t.errors.passwordShort); return; }
    setBusy(true); setError(null);
    const { error: err } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: `${window.location.origin}/collection` } });
    setBusy(false);
    if (err) setError(translate(err.message)); else setSent(true);
  };

  if (sent) {
    return (
      <AuthShell title={t.signup.checkTitle} foot={<Link to="/login">{t.signup.backToLogin}</Link>}>
        <p className={s.text}>{t.signup.sentBefore}<strong>{email.trim()}</strong>{t.signup.sentAfter}</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t.signup.title} foot={<>{t.signup.already} <Link to="/login">{t.signup.login}</Link></>}>
      <form onSubmit={submit} className={s.form}>
        {error && <Notice tone="error">{error}</Notice>}
        <TextField label={t.email} type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required />
        <TextField label={t.password} type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} hint={t.passwordHint} required />
        <Button type="submit" block disabled={busy}>{busy ? t.signup.busy : t.signup.submit}</Button>
        <p className={s.legal}>{t.signup.legalBefore}<Link to="/cgu">{t.signup.terms}</Link>{t.signup.legalMiddle}<Link to="/confidentialite">{t.signup.privacy}</Link>{t.signup.legalAfter}</p>
      </form>
    </AuthShell>
  );
}

export function ForgotPasswordPage() {
  const t = useStrings(S);
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
    <AuthShell title={t.forgot.title} foot={<Link to="/login">{t.signup.backToLogin}</Link>}>
      {sent ? (
        <p className={s.text}>{t.forgot.sentBefore}<strong>{email.trim()}</strong>{t.forgot.sentAfter}</p>
      ) : (
        <form onSubmit={submit} className={s.form}>
          {error && <Notice tone="error">{error}</Notice>}
          <TextField label={t.email} type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <Button type="submit" block disabled={busy}>{busy ? t.forgot.busy : t.forgot.submit}</Button>
        </form>
      )}
    </AuthShell>
  );
}

export function NewPasswordPage() {
  const t = useStrings(S);
  const c = useStrings(COMMON);
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError(t.errors.passwordShort); return; }
    setBusy(true); setError(null);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) setError(err.message.includes('session') ? t.errors.linkExpired : err.message);
    else navigate('/collection', { replace: true });
  };

  return (
    <AuthShell title={t.reset.title} foot={<Link to="/mot-de-passe-oublie">{t.reset.newLink}</Link>}>
      <form onSubmit={submit} className={s.form}>
        {error && <Notice tone="error">{error}</Notice>}
        <TextField label={t.reset.label} type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} hint={t.passwordHint} required />
        <Button type="submit" block disabled={busy}>{busy ? c.saving : t.reset.submit}</Button>
      </form>
    </AuthShell>
  );
}
