import { useState } from 'react';
import type { FormEvent } from 'react';
import { joinWaitlist } from '../../lib/api';
import { readSource } from '../../lib/source';
import { Button, SelectField, TextField, Toggle } from '../ui';
import { defineStrings, useStrings } from '../../i18n';
import s from './WaitlistForm.module.css';

const COUNT_VALUES = ['0', '1-2', '3-5', '6-10', '11+'] as const;

const S = defineStrings({
  counts: ['Aucune pour l’instant', '1 ou 2', '3 à 5', '6 à 10', 'Plus de 10'],
  invalidEmail: 'Saisissez une adresse e-mail valide.',
  failed: 'Inscription impossible pour le moment.',
  doneTitle: "C'est noté.",
  doneText: (email: string) => `Nous vous écrirons à ${email} à l'ouverture. Un seul e-mail, pas de lettre d'information.`,
  email: 'Adresse e-mail',
  emailPlaceholder: 'vous@exemple.fr',
  count: 'Combien de montres possédez-vous ?',
  premium: 'Me prévenir aussi pour Premium',
  sending: 'Inscription…',
  submit: 'Rejoindre la liste d’attente',
}, {
  counts: ['None yet', '1 or 2', '3 to 5', '6 to 10', 'More than 10'],
  invalidEmail: 'Please enter a valid email address.',
  failed: 'We could not sign you up right now.',
  doneTitle: "You're on the list.",
  doneText: email => `We'll write to ${email} when we open. Just one email, no newsletter.`,
  email: 'Email address',
  emailPlaceholder: 'you@example.com',
  count: 'How many watches do you own?',
  premium: 'Tell me about Premium too',
  sending: 'Joining…',
  submit: 'Join the waitlist',
});

export default function WaitlistForm({ premiumDefault = false, compact = false }: { premiumDefault?: boolean; compact?: boolean }) {
  const t = useStrings(S);
  const COUNTS = COUNT_VALUES.map((value, i) => ({ value, label: t.counts[i] }));
  const [email, setEmail] = useState('');
  const [count, setCount] = useState('');
  const [premium, setPremium] = useState(premiumDefault);
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) { setError(t.invalidEmail); return; }
    setState('sending');
    try {
      await joinWaitlist({ email, watch_count: count || null, interested_in_premium: premium, source: readSource() });
      setState('done');
    } catch (x) {
      setError(x instanceof Error ? x.message : t.failed);
      setState('idle');
    }
  };

  if (state === 'done') {
    return (
      <div className={`panel ${s.done}`} data-tone="lume" role="status">
        <strong>{t.doneTitle}</strong>
        <span>{t.doneText(email.trim())}</span>
      </div>
    );
  }

  return (
    <form className={`${s.form} ${compact ? s.compact : ''}`} onSubmit={submit} noValidate>
      <TextField label={t.email} type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} error={error} placeholder={t.emailPlaceholder} />
      <SelectField label={t.count} optional options={COUNTS} value={count} onChange={e => setCount(e.target.value)} />
      <Toggle label={t.premium} checked={premium} onChange={setPremium} />
      <Button type="submit" disabled={state === 'sending'}>{state === 'sending' ? t.sending : t.submit}</Button>
    </form>
  );
}
