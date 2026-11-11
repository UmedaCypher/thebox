import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Heart, MessageCircle, Store, Trash2, UserCheck, UserPlus, Watch as WatchIcon, X } from 'lucide-react';
import {
  addPostComment, createPost, deletePost, deletePostComment, getPostComments, photoUrl, setFollow, thumbSrc, togglePostLike,
} from '../../lib/api';
import type { FeedItem, PostComment } from '../../lib/api';
import type { Watch } from '../../types';
import { Button, Img, Notice, SelectField, TextArea } from '../ui';
import { formatAgo, formatEuros } from '../../lib/format';
import { defineStrings, useStrings } from '../../i18n';
import s from './Feed.module.css';

const S = defineStrings({
  placeholder: 'Une nouvelle pièce, un Wrist Check, une question à la communauté…',
  watch: 'Montre (facultatif)', noWatch: 'Aucune',
  photo: 'Photo', removePhoto: 'Retirer la photo',
  publish: 'Publier', publishing: 'Publication…',
  needPublic: 'Pour publier, rendez votre profil public et choisissez un pseudo dans votre profil.',
  wrist: 'a publié un wrist shot', listing: 'a mis une montre sur le Marché', trade: 'à échanger',
  like: 'J’aime', comments: 'Commentaires', comment: 'Écrire un commentaire…', send: 'Envoyer',
  delete: 'Supprimer', confirmDelete: 'Supprimer cette publication ?',
  follow: 'Suivre', following: 'Abonné',
}, {
  placeholder: 'A new piece, a Wrist Check, a question for the community…',
  watch: 'Watch (optional)', noWatch: 'None',
  photo: 'Photo', removePhoto: 'Remove photo',
  publish: 'Post', publishing: 'Posting…',
  needPublic: 'To post, make your profile public and choose a username in your profile.',
  wrist: 'posted a wrist shot', listing: 'listed a watch on the Market', trade: 'for trade',
  like: 'Like', comments: 'Comments', comment: 'Write a comment…', send: 'Send',
  delete: 'Delete', confirmDelete: 'Delete this post?',
  follow: 'Follow', following: 'Following',
});

const Avatar = ({ src, name }: { src: string | null; name: string }) => (
  <span className={s.avatar}>{src ? <img src={src} alt="" /> : name.charAt(0).toUpperCase()}</span>
);

/** Rédaction d'une publication. */
/** Rédaction d'un post, dans la fenêtre « Écrire un post ». */
export function Composer({ uid, watches, canPost, onPosted }: { uid: string; watches: Watch[]; canPost: boolean; onPosted: () => void }) {
  const t = useStrings(S);
  const [body, setBody] = useState('');
  const [watchId, setWatchId] = useState('none');
  const [file, setFile] = useState<{ file: File; url: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  if (!canPost) return <Notice>{t.needPublic} <Link to="/profil">→</Link></Notice>;

  const submit = async (e: FormEvent) => {
    e.preventDefault(); if (!body.trim()) return;
    setBusy(true); setError(null);
    try {
      await createPost(uid, body, watchId === 'none' ? null : watchId, file?.file ?? null);
      setBody(''); setWatchId('none'); if (file) URL.revokeObjectURL(file.url); setFile(null); onPosted();
    } catch (err) { setError(err instanceof Error ? err.message : String(err)); }
    setBusy(false);
  };
  return (
    <form className={s.composer} onSubmit={submit}>
      <TextArea label={t.placeholder} className={s.bodyField} rows={5} value={body} placeholder={t.placeholder} autoFocus
        onChange={e => setBody(e.target.value.slice(0, 1000))} hint={`${body.length} / 1000`} />
      {file && (
        <span className={s.preview}><img src={file.url} alt="" />
          <button type="button" onClick={() => { URL.revokeObjectURL(file.url); setFile(null); }} aria-label={t.removePhoto}><X size={14} /></button>
        </span>
      )}
      <div className={s.composerRow}>
        <SelectField label={t.watch} value={watchId} onChange={e => setWatchId(e.target.value)}
          options={[{ value: 'none', label: t.noWatch }, ...watches.map(w => ({ value: w.id, label: `${w.brand} ${w.model}` }))]} />
        <Button variant="secondary" size="small" onClick={() => input.current?.click()}><Camera size={16} aria-hidden="true" />{t.photo}</Button>
        <input ref={input} type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) setFile({ file: f, url: URL.createObjectURL(f) }); }} />
        <Button type="submit" size="small" disabled={busy || !body.trim()}>{busy ? t.publishing : t.publish}</Button>
      </div>
      {error && <Notice tone="error">{error}</Notice>}
    </form>
  );
}

