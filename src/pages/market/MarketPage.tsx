import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLoad } from '../../hooks/useLoad';
import { getMarketFilterOptions, MARKET_PAGE, searchMarket, thumbSrc } from '../../lib/api';
import { formatEuros, plural } from '../../lib/format';
import { listingPrice } from '../../lib/listing';
import { defineStrings, useStrings } from '../../i18n';
import { COMMON } from '../../i18n/common';
import type { MarketFilterOptions, MarketFilters, MarketItem } from '../../types';
import { Button, EmptyState, LinkButton, Notice, PageHeader, Segmented, Sheet, SelectField, TextField } from '../../components/ui';
import WatchCard, { WatchGrid } from '../../components/WatchCard/WatchCard';
import s from './MarketPage.module.css';
import { SkeletonGrid } from '../../components/Skeleton/Skeleton';

const S = defineStrings({
  subtitleCount: (n: string) => `${n} à vendre ou à échanger, directement entre collectionneurs.`,
  subtitle: 'Les montres à vendre ou à échanger, directement entre collectionneurs.',
  watches: ['montre', 'montres'],
  sellWatch: 'Vendre une montre',
  searchPlaceholder: 'Marque, modèle, référence',
  search: 'Rechercher',
  filters: 'Filtres',
  sort: 'Trier',
  removeFilter: (label: string) => `Retirer le filtre ${label}`,
  clearAll: 'Tout effacer',
  opening: 'Ouverture du marché…',
  noResultsTitle: 'Aucune montre pour cette recherche',
  emptyTitle: 'Le marché ouvre ses portes',
  clearFilters: 'Effacer les filtres',
  listWatch: 'Mettre une montre en vente',
  noResultsText: 'Élargissez la fourchette de prix ou retirez un filtre.',
  emptyText: 'Aucune annonce pour le moment. Depuis votre collection, choisissez « À vendre » ou « À échanger » dans la fiche d\'une montre.',
  seeMore: 'Voir plus de montres',
  safetyTitle: 'Acheter et vendre entre membres',
  safetyText: 'Les échanges se font directement entre collectionneurs, par la messagerie. Arcora ne prend aucune commission et n\'intervient pas dans la transaction. Demandez des photos récentes, vérifiez la référence et les papiers, préférez une remise en main propre dans un lieu sûr, ou chez un horloger.',
  searching: 'Recherche…',
  seeResults: (watches: string, more: boolean) => `Voir ${watches}${more ? ' et plus' : ''}`,
  from: (price: string) => `Dès ${price}`,
  upTo: (price: string) => `Jusqu'à ${price}`,
  sizes: { all: 'Toutes', small: '< 38 mm', medium: '38 à 41 mm', large: '42 mm +' },
  sorts: { recent: 'Plus récentes', price_asc: 'Prix croissant', price_desc: 'Prix décroissant' },
  type: 'Type',
  listingType: 'Type d\'annonce',
  all: 'Tout',
  brand: 'Marque',
  allBrands: 'Toutes les marques',
  price: 'Prix',
  minimum: 'Minimum',
  maximum: 'Maximum',
  unlimited: 'Illimité',
  diameter: 'Diamètre',
  condition: 'État',
  allConditions: 'Tous les états',
  boxPapers: 'Boîte et papiers',
  any: 'Indifférent',
}, {
  subtitleCount: n => `${n} for sale or trade, directly between collectors.`,
  subtitle: 'Watches for sale or trade, directly between collectors.',
  watches: ['watch', 'watches'],
  sellWatch: 'Sell a watch',
  searchPlaceholder: 'Brand, model, reference',
  search: 'Search',
  filters: 'Filters',
  sort: 'Sort',
  removeFilter: label => `Remove filter ${label}`,
  clearAll: 'Clear all',
  opening: 'Opening the Market…',
  noResultsTitle: 'No watches match this search',
  emptyTitle: 'The Market is opening its doors',
  clearFilters: 'Clear filters',
  listWatch: 'List a watch for sale',
  noResultsText: 'Widen the price range or remove a filter.',
  emptyText: 'No listings yet. From your collection, open a watch and choose “For sale” or “For trade”.',
  seeMore: 'Show more watches',
  safetyTitle: 'Buying and selling between members',
  safetyText: 'Deals happen directly between collectors, through Messages. Arcora takes no commission and plays no part in the transaction. Ask for recent photos, check the reference and the papers, and prefer to meet in person somewhere safe, or at a watchmaker’s.',
  searching: 'Searching…',
  seeResults: (watches, more) => `Show ${watches}${more ? ' and more' : ''}`,
  from: price => `From ${price}`,
  upTo: price => `Up to ${price}`,
  sizes: { all: 'All', small: '< 38 mm', medium: '38 to 41 mm', large: '42 mm +' },
  sorts: { recent: 'Newest', price_asc: 'Price: low to high', price_desc: 'Price: high to low' },
  type: 'Type',
  listingType: 'Listing type',
  all: 'All',
  brand: 'Brand',
  allBrands: 'All brands',
  price: 'Price',
  minimum: 'Minimum',
  maximum: 'Maximum',
  unlimited: 'No limit',
  diameter: 'Diameter',
  condition: 'Condition',
  allConditions: 'All conditions',
  boxPapers: 'Box & papers',
  any: 'Any',
});

