import { useEffect, useState } from 'react';
import { BellRing, X } from 'lucide-react';
import { Button } from '../ui';
import { defineStrings, useStrings } from '../../i18n';
import { enablePush, getPushState } from '../../lib/push';
import { useToast } from '../Toast/Toast';
import s from './Notifications.module.css';

const S = defineStrings({
  title: 'Être prévenu des nouveaux messages',
  text: 'Une notification sur cet appareil quand un membre vous répond.',
  enable: 'Activer',
  later: 'Plus tard',
  done: 'Notifications activées.',
}, {
  title: 'Get notified of new messages',
  text: 'A notification on this device when a member replies.',
  enable: 'Turn on',
  later: 'Later',
  done: 'Notifications turned on.',
});

const KEY = 'thebox-push-prompt-dismissed';

/** Propose d'activer les notifications au moment où elles servent : dans la messagerie, une seule fois. */
export default function PushPrompt() {
  const t = useStrings(S);
  const toast = useToast();
  const [show, setShow] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try { dismissed = localStorage.getItem(KEY) === '1'; } catch { /* stockage indisponible */ }
    if (dismissed) return;
    getPushState().then(st => setShow(st === 'off')).catch(() => {});
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(KEY, '1'); } catch { /* stockage indisponible */ }
    setShow(false);
  };
  const enable = async () => {
    try {
      const st = await enablePush();
      if (st === 'on') toast(t.done);
    } catch { /* l'utilisateur pourra réessayer depuis le Profil */ }
    dismiss();
  };

  if (!show) return null;
  return (
    <aside className={`panel ${s.prompt}`} data-tone="ruby" aria-label={t.title}>
      <span className={s.promptIcon} aria-hidden="true"><BellRing size={18} strokeWidth={1.8} /></span>
      <p className={s.promptText}><strong>{t.title}</strong>{t.text}</p>
      <span className={s.promptActions}>
        <Button size="small" variant="secondary" onClick={enable}>{t.enable}</Button>
        <button type="button" className={s.close} onClick={dismiss} aria-label={t.later} title={t.later}><X size={18} /></button>
      </span>
    </aside>
  );
}
