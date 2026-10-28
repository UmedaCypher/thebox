import s from './Fill.module.css';

/** Valeur légale à afficher ; tant qu'elle manque, un repère surligné « à compléter » (src/lib/legal.ts). */
export default function Fill({ v, label }: { v: string | null | undefined; label: string }) {
  return v ? <>{v}</> : <mark className={s.todo}>[à compléter : {label}]</mark>;
}
