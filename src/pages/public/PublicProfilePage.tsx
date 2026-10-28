import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLoad } from '../../hooks/useLoad';
import { getPublicCollection, thumbSrc } from '../../lib/api';
import { formatDate } from '../../lib/format';
import { listingBadge, listingPrice } from '../../lib/listing';
import { EmptyState, LinkButton, Notice, PageHeader } from '../../components/ui';
import ContactButton from '../../components/ContactButton/ContactButton';
import WatchCard, { WatchGrid } from '../../components/WatchCard/WatchCard';
import { defineStrings, useStrings } from '../../i18n';
import s from './PublicProfilePage.module.css';
import { SkeletonGrid, SkeletonHeader } from '../../components/Skeleton/Skeleton';

const S = defineStrings({
  notFoundTitle: 'Profil introuvable',
  notFoundText: 'Aucun membre ne porte ce pseudo.',
  watches: (n: number) => `${n} montre${n > 1 ? 's' : ''}`,
  memberSince: (date: string) => `, membre depuis ${date}`,
  edit: 'Modifier',
  writeTo: (username: string) => `Écrire à @${username}`,
  privateTitle: 'Collection privée',
  privateText: 'Ce membre garde sa collection pour lui.',
  emptyTitle: 'Écrin vide pour l\'instant',
}, {
  notFoundTitle: 'Profile not found',
  notFoundText: 'No member goes by this username.',
  watches: n => `${n} ${n === 1 ? 'watch' : 'watches'}`,
  memberSince: date => `, member since ${date}`,
  edit: 'Edit',
  writeTo: username => `Message @${username}`,
  privateTitle: 'Private collection',
  privateText: 'This member keeps their collection to themselves.',
  emptyTitle: 'The watch box is empty for now',
});

export default function PublicProfilePage() {
  const t = useStrings(S);
  const { username } = useParams();
  const { profile: me } = useAuth();
  const q = useLoad(() => getPublicCollection(username!), [username]);

  if (q.loading) return <div className="page"><SkeletonHeader /><SkeletonGrid count={8} /></div>;
  if (q.error) return <div className="page"><Notice tone="error">{q.error}</Notice></div>;
  const p = q.data;
  if (!p) return <div className="page"><EmptyState title={t.notFoundTitle}>{t.notFoundText}</EmptyState></div>;

  const isMe = me?.username === p.username;

  return (
    <div className="page">
      <div className={s.head}>
        <span className={s.avatar}>{p.profile_picture_url ? <img src={p.profile_picture_url} alt="" /> : p.username.charAt(0).toUpperCase()}</span>
        <PageHeader
          title={`@${p.username}`}
          subtitle={p.is_public ? `${t.watches(p.watches.length)}${p.created_at ? t.memberSince(formatDate(p.created_at, { month: 'long', year: 'numeric' })) : ''}` : undefined}
          action={isMe ? <LinkButton to="/profil" variant="secondary" size="small">{t.edit}</LinkButton> : undefined}
        />
      </div>
      {!isMe && p.is_public && p.accepts_messages && (
        <div className={s.contact}><ContactButton username={p.username} label={t.writeTo(p.username)} variant="secondary" /></div>
      )}

      {!p.is_public ? (
        <EmptyState title={t.privateTitle}>{t.privateText}</EmptyState>
      ) : p.watches.length === 0 ? (
        <EmptyState title={t.emptyTitle} />
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
