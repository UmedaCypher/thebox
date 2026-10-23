import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLoad } from '../../hooks/useLoad';
import { getPassport, mainPhoto, photoUrl, thumbSrc } from '../../lib/api';
import { formatDate, formatMm } from '../../lib/format';
import { listingPrice } from '../../lib/listing';
import { Cushion, LinkButton, Loading, Notice } from '../../components/ui';
import ContactButton from '../../components/ContactButton/ContactButton';
import s from './PassportPage.module.css';

/** Passeport public d'une montre : caractéristiques et historique, jamais les prix. */
export default function PassportPage() {
  const { watchId } = useParams();
  const q = useLoad(() => getPassport(watchId!), [watchId]);
  const [idx, setIdx] = useState(0);

  if (q.loading) return <div className="page"><Loading /></div>;
  const p = q.data;
  if (q.error || !p) {
    return (
      <div className="page page--narrow">
        <Notice tone="error">{q.error ?? "Ce passeport n'existe pas ou n'est plus partagé."}</Notice>
      </div>
    );
  }

  const photos = [...p.photos].sort((a, b) => Number(b.is_main_photo) - Number(a.is_main_photo));
  const current = photos[idx] ?? mainPhoto(photos);
  const rows: [string, string | number | null][] = [
    ['Référence', p.reference_number], ['Année', p.year_of_production], ['Mouvement', p.movement],
    ['Diamètre', formatMm(p.case_diameter_mm)], ['Corne à corne', formatMm(p.lug_to_lug_mm)], ['Entrecorne', formatMm(p.lug_width_mm)],
    ['Boîtier', p.case_material], ['Cadran', p.dial_color],
    ['Bracelet', [p.bracelet_material, p.bracelet_type].filter(Boolean).join(', ') || null],
    ['État', p.condition], ['Boîte et papiers', p.box_papers_status],
  ];

  return (
    <div className="page">
      <article className={s.passport}>
        <div className={s.media}>
          <Cushion src={photoUrl(current?.storage_path)} alt={`${p.brand} ${p.model}`} ratio="portrait" />
          {photos.length > 1 && (
            <div className={s.thumbs}>
              {photos.map((ph, i) => (
                <button key={ph.storage_path} aria-label={`Photo ${i + 1}`} aria-pressed={ph === current} onClick={() => setIdx(i)}>
                  <Cushion src={thumbSrc(ph.storage_path).src} fallbackSrc={thumbSrc(ph.storage_path).fallback} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={s.body}>
          <p className={s.kind}>{p.listing ? (p.listing.kind === 'sale' ? 'À vendre' : 'À échanger') : 'Passeport de montre'}</p>
          <h1 className={s.title}>{p.model}</h1>
          <p className={s.brand}>{p.brand}</p>

          {p.listing && (
            <section className={s.listing} aria-label="Annonce">
              <div className={s.listingHead}>
                <strong className={`${s.listingPrice} num`}>{listingPrice(p.listing.kind, p.listing.price)}</strong>
                <span className={s.listingMeta}>
                  {[p.listing.city, p.listing.listed_at && `en ligne depuis le ${formatDate(p.listing.listed_at, { day: 'numeric', month: 'long' })}`].filter(Boolean).join(' · ')}
                </span>
              </div>
              {p.listing.note && <p className={s.listingNote}>{p.listing.note}</p>}
              {p.is_owner ? (
                <LinkButton to={`/montre/${p.id}/modifier`} variant="secondary">Modifier mon annonce</LinkButton>
              ) : p.owner_accepts_messages ? (
                <div className={s.contact}>
                  <ContactButton watchId={p.id} label={p.owner_username ? `Écrire à @${p.owner_username}` : 'Contacter le vendeur'} />
                </div>
              ) : (
                <p className={s.owner}>Ce membre ne reçoit pas de messages pour le moment.</p>
              )}
            </section>
          )}

          <dl className={s.specs}>
            {rows.filter(([, v]) => v !== null && v !== '').map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
          </dl>

          <div className={s.record}>
            <div><strong className="num">{p.service_count}</strong><span>{p.service_count > 1 ? 'entretiens notés' : 'entretien noté'}</span></div>
            <div><strong>{p.last_service_on ? formatDate(p.last_service_on, { month: 'short', year: 'numeric' }) : '—'}</strong><span>dernière révision</span></div>
            <div><strong className="num">{p.wear_count}</strong><span>{p.wear_count > 1 ? 'jours' : 'jour'} au poignet</span></div>
          </div>

          <p className={s.owner}>
            {p.owner_username && p.owner_is_public
              ? <>Dans la collection de <Link to={`/profil/${p.owner_username}`}>@{p.owner_username}</Link>.</>
              : p.listing && p.owner_username ? <>Proposée par @{p.owner_username}.</>
              : 'Dans une collection privée.'}{' '}
            {p.listing ? "Le prix d'achat et la valeur estimée ne sont jamais publiés." : 'Prix et valeur ne sont jamais publiés.'}
          </p>

          {p.is_owner
            ? <LinkButton to={`/montre/${p.id}`} variant="ghost">Retour à ma montre</LinkButton>
            : p.listing ? <LinkButton to="/marche" variant="ghost">Retour au marché</LinkButton>
            : <LinkButton to="/" variant="secondary">Créer le passeport de mes montres</LinkButton>}
        </div>
      </article>
    </div>
  );
}
