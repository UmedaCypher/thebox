import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLoad } from '../../hooks/useLoad';
import { getPassport, mainPhoto, photoUrl, thumbSrc } from '../../lib/api';
import { formatDate, formatMm } from '../../lib/format';
import { listingPrice } from '../../lib/listing';
import { Cushion, LinkButton, Loading, Notice } from '../../components/ui';
import ContactButton from '../../components/ContactButton/ContactButton';
import { defineStrings, useLang, useStrings } from '../../i18n';
import { COMMON, movementLabel } from '../../i18n/common';
import s from './PassportPage.module.css';

const S = defineStrings({
  notFound: 'Ce passeport n\'existe pas ou n\'est plus partagé.',
  specs: {
    reference: 'Référence', year: 'Année', movement: 'Mouvement', diameter: 'Diamètre', lugToLug: 'Corne à corne',
    lugWidth: 'Entrecorne', case: 'Boîtier', dial: 'Cadran', strap: 'Bracelet', condition: 'État', boxPapers: 'Boîte et papiers',
  },
  photo: (n: number) => `Photo ${n}`,
  passport: 'Passeport de montre',
  listing: 'Annonce',
  listedSince: (date: string) => `en ligne depuis le ${date}`,
  editListing: 'Modifier mon annonce',
  writeTo: (username: string) => `Écrire à @${username}`,
  contactSeller: 'Contacter le vendeur',
  noMessages: 'Ce membre ne reçoit pas de messages pour le moment.',
  services: (n: number) => (n > 1 ? 'entretiens notés' : 'entretien noté'),
  lastService: 'dernière révision',
  daysOnWrist: (n: number) => `${n > 1 ? 'jours' : 'jour'} au poignet`,
  inCollectionOf: 'Dans la collection de ',
  offeredBy: (username: string) => `Proposée par @${username}.`,
  privateCollection: 'Dans une collection privée.',
  pricesPrivateListing: 'Le prix d\'achat et la valeur estimée ne sont jamais publiés.',
  pricesPrivate: 'Prix et valeur ne sont jamais publiés.',
  backToWatch: 'Retour à ma montre',
  backToMarket: 'Retour au marché',
  createPassport: 'Créer le passeport de mes montres',
}, {
  notFound: 'This passport doesn’t exist or is no longer shared.',
  specs: {
    reference: 'Reference', year: 'Year', movement: 'Movement', diameter: 'Diameter', lugToLug: 'Lug to lug',
    lugWidth: 'Lug width', case: 'Case', dial: 'Dial', strap: 'Strap', condition: 'Condition', boxPapers: 'Box & papers',
  },
  photo: n => `Photo ${n}`,
  passport: 'Watch passport',
  listing: 'Listing',
  listedSince: date => `listed since ${date}`,
  editListing: 'Edit my listing',
  writeTo: username => `Message @${username}`,
  contactSeller: 'Contact the seller',
  noMessages: 'This member isn’t accepting messages at the moment.',
  services: n => (n === 1 ? 'service logged' : 'services logged'),
  lastService: 'last service',
  daysOnWrist: n => `${n === 1 ? 'day' : 'days'} on the wrist`,
  inCollectionOf: 'In the collection of ',
  offeredBy: username => `Offered by @${username}.`,
  privateCollection: 'In a private collection.',
  pricesPrivateListing: 'The purchase price and estimated value are never published.',
  pricesPrivate: 'Prices and values are never published.',
  backToWatch: 'Back to my watch',
  backToMarket: 'Back to the Market',
  createPassport: 'Create passports for my watches',
});

