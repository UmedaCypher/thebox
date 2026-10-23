import { getLocale } from '../i18n';

const nf = (opts: Intl.NumberFormatOptions) => new Intl.NumberFormat(getLocale(), opts);

export const formatEuros = (n: number | null | undefined, cents = false): string =>
  n === null || n === undefined || Number.isNaN(n) ? '—'
    : nf({ style: 'currency', currency: 'EUR', minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 }).format(n);

export const formatNumber = (n: number, digits = 0) => nf({ maximumFractionDigits: digits }).format(n);

export const formatDate = (iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }) => {
  if (!iso) return '—';
  const d = iso.length === 10 ? new Date(iso + 'T12:00:00') : new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString(getLocale(), opts);
};

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit' });

/** Date locale au format AAAA-MM-JJ (pas d'UTC : « aujourd'hui » doit être celui de l'utilisateur). */
export const toISODate = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export const todayISO = () => toISODate(new Date());

export const daysBetween = (fromISO: string, to: Date = new Date()) => {
  const a = new Date(fromISO + 'T12:00:00').getTime();
  const b = new Date(toISODate(to) + 'T12:00:00').getTime();
  return Math.round((b - a) / 86_400_000);
};

/** « 3 montres » : le nombre formaté selon la langue, puis le mot au singulier ou au pluriel. */
export const plural = (n: number, one: string, many: string) => `${formatNumber(n)} ${Math.abs(n) > 1 || (getLocale() !== 'fr-FR' && n === 0) ? many : one}`;

/** Décimales à la française ou à l'anglaise (16,5 / 16.5). */
export const formatDecimal = (n: number | string) => (getLocale() === 'fr-FR' ? String(n).replace('.', ',') : String(n));

export const formatMm = (n: number | null | undefined) =>
  n === null || n === undefined ? null : `${formatDecimal(n)} mm`;
