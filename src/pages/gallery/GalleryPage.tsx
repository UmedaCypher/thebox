import { useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, X } from 'lucide-react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLoad } from '../../hooks/useLoad';
import { getFitRanking, listGalleryBrands, listGalleryShots, photoUrl, thumbPath } from '../../lib/api';
import type { GalleryShot } from '../../types';
import FitScale, { FitBadge } from '../../components/WristCheck/FitScale';
import { Cushion, EmptyState, IconButton, Img, LinkButton, Notice, PageHeader, Segmented } from '../../components/ui';
import { formatDecimal } from '../../lib/format';
import { defineStrings, useStrings } from '../../i18n';
import { COMMON } from '../../i18n/common';
import CommunityNav from '../../components/CommunityNav/CommunityNav';
import s from './GalleryPage.module.css';
import { SkeletonGrid } from '../../components/Skeleton/Skeleton';

const S = defineStrings({
  subtitle: 'Des montres photographiées au poignet. Choisissez un tour de poignet pour voir comment elles tombent.',
  brand: 'Marque',
  allBrands: 'Toutes',
  wristTitle: 'Quel tour de poignet ?',
  wristHint: 'Mesurez le tour de votre poignet juste sous l’os, avec un mètre ruban ou une ficelle.',
  allWrists: 'Tous',
  mine: 'Le mien',
  setMine: 'Indiquer le mien',
  bands: ['Fin', 'Moyen', 'Moyen +', 'Large', 'Très large'],
  custom: 'Sur mesure',
  showAll: 'Tout effacer',
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
  subtitle: 'Watches photographed on the wrist. Pick a wrist size to see how they sit.',
  brand: 'Brand',
  allBrands: 'All',
  wristTitle: 'Which wrist size?',
  wristHint: 'Measure around your wrist just below the bone, with a tape measure or a piece of string.',
  allWrists: 'All',
  mine: 'Mine',
  setMine: 'Add mine',
  bands: ['Slim', 'Medium', 'Medium +', 'Large', 'Extra large'],
  custom: 'Custom',
  showAll: 'Clear all',
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
  const [filters, setFilters] = useState({ brand: (params.get('marque') || null) as string | null, minWrist: parse(params.get('min') ?? ''), maxWrist: parse(params.get('max') ?? '') });

  const [view, setView] = useState<'photos' | 'ranking'>(params.get('vue') === 'classement' ? 'ranking' : 'photos');
  const [viewer, setViewer] = useState<GalleryShot | null>(null);
  const brands = useLoad(listGalleryBrands, []);
  const shots = useLoad(() => listGalleryShots(filters), [filters], view === 'photos');
  const todays = useLoad(() => listGalleryShots({ brand: null, minWrist: null, maxWrist: null, today: true }).catch(() => []), []);
  const ranking = useLoad(() => getFitRanking(filters.minWrist, filters.maxWrist), [filters.minWrist, filters.maxWrist], view === 'ranking');
  const rangeLabel = filters.minWrist && filters.maxWrist ? t.rankRange(formatDecimal(filters.minWrist), formatDecimal(filters.maxWrist))
    : filters.minWrist ? t.rankFrom(formatDecimal(filters.minWrist)) : filters.maxWrist ? t.rankTo(formatDecimal(filters.maxWrist)) : t.rankAll;

  // Les filtres s'appliquent dès qu'on touche une taille ou une marque : pas de bouton « Filtrer »
  const setWrist = (minWrist: number | null, maxWrist: number | null) => setFilters(f => ({ ...f, minWrist, maxWrist }));
  const reset = () => setFilters({ brand: null, minWrist: null, maxWrist: null });
  const filtered = filters.brand || filters.minWrist || filters.maxWrist;

  return (
    <div className="page">
      {user && <CommunityNav />}
      <PageHeader
        title={c.tabs.gallery}
        subtitle={t.subtitle}
        hideTitleOnMobile={Boolean(user)}
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

      <WristFilter min={filters.minWrist} max={filters.maxWrist} mine={profile?.wrist_size_cm ? Number(profile.wrist_size_cm) : null}
        loggedIn={Boolean(user)} onWrist={setWrist}
        brand={filters.brand} brands={brands.data ?? []} onBrand={b => setFilters(f => ({ ...f, brand: b || null }))}
        onReset={filtered ? reset : undefined} />

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

/* ---------- Filtre par tour de poignet : des tailles à toucher, appliquées tout de suite ---------- */

const BANDS: [number | null, number | null][] = [[null, 16], [16, 17], [17, 18], [18, 19], [19, null]];
const bandRange = (lo: number | null, hi: number | null) =>
  lo === null ? `< ${formatDecimal(hi!)}` : hi === null ? `${formatDecimal(lo)} +` : `${formatDecimal(lo)}–${formatDecimal(hi)}`;

/** Coupe du poignet : une ellipse plus ou moins large selon la taille, pour lire la taille d'un coup d'œil. */
function WristGlyph({ size }: { size: number }) {
  const rx = 6 + size * 2; // 0 : fin, 4 : très large
  return (
    <svg className={s.glyph} width="32" height="20" viewBox="0 0 32 20" aria-hidden="true">
      <ellipse cx="16" cy="10" rx={rx} ry={Math.min(9, rx * 0.6)} />
    </svg>
  );
}

function WristFilter({ min, max, mine, loggedIn, onWrist, brand, brands, onBrand, onReset }: {
  min: number | null; max: number | null; mine: number | null; loggedIn: boolean;
  onWrist: (min: number | null, max: number | null) => void;
  brand: string | null; brands: string[]; onBrand: (b: string) => void; onReset?: () => void;
}) {
  const t = useStrings(S);
  const mineLo = mine !== null ? Math.round((mine - 0.5) * 10) / 10 : null;
  const mineHi = mine !== null ? Math.round((mine + 0.5) * 10) / 10 : null;
  const is = (lo: number | null, hi: number | null) => min === lo && max === hi;
  const known = is(null, null) || BANDS.some(([lo, hi]) => is(lo, hi)) || (mine !== null && is(mineLo, mineHi));
  const brandLabel = brand ?? t.allBrands;

  return (
    <section className={s.wristFilter} aria-labelledby="wrist-filter-title">
      <div className={s.wfHead}>
        <h2 id="wrist-filter-title" className={s.wfTitle}>{t.wristTitle}</h2>
        {onReset && <button type="button" className={s.wfReset} onClick={onReset}>{t.showAll}</button>}
      </div>
      <div className={s.chips} role="group" aria-labelledby="wrist-filter-title">
        <button type="button" className={s.chip} aria-pressed={is(null, null)} onClick={() => onWrist(null, null)}>
          <span className={s.chipMain}>{t.allWrists}</span>
        </button>
        {mine !== null ? (
          <button type="button" className={s.chip} data-mine aria-pressed={is(mineLo, mineHi)} onClick={() => onWrist(mineLo, mineHi)}>
            <span className={s.chipMain}>{t.mine}</span>
            <span className={s.chipSub}>{formatDecimal(mine)} cm</span>
          </button>
        ) : loggedIn && (
          <Link to="/profil" className={s.chip} data-mine>
            <span className={s.chipMain}>{t.setMine}</span>
            <span className={s.chipSub}>cm</span>
          </Link>
        )}
        {BANDS.map(([lo, hi], i) => (
          <button key={i} type="button" className={s.chip} aria-pressed={is(lo, hi)} onClick={() => onWrist(lo, hi)}
            aria-label={`${t.bands[i]}, ${bandRange(lo, hi)} cm`}>
            <WristGlyph size={i} />
            <span className={s.chipMain}>{bandRange(lo, hi)}</span>
            <span className={s.chipSub}>{t.bands[i]}</span>
          </button>
        ))}
        {!known && (
          <span className={s.chip} data-static aria-current="true">
            <span className={s.chipMain}>{bandRange(min, max)}</span>
            <span className={s.chipSub}>{t.custom}</span>
          </span>
        )}
      </div>
      <p className={s.wfHint}>{t.wristHint}</p>
      <label className={s.brandPill} data-active={Boolean(brand)}>
        <span className={s.brandKey}>{t.brand}</span>
        <span className={s.brandValue}>{brandLabel}</span>
        <ChevronDown size={16} aria-hidden="true" />
        <select value={brand ?? ''} onChange={e => onBrand(e.target.value)} aria-label={t.brand}>
          <option value="">{t.allBrands}</option>
          {brands.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </label>
    </section>
  );
}
