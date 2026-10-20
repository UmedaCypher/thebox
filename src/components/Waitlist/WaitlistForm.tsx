import { useState } from 'react';
import type { FormEvent } from 'react';
import { joinWaitlist } from '../../lib/api';
import { readSource } from '../../lib/source';
import { Button, SelectField, TextField, Toggle } from '../ui';
import s from './WaitlistForm.module.css';


const COUNTS = [
  { value: '0', label: 'Aucune pour l’instant' },
  { value: '1-2', label: '1 ou 2' },
  { value: '3-5', label: '3 à 5' },
  { value: '6-10', label: '6 à 10' },
  { value: '11+', label: 'Plus de 10' },
];

export default function WaitlistForm({ premiumDefault = false, compact = false }: { premiumDefault?: boolean; compact?: boolean }) {
  const [email, setEmail] = useState('');
  const [count, setCount] = useState('');
  const [premium, setPremium] = useState(premiumDefault);
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) { setError('Saisissez une adresse e-mail valide.'); return; }
    setState('sending');
    try {
      await joinWaitlist({ email, watch_count: count || null, interested_in_premium: premium, source: readSource() });
      setState('done');
    } catch (x) {
      setError(x instanceof Error ? x.message : 'Inscription impossible pour le moment.');
      setState('idle');
    }
  };

  if (state === 'done') {
    return (
      <div className={s.done} role="status">
        <strong>C'est noté.</strong>
        <span>Nous vous écrirons à {email.trim()} à l'ouverture. Un seul e-mail, pas de lettre d'information.</span>
      </div>
    );
  }

  return (
    <form className={`${s.form} ${compact ? s.compact : ''}`} onSubmit={submit} noValidate>
      <TextField label="Adresse e-mail" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} error={error} placeholder="vous@exemple.fr" />
      <SelectField label="Combien de montres possédez-vous ?" optional options={COUNTS} value={count} onChange={e => setCount(e.target.value)} />
      <Toggle label="Me prévenir aussi pour Premium" checked={premium} onChange={setPremium} />
      <Button type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Inscription…' : 'Rejoindre la liste d’attente'}</Button>
    </form>
  );
}
