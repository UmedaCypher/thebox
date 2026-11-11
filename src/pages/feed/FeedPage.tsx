import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLoad } from '../../hooks/useLoad';
import { followByUsername, getFeed, getFollowSuggestions, listWatches } from '../../lib/api';
import type { FeedItem, FollowSuggestion } from '../../lib/api';
import { PenLine } from 'lucide-react';
import { Button, EmptyState, Notice, PageHeader, Segmented, Sheet } from '../../components/ui';
import CommunityNav from '../../components/CommunityNav/CommunityNav';
import { Composer, FeedCard } from '../../components/Feed/Feed';
import { SkeletonList } from '../../components/Skeleton/Skeleton';
import { defineStrings, useStrings } from '../../i18n';
import s from './FeedPage.module.css';

const S = defineStrings({
  title: 'Feed',
  write: 'Écrire un post',
  newPost: 'Nouveau post',
  following: 'Abonnements', all: 'Tous les membres', mode: 'Afficher',
  emptyFollowing: 'Votre feed est encore calme',
  emptyFollowingText: 'Suivez quelques collectionneurs : leurs publications, wrist shots et annonces apparaîtront ici.',
  emptyAll: 'Aucune publication pour le moment. Lancez la conversation !',
  more: 'Voir plus',
  suggest: 'Collectionneurs à suivre',
  watches: (n: number) => `${n} montre${n > 1 ? 's' : ''}`,
  follow: 'Suivre',
}, {
  title: 'Feed',
  write: 'Write a post',
  newPost: 'New post',
  following: 'Following', all: 'All members', mode: 'Show',
  emptyFollowing: 'Your feed is quiet for now',
  emptyFollowingText: 'Follow a few collectors: their posts, wrist shots and listings will show up here.',
  emptyAll: 'No posts yet. Start the conversation!',
  more: 'Show more',
  suggest: 'Collectors to follow',
  watches: (n: number) => `${n} watch${n > 1 ? 'es' : ''}`,
  follow: 'Follow',
});

export default function FeedPage() {
  const t = useStrings(S);
  const { user, profile } = useAuth();
  const uid = user!.id;
  const watches = useLoad(() => listWatches(uid), [uid]);
  const [mode, setMode] = useState<'following' | 'all'>('following');
  const [items, setItems] = useState<FeedItem[] | null>(null);
  const [more, setMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [writing, setWriting] = useState(false);
  const [suggestions, setSuggestions] = useState<FollowSuggestion[]>([]);

  const load = useCallback(async (append = false, before?: string) => {
    try {
      const page = await getFeed(mode, before);
      setItems(prev => (append ? [...(prev ?? []), ...page] : page));
      setMore(page.length === 20); setError(null);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); setItems([]); }
  }, [mode]);
  useEffect(() => { setItems(null); load(); }, [load]);
  useEffect(() => { getFollowSuggestions().then(setSuggestions); }, []);

  const follow = async (username: string) => {
    await followByUsername(uid, username).catch(() => null);
    setSuggestions(x => x.filter(sg => sg.username !== username));
    if (mode === 'following') load();
  };
  const canPost = Boolean(profile?.username && profile?.is_public);

  return (
    <div className="page">
      <CommunityNav />
      <PageHeader title={t.title} hideTitleOnMobile
        action={<Button className={s.writeDesktop} onClick={() => setWriting(true)}><PenLine size={16} aria-hidden="true" />{t.write}</Button>} />
      {/* Téléphone : bouton flottant au-dessus de la barre d'onglets */}
      <button type="button" className={s.fab} onClick={() => setWriting(true)} aria-label={t.write}>
        <PenLine size={22} aria-hidden="true" /><span>{t.write}</span>
      </button>
      <Sheet open={writing} onClose={() => setWriting(false)} title={t.newPost}>
        {writing && <Composer uid={uid} watches={watches.data ?? []} canPost={canPost}
          onPosted={() => { setWriting(false); setMode('following'); load(); }} />}
      </Sheet>
      <div className={s.layout}>
        <div className={s.main}>
          <Segmented label={t.mode} value={mode} onChange={setMode} options={[{ value: 'following', label: t.following }, { value: 'all', label: t.all }]} />
          {error && <Notice tone="error">{error}</Notice>}
          {!items ? <SkeletonList rows={3} /> : items.length === 0 ? (
            mode === 'following'
              ? <EmptyState title={t.emptyFollowing}>{t.emptyFollowingText}</EmptyState>
              : <EmptyState title={t.emptyAll} />
          ) : (
            <div className={s.list}>
              {items.map(it => <FeedCard key={`${it.kind}-${it.id}`} item={it} uid={uid} onRemoved={() => setItems(x => (x ?? []).filter(y => y !== it))} />)}
              {more && <Button variant="secondary" onClick={() => load(true, items[items.length - 1]?.created_at)}>{t.more}</Button>}
            </div>
          )}
        </div>
        {suggestions.length > 0 && (
          <aside className={`panel ${s.aside}`} data-tone="plain">
            <h2 className={s.h}>{t.suggest}</h2>
            <ul className={s.suggest}>
              {suggestions.map(sg => (
                <li key={sg.username}>
                  <Link to={`/profil/${sg.username}`} className={s.who}>
                    <span className={s.avatar}>{sg.avatar ? <img src={sg.avatar} alt="" /> : sg.username.charAt(0).toUpperCase()}</span>
                    <span><strong>@{sg.username}</strong><small>{t.watches(sg.watches)}</small></span>
                  </Link>
                  <Button size="small" variant="secondary" onClick={() => follow(sg.username)}>{t.follow}</Button>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </div>
  );
}
