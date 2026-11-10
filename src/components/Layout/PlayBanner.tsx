import { useState } from 'react';
import { Smartphone, X } from 'lucide-react';
import { isAndroidApp } from '../../lib/platform';
import { defineStrings, useLang, useStrings } from '../../i18n';
import s from './PlayBanner.module.css';

export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.arcorawatch.app';
const KEY = 'arcora-play-banner-closed';

const S = defineStrings({
  title: 'Arcora sur Android',
  text: 'Votre écrin dans la poche, et le Wrist Check en un geste.',
  cta: 'Disponible sur Google Play',
  close: 'Masquer',
}, {
  title: 'Arcora on Android',
  text: 'Your collection in your pocket, and the Wrist Check in one tap.',
  cta: 'Get it on Google Play',
  close: 'Hide',
});

const closed = () => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } };

/** Mini bannière (ordinateur) vers l'app du Play Store ; glisse depuis le bas, se masque pour de bon. */
export default function PlayBanner() {
  const t = useStrings(S);
  const { lang } = useLang();
  const [hidden, setHidden] = useState(closed);
  if (hidden || isAndroidApp()) return null;
  const close = () => { try { localStorage.setItem(KEY, '1'); } catch { /* stockage indisponible */ } setHidden(true); };
  return (
    <aside className={s.banner} aria-label={t.title}>
      <span className={s.icon} aria-hidden="true"><Smartphone size={20} strokeWidth={1.6} /></span>
      <span className={s.text}><strong>{t.title}</strong>{t.text}</span>
      <a className={s.cta} href={`${PLAY_STORE_URL}&hl=${lang}`} target="_blank" rel="noopener noreferrer">{t.cta}</a>
      <button type="button" className={s.close} onClick={close} aria-label={t.close} title={t.close}><X size={16} strokeWidth={2} /></button>
    </aside>
  );
}
