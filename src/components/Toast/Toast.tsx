import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Check, CircleAlert, X } from 'lucide-react';
import { useStrings } from '../../i18n';
import { COMMON } from '../../i18n/common';
import s from './Toast.module.css';

type Tone = 'ok' | 'error' | 'info';
interface Toast { id: number; text: string; tone: Tone; leaving?: boolean }

const ToastContext = createContext<(text: string, tone?: Tone) => void>(() => {});

/** Confirmation discrète en bas d'écran après une action (« Montre ajoutée », « Profil enregistré »…). */
// eslint-disable-next-line react-refresh/only-export-components
export function useToast() { return useContext(ToastContext); }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);
  const t = useStrings(COMMON);

  const dismiss = useCallback((id: number) => {
    setToasts(list => list.map(x => (x.id === id ? { ...x, leaving: true } : x)));
    setTimeout(() => setToasts(list => list.filter(x => x.id !== id)), 180);
  }, []);

  const show = useCallback((text: string, tone: Tone = 'ok') => {
    const id = ++seq.current;
    setToasts(list => [...list.slice(-2), { id, text, tone }]);
    setTimeout(() => dismiss(id), tone === 'error' ? 5200 : 3200);
  }, [dismiss]);

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={s.stack} role="status" aria-live="polite">
        {toasts.map(x => (
          <div key={x.id} className={s.toast} data-tone={x.tone} data-leaving={x.leaving}>
            <span className={s.icon} aria-hidden="true">{x.tone === 'error' ? <CircleAlert size={18} strokeWidth={1.8} /> : <Check size={18} strokeWidth={2.2} />}</span>
            <span className={s.text}>{x.text}</span>
            <button type="button" className={s.close} onClick={() => dismiss(x.id)} aria-label={t.close}><X size={16} strokeWidth={2} /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