type Texts = typeof S.fr;

/* Filtres gardés dans l'adresse : une recherche se partage et survit au retour arrière. */
const KEYS: Record<keyof MarketFilters, string> = {
  query: 'q', brand: 'marque', kind: 'type', minPrice: 'min', maxPrice: 'max',
  condition: 'etat', boxPapers: 'papiers', size: 'taille', sort: 'tri',
};
const DEFAULTS: MarketFilters = { query: '', brand: '', kind: '', minPrice: '', maxPrice: '', condition: '', boxPapers: '', size: '', sort: 'recent' };

const sizesFor = (t: Texts): { value: MarketFilters['size']; label: string }[] => [
  { value: '', label: t.sizes.all }, { value: 'small', label: t.sizes.small }, { value: 'medium', label: t.sizes.medium }, { value: 'large', label: t.sizes.large },
];
const SORT_VALUES = ['recent', 'price_asc', 'price_desc'] as const;

function readFilters(p: URLSearchParams): MarketFilters {
  const f = { ...DEFAULTS };
  (Object.keys(KEYS) as (keyof MarketFilters)[]).forEach(k => {
    const v = p.get(KEYS[k]);
    if (v !== null) (f as Record<string, string>)[k] = v;
  });
  return f;
}

function chipsFor(f: MarketFilters, t: Texts, c: typeof COMMON.fr): { key: keyof MarketFilters; label: string }[] {
  const out: { key: keyof MarketFilters; label: string }[] = [];
  if (f.kind) out.push({ key: 'kind', label: f.kind === 'sale' ? c.listing.forSale : c.listing.forTrade });
  if (f.brand) out.push({ key: 'brand', label: f.brand });
  if (f.minPrice) out.push({ key: 'minPrice', label: t.from(formatEuros(Number(f.minPrice.replace(',', '.')))) });
  if (f.maxPrice) out.push({ key: 'maxPrice', label: t.upTo(formatEuros(Number(f.maxPrice.replace(',', '.')))) });
  if (f.size) out.push({ key: 'size', label: sizesFor(t).find(x => x.value === f.size)?.label ?? f.size });
  if (f.condition) out.push({ key: 'condition', label: f.condition });
  if (f.boxPapers) out.push({ key: 'boxPapers', label: f.boxPapers });
  return out;
}

