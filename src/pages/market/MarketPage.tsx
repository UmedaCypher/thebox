import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLoad } from '../../hooks/useLoad';
import { getMarketFilterOptions, MARKET_PAGE, searchMarket, thumbSrc } from '../../lib/api';
import { formatEuros, plural } from '../../lib/format';
import { listingPrice } from '../../lib/listing';
import type { MarketFilterOptions, MarketFilters, MarketItem } from '../../types';
import { Button, EmptyState, LinkButton, Loading, Notice, PageHeader, Segmented, Sheet, SelectField, TextField } from '../../components/ui';
import WatchCard, { WatchGrid } from '../../components/WatchCard/WatchCard';
import s from './MarketPage.module.css';

/* Filtres gardés dans l'adresse : une recherche se partage et survit au retour arrière. */
const KEYS: Record<keyof MarketFilters, string> = {
  query: 'q', brand: 'marque', kind: 'type', minPrice: 'min', maxPrice: 'max',
  condition: 'etat', boxPapers: 'papiers', size: 'taille', sort: 'tri',
};
const DEFAULTS: MarketFilters = { query: '', brand: '', kind: '', minPrice: '', maxPrice: '', condition: '', boxPapers: '', size: '', sort: 'recent' };

const SIZES: { value: MarketFilters['size']; label: string }[] = [
  { value: '', label: 'Toutes' }, { value: 'small', label: '< 38 mm' }, { value: 'medium', label: '38 à 41 mm' }, { value: 'large', label: '42 mm +' },
];
const SORTS = [
  { value: 'recent', label: 'Plus récentes' }, { value: 'price_asc', label: 'Prix croissant' }, { value: 'price_desc', label: 'Prix décroissant' },
];

function readFilters(p: URLSearchParams): MarketFilters {
  const f = { ...DEFAULTS };
  (Object.keys(KEYS) as (keyof MarketFilters)[]).forEach(k => {
    const v = p.get(KEYS[k]);
    if (v !== null) (f as Record<string, string>)[k] = v;
  });
  return f;
}

function chipsFor(f: MarketFilters): { key: keyof MarketFilters; label: string }[] {
  const out: { key: keyof MarketFilters; label: string }[] = [];
  if (f.kind) out.push({ key: 'kind', label: f.kind === 'sale' ? 'À vendre' : 'À échanger' });
  if (f.brand) out.push({ key: 'brand', label: f.brand });
  if (f.minPrice) out.push({ key: 'minPrice', label: `Dès ${formatEuros(Number(f.minPrice.replace(',', '.')))}` });
  if (f.maxPrice) out.push({ key: 'maxPrice', label: `Jusqu'à ${formatEuros(Number(f.maxPrice.replace(',', '.')))}` });
  if (f.size) out.push({ key: 'size', label: SIZES.find(x => x.value === f.size)!.label });
  if (f.condition) out.push({ key: 'condition', label: f.condition });
  if (f.boxPapers) out.push({ key: 'boxPapers', label: f.boxPapers });
  return out;
}