/** Un élément du fil : publication, wrist shot ou nouvelle annonce. */
export function FeedCard({ item, uid, onRemoved }: { item: FeedItem; uid: string | null; onRemoved?: () => void }) {
  const t = useStrings(S);
  const [likes, setLikes] = useState(item.likes ?? 0);
  const [liked, setLiked] = useState(Boolean(item.liked));
  const [count, setCount] = useState(item.comments ?? 0);
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<PostComment[] | null>(null);
  const [draft, setDraft] = useState('');
  const img = item.photo_path ? (item.kind === 'post' ? { src: photoUrl(item.photo_path)!, fallback: null } : thumbSrc(item.photo_path)) : null;
  const target = item.kind === 'listing' && item.watch ? `/passeport/${item.watch.id}` : item.kind === 'wrist' ? '/galerie' : null;

  const like = async () => {
    if (!uid) return;
    const next = !liked; setLiked(next); setLikes(n => n + (next ? 1 : -1));
    try { await togglePostLike(uid, item.id, next); } catch { setLiked(!next); setLikes(n => n + (next ? -1 : 1)); }
  };
  const toggleComments = async () => {
    const next = !open; setOpen(next);
    if (next && !comments) setComments(await getPostComments(item.id).catch(() => []));
  };
  const send = async (e: FormEvent) => {
    e.preventDefault(); if (!uid || !draft.trim()) return;
    await addPostComment(uid, item.id, draft).catch(() => null);
    setDraft(''); setCount(n => n + 1); setComments(await getPostComments(item.id).catch(() => []));
  };
  const removeComment = async (id: string) => {
    await deletePostComment(id).catch(() => null); setCount(n => n - 1);
    setComments(c => (c ?? []).filter(x => x.id !== id));
  };
  const remove = async () => {
    if (!window.confirm(t.confirmDelete)) return;
    await deletePost(item.id, item.photo_path).catch(() => null); onRemoved?.();
  };

  return (
    <article className={`panel ${s.card}`} data-tone="plain" data-kind={item.kind}>
      <header className={s.cardHead}>
        <Link to={`/profil/${item.author.username}`} className={s.author}>
          <Avatar src={item.author.avatar} name={item.author.username} />
          <span><strong>@{item.author.username}</strong>{item.kind !== 'post' && <span className={s.action}> {item.kind === 'wrist' ? t.wrist : t.listing}</span>}</span>
        </Link>
        <time className={s.time} dateTime={item.created_at}>{formatAgo(item.created_at)}</time>
      </header>
      {item.body && <p className={s.body}>{item.body}</p>}
      {img?.src && (
        target
          ? <Link to={target} className={s.photo}><Img src={img.src} fallback={img.fallback} alt="" /></Link>
          : <span className={s.photo}><Img src={img.src} fallback={img.fallback} alt="" /></span>
      )}
      {item.watch && (
        <Link to={item.kind === 'listing' ? `/passeport/${item.watch.id}` : `/passeport/${item.watch.id}`} className={s.watchChip}>
          {item.kind === 'listing' ? <Store size={14} aria-hidden="true" /> : <WatchIcon size={14} aria-hidden="true" />}
          {item.watch.brand} {item.watch.model}
          {item.kind === 'listing' && <strong>{item.price !== null ? formatEuros(Number(item.price)) : t.trade}</strong>}
        </Link>
      )}
      {item.kind === 'post' && (
        <footer className={s.cardFoot}>
          <button type="button" className={s.react} aria-pressed={liked} onClick={like} disabled={!uid}>
            <Heart size={18} fill={liked ? 'currentColor' : 'none'} aria-hidden="true" /><span>{likes || ''}</span><span className="visually-hidden">{t.like}</span>
          </button>
          <button type="button" className={s.react} aria-expanded={open} onClick={toggleComments}>
            <MessageCircle size={18} aria-hidden="true" /><span>{count || ''}</span><span className="visually-hidden">{t.comments}</span>
          </button>
          {item.mine && <button type="button" className={s.react} onClick={remove} aria-label={t.delete}><Trash2 size={16} /></button>}
        </footer>
      )}
      {open && (
        <div className={s.comments}>
          {(comments ?? []).map(c => (
            <p key={c.id} className={s.comment}>
              <Link to={`/profil/${c.author.username}`}>@{c.author.username}</Link> {c.body}
              {(c.mine || item.mine) && <button type="button" onClick={() => removeComment(c.id)} aria-label={t.delete}><X size={12} /></button>}
            </p>
          ))}
          {uid && (
            <form className={s.commentForm} onSubmit={send}>
              <input value={draft} onChange={e => setDraft(e.target.value.slice(0, 500))} placeholder={t.comment} aria-label={t.comment} />
              <Button type="submit" size="small" variant="secondary" disabled={!draft.trim()}>{t.send}</Button>
            </form>
          )}
        </div>
      )}
    </article>
  );
}

/** Bouton Suivre / Abonné. */
export function FollowButton({ uid, targetId, following, onChange }: { uid: string; targetId: string; following: boolean; onChange: (v: boolean) => void }) {
  const t = useStrings(S);
  const [busy, setBusy] = useState(false);
  const toggle = async () => {
    setBusy(true);
    try { await setFollow(uid, targetId, !following); onChange(!following); } catch { /* état inchangé */ }
    setBusy(false);
  };
  return (
    <Button size="small" variant={following ? 'secondary' : 'primary'} onClick={toggle} disabled={busy}>
      {following ? <UserCheck size={16} aria-hidden="true" /> : <UserPlus size={16} aria-hidden="true" />}{following ? t.following : t.follow}
    </Button>
  );
}
