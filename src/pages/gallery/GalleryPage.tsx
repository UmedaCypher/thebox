import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLoad } from '../../hooks/useLoad';
import { listGalleryBrands, listGalleryShots } from '../../lib/api';
import { Button, Cushion, EmptyState, LinkButton, Loading, Notice, PageHeader, SelectField, TextField } from '../../components/ui';
import s from './GalleryPage.module.css';

const parse = (v: string) => { const n = Number(v.replace(',', '.')); return v.trim() && Number.isFinite(n) ? n : null; };

export default function GalleryPage() {
  const { user, profile } = useAuth();
  const [params] = useSearchParams();
  // Filtres initiaux possibles depuis l'accueil : /galerie?min=16.5&max=17.5
  const [brand, setBrand] = useState('');
  const [min, setMin] = useState(params.get('min')?.replace('.', ',') ?? '');
  const [max, setMax] = useState(params.get('max')?.replace('.', ',') ?? '');
  const [filters, setFilters] = useState({ brand: null as string | null, minWrist: parse(params.get('min') ?? ''), maxWrist: parse(params.get('max') ?? '') });

  const brands = useLoad(listGalleryBrands, []);
  const shots = useLoad(() => listGalleryShots(filters), [filters]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    setFilters({ brand: brand || null, minWrist: parse(min), maxWrist: parse(max) });
  };

  const aroundMine = () => {
    if (!profile?.wrist_size_cm) return;
    const w = Number(profile.wrist_size_cm);
    const lo = String(w - 0.5).replace('.', ','), hi = String(w + 0.5).replace('.', ',');
    setMin(lo); setMax(hi);
    setFilters({ brand: brand || null, minWrist: w - 0.5, maxWrist: w + 0.5 });
  };

  const reset = () => { setBrand(''); setMin(''); setMax(''); setFilters({ brand: null, minWrist: null, maxWrist: null }); };
  const filtered = filters.brand || filters.minWrist || filters.maxWrist;

  return (
    <div className="page">
      <PageHeader
        title="Galerie"
        subtitle="Des montres photographiées au poignet. Filtrez par tour de poignet pour voir comment une pièce tombe sur un poignet comme le vôtre."
      />

      <form className={s.filters} onSubmit={apply}>
        <SelectField label="Marque" placeholder="Toutes les marques" options={brands.data ?? []} value={brand} onChange={e => setBrand(e.target.value)} />
        <TextField label="Poignet min." inputMode="decimal" suffix="cm" value={min} onChange={e => setMin(e.target.value)} placeholder="16" />
        <TextField label="Poignet max." inputMode="decimal" suffix="cm" value={max} onChange={e => setMax(e.target.value)} placeholder="18" />
        <div className={s.filterActions}>
          <Button type="submit">Filtrer</Button>
          {profile?.wrist_size_cm && <Button variant="ghost" onClick={aroundMine}>Poignets comme le mien</Button>}
          {filtered && <Button variant="ghost" onClick={reset}>Tout afficher</Button>}
        </div>
      </form>

      {shots.loading ? <Loading /> : shots.error ? <Notice tone="error">{shots.error}</Notice> : !shots.data?.length ? (
        <EmptyState
          title={filtered ? 'Aucune photo pour ces filtres' : 'La galerie attend ses premières photos'}
          action={user ? <LinkButton to="/collection" variant="secondary">Ajouter une photo au poignet</LinkButton> : undefined}
        >
          {filtered ? 'Élargissez la fourchette de tour de poignet ou retirez la marque.' : 'Ajoutez une photo au poignet à une montre de votre collection et choisissez de la montrer ici.'}
        </EmptyState>
      ) : (
        <ul className={s.masonry}>
          {shots.data.map(p => (
            <li key={p.id} className={s.item}>
              <Cushion src={p.thumb} fallbackSrc={p.url} alt={`${p.brand} ${p.model} au poignet`} ratio="portrait" />
              <div className={s.caption}>
                <span className={s.capModel}>{p.brand} {p.model}</span>
                <span className={s.capMeta}>
                  {p.username ? <Link to={`/profil/${p.username}`}>@{p.username}</Link> : 'Membre'}
                  {p.wrist_size_cm && <span className="num">{String(p.wrist_size_cm).replace('.', ',')} cm</span>}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
