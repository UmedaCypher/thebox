import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLoad } from '../../hooks/useLoad';
import { listGalleryBrands, listGalleryShots } from '../../lib/api';
import { Button, Cushion, EmptyState, LinkButton, Notice, PageHeader, SelectField, TextField } from '../../components/ui';
import { formatDecimal } from '../../lib/format';
import { defineStrings, useStrings } from '../../i18n';
import { COMMON } from '../../i18n/common';
import s from './GalleryPage.module.css';
import { SkeletonGrid } from '../../components/Skeleton/Skeleton';

const S = defineStrings({
  subtitle: 'Des montres photographiées au poignet. Filtrez par tour de poignet pour voir comment une pièce tombe sur un poignet comme le vôtre.',
  brand: 'Marque',
  allBrands: 'Toutes les marques',
  wristMin: 'Poignet min.',
  wristMax: 'Poignet max.',
  filter: 'Filtrer',
  likeMine: 'Poignets comme le mien',
  showAll: 'Tout afficher',
  noResultsTitle: 'Aucune photo pour ces filtres',
  emptyTitle: 'La galerie attend ses premières photos',
  addShot: 'Ajouter une photo au poignet',
  noResultsText: 'Élargissez la fourchette de tour de poignet ou retirez la marque.',
  emptyText: 'Ajoutez une photo au poignet à une montre de votre collection et choisissez de la montrer ici.',
  onWrist: (watch: string) => `${watch} au poignet`,
  member: 'Membre',
}, {
  subtitle: 'Watches photographed on the wrist. Filter by wrist size to see how a piece sits on a wrist like yours.',
  brand: 'Brand',
  allBrands: 'All brands',
  wristMin: 'Min. wrist',
  wristMax: 'Max. wrist',
  filter: 'Filter',
  likeMine: 'Wrists like mine',
  showAll: 'Show all',
  noResultsTitle: 'No photos match these filters',
  emptyTitle: 'The gallery is waiting for its first photos',
  addShot: 'Add a wrist shot',
  noResultsText: 'Widen the wrist size range or remove the brand.',
  emptyText: 'Add a wrist shot to a watch in your collection and choose to show it here.',
  onWrist: watch => `${watch} on the wrist`,
  member: 'Member',
});

const parse = (v: string) => { const n = Number(v.replace(',', '.')); return v.trim() && Number.isFinite(n) ? n : null; };

/** Une nouvelle adresse (ex. depuis la recherche : ?marque=Omega) repart de filtres neufs. */
export default function GalleryPage() {
  const { search } = useLocation();
  return <GalleryView key={search} />;
}

function GalleryView() {
  const t = useStrings(S);
  const c = useStrings(COMMON);
  const { user, profile } = useAuth();
  const [params] = useSearchParams();
  // Filtres initiaux possibles depuis l'accueil : /galerie?min=16.5&max=17.5
  const [brand, setBrand] = useState(params.get('marque') ?? '');
  const [min, setMin] = useState((params.get('min') ? formatDecimal(params.get('min')!) : ''));
  const [max, setMax] = useState((params.get('max') ? formatDecimal(params.get('max')!) : ''));
  const [filters, setFilters] = useState({ brand: (params.get('marque') || null) as string | null, minWrist: parse(params.get('min') ?? ''), maxWrist: parse(params.get('max') ?? '') });

  const brands = useLoad(listGalleryBrands, []);
  const shots = useLoad(() => listGalleryShots(filters), [filters]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    setFilters({ brand: brand || null, minWrist: parse(min), maxWrist: parse(max) });
  };

  const aroundMine = () => {
    if (!profile?.wrist_size_cm) return;
    const w = Number(profile.wrist_size_cm);
    const lo = formatDecimal(w - 0.5), hi = formatDecimal(w + 0.5);
    setMin(lo); setMax(hi);
    setFilters({ brand: brand || null, minWrist: w - 0.5, maxWrist: w + 0.5 });
  };

  const reset = () => { setBrand(''); setMin(''); setMax(''); setFilters({ brand: null, minWrist: null, maxWrist: null }); };
  const filtered = filters.brand || filters.minWrist || filters.maxWrist;

  return (
    <div className="page">
      <PageHeader
        title={c.tabs.gallery}
        subtitle={t.subtitle}
      />

      <form className={s.filters} onSubmit={apply}>
        <SelectField label={t.brand} placeholder={t.allBrands} options={brands.data ?? []} value={brand} onChange={e => setBrand(e.target.value)} />
        <TextField label={t.wristMin} inputMode="decimal" suffix="cm" value={min} onChange={e => setMin(e.target.value)} placeholder="16" />
        <TextField label={t.wristMax} inputMode="decimal" suffix="cm" value={max} onChange={e => setMax(e.target.value)} placeholder="18" />
        <div className={s.filterActions}>
          <Button type="submit">{t.filter}</Button>
          {profile?.wrist_size_cm && <Button variant="ghost" onClick={aroundMine}>{t.likeMine}</Button>}
          {filtered && <Button variant="ghost" onClick={reset}>{t.showAll}</Button>}
        </div>
      </form>

      {shots.loading ? <SkeletonGrid count={8} /> : shots.error ? <Notice tone="error">{shots.error}</Notice> : !shots.data?.length ? (
        <EmptyState
          title={filtered ? t.noResultsTitle : t.emptyTitle}
          action={user ? <LinkButton to="/collection" variant="secondary">{t.addShot}</LinkButton> : undefined}
        >
          {filtered ? t.noResultsText : t.emptyText}
        </EmptyState>
      ) : (
        <ul className={`${s.masonry} reveal`}>
          {shots.data.map(p => (
            <li key={p.id} className={s.item}>
              <Cushion src={p.thumb} fallbackSrc={p.url} alt={t.onWrist(`${p.brand} ${p.model}`)} ratio="portrait" className={s.shot}>
                {p.wrist_size_cm && <span className={`${s.wrist} num`}>{formatDecimal(p.wrist_size_cm)} cm</span>}
                <div className={s.caption}>
                  <span className={s.capModel}>{p.brand} {p.model}</span>
                  <span className={s.capMeta}>
                    {p.username ? <Link to={`/profil/${p.username}`}>@{p.username}</Link> : t.member}
                  </span>
                </div>
              </Cushion>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
