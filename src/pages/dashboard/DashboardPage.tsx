import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight, Award, BarChart3, CalendarDays, Camera, Check, Info, HandCoins, Heart, Images, MessageCircle, Newspaper, Plus,
  ShieldCheck, Sparkles, Store, Tag, Watch as WatchIcon,
  Activity, GitCompareArrows, ShieldAlert, Users,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLoad } from '../../hooks/useLoad';
import {
  addWear, getFeed, getMyWearStreak, listAccuracy, listConversations, listGalleryShots, listWatches, listWearLogs, mainPhoto, photoUrl, searchMarket, thumbSrc,
} from '../../lib/api';
import { analyseCosts } from '../../lib/costPerWear';
import { ACC_STRINGS, signed, verdictKey } from '../../components/Accuracy/accuracy';
import { formatAgo, formatDate, formatEuros, toISODate, todayISO } from '../../lib/format';
import { listingPrice } from '../../lib/listing';
import { latestNews } from '../../components/NewsTeaser/NewsTeaser';
import { Img, LinkButton } from '../../components/ui';
import { useToast } from '../../components/Toast/Toast';
import WristCheckSheet from '../../components/WristCheck/WristCheckSheet';
import StreakTrack from '../../components/WristCheck/StreakTrack';
import { useStreakMessage } from '../../components/WristCheck/StreakPanel';
import { STREAK_STRINGS } from '../../components/WristCheck/streak';
import { defineStrings, getLocale, useStrings } from '../../i18n';
import type { Watch } from '../../types';
import type { AccuracyMeasurement } from '../../lib/api';
import s from './DashboardPage.module.css';

const S = defineStrings({
  hello: (h: number) => (h < 18 && h >= 5 ? 'Bonjour' : 'Bonsoir'),
  today: "Aujourd'hui",
  pick: 'Quelle montre aujourd\'hui\u00a0?',
  addShot: 'Prendre mon wrist shot',
  withPhoto: 'Prendre la photo du jour',
  nudgeBadge: (n: number, m: number) => n <= 1 ? `Dernière photo avant le badge ${m} wrist shots` : `Encore ${n} photos avant le badge ${m} wrist shots`,
  nudgeGallery: 'Elle rejoint la page de la montre, et la Galerie si vous le souhaitez',
  logged: 'Port noté',
  change: 'Changer',
  firstWatch: 'Ajouter ma première montre',
  empty: 'Votre écrin est vide',
  collection: 'Collection',
  watches: (n: number) => (n > 1 ? 'montres' : 'montre'),
  declared: 'déclarés',
  week: 'Cette semaine',
  daysMonth: (n: number) => `${n} jour${n > 1 ? 's' : ''} ce mois-ci`,
  days: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
  messages: 'Messages',
  unread: (n: number) => (n > 1 ? 'non lus' : 'non lu'),
  allRead: 'Tout est lu',
  noConv: 'Aucune conversation',
  market: 'Marché',
  listings: (n: number) => `${n} annonce${n > 1 ? 's' : ''} récente${n > 1 ? 's' : ''}`,
  gallery: 'Galerie',
  feed: 'Feed',
  feedEmpty: 'Suivez des collectionneurs pour voir leurs pièces et leurs wrist shots ici.',
  feedWrist: 'a porté', feedListing: 'vend',
  accuracy: 'Précision',
  accuracyEmpty: 'Mesurez l’avance ou le retard de vos montres mécaniques, au micro du téléphone.',
  accuracyTry: 'Essayer le timegrapher',
  perDay: 'secondes par jour',
  measures: (n: number) => `${n} mesure${n > 1 ? 's' : ''}`,
  costTitle: 'Coût par port',
  perWear: 'par port',
  premium: 'Premium',
  discover: 'Découvrir',
  stats: 'Statistiques',
  wearsLabel: (n: number) => (n > 1 ? 'ports notés' : 'port noté'),
  news: 'À lire',
  shortcuts: 'Outils',
  timegrapher: 'Timegrapher',
  compare: 'Comparer',
  stolen: 'Montres volées',
  add: 'Ajouter',
  sell: 'Vendre',
  wishlist: 'Wishlist',
  insurance: 'Assurance',
  affiliate: 'Parrainage',
  profile: 'Profil',
}, {
  hello: h => (h < 12 && h >= 5 ? 'Good morning' : h < 18 && h >= 12 ? 'Good afternoon' : 'Good evening'),
  today: 'Today',
  pick: 'Which watch today?',
  addShot: 'Take my wrist shot',
  withPhoto: 'Take today’s photo',
  nudgeBadge: (n: number, m: number) => n <= 1 ? `One last photo before the ${m} wrist shots badge` : `${n} more photos before the ${m} wrist shots badge`,
  nudgeGallery: 'It goes on the watch page, and in the Gallery if you wish',
  logged: 'Logged',
  change: 'Change',
  firstWatch: 'Add my first watch',
  empty: 'Your watch box is empty',
  collection: 'Collection',
  watches: n => (n === 1 ? 'watch' : 'watches'),
  declared: 'declared',
  week: 'This week',
  daysMonth: n => `${n} day${n === 1 ? '' : 's'} this month`,
  days: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  messages: 'Messages',
  unread: () => 'unread',
  allRead: 'All read',
  noConv: 'No conversations',
  market: 'Market',
  listings: n => `${n} recent listing${n === 1 ? '' : 's'}`,
  gallery: 'Gallery',
  feed: 'Feed',
  feedEmpty: 'Follow collectors to see their pieces and wrist shots here.',
  feedWrist: 'wore', feedListing: 'is selling',
  accuracy: 'Accuracy',
  accuracyEmpty: 'Measure how fast or slow your mechanical watches run, with your phone’s microphone.',
  accuracyTry: 'Try the timegrapher',
  perDay: 'seconds a day',
  measures: (n: number) => `${n} measurement${n > 1 ? 's' : ''}`,
  costTitle: 'Cost per wear',
  perWear: 'per wear',
  premium: 'Premium',
  discover: 'Discover',
  stats: 'Statistics',
  wearsLabel: n => (n === 1 ? 'wear logged' : 'wears logged'),
  news: 'Worth reading',
  shortcuts: 'Tools',
  timegrapher: 'Timegrapher',
  compare: 'Compare',
  stolen: 'Stolen watches',
  add: 'Add',
  sell: 'Sell',
  wishlist: 'Wishlist',
  insurance: 'Insurance',
  affiliate: 'Referrals',
  profile: 'Profile',
});

