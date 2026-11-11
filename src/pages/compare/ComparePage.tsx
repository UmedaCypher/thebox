import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeftRight, Search, Watch as WatchIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLoad } from '../../hooks/useLoad';
import { getPassport, listWatches, listWearLogs, mainPhoto, searchPublicWatches, thumbSrc } from '../../lib/api';
import type { PublicWatchHit } from '../../lib/api';
import type { Passport, Watch } from '../../types';
import { Button, Img, Loading, PageHeader, Segmented, Sheet } from '../../components/ui';
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
  change: 'Changer',
  mine: 'Ma collection', everyone: 'Toutes les montres',
  searchLabel: 'Rechercher une montre',
  searchPlaceholder: 'Marque, modèle ou référence',
  noMine: 'Aucune montre de votre collection ne correspond.',
  noPublic: 'Aucune montre publique ne correspond.',
  market: 'Marché',
  pickBoth: 'Choisissez deux montres : les vôtres, ou n’importe quelle montre publique d’Arcora.',
  member: (u: string) => `@${u}`,
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
  change: 'Change',
  mine: 'My collection', everyone: 'All watches',
  searchLabel: 'Search for a watch',
  searchPlaceholder: 'Brand, model or reference',
  noMine: 'No watch in your collection matches.',
  noPublic: 'No public watch matches.',
  market: 'Market',
  pickBoth: 'Choose two watches: your own, or any public watch on Arcora.',
  member: (u: string) => `@${u}`,
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

  const [picking, setPicking] = useState<'a' | 'b' | null>(null);
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
    const id = key === 'a' ? aId : bId;
    return (
      <div className={s.slot}>
        <button type="button" className={s.photo} onClick={() => setPicking(key)}
          aria-label={`${key === 'a' ? t.slotA : t.slotB} : ${side ? `${side.passport.brand} ${side.passport.model}, ${t.change.toLowerCase()}` : t.pick}`}>
          {ph?.src ? <Img src={ph.src} fallback={ph.fallback} alt="" /> : <WatchIcon size={28} strokeWidth={1.3} aria-hidden="true" />}
        </button>
        {side ? (
          <p className={s.name}>
            <span>{side.passport.brand}</span>
            <Link to={side.own ? `/montre/${side.passport.id}` : `/passeport/${side.passport.id}`}>{side.passport.model}</Link>
          </p>
        ) : id ? null : <p className={s.slotLabel}>{key === 'a' ? t.slotA : t.slotB}</p>}
        {side && !side.own && side.passport.listing && <p className={s.tag}>{t.fromMarket}</p>}
        <Button variant="secondary" size="small" onClick={() => setPicking(key)}>{side ? t.change : t.pick}</Button>
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
      {!aId || !bId ? <p className={s.note}>{t.pickBoth}</p> : !a || !b ? <Loading /> : (
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
      <WatchPicker open={picking !== null} onClose={() => setPicking(null)} title={picking === 'b' ? t.slotB : t.slotA}
        mine={list} exclude={picking === 'a' ? bId : aId}
        onPick={id => { if (picking) set(picking, id); setPicking(null); }} />
    </div>
  );
}

/* ---------- Choix d'une montre : la sienne ou n'importe quelle montre publique ---------- */

function WatchPicker({ open, onClose, title, mine, exclude, onPick }: {
  open: boolean; onClose: () => void; title: string; mine: Watch[]; exclude: string | null; onPick: (id: string) => void;
}) {
  const t = useStrings(S);
  const [tab, setTab] = useState<'mine' | 'everyone'>(mine.length ? 'mine' : 'everyone');
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<PublicWatchHit[] | null>(null);

  useEffect(() => {
    if (!open || tab !== 'everyone') return;
    let alive = true;
    const timer = setTimeout(() => {
      searchPublicWatches(query, 30).then(r => { if (alive) setHits(r); }).catch(() => { if (alive) setHits([]); });
    }, query ? 250 : 0);
    return () => { alive = false; clearTimeout(timer); };
  }, [open, tab, query]);

  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const match = (text: string) => words.every(w => text.toLowerCase().includes(w));
  const own = mine.filter(w => w.id !== exclude && match(`${w.brand} ${w.model} ${w.reference_number ?? ''}`));
  const pub = (hits ?? []).filter(h => h.id !== exclude);

  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <div className={s.picker}>
        <Segmented label={title} value={tab} onChange={v => { setTab(v); setHits(null); }}
          options={[{ value: 'mine', label: t.mine }, { value: 'everyone', label: t.everyone }]} />
        <label className={s.search}>
          <Search size={18} aria-hidden="true" />
          <span className="visually-hidden">{t.searchLabel}</span>
          <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder={t.searchPlaceholder} autoComplete="off" />
        </label>
        <ul className={s.results}>
          {tab === 'mine' ? (
            own.length ? own.map(w => {
              const ph = thumbSrc(mainPhoto(w.photos)?.storage_path);
              return (
                <li key={w.id}>
                  <button type="button" className={s.result} onClick={() => onPick(w.id)}>
                    <span className={s.thumb}>{ph?.src ? <Img src={ph.src} fallback={ph.fallback} alt="" /> : <WatchIcon size={20} strokeWidth={1.4} aria-hidden="true" />}</span>
                    <span className={s.resultText}><strong>{w.brand} {w.model}</strong>{w.reference_number && <span>{w.reference_number}</span>}</span>
                  </button>
                </li>
              );
            }) : <li className={s.none}>{t.noMine}</li>
          ) : hits === null ? <li><Loading /></li> : pub.length ? pub.map(h => {
            const ph = thumbSrc(h.photo_path);
            return (
              <li key={h.id}>
                <button type="button" className={s.result} onClick={() => onPick(h.id)}>
                  <span className={s.thumb}>{ph?.src ? <Img src={ph.src} fallback={ph.fallback} alt="" /> : <WatchIcon size={20} strokeWidth={1.4} aria-hidden="true" />}</span>
                  <span className={s.resultText}>
                    <strong>{h.brand} {h.model}</strong>
                    <span>{[h.reference_number, h.owner_username && t.member(h.owner_username)].filter(Boolean).join(' · ')}</span>
                  </span>
                  {h.on_market && <span className={s.marketTag}>{t.market}</span>}
                </button>
              </li>
            );
          }) : <li className={s.none}>{t.noPublic}</li>}
        </ul>
      </div>
    </Sheet>
  );
}
