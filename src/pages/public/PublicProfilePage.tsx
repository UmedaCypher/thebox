import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLoad } from '../../hooks/useLoad';
import { getPublicCollection, thumbSrc } from '../../lib/api';
import { formatDate } from '../../lib/format';
import { listingBadge, listingPrice } from '../../lib/listing';
import { EmptyState, LinkButton, Loading, Notice, PageHeader } from '../../components/ui';
import ContactButton from '../../components/ContactButton/ContactButton';
import WatchCard, { WatchGrid } from '../../components/WatchCard/WatchCard';
import s from './PublicProfilePage.module.css';

export default function PublicProfilePage() {
  const { username } = useParams();
  const { profile: me } = useAuth();
  const q = useLoad(() => getPublicCollection(username!), [username]);

  if (q.loading) return <div className="page"><Loading /></div>;
  if (q.error) return <div className="page"><Notice tone="error">{q.error}</Notice></div>;
  const p = q.data;
  if (!p) return <div className="page"><EmptyState title="Profil introuvable">Aucun membre ne porte ce pseudo.</EmptyState></div>;

  const isMe = me?.username === p.username;

  return (
    <div className="page">
      <div className={s.head}>
        <span className={s.avatar}>{p.profile_picture_url ? <img src={p.profile_picture_url} alt="" /> : p.username.charAt(0).toUpperCase()}</span>
        <PageHeader
          title={`@${p.username}`}
          subtitle={p.is_public ? `${p.watches.length} montre${p.watches.length > 1 ? 's' : ''}${p.created_at ? `, membre depuis ${formatDate(p.created_at, { month: 'long', year: 'numeric' })}` : ''}` : undefined}
          action={isMe ? <LinkButton to="/profil" variant="secondary" size="small">Modifier</LinkButton> : undefined}
        />
      </div>
      {!isMe && p.is_public && p.accepts_messages && (
        <div className={s.contact}><ContactButton username={p.username} label={`Écrire à @${p.username}`} variant="secondary" /></div>
      )}

      {!p.is_public ? (
        <EmptyState title="Collection privée">Ce membre garde sa collection pour lui.</EmptyState>
      ) : p.watches.length === 0 ? (
        <EmptyState title="Écrin vide pour l'instant" />
      ) : (
        <WatchGrid>
          {p.watches.map(w => (
            <WatchCard key={w.id} to={`/passeport/${w.id}`} brand={w.brand} model={w.model}
              photo={thumbSrc(w.main_photo_path).src} photoFallback={thumbSrc(w.main_photo_path).fallback}
              badge={listingBadge(w.kind)} price={listingPrice(w.kind, w.sale_price)}
              meta={[w.reference_number, w.year_of_production].filter(Boolean).join(', ') || null} />
          ))}
        </WatchGrid>
      )}
    </div>
  );
}