const thumbFor = (w: Watch | undefined) => thumbSrc(mainPhoto(w?.photos)?.storage_path);

/** Lundi de la semaine en cours, puis les 7 jours. */
function currentWeek(): string[] {
  const d = new Date(); const day = (d.getDay() + 6) % 7;
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => toISODate(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)));
}

/** Une tuile du tableau de bord : un titre court avec son icône, un aperçu, et toute la tuile mène à la page. */
function Tile({ to, icon, title, tone = 'plain', className, children, external }:
  { to: string; icon: ReactNode; title: string; tone?: 'plain' | 'lume' | 'brass' | 'ruby'; className?: string; children: ReactNode; external?: boolean }) {
  const inner = (
    <>
      <span className={s.tileHead}>
        <span className={s.tileIcon} aria-hidden="true">{icon}</span>
        <span className={s.tileTitle}>{title}</span>
        <ArrowUpRight className={s.tileArrow} size={18} strokeWidth={1.6} aria-hidden="true" />
      </span>
      {children}
    </>
  );
  const cls = `panel ${s.tile} ${className ?? ''}`;
  return external
    ? <a href={to} className={cls} data-tone={tone} data-reveal target="_blank" rel="noreferrer">{inner}</a>
    : <Link to={to} className={cls} data-tone={tone} data-reveal>{inner}</Link>;
}

/** Heure à la seconde près, pour régler ses montres. Recalée sur chaque changement de seconde. */
function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let id: ReturnType<typeof setTimeout>;
    const tick = () => {
      const d = new Date();
      setNow(d);
      id = setTimeout(tick, 1000 - d.getMilliseconds() + 5);
    };
    id = setTimeout(tick, 1000 - new Date().getMilliseconds() + 5);
    return () => clearTimeout(id);
  }, []);
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    <time className={s.clock} dateTime={now.toISOString()} aria-label={now.toLocaleTimeString(getLocale())}>
      {p(now.getHours())}:{p(now.getMinutes())}<span className={s.seconds}>:{p(now.getSeconds())}</span>
    </time>
  );
}

