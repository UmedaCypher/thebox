import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Images, Search, Store, Watch as WatchIcon, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getMarketFilterOptions, listGalleryBrands, listWatches, mainPhoto, searchMarket, thumbSrc } from '../../lib/api';
import { formatNumber } from '../../lib/format';
import { listingPrice } from '../../lib/listing';
import { defineStrings, useStrings } from '../../i18n';
import type { MarketFilters, MarketItem, Watch } from '../../types';
import { Img } from '../ui';
import s from './GlobalSearch.module.css';

const S = defineStrings({
  placeholder: 'Rechercher une marque, un modèle, une référence',
  placeholderCount: (n: string) => `Rechercher parmi ${n} montres du marché`,
  label: 'Rechercher',
  clear: 'Effacer la recherche',
  mine: 'Ma collection',
  market: 'Marché',
  gallery: 'Galerie',
  galleryItem: (brand: string) => `Photos de ${brand} au poignet`,
  allMarket: (q: string) => `Voir tous les résultats pour « ${q} » dans le Marché`,
  searching: 'Recherche…',
  none: (q: string) => `Aucune montre ne correspond à « ${q} ».`,
  hint: 'Tapez au moins deux lettres',
  shortcut: 'Raccourci : /',
}, {
  placeholder: 'Search a brand, a model, a reference',
  placeholderCount: n => `Search ${n} watches on the Market`,
  label: 'Search',
  clear: 'Clear search',
  mine: 'My collection',
  market: 'Market',
  gallery: 'Gallery',
  galleryItem: brand => `${brand} wrist shots`,
  allMarket: q => `See all results for "${q}" on the Market`,
  searching: 'Searching…',
  none: q => `No watch matches "${q}".`,
  hint: 'Type at least two letters',
  shortcut: 'Shortcut: /',
});

const MARKET_DEFAULTS: MarketFilters = { query: '', brand: '', kind: '', minPrice: '', maxPrice: '', condition: '', boxPapers: '', size: '', sort: 'recent' };

/** Minuscules sans accents, pour que « zenith » trouve « Zénith ». */
const norm = (v: string) => v.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const matches = (hay: string, q: string) => {
  const h = norm(hay);
  return norm(q).split(/\s+/).filter(Boolean).every(word => h.includes(word));
};

interface Item { key: string; to: string; title: string; sub?: string | null; thumb?: { src: string | null; fallback: string | null }; icon?: 'gallery' | 'market' }

/**
 * Recherche de l'en-tête (ordinateur) : la collection du membre, le Marché et la Galerie, au fil de la frappe.
 * Clavier : « / » pour y aller, flèches pour choisir, Entrée pour ouvrir, Échap pour fermer.
 */
