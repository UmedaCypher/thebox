import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLoad } from '../../hooks/useLoad';
import { getFeed, getProfileSocial, getPublicCollection, thumbSrc } from '../../lib/api';
import type { FeedItem, ProfileSocial } from '../../lib/api';
import { FeedCard, FollowButton } from '../../components/Feed/Feed';
import { formatDate } from '../../lib/format';
import { listingBadge, listingPrice } from '../../lib/listing';
import { EmptyState, LinkButton, Notice, PageHeader, Segmented } from '../../components/ui';
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
  followers: (n: number) => `${n} abonné${n > 1 ? 's' : ''}`,
  following: (n: number) => `${n} abonnement${n > 1 ? 's' : ''}`,
  followsYou: 'Vous suit',
  tabs: 'Rubriques', activity: 'Activité', collection: 'Collection',
  noActivity: 'Pas encore de publication.',
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
  followers: (n: number) => `${n} follower${n > 1 ? 's' : ''}`,
  following: (n: number) => `${n} following`,
  followsYou: 'Follows you',
  tabs: 'Sections', activity: 'Activity', collection: 'Collection',
  noActivity: 'No posts yet.',
});

export default function PublicProfilePage() {
  const t = useStrings(S);
  const { username } = useParams();
  const { profile: me, user } = useAuth();
  const q = useLoad(() => getPublicCollection(username!), [username]);
  const [social, setSocial] = useState<ProfileSocial | null>(null);
  const [tab, setTab] = useState<'activity' | 'collection'>('collection');
  const [items, setItems] = useState<FeedItem[] | null>(null);
  useEffect(() => { getProfileSocial(username!).then(setSocial); }, [username]);
  // L'activité (publications, wrist shots, annonces) est le premier onglet dès qu'il y en a
  useEffect(() => {
    if (!social?.user_id) return;
    getFeed('all', null, social.user_id).then(list => { setItems(list); if (list.length) setTab('activity'); }).catch(() => setItems([]));
  }, [social?.user_id]);

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
      {social && (
        <div className={s.social}>
          {social.bio && <p className={s.bio}>{social.bio}</p>}
          <p className={s.counts}>
            <strong>{t.followers(social.followers)}</strong> · <span>{t.following(social.following)}</span>
            {social.follows_me && <span className={s.followsYou}>{t.followsYou}</span>}
          </p>
        </div>
      )}
      {!isMe && p.is_public && (
        <div className={s.contact}>
          {user && social && <FollowButton uid={user.id} targetId={social.user_id} following={social.i_follow}
            onChange={v => setSocial({ ...social, i_follow: v, followers: social.followers + (v ? 1 : -1) })} />}
          {p.accepts_messages && <ContactButton username={p.username} label={t.writeTo(p.username)} variant="secondary" />}
        </div>
      )}
      {p.is_public && social && (
        <div className={s.tabs}>
          <Segmented label={t.tabs} value={tab} onChange={setTab} options={[{ value: 'activity', label: t.activity }, { value: 'collection', label: t.collection }]} />
        </div>
      )}
      {tab === 'activity' && p.is_public && social ? (
        <div className={s.feed}>
          {items && items.length === 0 && <p className={s.muted}>{t.noActivity}</p>}
          {(items ?? []).map(it => <FeedCard key={`${it.kind}-${it.id}`} item={it} uid={user?.id ?? null} onRemoved={() => setItems(x => (x ?? []).filter(y => y !== it))} />)}
        </div>
      ) : null}

      {tab === 'activity' && p.is_public && social ? null : !p.is_public ? (
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