export default function DashboardPage() {
  const t = useStrings(S);
  const st = useStrings(STREAK_STRINGS);
  const toast = useToast();
  const { user, profile, isPremium } = useAuth();
  const uid = user!.id;
  const today = todayISO();
  const week = useMemo(currentWeek, []);

  const mine = useLoad(async () => {
    const [watches, wears] = await Promise.all([listWatches(uid), listWearLogs(uid).catch(() => [])]);
    return { watches, wears };
  }, [uid]);
  const convs = useLoad(() => listConversations().catch(() => []), []);
  const market = useLoad(() => searchMarket({ query: '', brand: '', kind: '', minPrice: '', maxPrice: '', condition: '', boxPapers: '', size: '', sort: 'recent' }).catch(() => []), []);
  const shots = useLoad(() => listGalleryShots({ brand: null, minWrist: null, maxWrist: null }).catch(() => []), []);
  const news = useLoad(() => latestNews(2).catch(() => []), []);
  // Feed : d'abord les abonnements, sinon toute la communauté
  const feed = useLoad(async () => {
    const mineFeed = await getFeed('following').catch(() => []);
    return mineFeed.length ? mineFeed : getFeed('all').catch(() => []);
  }, []);
  const accuracy = useLoad(() => listAccuracy(uid), [uid]);

  const streak = useLoad(() => getMyWearStreak(), [uid]);
  const [check, setCheck] = useState<{ watchId?: string | null; day?: string | null } | null>(null);

  const [justLogged, setJustLogged] = useState<string | null>(null);
  const watches = mine.data?.watches ?? [];
  const wears = mine.data?.wears ?? [];
  const byId = useMemo(() => new Map(watches.map(w => [w.id, w])), [watches]);
  const todayWatchId = justLogged ?? wears.find(w => w.worn_on === today)?.watch_id ?? null;
  const todayWatch = todayWatchId ? byId.get(todayWatchId) : undefined;

  const wornByDay = useMemo(() => {
    const m = new Map<string, string>();
    for (const w of wears) if (!m.has(w.worn_on)) m.set(w.worn_on, w.watch_id);
    if (justLogged) m.set(today, justLogged);
    return m;
  }, [wears, justLogged, today]);
  const monthDays = useMemo(() => new Set([...wornByDay.keys()].filter(d => d.slice(0, 7) === today.slice(0, 7))).size, [wornByDay, today]);
  const totalValue = watches.reduce((sum, w) => sum + (Number(w.current_estimated_value) || 0), 0);
  const costs = useMemo(() => (mine.data ? analyseCosts(watches, wears) : null), [mine.data, watches, wears]);
  const unread = (convs.data ?? []).reduce((n, c) => n + (c.unread_count || 0), 0);

  // Les montres les plus portées d'abord : le choix du jour se fait en un geste.
  const pickList = useMemo(() => {
    const count = new Map<string, number>();
    for (const w of wears) count.set(w.watch_id, (count.get(w.watch_id) ?? 0) + 1);
    return [...watches].sort((a, b) => (count.get(b.id) ?? 0) - (count.get(a.id) ?? 0)).slice(0, 6);
  }, [watches, wears]);

  const logToday = async (w: Watch) => {
    setJustLogged(w.id);
    try { await addWear(uid, w.id, today); toast(`${t.logged} : ${w.model}`); streak.reload(); } catch { setJustLogged(null); }
  };
  // Photo du Wrist Check d'aujourd'hui, si elle existe : elle remplace la photo principale de la montre
  const [explain, setExplain] = useState(false);
  const streakAlive = streak.data?.status === 'done' || streak.data?.status === 'open';
  const streakMessage = useStreakMessage(streak.data ?? null);
  // Petite incitation sous le bouton photo : le prochain badge photo, sinon la Galerie
  const left = streak.data?.next_photo_milestone ? streak.data.next_photo_milestone - streak.data.photos : null;
  const photoNudge = left !== null && left <= 10 ? t.nudgeBadge(left, streak.data!.next_photo_milestone!) : t.nudgeGallery;
  const todayShot = todayWatch?.photos?.filter(p => p.worn_on === today && p.photo_type === 'wrist_shot')
    .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))[0];

  const hour = new Date().getHours();
  const name = profile?.username;
  const dateLabel = new Date().toLocaleDateString(getLocale(), { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className={`page ${s.page}`}>
      <header className={s.greet}>
        <h1>{t.hello(hour)}{name ? `, ${name}` : ''}</h1>
        <p className={s.date}>{dateLabel}<span className={s.dateSep} aria-hidden="true">·</span><LiveClock /></p>
      </header>

      <div className={s.bento}>
        {/* ---------- Aujourd'hui : la pièce maîtresse du tableau de bord ---------- */}
        <section className={s.hero} data-reveal aria-label={t.today}>
          {todayWatch ? (
            <div className={s.heroWrap} data-cta={!todayShot}>
              <Link to="/portage" className={s.heroWorn}>
                <Img key={todayShot?.id ?? todayWatch.id} src={photoUrl((todayShot ?? mainPhoto(todayWatch.photos))?.storage_path) ?? ''} fallback={thumbFor(todayWatch).src} alt={`${todayWatch.brand} ${todayWatch.model}`} className={s.heroPhoto} />
                <span className={s.heroCaption}>
                  <span className={s.heroKicker}><Check size={14} strokeWidth={2.6} aria-hidden="true" />{todayShot ? 'Wrist Check' : t.today}</span>
                  <span className={s.heroBrand}>{todayWatch.brand}</span>
                  <span className={s.heroModel}>{todayWatch.model}</span>
                </span>
                <span className={s.heroChange}>{t.change}</span>
              </Link>
              {!todayShot && (
                <button type="button" className={s.shotCta} onClick={() => setCheck({ watchId: todayWatch.id, day: today })}>
                  <span className={s.shotIcon}><Camera size={18} strokeWidth={2} aria-hidden="true" /></span>
                  <b>{t.addShot}</b>
                </button>
              )}
            </div>
          ) : watches.length === 0 && !mine.loading ? (
            <div className={`panel ${s.heroEmpty}`} data-tone="lume">
              <WatchIcon size={40} strokeWidth={1.1} aria-hidden="true" />
              <h2>{t.empty}</h2>
              <LinkButton to="/ajouter-montre"><Plus size={16} strokeWidth={2} aria-hidden="true" />{t.firstWatch}</LinkButton>
            </div>
          ) : (
            <div className={`panel ${s.heroPick}`} data-tone="lume">
              <span className={s.heroKicker}>{t.today}</span>
              <h2>{t.pick}</h2>
              <ul className={s.pickRow}>
                {pickList.map(w => (
                  <li key={w.id}>
                    <button type="button" className={s.pickBtn} onClick={() => logToday(w)} aria-label={`${w.brand} ${w.model}`}>
                      <span className={s.pickPhoto}>
                        {thumbFor(w).src ? <Img src={thumbFor(w).src!} fallback={thumbFor(w).fallback} alt="" /> : <WatchIcon size={22} strokeWidth={1.3} />}
                      </span>
                      <span className={s.pickName}>{w.model}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" className={s.pickCta} onClick={() => setCheck({ day: today })}>
                <span className={s.shotIcon}><Camera size={20} strokeWidth={1.9} aria-hidden="true" /></span>
                <span className={s.shotText}>
                  <b>{t.withPhoto}</b>
                  <small>{photoNudge}</small>
                </span>
              </button>
            </div>
          )}
        </section>

        {/* ---------- Série de portage ---------- */}
        {streak.data && (
          <section className={`panel ${s.tile} ${s.wide} ${s.streakTile}`} data-tone="lume" data-reveal aria-label={st.tileTitle}>
            <div className={s.tileHead}>
              <span className={s.tileIcon}><Award size={18} strokeWidth={1.7} /></span>
              <span className={s.tileTitle}>
                {st.tileTitle}
                <button type="button" className={s.infoBtn} aria-expanded={explain} aria-label={st.explainBtn} title={st.explainBtn}
                  onClick={() => setExplain(!explain)}><Info size={15} strokeWidth={1.9} aria-hidden="true" /></button>
              </span>
              <span className={s.todayChip} data-done={streak.data.logged_today}
                title={streak.data.logged_today ? st.todayDoneLong : st.todayTodoLong} aria-label={streak.data.logged_today ? st.todayDoneLong : st.todayTodoLong}>
                {streak.data.logged_today ? <Check size={13} strokeWidth={2.8} aria-hidden="true" /> : <span className={s.todayEmpty} aria-hidden="true" />}
                {streak.data.logged_today ? st.todayDone : st.todayTodo}
              </span>
            </div>
            {explain && <p className={s.explain}>{st.explain}</p>}
            <div className={s.streakTop}>
              <span className={s.metric}>
                <b className="num">{streakAlive ? streak.data.current : streak.data.paused_length}</b>
                <span>{(streakAlive ? streak.data.current : streak.data.paused_length) > 1 ? st.daysInRow : st.dayInRow}</span>
              </span>
              {streak.data.best > 0 && <span className={s.small}>{st.best(streak.data.best)}</span>}
            </div>
            <StreakTrack streak={streak.data} />
            <p className={s.streakMsg}>
              {streak.data.status === 'none' ? st.firstDay : streakAlive && streak.data.next_milestone
                ? st.toNext(streak.data.next_milestone - streak.data.current, st.badge[streak.data.next_milestone])
                : streakMessage}
              {streak.data.status === 'open' && streak.data.catch_up.length > 0 && (
                <button type="button" className={s.catchLink} onClick={() => setCheck({ day: streak.data!.catch_up[streak.data!.catch_up.length - 1] })}>
                  {st.catchUpBtn} {formatDate(streak.data.catch_up[streak.data.catch_up.length - 1], { weekday: 'long' })}
                </button>
              )}
            </p>
          </section>
        )}


        {/* ---------- Collection ---------- */}
        <Tile to="/collection" icon={<WatchIcon size={18} strokeWidth={1.7} />} title={t.collection} className={s.wide}>
          <span className={s.collection}>
            <span className={s.thumbs}>
              {watches.slice(0, 4).map(w => (
                <span key={w.id} className={s.thumb}>{thumbFor(w).src && <Img src={thumbFor(w).src!} fallback={thumbFor(w).fallback} alt="" />}</span>
              ))}
            </span>
            <span className={s.figures}>
              <span className={s.big}><b className="num">{watches.length}</b> {t.watches(watches.length)}</span>
              {totalValue > 0 && <span className={s.small}><b className="num">{formatEuros(totalValue)}</b> {t.declared}</span>}
            </span>
          </span>
        </Tile>

        {/* ---------- Portage de la semaine ---------- */}
        <Tile to="/portage" icon={<CalendarDays size={18} strokeWidth={1.7} />} title={t.week} tone="lume" className={s.weekTile}>
          <span className={s.week}>
            {week.map((d, i) => {
              const w = byId.get(wornByDay.get(d) ?? '');
              const th = thumbFor(w);
              return (
                <span key={d} className={s.day} data-today={d === today} data-future={d > today}>
                  <span className={s.dayDot}>{w && th.src ? <Img src={th.src} fallback={th.fallback} alt="" /> : null}</span>
                  <span className={s.dayLetter}>{t.days[i]}</span>
                </span>
              );
            })}
          </span>
          <span className={s.small}>{t.daysMonth(monthDays)}</span>
        </Tile>

        {/* ---------- Messages ---------- */}
        <Tile to="/messages" icon={<MessageCircle size={18} strokeWidth={1.7} />} title={t.messages} tone="ruby">
          <span className={s.metric}>
            {unread > 0
              ? <><b className="num">{unread}</b><span>{t.unread(unread)}</span></>
              : <span className={s.quiet}>{(convs.data ?? []).length ? t.allRead : t.noConv}</span>}
          </span>
          <span className={s.faces}>
            {(convs.data ?? []).slice(0, 4).map(c => (
              <span key={c.conversation_id} className={s.face} data-unread={c.unread_count > 0}>
                {c.other_avatar_url ? <img src={c.other_avatar_url} alt="" /> : (c.other_username ?? '?').charAt(0).toUpperCase()}
              </span>
            ))}
          </span>
        </Tile>

        {/* ---------- Premium : coût par port (gratuit) ou statistiques (Premium) ---------- */}
        {isPremium ? (
          <Tile to="/stats" icon={<BarChart3 size={18} strokeWidth={1.7} />} title={t.stats} tone="brass">
            <span className={s.metric}><b className="num">{costs?.totalWears ?? 0}</b><span>{t.wearsLabel(costs?.totalWears ?? 0)}</span></span>
            {costs?.cheapest?.costPerWear != null && (
              <span className={s.small}>{costs.cheapest.watch.model} : <b className="num">{formatEuros(costs.cheapest.costPerWear)}</b> {t.perWear}</span>
            )}
          </Tile>
        ) : (
          <Tile to="/premium" icon={<Sparkles size={18} strokeWidth={1.7} />} title={t.costTitle} tone="brass">
            {costs?.priciest?.costPerWear != null ? (
              <>
                <span className={s.metric}><b className="num">{formatEuros(costs.priciest.costPerWear)}</b><span>{t.perWear}</span></span>
                <span className={s.small}>{costs.priciest.watch.brand} {costs.priciest.watch.model}</span>
              </>
            ) : <span className={s.metric}><span className={s.quiet}>{t.premium}</span></span>}
            <span className={s.chip}>{t.discover}</span>
          </Tile>
        )}

        {/* ---------- Marché ---------- */}
        <Tile to="/marche" icon={<Store size={18} strokeWidth={1.7} />} title={t.market} tone="ruby" className={s.wide}>
          <span className={s.strip}>
            {(market.data ?? []).slice(0, 4).map(m => {
              const th = thumbSrc(m.main_photo_path);
              return (
                <span key={m.watch_id} className={s.listing}>
                  {th.src && <Img src={th.src} fallback={th.fallback} alt="" />}
                  <span className={`${s.priceTag} num`}>{listingPrice(m.kind, m.sale_price)}</span>
                </span>
              );
            })}
          </span>
          <span className={s.small}>{t.listings((market.data ?? []).length)}</span>
        </Tile>

        {/* ---------- Galerie ---------- */}
        <Tile to="/galerie" icon={<Images size={18} strokeWidth={1.7} />} title={t.gallery} className={s.galleryTile}>
          <span className={s.collage}>
            {(shots.data ?? []).slice(0, 3).map(g => (
              <span key={g.id} className={s.shot}><Img src={g.thumb} fallback={g.url} alt="" /></span>
            ))}
          </span>
        </Tile>

        {/* ---------- Précision : la dernière mesure du timegrapher et la tendance ---------- */}
        <AccuracyTile measures={accuracy.data ?? []} watchName={id => { const w = byId.get(id); return w ? `${w.brand} ${w.model}` : null; }} />

        {/* ---------- Feed : les dernières publications ---------- */}
        <Tile to="/fil" icon={<Users size={18} strokeWidth={1.7} />} title={t.feed} tone="ruby" className={s.wide}>
          {(feed.data ?? []).length === 0 ? <span className={s.quiet}>{t.feedEmpty}</span> : (
            <span className={s.feedList}>
              {(feed.data ?? []).slice(0, 2).map(it => (
                <span key={`${it.kind}-${it.id}`} className={s.feedItem}>
                  <span className={s.face}>{it.author.avatar ? <img src={it.author.avatar} alt="" /> : it.author.username.charAt(0).toUpperCase()}</span>
                  <span className={s.feedText}>
                    <small><b>@{it.author.username}</b>{it.kind === 'wrist' ? ` ${t.feedWrist}` : it.kind === 'listing' ? ` ${t.feedListing}` : ''} · {formatAgo(it.created_at)}</small>
                    <span>{it.body || (it.watch ? `${it.watch.brand} ${it.watch.model}` : '')}</span>
                  </span>
                  {it.photo_path && (() => { const th = it.kind === 'post' ? { src: photoUrl(it.photo_path), fallback: null } : thumbSrc(it.photo_path); return th.src ? <span className={s.feedThumb}><Img src={th.src} fallback={th.fallback} alt="" /></span> : null; })()}
                </span>
              ))}
            </span>
          )}
        </Tile>

        {/* ---------- À lire ---------- */}
        {(news.data ?? []).length > 0 && (
          <Tile to="/actualites" icon={<Newspaper size={18} strokeWidth={1.7} />} title={t.news} className={s.wide}>
            <span className={s.news}>
              {(news.data ?? []).map(n => (
                <span key={n.link} className={s.newsItem}>
                  {n.imageUrl ? <img src={n.imageUrl} alt="" loading="lazy" className={s.newsImg} /> : <span className={s.newsImg} />}
                  <span className={s.newsText}><b>{n.title}</b><small>{n.source}</small></span>
                </span>
              ))}
            </span>
          </Tile>
        )}

        {/* ---------- Outils ---------- */}
        <section className={`panel ${s.tile} ${s.wide} ${s.shortcutsTile}`} data-tone="plain" data-reveal aria-label={t.shortcuts}>
          <span className={s.tileHead}><span className={s.tileTitle}>{t.shortcuts}</span></span>
          <nav className={s.shortcuts}>
            <Link to="/ajouter-montre"><Plus size={20} strokeWidth={1.7} aria-hidden="true" />{t.add}</Link>
            <Link to="/collection"><Tag size={20} strokeWidth={1.7} aria-hidden="true" />{t.sell}</Link>
            <Link to="/wishlist"><Heart size={20} strokeWidth={1.7} aria-hidden="true" />{t.wishlist}</Link>
            <Link to="/timegrapher"><Activity size={20} strokeWidth={1.7} aria-hidden="true" />{t.timegrapher}</Link>
            <Link to="/comparer"><GitCompareArrows size={20} strokeWidth={1.7} aria-hidden="true" />{t.compare}</Link>
            <Link to="/montres-volees"><ShieldAlert size={20} strokeWidth={1.7} aria-hidden="true" />{t.stolen}</Link>
            <Link to="/export/assurance"><ShieldCheck size={20} strokeWidth={1.7} aria-hidden="true" />{t.insurance}</Link>
            <Link to="/affiliation"><HandCoins size={20} strokeWidth={1.7} aria-hidden="true" />{t.affiliate}</Link>
          </nav>
        </section>
      </div>
      <WristCheckSheet open={check !== null} onClose={() => setCheck(null)} watches={watches}
        watchId={check?.watchId} day={check?.day}
        onDone={() => { streak.reload(); mine.reload(); setJustLogged(null); }} />
    </div>
  );
}

/** Tuile Précision : dernière marche mesurée, son verdict, et une petite courbe des dernières mesures. */
function AccuracyTile({ measures, watchName }: { measures: AccuracyMeasurement[]; watchName: (id: string) => string | null }) {
  const t = useStrings(S);
  const a = useStrings(ACC_STRINGS);
  const last = measures[measures.length - 1];
  const recent = measures.slice(-8).map(m => m.rate_s_day);
  const points = (() => {
    if (recent.length < 2) return null;
    const lo = Math.min(...recent, 0), hi = Math.max(...recent, 0), span = hi - lo || 1;
    return recent.map((v, i) => `${(i / (recent.length - 1)) * 100},${28 - ((v - lo) / span) * 24 - 2}`).join(' ');
  })();
  return (
    <Tile to="/timegrapher" icon={<Activity size={18} strokeWidth={1.7} />} title={t.accuracy} tone="lume" className={s.accuracyTile}>
      {last ? (
        <>
          <span className={s.metric}><b className="num">{signed(last.rate_s_day)}</b><span>{t.perDay}</span></span>
          <span className={s.small}>
            {last.watch_id && watchName(last.watch_id) ? <><b>{watchName(last.watch_id)}</b> · </> : null}
            {a.verdict[verdictKey(last.rate_s_day)]}
          </span>
          {points && (
            <svg className={s.spark} viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true">
              <polyline points={points} />
            </svg>
          )}
        </>
      ) : (
        <>
          <span className={s.quiet}>{t.accuracyEmpty}</span>
          <span className={s.chip}>{t.accuracyTry}</span>
        </>
      )}
    </Tile>
  );
}
