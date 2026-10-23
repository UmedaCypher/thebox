import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { CalendarDays, MessageCircle, Watch } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { saveProfile } from '../../lib/api';
import { defineStrings, useStrings } from '../../i18n';
import type { LangChoice } from '../../i18n';
import { COMMON } from '../../i18n/common';
import { useLanguageSetting } from '../../i18n/useLanguageSetting';
import { formatDecimal } from '../../lib/format';
import { Button, LinkButton, Notice, Segmented, TextField, Toggle } from '../../components/ui';
import s from './OnboardingPage.module.css';

const S = defineStrings({
  steps: ['Bienvenue', 'Profil', 'Première montre'],
  stepOf: (i: number, n: number) => `Étape ${i} sur ${n}`,
  welcomeTitle: 'Bienvenue dans votre écrin',
  welcomeLead: 'The Box garde la trace de vos montres, de leur histoire et du temps passé au poignet.',
  values: [
    { title: 'Votre collection', text: 'Chaque montre avec ses photos, ses papiers et son passeport à partager.' },
    { title: 'Votre portage', text: 'Notez ce que vous portez et découvrez ce que chaque montre vous coûte vraiment.' },
    { title: 'Entre collectionneurs', text: 'La galerie au poignet, le Marché et la messagerie.' },
  ],
  language: 'Langue',
  continue: 'Continuer',
  profileTitle: 'Votre profil',
  profileLead: 'Votre pseudo est la seule chose que les autres membres voient de vous. Vous pourrez tout changer plus tard.',
  username: 'Pseudo',
  usernameHint: '3 à 30 caractères : lettres, chiffres, point ou tiret bas.',
  usernameInvalid: 'Le pseudo doit faire 3 à 30 caractères : lettres, chiffres, point ou tiret bas.',
  wrist: 'Tour de poignet',
  wristHint: 'Il aide les autres à se projeter quand vous partagez une photo au poignet.',
  wristInvalid: 'Le tour de poignet doit être compris entre 12 et 26 cm.',
  publicLabel: 'Profil public',
  publicHint: 'Votre pseudo et les photos de vos montres deviennent visibles. Les prix restent toujours privés.',
  messagesLabel: 'Accepter les messages',
  messagesHint: 'Les membres peuvent vous écrire depuis vos annonces et votre profil public.',
  firstTitle: 'Votre première montre',
  firstLead: 'Commencez par celle que vous portez le plus. Une photo, une marque, un modèle : le reste peut attendre.',
  addFirst: 'Ajouter ma première montre',
  later: 'Plus tard',
}, {
  steps: ['Welcome', 'Profile', 'First watch'],
  stepOf: (i, n) => `Step ${i} of ${n}`,
  welcomeTitle: 'Welcome to your watch box',
  welcomeLead: 'The Box keeps track of your watches, their story and the time they spend on your wrist.',
  values: [
    { title: 'Your collection', text: 'Every watch with its photos, papers and a passport you can share.' },
    { title: 'Your wear log', text: 'Log what you wear and find out what each watch really costs you.' },
    { title: 'Among collectors', text: 'The wrist gallery, the Market and messages.' },
  ],
  language: 'Language',
  continue: 'Continue',
  profileTitle: 'Your profile',
  profileLead: 'Your username is the only thing other members see about you. You can change everything later.',
  username: 'Username',
  usernameHint: '3 to 30 characters: letters, numbers, dot or underscore.',
  usernameInvalid: 'Your username must be 3 to 30 characters: letters, numbers, dot or underscore.',
  wrist: 'Wrist size',
  wristHint: 'It helps others picture a watch when you share a wrist shot.',
  wristInvalid: 'Wrist size must be between 12 and 26 cm.',
  publicLabel: 'Public profile',
  publicHint: 'Your username and watch photos become visible. Prices always stay private.',
  messagesLabel: 'Accept messages',
  messagesHint: 'Members can write to you from your listings and your public profile.',
  firstTitle: 'Your first watch',
  firstLead: 'Start with the one you wear most. A photo, a brand, a model: the rest can wait.',
  addFirst: 'Add my first watch',
  later: 'Later',
});

const ICONS = [Watch, CalendarDays, MessageCircle];

