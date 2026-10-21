import { useEffect, useId, useRef } from 'react';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { Link } from 'react-router-dom';
import type { LinkProps } from 'react-router-dom';
import { ChevronLeft, Watch as WatchIcon, X } from 'lucide-react';
import s from './ui.module.css';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
interface BtnStyle { variant?: Variant; size?: 'md' | 'small'; block?: boolean }

const btnClass = ({ variant = 'primary', size = 'md', block }: BtnStyle, extra?: string) =>
  cx(s.btn, s[variant], size === 'small' && s.small, block && s.block, extra);

export function Button({ variant, size, block, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & BtnStyle) {
  return <button type="button" className={btnClass({ variant, size, block }, className)} {...rest} />;
}

export function LinkButton({ variant, size, block, className, ...rest }: LinkProps & BtnStyle) {
  return <Link className={btnClass({ variant, size, block }, className)} {...rest} />;
}

export function IconButton({ label, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return <button type="button" aria-label={label} title={label} className={cx(s.iconBtn, className)} {...rest} />;
}

/* ---------- Champs ---------- */

interface FieldShell { label: string; hint?: ReactNode; error?: string | null; optional?: boolean; className?: string }

function Shell({ id, label, hint, error, optional, className, children }: FieldShell & { id: string; children: ReactNode }) {
  return (
    <div className={cx(s.field, className)}>
      <label htmlFor={id} className={s.label}>
        {label}{optional && <span className={s.optional}> (facultatif)</span>}
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

export function SelectField({ label, hint, error, optional, className, options, placeholder = 'Choisir…', ...rest }:
  FieldShell & SelectHTMLAttributes<HTMLSelectElement> & { options: (string | { value: string; label: string })[]; placeholder?: string }) {
  const id = useId();
  return (
    <Shell id={id} label={label} hint={hint} error={error} optional={optional} className={className}>
      <select id={id} className={s.control} {...rest}>
        <option value="">{placeholder}</option>
        {options.map(o => typeof o === 'string'
          ? <option key={o} value={o}>{o}</option>
          : <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Shell>
  );
}

export function TextArea({ label, hint, error, optional, className, ...rest }: FieldShell & TextareaHTMLAttributes<HTMLTextAreaElement>) {
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
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
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
          <IconButton label="Fermer" onClick={onClose}><X size={20} strokeWidth={1.6} /></IconButton>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------- Mise en page ---------- */

export function PageHeader({ title, subtitle, action, back }:
  { title: ReactNode; subtitle?: ReactNode; action?: ReactNode; back?: { to: string; label: string } }) {
  return (
    <header className={s.pageHeader}>
      <div className={s.pageHeaderText}>
        {back && <Link to={back.to} className={s.back}><ChevronLeft size={16} strokeWidth={1.6} />{back.label}</Link>}
        <h1>{title}</h1>
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

export function Loading({ label = 'Chargement…' }: { label?: string }) {
  return <p className={s.loading} role="status">{label}</p>;
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

export function Cushion({ src, alt, ratio = 'square', className, children }:
  { src?: string | null; alt: string; ratio?: 'square' | 'portrait' | 'wide'; className?: string; children?: ReactNode }) {
  const r = ratio === 'portrait' ? s.ratioPortrait : ratio === 'wide' ? s.ratioWide : s.ratioSquare;
  return (
    <div className={cx(s.cushion, r, className)}>
      {src
        ? <img src={src} alt={alt} loading="lazy" decoding="async" />
        : !children && <span className={s.cushionEmpty} aria-label={alt}><WatchIcon size={36} strokeWidth={1.2} /></span>}
      {children}
    </div>
  );
}
