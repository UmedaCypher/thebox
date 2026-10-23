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
import { formatDate, toISODate } from '../../lib/format';
import { listingPrice } from '../../lib/listing';
import type { ConversationSummary, Message } from '../../types';
import { Button, Cushion, EmptyState, IconButton, LinkButton, Loading, Notice, Sheet } from '../../components/ui';
import s from './MessagesPage.module.css';

const POLL_MS = 20_000;

/** « 14:32 » aujourd'hui, « hier », sinon « 12 oct. ». */
function shortTime(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  const today = toISODate(new Date());
  const day = toISODate(d);
  if (day === today) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const y = new Date(); y.setDate(y.getDate() - 1);
  if (day === toISODate(y)) return 'hier';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function dayLabel(iso: string) {
  const day = iso.slice(0, 10);
  const today = toISODate(new Date());
  const y = new Date(); y.setDate(y.getDate() - 1);
  if (day === today) return "Aujourd'hui";
  if (day === toISODate(y)) return 'Hier';
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
      <aside className={s.listPane} aria-label="Conversations">
        <div className={s.listHead}><h1>Messages</h1></div>
        {list.loading && !list.data ? <Loading /> : list.error ? <Notice tone="error">{list.error}</Notice> : !items.length ? (
          <div className={s.listEmpty}>
            <EmptyState title="Aucune conversation" action={<LinkButton to="/marche" variant="secondary">Parcourir le marché</LinkButton>}>
              Écrivez à un vendeur depuis une annonce du marché, ou à un membre depuis son profil public.
            </EmptyState>
          </div>
        ) : (
          <ul className={s.list}>
            {items.map(c => (
              <li key={c.conversation_id}>
                <Link to={`/messages/${c.conversation_id}`} className={s.row} aria-current={c.conversation_id === conversationId ? 'page' : undefined}>
                  <Avatar c={c} />
                  <span className={s.rowText}>
                    <span className={s.rowTop}>
                      <strong>{c.other_username ? `@${c.other_username}` : 'Membre'}</strong>
                      <time className={s.time}>{shortTime(c.last_message_at)}</time>
                    </span>
                    {c.watch_brand && <span className={s.rowWatch}>{c.watch_brand} {c.watch_model}</span>}
                    <span className={s.rowBottom}>
                      <span className={s.preview} data-unread={c.unread_count > 0}>
                        {c.blocked_by_me ? 'Membre bloqué' : `${c.last_from_me ? 'Vous : ' : ''}${c.last_message ?? ''}`}
                      </span>
                      {c.unread_count > 0 && <span className={s.unread} aria-label={`${c.unread_count} non lus`}>{c.unread_count}</span>}
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
          : <div className={s.placeholder}><p>Choisissez une conversation.</p></div>}
      </section>
    </div>
  );
}

/* ---------- Fil de discussion ---------- */

type Pending = Message & { pending?: boolean; failed?: boolean };

function Thread({ id, onActivity }: { id: string; onActivity: () => void }) {
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
      setLoadError(e instanceof Error ? e.message : 'Chargement impossible.');
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
    const t = setInterval(() => { if (document.visibilityState === 'visible') load(); }, POLL_MS);
    return () => { unsub(); clearInterval(t); };
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
      setSendError(err instanceof Error ? err.message : 'Envoi impossible.');
    }
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Entrée envoie sur ordinateur ; sur téléphone, Entrée va à la ligne et le bouton envoie.
    if (e.key === 'Enter' && !e.shiftKey && !window.matchMedia('(pointer: coarse)').matches) { e.preventDefault(); send(); }
  };

  const toggleBlock = async () => {
    await setBlocked(id, !blocked);
    setOptionsOpen(false);
    summary.reload();
    onActivity();
  };

  const report = async (messageId: string) => {
    await reportMessage(messageId);
    setReported(r => new Set(r).add(messageId));
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

  if (summary.loading && !c) return <Loading />;
  if (!c) return <div className={s.placeholder}><Notice tone="error">{summary.error ?? 'Conversation introuvable.'}</Notice></div>;

  const t = thumbSrc(c.watch_photo_path);

  return (
    <div className={s.thread}>
      <header className={s.threadHead}>
        <IconButton label="Retour aux conversations" className={s.back} onClick={() => navigate('/messages')}>
          <ChevronLeft size={22} strokeWidth={1.8} />
        </IconButton>
        <Avatar c={c} />
        <div className={s.threadWho}>
          {c.other_username && c.other_is_public
            ? <Link to={`/profil/${c.other_username}`}>@{c.other_username}</Link>
            : <strong>{c.other_username ? `@${c.other_username}` : 'Membre'}</strong>}
        </div>
        <IconButton label="Options de la conversation" onClick={() => setOptionsOpen(true)}><MoreHorizontal size={20} strokeWidth={1.8} /></IconButton>
      </header>

      {c.watch_id && c.watch_brand && (
        <Link to={`/passeport/${c.watch_id}`} className={s.context}>
          <Cushion src={t.src} fallbackSrc={t.fallback} alt="" className={s.contextPhoto} />
          <span className={s.contextText}>
            <span className={s.contextLabel}>À propos de</span>
            <strong>{c.watch_brand} {c.watch_model}</strong>
          </span>
          {c.watch_kind && <span className={`${s.contextPrice} num`}>{listingPrice(c.watch_kind, c.watch_sale_price)}</span>}
        </Link>
      )}

      <div className={s.messages} ref={scroller} role="log" aria-live="polite" aria-label="Messages">
        {loadError && <Notice tone="error">{loadError}</Notice>}
        {messages === null ? <Loading /> : !messages.length ? (
          <p className={s.firstHint}>
            Présentez-vous et posez vos questions : état, révision, papiers, remise en main propre.
            Ne partagez jamais vos codes bancaires ni de lien de paiement.
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
                    aria-label={mine ? undefined : 'Message reçu, toucher pour les options'}
                  >
                    {m.content}
                    <time className={s.bubbleTime}>
                      {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      {m.pending && ' · envoi…'}{m.failed && ' · non envoyé'}
                    </time>
                  </button>
                  {selected === m.id && (
                    <div className={s.bubbleActions}>
                      {reported.has(m.id)
                        ? <span>Signalement envoyé. Merci.</span>
                        : <button type="button" onClick={() => report(m.id)}><Flag size={14} aria-hidden="true" />Signaler ce message</button>}
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
          <p>Vous avez bloqué ce membre : il ne peut plus vous écrire.</p>
          <Button variant="secondary" size="small" onClick={toggleBlock}>Débloquer</Button>
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
              placeholder="Votre message"
              rows={1}
              maxLength={2000}
              aria-label="Votre message"
            />
            <button type="submit" className={s.send} disabled={!text.trim()} aria-label="Envoyer">
              <Send size={20} strokeWidth={1.8} />
            </button>
          </div>
        </form>
      )}

      <Sheet open={optionsOpen} onClose={() => setOptionsOpen(false)} title="Conversation">
        <div className={s.options}>
          {c.other_username && c.other_is_public && (
            <LinkButton to={`/profil/${c.other_username}`} variant="secondary" block onClick={() => setOptionsOpen(false)}>Voir le profil</LinkButton>
          )}
          {lastReceived && !reported.has(lastReceived.id) && (
            <Button variant="secondary" block onClick={async () => { await report(lastReceived.id); setOptionsOpen(false); }}>
              <Flag size={16} aria-hidden="true" />Signaler le dernier message reçu
            </Button>
          )}
          <Button variant={blocked ? 'secondary' : 'danger'} block onClick={toggleBlock}>
            <ShieldOff size={16} aria-hidden="true" />{blocked ? 'Débloquer ce membre' : 'Bloquer ce membre'}
          </Button>
          <p className={s.optionsHint}>
            Un membre bloqué ne peut plus vous écrire et ses annonces disparaissent de votre marché. Il n'en est pas informé.
            Les signalements sont lus par l'équipe The Box.
          </p>
        </div>
      </Sheet>
    </div>
  );
}
