import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeftRight, Watch as WatchIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLoad } from '../../hooks/useLoad';
import { getPassport, listWatches, listWearLogs, mainPhoto, thumbSrc } from '../../lib/api';
import type { Passport, Watch } from '../../types';
import { EmptyState, Img, LinkButton, Loading, PageHeader, SelectField } from '../../components/ui';
import { defineStrings, useLang, useStrings } from '../../i18n';
import { movementLabel } from '../../i18n/common';
import { formatDate, formatEuros, formatMm, formatNumber } from '../../lib/format';
import { listingPrice } from '../../lib/listing';
import s from './ComparePage.module.css';

const S = defineStrings({
  title: 'Comparateur',
  subtitle: 'Deux montres côte à côte, caractéristique par caractéristique.',
  pick: 'Choisir une montre',
  slotA: 'Montre A', slotB: 'Montre B',
  swap: 'Inverser',
  fromMarket: 'Montre du Marché',
  empty: 'Ajoutez au moins deux montres à votre collection pour les comparer.',
  add: 'Ajouter une montre',
  diff: 'Différence',
  same: 'identique',
  rows: {
    reference: 'Référence', year: 'Année', movement: 'Mouvement', diameter: 'Diamètre', lugToLug: 'Corne à corne',
    lugWidth: 'Entrecorne', case: 'Boîtier', dial: 'Cadran', bracelet: 'Bracelet', condition: 'État', boxPapers: 'Boîte et papiers',
    price: 'Prix d’achat', value: 'Valeur déclarée', wears: 'Jours portée', costPerWear: 'Coût par port', lastService: 'Dernière révision',
    listing: 'Sur le Marché',
  },
  wristFit: (ok: string) => `Sur votre poignet : ${ok}`,
  privateNote: 'Prix, valeur et coût par port ne s’affichent que pour vos propres montres.',
}, {
  title: 'Compare',
  subtitle: 'Two watches side by side, spec by spec.',
  pick: 'Choose a watch',
  slotA: 'Watch A', slotB: 'Watch B',
  swap: 'Swap',
  fromMarket: 'Market watch',
  empty: 'Add at least two watches to your collection to compare them.',
  add: 'Add a watch',
  diff: 'Difference',
  same: 'same',
  rows: {
    reference: 'Reference', year: 'Year', movement: 'Movement', diameter: 'Diameter', lugToLug: 'Lug to lug',
    lugWidth: 'Lug width', case: 'Case', dial: 'Dial', bracelet: 'Strap', condition: 'Condition', boxPapers: 'Box and papers',
    price: 'Purchase price', value: 'Declared value', wears: 'Days worn', costPerWear: 'Cost per wear', lastService: 'Last service',
    listing: 'On the Market',
  },
  wristFit: (ok: string) => `On your wrist: ${ok}`,
  privateNote: 'Price, value and cost per wear only show for your own watches.',
});

type Side = { passport: Passport; own: Watch | null; wears: number };
type Row = { label: string; a: ReactNode; b: ReactNode; delta?: string | null; differs: boolean };

/** Écart numérique lisible : « +2 mm », « −1 an »… (null si l'une des valeurs manque ou s'il n'y a pas d'écart). */
const delta = (a: number | null | undefined, b: number | null | undefined, unit: (n: number) => string) => {
  if (a === null || a === undefined || b === null || b === undefined) return null;
  const d = Number(b) - Number(a);
  if (!d) return null;
  return `${d > 0 ? '+' : '−'}${unit(Math.abs(d))}`;
};

