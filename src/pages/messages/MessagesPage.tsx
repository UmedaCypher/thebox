import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Flag, MoreHorizontal, Send, ShieldOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLoad } from '../../hooks/useLoad';
import {
  getConversation, listConversations, listMessages, markConversationRead, reportMessage, sendMessage, setBlocked,
  subscribeToMessages, thumbSrc, UNREAD_REFRESH,
} from '../../lib/api';
import { formatDate, formatTime, toISODate } from '../../lib/format';
import { defineStrings, getLocale, tr, useStrings } from '../../i18n';
import { COMMON } from '../../i18n/common';
import { listingPrice } from '../../lib/listing';
import type { ConversationSummary, Message } from '../../types';
import { Button, Cushion, EmptyState, IconButton, LinkButton, Notice, Sheet } from '../../components/ui';
import { useToast } from '../../components/Toast/Toast';
import PushPrompt from '../../components/Notifications/PushPrompt';
import s from './MessagesPage.module.css';
import { SkeletonList } from '../../components/Skeleton/Skeleton';

const S = defineStrings({
  yesterdayShort: 'hier',
  today: 'Aujourd\'hui',
  yesterday: 'Hier',
  conversations: 'Conversations',
  noConversations: 'Aucune conversation',
  browseMarket: 'Parcourir le marché',
  noConversationsText: 'Écrivez à un vendeur depuis une annonce du marché, ou à un membre depuis son profil public.',
  member: 'Membre',
  blockedMember: 'Membre bloqué',
  you: 'Vous : ',
  chooseConversation: 'Choisissez une conversation.',
  loadError: 'Chargement impossible.',
  sendError: 'Envoi impossible.',
  notFound: 'Conversation introuvable.',
  backToList: 'Retour aux conversations',
  options: 'Options de la conversation',
  about: 'À propos de',
  firstHint: 'Présentez-vous et posez vos questions : état, révision, papiers, remise en main propre. Ne partagez jamais vos codes bancaires ni de lien de paiement.',
  receivedMessage: 'Message reçu, toucher pour les options',
  sending: ' · envoi…',
  notSent: ' · non envoyé',
  reportSent: 'Signalement envoyé. Merci.',
  reportMessage: 'Signaler ce message',
  youBlocked: 'Vous avez bloqué ce membre : il ne peut plus vous écrire.',
  unblock: 'Débloquer',
  yourMessage: 'Votre message',
  send: 'Envoyer',
  conversation: 'Conversation',
  viewProfile: 'Voir le profil',
  reportLast: 'Signaler le dernier message reçu',
  unblockMember: 'Débloquer ce membre',
  blockMember: 'Bloquer ce membre',
  optionsHint: 'Un membre bloqué ne peut plus vous écrire et ses annonces disparaissent de votre marché. Il n\'en est pas informé. Les signalements sont lus par l\'équipe Arcora.',
}, {
  yesterdayShort: 'yesterday',
  today: 'Today',
  yesterday: 'Yesterday',
  conversations: 'Conversations',
  noConversations: 'No conversations yet',
  browseMarket: 'Browse the Market',
  noConversationsText: 'Write to a seller from a Market listing, or to a member from their public profile.',
  member: 'Member',
  blockedMember: 'Blocked member',
  you: 'You: ',
  chooseConversation: 'Choose a conversation.',
  loadError: 'We couldn’t load the messages.',
  sendError: 'We couldn’t send your message.',
  notFound: 'Conversation not found.',
  backToList: 'Back to conversations',
  options: 'Conversation options',
  about: 'About',
  firstHint: 'Introduce yourself and ask your questions: condition, servicing, papers, meeting in person. Never share your bank details or a payment link.',
  receivedMessage: 'Message received, tap for options',
  sending: ' · sending…',
  notSent: ' · not sent',
  reportSent: 'Report sent. Thank you.',
  reportMessage: 'Report this message',
  youBlocked: 'You have blocked this member. They can no longer write to you.',
  unblock: 'Unblock',
  yourMessage: 'Your message',
  send: 'Send',
  conversation: 'Conversation',
  viewProfile: 'View profile',
  reportLast: 'Report the last message received',
  unblockMember: 'Unblock this member',
  blockMember: 'Block this member',
  optionsHint: 'A blocked member can no longer write to you, and their listings disappear from your Market. They are not notified. Reports are read by Arcora team.',
});