export default function MarketPage() {
  const t = useStrings(S);
  const c = useStrings(COMMON);
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => readFilters(params), [params]);
  const [query, setQuery] = useState(filters.query);
  // Recherche arrivée par l'adresse (ex. depuis la recherche de l'en-tête) : le champ suit.
  useEffect(() => { setQuery(filters.query); }, [filters.query]);
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

  const chips = chipsFor(filters, t, c);
  const clearAll = () => { setQuery(''); setParams(new URLSearchParams(filters.sort !== 'recent' ? { tri: filters.sort } : {}), { replace: true }); };
  const total = options.data?.count ?? 0;
  const watches = (n: number) => plural(n, t.watches[0], t.watches[1]);

  return (
    <div className="page">
      <PageHeader
        title={c.tabs.market}
        subtitle={total ? t.subtitleCount(watches(total)) : t.subtitle}
        action={user ? <LinkButton to="/collection" variant="secondary" size="small">{t.sellWatch}</LinkButton> : undefined}
      />

      <div className={s.toolbar}>
        <label className={s.search}>
          <Search size={18} strokeWidth={1.6} aria-hidden="true" />
          <input type="search" placeholder={t.searchPlaceholder} value={query} onChange={e => setQuery(e.target.value)} aria-label={t.search} />
        </label>
        <Button variant="secondary" className={s.filterBtn} onClick={() => setSheetOpen(true)}>
          <SlidersHorizontal size={16} strokeWidth={1.8} aria-hidden="true" />{t.filters}{chips.length > 0 && <span className={s.count}>{chips.length}</span>}
        </Button>
        <select className={s.sort} value={filters.sort} onChange={e => update({ sort: e.target.value as MarketFilters['sort'] })} aria-label={t.sort}>
          {SORT_VALUES.map(v => <option key={v} value={v}>{t.sorts[v]}</option>)}
        </select>
      </div>

      {chips.length > 0 && (
        <div className={s.chips}>
          {chips.map(ch => (
            <button key={ch.key} className={s.chip} onClick={() => update({ [ch.key]: '' })} aria-label={t.removeFilter(ch.label)}>
              {ch.label}<X size={14} strokeWidth={2} aria-hidden="true" />
            </button>
          ))}
          <button className={s.clear} onClick={clearAll}>{t.clearAll}</button>
        </div>
      )}

      <div className={s.layout}>
        <aside className={s.sidebar} aria-label={t.filters}>
          <FilterFields filters={filters} options={options.data} onChange={update} />
        </aside>

        <section className={s.results} aria-live="polite">
          {results.loading ? <SkeletonGrid count={8} /> : results.error ? <Notice tone="error">{results.error}</Notice> : !items.length ? (
            <EmptyState
              title={chips.length || filters.query ? t.noResultsTitle : t.emptyTitle}
              action={chips.length || filters.query ? <Button variant="secondary" onClick={clearAll}>{t.clearFilters}</Button>
                : user ? <LinkButton to="/collection" variant="secondary">{t.listWatch}</LinkButton> : undefined}
            >
              {chips.length || filters.query ? t.noResultsText : t.emptyText}
            </EmptyState>
          ) : (
            <>
              <WatchGrid cols={3}>
                {items.map(m => {
                  const th = thumbSrc(m.main_photo_path);
                  return (
                    <WatchCard
                      key={m.watch_id}
                      to={`/passeport/${m.watch_id}`}
                      brand={m.brand}
                      model={m.model}
                      photo={th.src}
                      photoFallback={th.fallback}
                      badge={m.is_mine ? c.listing.mine : null}
                      badgeTone="brass"
                      price={listingPrice(m.kind, m.sale_price)}
                      meta={[m.sale_city, `@${m.seller_username}`].filter(Boolean).join(' · ')}
                    />
                  );
                })}
              </WatchGrid>
              {canLoadMore && (
                <div className={s.more}><Button variant="secondary" onClick={loadMore} disabled={moreBusy}>{moreBusy ? c.loading : t.seeMore}</Button></div>
              )}
            </>
          )}

          <aside className={`panel ${s.safety}`} data-tone="ruby">
            <h2>{t.safetyTitle}</h2>
            <p>{t.safetyText}</p>
          </aside>
        </section>
      </div>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={t.filters}>
        <div className={s.sheetBody}>
          <FilterFields filters={filters} options={options.data} onChange={update} />
          <div className={s.sheetActions}>
            <Button block onClick={() => setSheetOpen(false)}>
              {results.loading ? t.searching : t.seeResults(watches(items.length), canLoadMore)}
            </Button>
            {chips.length > 0 && <Button variant="ghost" block onClick={clearAll}>{t.clearAll}</Button>}
          </div>
        </div>
      </Sheet>
    </div>
  );
}

function FilterFields({ filters, options, onChange }: {
  filters: MarketFilters; options: MarketFilterOptions | null; onChange: (p: Partial<MarketFilters>) => void;
}) {
  const t = useStrings(S);
  const c = useStrings(COMMON);
  // Les prix se valident à la sortie du champ pour ne pas relancer la recherche à chaque chiffre.
  const [min, setMin] = useState(filters.minPrice);
  const [max, setMax] = useState(filters.maxPrice);
  useEffect(() => { setMin(filters.minPrice); setMax(filters.maxPrice); }, [filters.minPrice, filters.maxPrice]);
  const commit = () => { if (min !== filters.minPrice || max !== filters.maxPrice) onChange({ minPrice: min.trim(), maxPrice: max.trim() }); };

  return (
    <div className={s.fields}>
      <div className={s.fieldGroup}>
        <span className={s.groupLabel}>{t.type}</span>
        <Segmented label={t.listingType} value={filters.kind} onChange={v => onChange({ kind: v })}
          options={[{ value: '', label: t.all }, { value: 'sale', label: c.listing.forSale }, { value: 'exchange', label: c.listing.trade }]} />
      </div>
      <SelectField label={t.brand} placeholder={t.allBrands} options={options?.brands ?? []} value={filters.brand} onChange={e => onChange({ brand: e.target.value })} />
      <div className={s.fieldGroup}>
        <span className={s.groupLabel}>{t.price}</span>
        <div className={s.priceRow} onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') commit(); }}>
          <TextField label={t.minimum} inputMode="numeric" suffix="€" value={min} onChange={e => setMin(e.target.value)} placeholder="0" />
          <TextField label={t.maximum} inputMode="numeric" suffix="€" value={max} onChange={e => setMax(e.target.value)} placeholder={t.unlimited} />
        </div>
      </div>
      <div className={s.fieldGroup}>
        <span className={s.groupLabel}>{t.diameter}</span>
        <Segmented label={t.diameter} value={filters.size} onChange={v => onChange({ size: v })} options={sizesFor(t)} />
      </div>
      <SelectField label={t.condition} placeholder={t.allConditions} options={options?.conditions ?? []} value={filters.condition} onChange={e => onChange({ condition: e.target.value })} />
      <SelectField label={t.boxPapers} placeholder={t.any} options={options?.box_papers ?? []} value={filters.boxPapers} onChange={e => onChange({ boxPapers: e.target.value })} />
    </div>
  );
}