/** Passeport public d'une montre : caractéristiques et historique, jamais les prix. */
export default function PassportPage() {
  const t = useStrings(S);
  const c = useStrings(COMMON);
  const { lang } = useLang();
  const { watchId } = useParams();
  const q = useLoad(() => getPassport(watchId!), [watchId]);
  const [idx, setIdx] = useState(0);

  if (q.loading) return <div className="page"><Loading /></div>;
  const p = q.data;
  if (q.error || !p) {
    return (
      <div className="page page--narrow">
        <Notice tone="error">{q.error ?? t.notFound}</Notice>
      </div>
    );
  }

  const photos = [...p.photos].sort((a, b) => Number(b.is_main_photo) - Number(a.is_main_photo));
  const current = photos[idx] ?? mainPhoto(photos);
  const rows: [string, string | number | null][] = [
    [t.specs.reference, p.reference_number], [t.specs.year, p.year_of_production], [t.specs.movement, movementLabel(p.movement, lang)],
    [t.specs.diameter, formatMm(p.case_diameter_mm)], [t.specs.lugToLug, formatMm(p.lug_to_lug_mm)], [t.specs.lugWidth, formatMm(p.lug_width_mm)],
    [t.specs.case, p.case_material], [t.specs.dial, p.dial_color],
    [t.specs.strap, [p.bracelet_material, p.bracelet_type].filter(Boolean).join(', ') || null],
    [t.specs.condition, p.condition], [t.specs.boxPapers, p.box_papers_status],
  ];

  return (
    <div className="page">
      <article className={s.passport}>
        <div className={s.media}>
          <Cushion src={photoUrl(current?.storage_path)} alt={`${p.brand} ${p.model}`} ratio="portrait" />
          {photos.length > 1 && (
            <div className={s.thumbs}>
              {photos.map((ph, i) => (
                <button key={ph.storage_path} aria-label={t.photo(i + 1)} aria-pressed={ph === current} onClick={() => setIdx(i)}>
                  <Cushion src={thumbSrc(ph.storage_path).src} fallbackSrc={thumbSrc(ph.storage_path).fallback} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={s.body}>
          <p className={s.kind}>{p.listing ? (p.listing.kind === 'sale' ? c.listing.forSale : c.listing.forTrade) : t.passport}</p>
          <h1 className={s.title}>{p.model}</h1>
          <p className={s.brand}>{p.brand}</p>

          {p.listing && (
            <section className={s.listing} aria-label={t.listing}>
              <div className={s.listingHead}>
                <strong className={`${s.listingPrice} num`}>{listingPrice(p.listing.kind, p.listing.price)}</strong>
                <span className={s.listingMeta}>
                  {[p.listing.city, p.listing.listed_at && t.listedSince(formatDate(p.listing.listed_at, { day: 'numeric', month: 'long' }))].filter(Boolean).join(' · ')}
                </span>
              </div>
              {p.listing.note && <p className={s.listingNote}>{p.listing.note}</p>}
              {p.is_owner ? (
                <LinkButton to={`/montre/${p.id}/modifier`} variant="secondary">{t.editListing}</LinkButton>
              ) : p.owner_accepts_messages ? (
                <div className={s.contact}>
                  <ContactButton watchId={p.id} label={p.owner_username ? t.writeTo(p.owner_username) : t.contactSeller} />
                </div>
              ) : (
                <p className={s.owner}>{t.noMessages}</p>
              )}
            </section>
          )}

          <dl className={s.specs}>
            {rows.filter(([, v]) => v !== null && v !== '').map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
          </dl>

          <div className={s.record}>
            <div><strong className="num">{p.service_count}</strong><span>{t.services(p.service_count)}</span></div>
            <div><strong>{p.last_service_on ? formatDate(p.last_service_on, { month: 'short', year: 'numeric' }) : '—'}</strong><span>{t.lastService}</span></div>
            <div><strong className="num">{p.wear_count}</strong><span>{t.daysOnWrist(p.wear_count)}</span></div>
          </div>

          <p className={s.owner}>
            {p.owner_username && p.owner_is_public
              ? <>{t.inCollectionOf}<Link to={`/profil/${p.owner_username}`}>@{p.owner_username}</Link>.</>
              : p.listing && p.owner_username ? <>{t.offeredBy(p.owner_username)}</>
              : t.privateCollection}{' '}
            {p.listing ? t.pricesPrivateListing : t.pricesPrivate}
          </p>

          {p.is_owner
            ? <LinkButton to={`/montre/${p.id}`} variant="ghost">{t.backToWatch}</LinkButton>
            : p.listing ? <LinkButton to="/marche" variant="ghost">{t.backToMarket}</LinkButton>
            : <LinkButton to="/" variant="secondary">{t.createPassport}</LinkButton>}
        </div>
      </article>
    </div>
  );
}
