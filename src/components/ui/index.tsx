import { lockScroll } from '../../lib/motion';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, Ref, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { pageTitle } from '../Layout/pageTitle';
import type { LinkProps } from 'react-router-dom';
import { ChevronLeft, Watch as WatchIcon, X } from 'lucide-react';
import { useStrings } from '../../i18n';
import { COMMON } from '../../i18n/common';
import s from './ui.module.css';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
interface BtnStyle { variant?: Variant; size?: 'md' | 'small'; block?: boolean }

const btnClass = ({ variant = 'primary', size = 'md', block }: BtnStyle, extra?: string) =>
  cx(s.btn, s[variant], size === 'small' && s.small, block && s.block, extra);

export function Button({ variant, size, block, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & BtnStyle) {
  return <button type="button" className={btnClass({ variant, size, block }, className)} data-liquid {...rest} />;
}

export function LinkButton({ variant, size, block, className, ...rest }: LinkProps & BtnStyle) {
  return <Link className={btnClass({ variant, size, block }, className)} data-liquid {...rest} />;
}

export function IconButton({ label, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return <button type="button" aria-label={label} title={label} className={cx(s.iconBtn, className)} {...rest} />;
}

/* ---------- Champs ---------- */

interface FieldShell { label: string; hint?: ReactNode; error?: string | null; optional?: boolean; className?: string }

function Shell({ id, label, hint, error, optional, className, children }: FieldShell & { id: string; children: ReactNode }) {
  const t = useStrings(COMMON);
  return (
    <div className={cx(s.field, className)}>
      <label htmlFor={id} className={s.label}>
        {label}{optional && <span className={s.optional}> {t.optional}</span>}
      </label>
      {children}
      {hint && !error && <span className={s.hint} id={`${id}-hint`}>{hint}</span>}
      {error && <span className={s.error} role="alert">{error}</span>}
    </div>
  );
}

export function TextField({ label, hint, error, optional, className, suffix, ...rest }: FieldShell & InputHTMLAttributes<HTMLInputElement> & { suffix?: string }) {
  const id = useId();
  const input = <input id={id} className={s.control} aria-describedby={hint ? `${id}-hint` : undefined} aria-invalid={Boolean(error)} {...rest} />;
  return (
    <Shell id={id} label={label} hint={hint} error={error} optional={optional} className={className}>
      {suffix ? <div className={s.suffixWrap}>{input}<span className={s.suffix}>{suffix}</span></div> : input}
    </Shell>
  );
}

/** Option d'une liste de saisie : la valeur, et une indication discrète à droite (fabricant, nombre…). */
export interface ComboOption { value: string; hint?: string }

const comboKey = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Champ texte avec suggestions, dans le style de l'app (remplace la liste blanche native des navigateurs).
 * La saisie reste libre ; on filtre sans tenir compte des accents ni de la ponctuation, les débuts de mot en premier.
 */
export function Combobox({ label, hint, error, optional, className, options, value, onValueChange, maxResults = 8, ...rest }:
  FieldShell & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'list'> & {
    options: ComboOption[]; value: string; onValueChange: (v: string) => void; maxResults?: number;
  }) {
  const id = useId();
  const listId = `${id}-list`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listRef = useRef<HTMLUListElement>(null);

  const matches = useMemo(() => {
    const q = comboKey(value);
    if (!q) return options.slice(0, 50);
    const starts: ComboOption[] = [], inside: ComboOption[] = [];
    for (const o of options) {
      const k = comboKey(o.value);
      if (k === q) continue; // déjà saisie telle quelle
      if (k.startsWith(q)) starts.push(o); else if (k.includes(q)) inside.push(o);
    }
    return [...starts, ...inside].slice(0, maxResults);
  }, [options, value, maxResults]);

  const shown = open && matches.length > 0;
  useEffect(() => { setActive(-1); }, [value]);
  useEffect(() => {
    if (active >= 0) listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const pick = (v: string) => { onValueChange(v); setOpen(false); };

  return (
    <Shell id={id} label={label} hint={hint} error={error} optional={optional} className={className}>
      <div className={s.combo}>
        <input id={id} className={s.control} role="combobox" aria-autocomplete="list" aria-expanded={shown} aria-controls={listId}
          aria-activedescendant={shown && active >= 0 ? `${listId}-${active}` : undefined}
          aria-describedby={hint ? `${id}-hint` : undefined} aria-invalid={Boolean(error)} autoComplete="off"
          {...rest} value={value}
          onChange={e => { onValueChange(e.target.value); setOpen(true); }}
          onFocus={e => {
            setOpen(true); rest.onFocus?.(e);
            // Téléphone : si la liste n'a pas la place sous le champ (clavier ouvert), on remonte le champ
            const el = e.currentTarget;
            window.setTimeout(() => {
              const bottom = window.visualViewport?.height ?? window.innerHeight;
              if (bottom - el.getBoundingClientRect().bottom < 240) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
            }, 300);
          }}
          onBlur={e => { setOpen(false); rest.onBlur?.(e); }}
          onKeyDown={e => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive(a => Math.min(a + 1, matches.length - 1)); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, -1)); }
            else if (e.key === 'Enter' && shown && active >= 0) { e.preventDefault(); pick(matches[active].value); }
            else if (e.key === 'Escape' && shown) { e.preventDefault(); setOpen(false); }
            rest.onKeyDown?.(e);
          }} />
        {shown && (
          // pointerdown sans perte du focus : le clic choisit l'option avant que le champ ne se ferme
          <ul id={listId} ref={listRef} role="listbox" className={s.comboList} onPointerDown={e => e.preventDefault()}>
            {matches.map((o, i) => (
              <li key={o.value} id={`${listId}-${i}`} role="option" aria-selected={i === active}
                className={s.comboOption} onClick={() => pick(o.value)} onPointerEnter={() => setActive(i)}>
                <span className={s.comboValue}>{o.value}</span>
                {o.hint && <span className={s.comboHint}>{o.hint}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Shell>
  );
}

export function SelectField({ label, hint, error, optional, className, options, placeholder, ...rest }:
  FieldShell & SelectHTMLAttributes<HTMLSelectElement> & { options: (string | { value: string; label: string })[]; placeholder?: string }) {
  const id = useId();
  const t = useStrings(COMMON);
  return (
    <Shell id={id} label={label} hint={hint} error={error} optional={optional} className={className}>
      <select id={id} className={s.control} {...rest}>
        <option value="">{placeholder ?? t.choose}</option>
        {options.map(o => typeof o === 'string'
          ? <option key={o} value={o}>{o}</option>
          : <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Shell>
  );
}

export function TextArea({ label, hint, error, optional, className, ...rest }: FieldShell & TextareaHTMLAttributes<HTMLTextAreaElement> & { ref?: Ref<HTMLTextAreaElement> }) {
  const id = useId();
  return (
    <Shell id={id} label={label} hint={hint} error={error} optional={optional} className={className}>
      <textarea id={id} className={s.control} {...rest} />
    </Shell>
  );
}

export function Toggle({ label, description, checked, onChange, disabled }:
  { label: string; description?: ReactNode; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  const id = useId();
  return (
    <label className={s.toggleRow} htmlFor={id}>
      <span className={s.toggleText}>
        <span className={s.label}>{label}</span>
        {description && <span className={s.hint}>{description}</span>}
      </span>
      <span className={s.toggle}>
        <input id={id} type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={e => onChange(e.target.checked)} />
        <span className={s.track} />
      </span>
    </label>
  );
}

export function Segmented<T extends string>({ value, onChange, options, label }:
  { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string }) {
  return (
    <div className={s.segmented} role="tablist" aria-label={label}>
      {options.map(o => (
        <button key={o.value} type="button" role="tab" aria-selected={value === o.value} className={s.segment} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Feuille modale ---------- */

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const t = useStrings(COMMON);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    lockScroll(true);
    ref.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      lockScroll(false);
      prev?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className={s.sheetBackdrop} onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={s.sheet} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <div className={s.grabber} />
        <div className={s.sheetHead}>
          <h2 className={s.sheetTitle}>{title}</h2>
          <IconButton label={t.close} onClick={onClose}><X size={20} strokeWidth={1.6} /></IconButton>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------- Mise en page ---------- */

/**
 * En-tête de page. Sur téléphone, le nom de la page est déjà dans la barre du haut :
 * un titre identique n'est pas répété (il reste lu par les lecteurs d'écran et Google).
 * `hideTitleOnMobile` force ce comportement quand la barre du haut affiche la rubrique (ex. « Social »).
 */
export function PageHeader({ title, subtitle, action, back, hideTitleOnMobile }:
  { title: ReactNode; subtitle?: ReactNode; action?: ReactNode; back?: { to: string; label: string }; hideTitleOnMobile?: boolean }) {
  const { pathname } = useLocation();
  const same = hideTitleOnMobile
    || (typeof title === 'string' && title.trim().toLocaleLowerCase() === pageTitle(pathname).toLocaleLowerCase());
  return (
    <header className={s.pageHeader} data-mobile-title={same ? 'hidden' : undefined}>
      <div className={s.pageHeaderText}>
        {back && <Link to={back.to} className={s.back}><ChevronLeft size={16} strokeWidth={1.6} />{back.label}</Link>}
        <h1 className={same ? s.mobileHiddenTitle : undefined}>{title}</h1>
        {subtitle && <p className={s.pageSubtitle}>{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className={s.empty}>
      <h2>{title}</h2>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'error' | 'ok'; children: ReactNode }) {
  return <div className={s.notice} data-tone={tone} role={tone === 'error' ? 'alert' : 'status'}>{children}</div>;
}

export function Loading({ label }: { label?: string }) {
  const t = useStrings(COMMON);
  return <p className={s.loading} role="status">{label ?? t.loading}</p>;
}

export function Stat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className={s.stat}>
      <span className={s.statValue}>{value}</span>
      <span className={s.statLabel}>{label}</span>
    </div>
  );
}

export function PremiumTag() {
  return <span className={s.premiumTag}>Premium</span>;
}

/* ---------- Coussin ---------- */

/** Image qui bascule une fois sur une source de secours si la première manque (ex. miniature absente). */
export function Img({ src, fallback, alt, className }: { src: string; fallback?: string | null; alt: string; className?: string }) {
  return (
    <img
      src={src} alt={alt} className={className} loading="lazy" decoding="async"
      onError={e => {
        const img = e.currentTarget;
        if (fallback && img.dataset.fallback !== '1') { img.dataset.fallback = '1'; img.src = fallback; }
      }}
    />
  );
}

/** Lueur d'ambiance : la photo diffuse sa propre couleur autour de ce qu'elle entoure. */
export function Glow({ src, children, className }: { src?: string | null; children: ReactNode; className?: string }) {
  return (
    <div className={cx(s.glowWrap, className)}>
      {src && <img className={s.glowImg} src={src} alt="" aria-hidden="true" decoding="async" />}
      {children}
    </div>
  );
}

export function Cushion({ src, fallbackSrc, alt, ratio = 'square', className, children }:
  { src?: string | null; fallbackSrc?: string | null; alt: string; ratio?: 'square' | 'portrait' | 'wide'; className?: string; children?: ReactNode }) {
  const r = ratio === 'portrait' ? s.ratioPortrait : ratio === 'wide' ? s.ratioWide : s.ratioSquare;
  return (
    <div className={cx(s.cushion, r, className)}>
      {src
        ? <Img key={src} src={src} fallback={fallbackSrc} alt={alt} />
        : !children && <span className={s.cushionEmpty} aria-label={alt}><WatchIcon size={36} strokeWidth={1.2} /></span>}
      {children}
    </div>
  );
}
