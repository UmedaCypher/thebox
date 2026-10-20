const eur0 = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const eur2 = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatEuros = (n: number | null | undefined, cents = false): string =>
  n === null || n === undefined || Number.isNaN(n) ? '—' : (cents ? eur2 : eur0).format(n);

export const formatDate = (iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }) => {
  if (!iso) return '—';
  const d = iso.length === 10 ? new Date(iso + 'T12:00:00') : new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('fr-FR', opts);
};

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

export const plural = (n: number, one: string, many: string) => `${n.toLocaleString('fr-FR')} ${n > 1 ? many : one}`;

export const formatMm = (n: number | null | undefined) =>
  n === null || n === undefined ? null : `${String(n).replace('.', ',')} mm`;