const POLL_MS = 20_000;

/** « 14:32 » aujourd'hui, « hier », sinon « 12 oct. ». */
function shortTime(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  const today = toISODate(new Date());
  const day = toISODate(d);
  if (day === today) return formatTime(iso);
  const y = new Date(); y.setDate(y.getDate() - 1);
  if (day === toISODate(y)) return tr(S).yesterdayShort;
  return d.toLocaleDateString(getLocale(), { day: 'numeric', month: 'short' });
}

function dayLabel(iso: string) {
  const day = iso.slice(0, 10);
  const today = toISODate(new Date());
  const y = new Date(); y.setDate(y.getDate() - 1);
  if (day === today) return tr(S).today;
  if (day === toISODate(y)) return tr(S).yesterday;
  return formatDate(iso, { weekday: 'long', day: 'numeric', month: 'long' });
}

function Avatar({ c }: { c: Pick<ConversationSummary, 'other_username' | 'other_avatar_url'> }) {
  return (
    <span className={s.avatar} aria-hidden="true">
      {c.other_avatar_url ? <img src={c.other_avatar_url} alt="" /> : (c.other_username ?? '?').charAt(0).toUpperCase()}
    </span>
  );
}

export default function MessagesPage() {
  const t = useStrings(S);
  const cm = useStrings(COMMON);
  const { conversationId } = useParams();
  const list = useLoad(listConversations, []);
  const { reload } = list;

  // La liste suit les nouveaux messages, en direct et en secours toutes les 20 secondes.
  useEffect(() => {
    const unsub = subscribeToMessages(() => reload());
    const id = setInterval(() => { if (document.visibilityState === 'visible') reload(); }, POLL_MS);
    window.addEventListener(UNREAD_REFRESH, reload);
    return () => { unsub(); clearInterval(id); window.removeEventListener(UNREAD_REFRESH, reload); };
  }, [reload]);

  const items = list.data ?? [];

  return (
    <div className={s.page} data-thread={Boolean(conversationId)}>
      <aside className={s.listPane} aria-label={t.conversations}>
        <div className={s.listHead}><h1>{cm.tabs.messages}</h1></div>
        {items.length > 0 && <div className={s.promptWrap}><PushPrompt /></div>}
        {list.loading && !list.data ? <div className={s.listEmpty}><SkeletonList rows={5} round /></div> : list.error ? <Notice tone="error">{list.error}</Notice> : !items.length ? (
          <div className={s.listEmpty}>
            <EmptyState title={t.noConversations} action={<LinkButton to="/marche" variant="secondary">{t.browseMarket}</LinkButton>}>
              {t.noConversationsText}
            </EmptyState>
          </div>
        ) : (
          <ul className={`${s.list} reveal`}>
            {items.map(c => (
              <li key={c.conversation_id}>
                <Link to={`/messages/${c.conversation_id}`} className={s.row} aria-current={c.conversation_id === conversationId ? 'page' : undefined}>
                  <Avatar c={c} />
                  <span className={s.rowText}>
                    <span className={s.rowTop}>
                      <strong>{c.other_username ? `@${c.other_username}` : t.member}</strong>
                      <time className={s.time}>{shortTime(c.last_message_at)}</time>
                    </span>
                    {c.watch_brand && <span className={s.rowWatch}>{c.watch_brand} {c.watch_model}</span>}
                    <span className={s.rowBottom}>
                      <span className={s.preview} data-unread={c.unread_count > 0}>
                        {c.blocked_by_me ? t.blockedMember : `${c.last_from_me ? t.you : ''}${c.last_message ?? ''}`}
                      </span>
                      {c.unread_count > 0 && <span className={s.unread} aria-label={cm.unread(c.unread_count)}>{c.unread_count}</span>}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <section className={s.threadPane}>
        {conversationId
          ? <Thread key={conversationId} id={conversationId} onActivity={reload} />
          : <div className={s.placeholder}><p>{t.chooseConversation}</p></div>}
      </section>
    </div>
  );
}

/* ---------- Fil de discussion ---------- */

type Pending = Message & { pending?: boolean; failed?: boolean };

function Thread({ id, onActivity }: { id: string; onActivity: () => void }) {
  const t = useStrings(S);
  const cm = useStrings(COMMON);
  const toast = useToast();
  const { user } = useAuth();
  const me = user!.id;
  const navigate = useNavigate();
  const summary = useLoad(() => getConversation(id), [id]);
  const [messages, setMessages] = useState<Pending[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [reported, setReported] = useState<Set<string>>(new Set());
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async () => {
    try {
      const fresh = await listMessages(id);
      setMessages(prev => {
        const pending = (prev ?? []).filter(m => m.pending || m.failed);
        return [...fresh, ...pending.filter(p => !fresh.some(f => f.id === p.id))];
      });
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : tr(S).loadError);
    }
  }, [id]);

  useEffect(() => { load(); markConversationRead(id); }, [id, load]);

  // Nouveaux messages en direct, et rechargement de secours.
  useEffect(() => {
    const unsub = subscribeToMessages(m => {
      if (m.conversation_id !== id) return;
      setMessages(prev => (prev?.some(x => x.id === m.id) ? prev : [...(prev ?? []), m]));
      if (m.sender_id !== me) markConversationRead(id);
    });
    const iv = setInterval(() => { if (document.visibilityState === 'visible') load(); }, POLL_MS);
    return () => { unsub(); clearInterval(iv); };
  }, [id, me, load]);

  // Zone de saisie qui grandit avec le texte (5 lignes au plus).
  useLayoutEffect(() => {
    const el = input.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [text]);

  // Toujours afficher le dernier message.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages?.length]);

  const c = summary.data;
  const blocked = Boolean(c?.blocked_by_me);

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    const body = text.trim();
    if (!body) return;
    setSendError(null);
    const temp: Pending = { id: `tmp-${Date.now()}`, conversation_id: id, sender_id: me, content: body, created_at: new Date().toISOString(), pending: true };
    setMessages(prev => [...(prev ?? []), temp]);
    setText('');
    input.current?.focus();
    try {
      const saved = await sendMessage(id, body);
      setMessages(prev => {
        const without = (prev ?? []).filter(m => m.id !== temp.id);
        return without.some(m => m.id === saved.id) ? without : [...without, saved];
      });
      onActivity();
    } catch (err) {
      setMessages(prev => (prev ?? []).map(m => (m.id === temp.id ? { ...m, pending: false, failed: true } : m)));
      setSendError(err instanceof Error ? err.message : t.sendError);
    }
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Entrée envoie sur ordinateur ; sur téléphone, Entrée va à la ligne et le bouton envoie.
    if (e.key === 'Enter' && !e.shiftKey && !window.matchMedia('(pointer: coarse)').matches) { e.preventDefault(); send(); }
  };

  const toggleBlock = async () => {
    await setBlocked(id, !blocked);
    toast(blocked ? cm.toast.unblocked : cm.toast.blocked);
    setOptionsOpen(false);
    summary.reload();
    onActivity();
  };

  const report = async (messageId: string) => {
    await reportMessage(messageId);
    setReported(r => new Set(r).add(messageId));
    toast(cm.toast.reported);
    setSelected(null);
  };

  const lastReceived = useMemo(() => [...(messages ?? [])].reverse().find(m => m.sender_id !== me && !m.pending), [messages, me]);

  // Regroupement par jour
  const groups = useMemo(() => {
    const out: { day: string; items: Pending[] }[] = [];
    for (const m of messages ?? []) {
      const day = toISODate(new Date(m.created_at));
      if (!out.length || out[out.length - 1].day !== day) out.push({ day, items: [] });
      out[out.length - 1].items.push(m);
    }
    return out;
  }, [messages]);

  if (summary.loading && !c) return <div className={s.placeholder}><SkeletonList rows={4} thumb={0} /></div>;
  if (!c) return <div className={s.placeholder}><Notice tone="error">{summary.error ?? t.notFound}</Notice></div>;

  const th = thumbSrc(c.watch_photo_path);

  return (
    <div className={s.thread}>
      <header className={s.threadHead}>
        <IconButton label={t.backToList} className={s.back} onClick={() => navigate('/messages')}>
          <ChevronLeft size={22} strokeWidth={1.8} />
        </IconButton>
        <Avatar c={c} />
        <div className={s.threadWho}>
          {c.other_username && c.other_is_public
            ? <Link to={`/profil/${c.other_username}`}>@{c.other_username}</Link>
            : <strong>{c.other_username ? `@${c.other_username}` : t.member}</strong>}
        </div>
        <IconButton label={t.options} onClick={() => setOptionsOpen(true)}><MoreHorizontal size={20} strokeWidth={1.8} /></IconButton>
      </header>

      {c.watch_id && c.watch_brand && (
        <Link to={`/passeport/${c.watch_id}`} className={s.context}>
          <Cushion src={th.src} fallbackSrc={th.fallback} alt="" className={s.contextPhoto} />
          <span className={s.contextText}>
            <span className={s.contextLabel}>{t.about}</span>
            <strong>{c.watch_brand} {c.watch_model}</strong>
          </span>
          {c.watch_kind && <span className={`${s.contextPrice} num`}>{listingPrice(c.watch_kind, c.watch_sale_price)}</span>}
        </Link>
      )}

      <div className={s.messages} ref={scroller} role="log" aria-live="polite" aria-label={cm.tabs.messages}>
        {loadError && <Notice tone="error">{loadError}</Notice>}
        {messages === null ? <SkeletonList rows={4} thumb={0} /> : !messages.length ? (
          <p className={s.firstHint}>
            {t.firstHint}
          </p>
        ) : groups.map(g => (
          <div key={g.day} className={s.day}>
            <p className={s.dayLabel}><span>{dayLabel(g.items[0].created_at)}</span></p>
            {g.items.map((m, i) => {
              const mine = m.sender_id === me;
              const next = g.items[i + 1];
              const tail = !next || next.sender_id !== m.sender_id;
              return (
                <div key={m.id} className={s.bubbleRow} data-mine={mine}>
                  <button
                    type="button"
                    className={s.bubble}
                    data-mine={mine}
                    data-tail={tail}
                    data-state={m.failed ? 'failed' : m.pending ? 'pending' : undefined}
                    onClick={() => !mine && !m.pending && setSelected(selected === m.id ? null : m.id)}
                    aria-label={mine ? undefined : t.receivedMessage}
                  >
                    {m.content}
                    <time className={s.bubbleTime}>
                      {formatTime(m.created_at)}
                      {m.pending && t.sending}{m.failed && t.notSent}
                    </time>
                  </button>
                  {selected === m.id && (
                    <div className={s.bubbleActions}>
                      {reported.has(m.id)
                        ? <span>{t.reportSent}</span>
                        : <button type="button" onClick={() => report(m.id)}><Flag size={14} aria-hidden="true" />{t.reportMessage}</button>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {blocked ? (
        <div className={s.blocked}>
          <p>{t.youBlocked}</p>
          <Button variant="secondary" size="small" onClick={toggleBlock}>{t.unblock}</Button>
        </div>
      ) : (
        <form className={s.composer} onSubmit={send}>
          {sendError && <Notice tone="error">{sendError}</Notice>}
          <div className={s.composerRow}>
            <textarea
              ref={input}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={onKey}
              placeholder={t.yourMessage}
              rows={1}
              maxLength={2000}
              aria-label={t.yourMessage}
            />
            <button type="submit" className={s.send} disabled={!text.trim()} aria-label={t.send}>
              <Send size={20} strokeWidth={1.8} />
            </button>
          </div>
        </form>
      )}

      <Sheet open={optionsOpen} onClose={() => setOptionsOpen(false)} title={t.conversation}>
        <div className={s.options}>
          {c.other_username && c.other_is_public && (
            <LinkButton to={`/profil/${c.other_username}`} variant="secondary" block onClick={() => setOptionsOpen(false)}>{t.viewProfile}</LinkButton>
          )}
          {lastReceived && !reported.has(lastReceived.id) && (
            <Button variant="secondary" block onClick={async () => { await report(lastReceived.id); setOptionsOpen(false); }}>
              <Flag size={16} aria-hidden="true" />{t.reportLast}
            </Button>
          )}
          <Button variant={blocked ? 'secondary' : 'danger'} block onClick={toggleBlock}>
            <ShieldOff size={16} aria-hidden="true" />{blocked ? t.unblockMember : t.blockMember}
          </Button>
          <p className={s.optionsHint}>
            {t.optionsHint}
          </p>
        </div>
      </Sheet>
    </div>
  );
}
