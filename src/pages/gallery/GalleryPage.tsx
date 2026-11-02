import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { FormEvent } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLoad } from '../../hooks/useLoad';
import { getFitRanking, listGalleryBrands, listGalleryShots, photoUrl, thumbPath } from '../../lib/api';
import type { GalleryShot } from '../../types';
import FitScale, { FitBadge } from '../../components/WristCheck/FitScale';
import { Button, Cushion, EmptyState, IconButton, Img, LinkButton, Notice, PageHeader, Segmented, SelectField, TextField } from '../../components/ui';
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
  view: 'Affichage',
  photos: 'Photos',
  ranking: 'Classement',
  today: 'Wrist Checks du jour',
  rankTitle: (range: string) => `Ce qui tombe le mieux ${range}`,
  rankRange: (lo: string, hi: string) => `sur un poignet de ${lo} à ${hi} cm`,
  rankFrom: (lo: string) => `sur un poignet de ${lo} cm et plus`,
  rankTo: (hi: string) => `sur un poignet jusqu'à ${hi} cm`,
  rankAll: 'au poignet',
  rankHint: 'D’après les avis « Au poignet ? » des membres sur les photos de la Galerie. Une montre entre au classement à partir de 5 avis.',
  rankEmpty: 'Pas encore assez d’avis pour ces tours de poignet. Donnez le vôtre sur les photos de la Galerie : touchez une photo, puis « Petite », « Parfaite » ou « Grande ».',
  perfectFor: (pct: number) => `Parfaite pour ${pct}\u00a0%`,
  votes: (n: number) => `${n} avis`,
  close: 'Fermer',
  open: (watch: string) => `Voir ${watch} en grand`,
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
  view: 'View',
  photos: 'Photos',
  ranking: 'Ranking',
  today: 'Today’s Wrist Checks',
  rankTitle: (range: string) => `What suits best ${range}`,
  rankRange: (lo: string, hi: string) => `a ${lo} to ${hi} cm wrist`,
  rankFrom: (lo: string) => `a wrist of ${lo} cm or more`,
  rankTo: (hi: string) => `a wrist up to ${hi} cm`,
  rankAll: 'on the wrist',
  rankHint: 'Based on members’ “On the wrist?” votes on Gallery photos. A watch enters the ranking from 5 votes.',
  rankEmpty: 'Not enough votes yet for these wrist sizes. Give yours on Gallery photos: tap a photo, then “Small”, “Perfect” or “Large”.',
  perfectFor: (pct: number) => `Perfect for ${pct}%`,
  votes: (n: number) => `${n} votes`,
  close: 'Close',
  open: (watch: string) => `View ${watch} large`,
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

  const [view, setView] = useState<'photos' | 'ranking'>(params.get('vue') === 'classement' ? 'ranking' : 'photos');
  const [viewer, setViewer] = useState<GalleryShot | null>(null);
  const brands = useLoad(listGalleryBrands, []);
  const shots = useLoad(() => listGalleryShots(filters), [filters], view === 'photos');
  const todays = useLoad(() => listGalleryShots({ brand: null, minWrist: null, maxWrist: null, today: true }).catch(() => []), []);
  const ranking = useLoad(() => getFitRanking(filters.minWrist, filters.maxWrist), [filters.minWrist, filters.maxWrist], view === 'ranking');
  const rangeLabel = filters.minWrist && filters.maxWrist ? t.rankRange(formatDecimal(filters.minWrist), formatDecimal(filters.maxWrist))
    : filters.minWrist ? t.rankFrom(formatDecimal(filters.minWrist)) : filters.maxWrist ? t.rankTo(formatDecimal(filters.maxWrist)) : t.rankAll;

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

      <div className={s.viewSwitch}>
        <Segmented label={t.view} value={view} onChange={setView} options={[{ value: 'photos', label: t.photos }, { value: 'ranking', label: t.ranking }]} />
      </div>

      {view === 'photos' && (todays.data?.length ?? 0) > 0 && !filtered && (
        <section className={s.todayRow} aria-labelledby="today-row">
          <h2 id="today-row" className={s.todayTitle}><span className={s.todayDot} aria-hidden="true" />{t.today}</h2>
          <ul className={s.todayList}>
            {todays.data!.map(p => (
              <li key={p.id}>
                <button type="button" className={s.todayItem} onClick={() => setViewer(p)} aria-label={t.open(`${p.brand} ${p.model}`)}>
                  <Img src={p.thumb} fallback={p.url} alt="" />
                  <span className={s.todayCap}>{p.username ? `@${p.username}` : p.model}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

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

      {view === 'ranking' ? (
        <section className={s.ranking}>
          <h2 className={s.rankTitle}>{t.rankTitle(rangeLabel)}</h2>
          <p className={s.rankHint}>{t.rankHint}</p>
          {ranking.loading ? <SkeletonGrid count={4} /> : ranking.error ? <Notice tone="error">{ranking.error}</Notice> : !ranking.data?.length ? (
            <EmptyState title={t.ranking}>{t.rankEmpty}</EmptyState>
          ) : (
            <ol className={s.rankList}>
              {ranking.data.map((r, i) => (
                <li key={`${r.brand}-${r.model}`} className={`panel ${s.rankItem}`} data-tone={i === 0 ? 'lume' : 'plain'}>
                  <span className={s.rankNum}>{i + 1}</span>
                  <span className={s.rankPhoto}>{r.photo_storage_path && <Img src={photoUrl(thumbPath(r.photo_storage_path)) ?? ''} fallback={photoUrl(r.photo_storage_path)} alt="" />}</span>
                  <span className={s.rankText}>
                    <b>{r.brand} {r.model}</b>
                    <span className={s.rankMeta}>
                      {t.perfectFor(r.perfect_pct)} · {t.votes(r.votes)}
                      {r.case_diameter_mm ? ` · ${formatDecimal(r.case_diameter_mm)} mm` : ''}
                    </span>
                    <span className={s.rankMeter} aria-hidden="true"><i style={{ flex: r.small_pct }} /><i data-mid style={{ flex: r.perfect_pct }} /><i style={{ flex: r.large_pct }} /></span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      ) : shots.loading ? <SkeletonGrid count={8} /> : shots.error ? <Notice tone="error">{shots.error}</Notice> : !shots.data?.length ? (
        <EmptyState
          title={filtered ? t.noResultsTitle : t.emptyTitle}
          action={user ? <LinkButton to="/collection" variant="secondary">{t.addShot}</LinkButton> : undefined}
        >
          {filtered ? t.noResultsText : t.emptyText}
        </EmptyState>
      ) : (
        <div className={s.wall}><ul className={s.masonry}>
          {shots.data.map((p, i) => (
            <li key={p.id} className={s.item} data-reveal data-parallax>
              <Cushion src={i % 9 === 0 || i % 9 === 5 ? p.url : p.thumb} fallbackSrc={i % 9 === 0 || i % 9 === 5 ? p.thumb : p.url} alt={t.onWrist(`${p.brand} ${p.model}`)} ratio="portrait" className={s.shot}>
                {p.wrist_size_cm && <span className={`${s.wrist} num`}>{formatDecimal(p.wrist_size_cm)} cm</span>}
                <button type="button" className={s.openShot} onClick={() => setViewer(p)} aria-label={t.open(`${p.brand} ${p.model}`)} />
                <div className={s.caption}>
                  <span className={s.capModel}>{p.brand} {p.model}</span>
                  <span className={s.capMeta}>
                    {p.username ? <Link to={`/profil/${p.username}`}>@{p.username}</Link> : t.member}
                    <FitBadge fit={p.fit} likes={p.likes} />
                  </span>
                </div>
              </Cushion>
            </li>
          ))}
        </ul></div>
      )}
      {viewer && createPortal(
        <div className={s.viewer} role="dialog" aria-modal="true" aria-label={`${viewer.brand} ${viewer.model}`} onClick={() => setViewer(null)}>
          <div className={s.viewerCard} onClick={e => e.stopPropagation()}>
            <img src={viewer.url} alt={t.onWrist(`${viewer.brand} ${viewer.model}`)} className={s.viewerImg} />
            <IconButton label={t.close} className={s.viewerClose} onClick={() => setViewer(null)}><X size={20} /></IconButton>
            <span className={s.viewerTop}>
              {viewer.username ? <Link to={`/profil/${viewer.username}`}>@{viewer.username}</Link> : t.member}
              {viewer.wrist_size_cm && <> · {formatDecimal(viewer.wrist_size_cm)} cm</>}
            </span>
            <div className={s.viewerBottom}>
              <span className={s.viewerModel}>{viewer.brand} {viewer.model}</span>
              <FitScale key={viewer.id} photoId={viewer.id} fit={viewer.fit} likes={viewer.likes} liked={viewer.liked}
                canVote={Boolean(user) && !viewer.is_mine} own={viewer.is_mine} />
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