/** Accueil à la première connexion : langue, profil, première montre. */
export default function OnboardingPage() {
  const t = useStrings(S);
  const c = useStrings(COMMON);
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { choice, change } = useLanguageSetting();
  const [step, setStep] = useState(0);
  const suggested = typeof user?.user_metadata?.username === 'string' ? user.user_metadata.username : '';
  const [f, setF] = useState({
    username: profile?.username ?? suggested,
    wrist: profile?.wrist_size_cm ? formatDecimal(profile.wrist_size_cm) : '',
    is_public: Boolean(profile?.is_public),
    messages: profile?.allow_private_messages !== false,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Accueil déjà terminé (ou colonne absente) : direction la collection.
  if (profile && profile.onboarded_at !== null && step === 0) return <Navigate to="/collection" replace />;

  const saveProfileStep = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const username = f.username.trim();
    if (!/^[a-z0-9._]{3,30}$/i.test(username)) { setError(t.usernameInvalid); return; }
    const wrist = f.wrist.trim() ? Number(f.wrist.replace(',', '.')) : null;
    if (wrist !== null && (!Number.isFinite(wrist) || wrist < 12 || wrist > 26)) { setError(t.wristInvalid); return; }
    setSaving(true);
    try {
      await saveProfile(user!.id, {
        username, wrist_size_cm: wrist, is_public: f.is_public, allow_private_messages: f.messages,
        onboarded_at: new Date().toISOString(),
      }, Boolean(profile));
      await refreshProfile();
      setStep(2);
    } catch (x) {
      setError(x instanceof Error ? x.message : c.error);
    } finally { setSaving(false); }
  };

  return (
    <div className={s.page}>
      <div className={s.card}>
        <ol className={s.dots} aria-label={t.stepOf(step + 1, 3)}>
          {t.steps.map((label, i) => <li key={label} data-state={i < step ? 'done' : i === step ? 'current' : 'next'} aria-current={i === step ? 'step' : undefined}><span className="visually-hidden">{label}</span></li>)}
        </ol>

        {step === 0 && (
          <section className={s.step}>
            <h1>{t.welcomeTitle}</h1>
            <p className={s.lead}>{t.welcomeLead}</p>
            <ul className={s.values}>
              {t.values.map((v, i) => {
                const Icon = ICONS[i];
                return (
                  <li key={v.title}>
                    <span className={s.icon} aria-hidden="true"><Icon size={20} strokeWidth={1.6} /></span>
                    <span><strong>{v.title}</strong>{v.text}</span>
                  </li>
                );
              })}
            </ul>
            <div className={s.field}>
              <span className={s.label}>{t.language}</span>
              <Segmented label={t.language} value={choice} onChange={(v: LangChoice) => change(v)}
                options={[{ value: 'auto', label: c.language.auto }, { value: 'fr', label: 'Français' }, { value: 'en', label: 'English' }]} />
            </div>
            <Button block onClick={() => setStep(1)}>{t.continue}</Button>
          </section>
        )}

        {step === 1 && (
          <form className={s.step} onSubmit={saveProfileStep} noValidate>
            <h1>{t.profileTitle}</h1>
            <p className={s.lead}>{t.profileLead}</p>
            {error && <Notice tone="error">{error}</Notice>}
            <TextField label={t.username} value={f.username} onChange={e => setF({ ...f, username: e.target.value })}
              hint={t.usernameHint} autoCapitalize="none" autoComplete="username" required autoFocus />
            <TextField label={t.wrist} optional inputMode="decimal" suffix="cm" value={f.wrist}
              onChange={e => setF({ ...f, wrist: e.target.value })} hint={t.wristHint} />
            <Toggle label={t.publicLabel} description={t.publicHint} checked={f.is_public} onChange={v => setF({ ...f, is_public: v })} />
            <Toggle label={t.messagesLabel} description={t.messagesHint} checked={f.messages} onChange={v => setF({ ...f, messages: v })} />
            <div className={s.actions}>
              <Button type="submit" block disabled={saving}>{saving ? c.saving : t.continue}</Button>
              <Button variant="ghost" onClick={() => setStep(0)}>{c.back}</Button>
            </div>
          </form>
        )}

        {step === 2 && (
          <section className={s.step}>
            <h1>{t.firstTitle}</h1>
            <p className={s.lead}>{t.firstLead}</p>
            <div className={s.actions}>
              <LinkButton to="/ajouter-montre" block replace>{t.addFirst}</LinkButton>
              <Button variant="ghost" onClick={() => navigate('/collection', { replace: true })}>{t.later}</Button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