export default function ComparePage() {
  const t = useStrings(S);
  const { lang } = useLang();
  const { user } = useAuth();
  const uid = user!.id;
  const [params, setParams] = useSearchParams();
  const watches = useLoad(() => listWatches(uid), [uid]);
  const wears = useLoad(() => listWearLogs(uid), [uid]);
  const list = useMemo(() => watches.data ?? [], [watches.data]);

  // Montres choisies : ?a=…&b=… ; par défaut, les deux premières de la collection
  const aId = params.get('a') ?? list[0]?.id ?? null;
  const bId = params.get('b') ?? list.find(w => w.id !== aId)?.id ?? null;
  const set = (key: 'a' | 'b', id: string) => {
    const next = new URLSearchParams(params);
    next.set(key, id);
    if (!next.get(key === 'a' ? 'b' : 'a')) { const other = key === 'a' ? bId : aId; if (other) next.set(key === 'a' ? 'b' : 'a', other); }
    setParams(next, { replace: true });
  };
  const swap = () => { if (aId && bId) setParams({ a: bId, b: aId }, { replace: true }); };

  const [sides, setSides] = useState<{ a: Side | null; b: Side | null }>({ a: null, b: null });
  useEffect(() => {
    let alive = true;
    const load = async (id: string | null): Promise<Side | null> => {
      if (!id) return null;
      const own = list.find(w => w.id === id) ?? null;
      const passport = await getPassport(id).catch(() => null);
      if (!passport) return null;
      return { passport, own, wears: own ? (wears.data ?? []).filter(l => l.watch_id === id).length : passport.wear_count };
    };
    if (watches.loading) return;
    Promise.all([load(aId), load(bId)]).then(([a, b]) => { if (alive) setSides({ a, b }); });
    return () => { alive = false; };
  }, [aId, bId, list, wears.data, watches.loading]);

  if (watches.loading) return <div className="page"><Loading /></div>;
  const external = bId && !list.some(w => w.id === bId);
  if (list.length + (external ? 1 : 0) < 2) {
    return (
      <div className="page">
        <PageHeader title={t.title} subtitle={t.subtitle} />
        <EmptyState title={t.title} action={<LinkButton to="/ajouter-montre">{t.add}</LinkButton>}>{t.empty}</EmptyState>
      </div>
    );
  }

  const options = list.map(w => ({ value: w.id, label: `${w.brand} ${w.model}` }));
  const { a, b } = sides;
  const mm = (n: number) => `${formatNumber(n, 1)}\u00a0mm`;
  const rows: Row[] = [];
  if (a && b) {
    const P = (x: Side) => x.passport;
    const own = (x: Side) => x.own;
    const add = (label: string, va: ReactNode, vb: ReactNode, d?: string | null) =>
      rows.push({ label, a: va ?? '—', b: vb ?? '—', delta: d, differs: String(va ?? '') !== String(vb ?? '') });
    const r = t.rows;
    add(r.reference, P(a).reference_number, P(b).reference_number);
    add(r.year, P(a).year_of_production, P(b).year_of_production,
      delta(P(a).year_of_production, P(b).year_of_production, n => `${n}\u00a0${lang === 'fr' ? (n > 1 ? 'ans' : 'an') : (n > 1 ? 'yrs' : 'yr')}`));
    const mv = (p: Passport) => [movementLabel(p.movement, lang), p.caliber].filter(Boolean).join(' · ') || null;
    add(r.movement, mv(P(a)), mv(P(b)));
    add(r.diameter, formatMm(P(a).case_diameter_mm), formatMm(P(b).case_diameter_mm), delta(P(a).case_diameter_mm, P(b).case_diameter_mm, mm));
    add(r.lugToLug, formatMm(P(a).lug_to_lug_mm), formatMm(P(b).lug_to_lug_mm), delta(P(a).lug_to_lug_mm, P(b).lug_to_lug_mm, mm));
    add(r.lugWidth, formatMm(P(a).lug_width_mm), formatMm(P(b).lug_width_mm), delta(P(a).lug_width_mm, P(b).lug_width_mm, mm));
    add(r.case, P(a).case_material, P(b).case_material);
    add(r.dial, P(a).dial_color, P(b).dial_color);
    const br = (p: Passport) => [p.bracelet_material, p.bracelet_type].filter(Boolean).join(', ') || null;
    add(r.bracelet, br(P(a)), br(P(b)));
    add(r.condition, P(a).condition, P(b).condition);
    add(r.boxPapers, P(a).box_papers_status, P(b).box_papers_status);
    add(r.wears, formatNumber(a.wears), formatNumber(b.wears), delta(a.wears, b.wears, n => formatNumber(n)));
    add(r.lastService, P(a).last_service_on ? formatDate(P(a).last_service_on!) : null, P(b).last_service_on ? formatDate(P(b).last_service_on!) : null);
    const price = (x: Side) => (own(x)?.purchase_price ? Number(own(x)!.purchase_price) : null);
    const value = (x: Side) => (own(x)?.current_estimated_value ? Number(own(x)!.current_estimated_value) : null);
    if (own(a) || own(b)) {
      add(r.price, price(a) !== null ? formatEuros(price(a)) : null, price(b) !== null ? formatEuros(price(b)) : null,
        delta(price(a), price(b), n => formatEuros(n)));
      add(r.value, value(a) !== null ? formatEuros(value(a)) : null, value(b) !== null ? formatEuros(value(b)) : null,
        delta(value(a), value(b), n => formatEuros(n)));
      const cpw = (x: Side) => (price(x) && x.wears ? price(x)! / x.wears : null);
      add(r.costPerWear, cpw(a) !== null ? formatEuros(cpw(a), true) : null, cpw(b) !== null ? formatEuros(cpw(b), true) : null);
    }
    const lst = (p: Passport) => (p.listing ? listingPrice(p.listing.kind, p.listing.price) : null);
    if (P(a).listing || P(b).listing) add(r.listing, lst(P(a)), lst(P(b)));
  }

  const head = (side: Side | null, key: 'a' | 'b') => {
    const ph = side ? thumbSrc(mainPhoto(side.passport.photos)?.storage_path) : null;
    const isExternal = side && !side.own;
    return (
      <div className={s.slot}>
        <div className={s.photo}>{ph?.src ? <Img src={ph.src} fallback={ph.fallback} alt="" /> : <WatchIcon size={28} strokeWidth={1.3} aria-hidden="true" />}</div>
        {side && (
          <p className={s.name}>
            <span>{side.passport.brand}</span>
            <Link to={side.own ? `/montre/${side.passport.id}` : `/passeport/${side.passport.id}`}>{side.passport.model}</Link>
          </p>
        )}
        {isExternal
          ? <p className={s.tag}>{t.fromMarket}</p>
          : <SelectField label={key === 'a' ? t.slotA : t.slotB} value={(key === 'a' ? aId : bId) ?? ''}
              onChange={e => set(key, e.target.value)} options={options} placeholder={t.pick} />}
      </div>
    );
  };

  return (
    <div className="page">
      <PageHeader title={t.title} subtitle={t.subtitle} />
      <div className={s.heads}>
        {head(a, 'a')}
        <button type="button" className={s.swap} onClick={swap} aria-label={t.swap} title={t.swap}><ArrowLeftRight size={18} /></button>
        {head(b, 'b')}
      </div>
      {!a || !b ? <Loading /> : (
        <table className={s.table}>
          <thead className="visually-hidden">
            <tr><th scope="col">—</th><th scope="col">{a.passport.model}</th><th scope="col">{b.passport.model}</th></tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.label} data-differs={r.differs}>
                <th scope="row">{r.label}{r.delta && <span className={s.delta} title={t.diff}>{r.delta}</span>}</th>
                <td>{r.a}</td>
                <td>{r.b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {(a?.own || b?.own) && <p className={s.note}>{t.privateNote}</p>}
    </div>
  );
}