export default function MarketPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => readFilters(params), [params]);
  const [query, setQuery] = useState(filters.query);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [extra, setExtra] = useState<MarketItem[]>([]);
  const [moreBusy, setMoreBusy] = useState(false);
  const [moreLeft, setMoreLeft] = useState(true);

  const options = useLoad(getMarketFilterOptions, []);
  const results = useLoad(() => searchMarket(filters), [filters]);
  useEffect(() => { setExtra([]); setMoreLeft(true); }, [filters]);

  const update = (patch: Partial<MarketFilters>) => {
    const next = { ...filters, ...patch };
    const p = new URLSearchParams();
    (Object.keys(KEYS) as (keyof MarketFilters)[]).forEach(k => { if (next[k] && next[k] !== DEFAULTS[k]) p.set(KEYS[k], next[k]); });
    setParams(p, { replace: true });
  };

  // Recherche au fil de la frappe, avec un léger délai.
  useEffect(() => {
    if (query === filters.query) return;
    const id = setTimeout(() => update({ query }), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const items = [...(results.data ?? []), ...extra];
  const canLoadMore = (results.data?.length ?? 0) === MARKET_PAGE && moreLeft;
  const loadMore = async () => {
    setMoreBusy(true);
    try { const more = await searchMarket(filters, items.length); setExtra(e => [...e, ...more]); setMoreLeft(more.length === MARKET_PAGE); } finally { setMoreBusy(false); }
  };

  const chips = chipsFor(filters);
  const clearAll = () => { setQuery(''); setParams(new URLSearchParams(filters.sort !== 'recent' ? { tri: filters.sort } : {}), { replace: true }); };
  const total = options.data?.count ?? 0;

  return (
    <div className="page">
      <PageHeader
        title="Marché"
        subtitle={total
          ? `${plural(total, 'montre', 'montres')} à vendre ou à échanger, directement entre collectionneurs.`
          : 'Les montres à vendre ou à échanger, directement entre collectionneurs.'}
        action={user ? <LinkButton to="/collection" variant="secondary" size="small">Vendre une montre</LinkButton> : undefined}
      />

      <div className={s.toolbar}>
        <label className={s.search}>
          <Search size={18} strokeWidth={1.6} aria-hidden="true" />
          <input type="search" placeholder="Marque, modèle, référence" value={query} onChange={e => setQuery(e.target.value)} aria-label="Rechercher" />
        </label>
        <Button variant="secondary" className={s.filterBtn} onClick={() => setSheetOpen(true)}>
          <SlidersHorizontal size={16} strokeWidth={1.8} aria-hidden="true" />Filtres{chips.length > 0 && <span className={s.count}>{chips.length}</span>}
        </Button>
        <select className={s.sort} value={filters.sort} onChange={e => update({ sort: e.target.value as MarketFilters['sort'] })} aria-label="Trier">
          {SORTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {chips.length > 0 && (
        <div className={s.chips}>
          {chips.map(c => (
            <button key={c.key} className={s.chip} onClick={() => update({ [c.key]: '' })} aria-label={`Retirer le filtre ${c.label}`}>
              {c.label}<X size={14} strokeWidth={2} aria-hidden="true" />
            </button>
          ))}
          <button className={s.clear} onClick={clearAll}>Tout effacer</button>
        </div>
      )}

      <div className={s.layout}>
        <aside className={s.sidebar} aria-label="Filtres">
          <FilterFields filters={filters} options={options.data} onChange={update} />
        </aside>

        <section className={s.results} aria-live="polite">
          {results.loading ? <Loading label="Ouverture du marché…" /> : results.error ? <Notice tone="error">{results.error}</Notice> : !items.length ? (
            <EmptyState
              title={chips.length || filters.query ? 'Aucune montre pour cette recherche' : 'Le marché ouvre ses portes'}
              action={chips.length || filters.query ? <Button variant="secondary" onClick={clearAll}>Effacer les filtres</Button>
                : user ? <LinkButton to="/collection" variant="secondary">Mettre une montre en vente</LinkButton> : undefined}
            >
              {chips.length || filters.query
                ? 'Élargissez la fourchette de prix ou retirez un filtre.'
                : 'Aucune annonce pour le moment. Depuis votre collection, choisissez « À vendre » ou « À échanger » dans la fiche d\'une montre.'}
            </EmptyState>
          ) : (
            <>
              <WatchGrid>
                {items.map(m => {
                  const t = thumbSrc(m.main_photo_path);
                  return (
                    <WatchCard
                      key={m.watch_id}
                      to={`/passeport/${m.watch_id}`}
                      brand={m.brand}
                      model={m.model}
                      photo={t.src}
                      photoFallback={t.fallback}
                      badge={m.is_mine ? 'Mon annonce' : m.kind === 'exchange' ? 'À échanger' : null}
                      price={listingPrice(m.kind, m.sale_price)}
                      meta={[m.condition, m.sale_city, `@${m.seller_username}`].filter(Boolean).join(' · ')}
                    />
                  );
                })}
              </WatchGrid>
              {canLoadMore && (
                <div className={s.more}><Button variant="secondary" onClick={loadMore} disabled={moreBusy}>{moreBusy ? 'Chargement…' : 'Voir plus de montres'}</Button></div>
              )}
            </>
          )}

          <aside className={s.safety}>
            <h2>Acheter et vendre entre membres</h2>
            <p>
              Les échanges se font directement entre collectionneurs, par la messagerie. The Box ne prend aucune commission
              et n'intervient pas dans la transaction. Demandez des photos récentes, vérifiez la référence et les papiers,
              préférez une remise en main propre dans un lieu sûr, ou chez un horloger.
            </p>
          </aside>
        </section>
      </div>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Filtres">
        <div className={s.sheetBody}>
          <FilterFields filters={filters} options={options.data} onChange={update} />
          <div className={s.sheetActions}>
            <Button block onClick={() => setSheetOpen(false)}>
              {results.loading ? 'Recherche…' : `Voir ${plural(items.length, 'montre', 'montres')}${canLoadMore ? ' et plus' : ''}`}
            </Button>
            {chips.length > 0 && <Button variant="ghost" block onClick={clearAll}>Tout effacer</Button>}
          </div>
        </div>
      </Sheet>
    </div>
  );
}

function FilterFields({ filters, options, onChange }: {
  filters: MarketFilters; options: MarketFilterOptions | null; onChange: (p: Partial<MarketFilters>) => void;
}) {
  // Les prix se valident à la sortie du champ pour ne pas relancer la recherche à chaque chiffre.
  const [min, setMin] = useState(filters.minPrice);
  const [max, setMax] = useState(filters.maxPrice);
  useEffect(() => { setMin(filters.minPrice); setMax(filters.maxPrice); }, [filters.minPrice, filters.maxPrice]);
  const commit = () => { if (min !== filters.minPrice || max !== filters.maxPrice) onChange({ minPrice: min.trim(), maxPrice: max.trim() }); };

  return (
    <div className={s.fields}>
      <div className={s.fieldGroup}>
        <span className={s.groupLabel}>Type</span>
        <Segmented label="Type d'annonce" value={filters.kind} onChange={v => onChange({ kind: v })}
          options={[{ value: '', label: 'Tout' }, { value: 'sale', label: 'À vendre' }, { value: 'exchange', label: 'Échange' }]} />
      </div>
      <SelectField label="Marque" placeholder="Toutes les marques" options={options?.brands ?? []} value={filters.brand} onChange={e => onChange({ brand: e.target.value })} />
      <div className={s.fieldGroup}>
        <span className={s.groupLabel}>Prix</span>
        <div className={s.priceRow} onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') commit(); }}>
          <TextField label="Minimum" inputMode="numeric" suffix="€" value={min} onChange={e => setMin(e.target.value)} placeholder="0" />
          <TextField label="Maximum" inputMode="numeric" suffix="€" value={max} onChange={e => setMax(e.target.value)} placeholder="Illimité" />
        </div>
      </div>
      <div className={s.fieldGroup}>
        <span className={s.groupLabel}>Diamètre</span>
        <Segmented label="Diamètre" value={filters.size} onChange={v => onChange({ size: v })} options={SIZES} />
      </div>
      <SelectField label="État" placeholder="Tous les états" options={options?.conditions ?? []} value={filters.condition} onChange={e => onChange({ condition: e.target.value })} />
      <SelectField label="Boîte et papiers" placeholder="Indifférent" options={options?.box_papers ?? []} value={filters.boxPapers} onChange={e => onChange({ boxPapers: e.target.value })} />
    </div>
  );
}