export default function GlobalSearch() {
  const t = useStrings(S);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [mine, setMine] = useState<Watch[] | null>(null);
  const [brands, setBrands] = useState<string[]>([]);
  const [market, setMarket] = useState<{ q: string; items: MarketItem[] } | null>(null);
  const [count, setCount] = useState<number | null>(null);

  // Nombre d'annonces affiché dans le champ, comme un catalogue.
  useEffect(() => { getMarketFilterOptions().then(o => setCount(o.count)).catch(() => {}); }, []);

  // Collection et marques de la galerie : chargées une fois, à la première ouverture.
  const warm = useCallback(() => {
    if (user && mine === null) listWatches(user.id).then(setMine).catch(() => setMine([]));
    if (!brands.length) listGalleryBrands().then(setBrands).catch(() => {});
  }, [user, mine, brands.length]);

  // Marché : interrogé après une courte pause dans la frappe.
  const query = q.trim();
  useEffect(() => {
    if (query.length < 2) return;
    const id = setTimeout(() => {
      searchMarket({ ...MARKET_DEFAULTS, query })
        .then(items => setMarket({ q: query, items }))
        .catch(() => setMarket({ q: query, items: [] }));
    }, 220);
    return () => clearTimeout(id);
  }, [query]);

  // Fermer en changeant de page.
  useEffect(() => { setOpen(false); }, [pathname]);

  // « / » ou Ctrl/Cmd + K : aller dans la recherche.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName));
      if ((e.key === '/' && !typing) || (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Clic en dehors : fermer.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const sections = useMemo(() => {
    if (query.length < 2) return [];
    const out: { title: string; items: Item[] }[] = [];
    const own = (mine ?? []).filter(w => matches(`${w.brand} ${w.model} ${w.reference_number ?? ''}`, query)).slice(0, 4);
    if (own.length) out.push({
      title: t.mine,
      items: own.map(w => ({
        key: `w-${w.id}`, to: `/montre/${w.id}`, title: `${w.brand} ${w.model}`, sub: w.reference_number,
        thumb: thumbSrc(mainPhoto(w.photos)?.storage_path),
      })),
    });
    const m = market?.q === query ? market.items.slice(0, 5) : [];
    if (m.length) out.push({
      title: t.market,
      items: m.map(x => ({
        key: `m-${x.watch_id}`, to: `/passeport/${x.watch_id}`, title: `${x.brand} ${x.model}`,
        sub: [listingPrice(x.kind, x.sale_price), x.sale_city].filter(Boolean).join(' · '), thumb: thumbSrc(x.main_photo_path),
      })),
    });
    const g = brands.filter(b => matches(b, query) || matches(query, b)).slice(0, 2);
    if (g.length) out.push({
      title: t.gallery,
      items: g.map(b => ({ key: `g-${b}`, to: `/galerie?marque=${encodeURIComponent(b)}`, title: t.galleryItem(b), icon: 'gallery' as const })),
    });
    out.push({ title: '', items: [{ key: 'all', to: `/marche?q=${encodeURIComponent(query)}`, title: t.allMarket(query), icon: 'market' }] });
    return out;
  }, [query, mine, market, brands, t]);

  const flat = sections.flatMap(sec => sec.items);
  const loading = query.length >= 2 && market?.q !== query;
  const hasHits = sections.length > 1;

  const go = (item: Item | undefined) => {
    if (!item) return;
    setOpen(false);
    input.current?.blur();
    navigate(item.to);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') { if (q) setQ(''); else { setOpen(false); input.current?.blur(); } return; }
    if (!flat.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive(i => (i + 1) % flat.length); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => (i - 1 + flat.length) % flat.length); }
    if (e.key === 'Enter') { e.preventDefault(); go(flat[Math.min(active, flat.length - 1)]); }
  };

  const showPanel = open && query.length >= 2;
  let index = -1;

  return (
    <div className={s.search} ref={box}>
      <label className={s.field} data-open={showPanel}>
        <Search size={18} strokeWidth={1.7} aria-hidden="true" className={s.icon} />
        <span className="visually-hidden">{t.label}</span>
        <input
          ref={input}
          type="search"
          value={q}
          placeholder={count ? t.placeholderCount(formatNumber(count)) : t.placeholder}
          onChange={e => { setQ(e.target.value); setOpen(true); setActive(0); }}
          onFocus={() => { warm(); setOpen(true); }}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showPanel && flat[active] ? `${listId}-${flat[active].key}` : undefined}
          autoComplete="off"
          spellCheck={false}
        />
        {q ? (
          <button type="button" className={s.clear} onClick={() => { setQ(''); input.current?.focus(); }} aria-label={t.clear}><X size={16} strokeWidth={2} /></button>
        ) : (
          <kbd className={s.kbd} title={t.shortcut}>/</kbd>
        )}
      </label>

      {showPanel && (
        <div className={s.panel} id={listId} role="listbox" aria-label={t.label}>
          {loading && !hasHits && <p className={s.status}>{t.searching}</p>}
          {!loading && !hasHits && <p className={s.status}>{t.none(query)}</p>}
          {sections.map(sec => (
            <div key={sec.title || 'footer'} className={sec.title ? s.section : s.footer} role="group" aria-label={sec.title || undefined}>
              {sec.title && <p className={s.sectionTitle}>{sec.title === t.mine ? <WatchIcon size={13} aria-hidden="true" /> : sec.title === t.market ? <Store size={13} aria-hidden="true" /> : <Images size={13} aria-hidden="true" />}{sec.title}</p>}
              {sec.items.map(item => {
                index++;
                const i = index;
                return (
                  <Link
                    key={item.key}
                    id={`${listId}-${item.key}`}
                    to={item.to}
                    role="option"
                    aria-selected={i === active}
                    className={s.item}
                    onMouseEnter={() => setActive(i)}
                    onClick={e => { e.preventDefault(); go(item); }}
                  >
                    {item.thumb !== undefined ? (
                      <span className={s.thumb}>{item.thumb.src && <Img src={item.thumb.src} fallback={item.thumb.fallback} alt="" />}</span>
                    ) : item.icon === 'gallery' ? (
                      <span className={s.thumbIcon}><Images size={18} strokeWidth={1.6} aria-hidden="true" /></span>
                    ) : null}
                    <span className={s.text}>
                      <span className={s.title}>{item.title}</span>
                      {item.sub && <span className={s.sub}>{item.sub}</span>}
                    </span>
                    {item.icon === 'market' && <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" className={s.arrow} />}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
