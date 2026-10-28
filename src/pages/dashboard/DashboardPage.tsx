import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight, BarChart3, Bell, CalendarDays, Check, Heart, Images, MessageCircle, Newspaper, Plus,
  ShieldCheck, Sparkles, Store, Tag, UserRound, Watch as WatchIcon,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLoad } from '../../hooks/useLoad';
import {
  addWear, listConversations, listGalleryShots, listWatches, listWearLogs, mainPhoto, photoUrl, searchMarket, thumbSrc,
} from '../../lib/api';
import { analyseCosts } from '../../lib/costPerWear';
import { formatEuros, toISODate, todayISO } from '../../lib/format';
import { listingPrice } from '../../lib/listing';
import { latestNews } from '../../components/NewsTeaser/NewsTeaser';
import { Img, LinkButton } from '../../components/ui';
import { useToast } from '../../components/Toast/Toast';
import { defineStrings, getLocale, useStrings } from '../../i18n';
import type { Watch } from '../../types';
import s from './DashboardPage.module.css';

const S = defineStrings({
  hello: (h: number) => (h < 18 && h >= 5 ? 'Bonjour' : 'Bonsoir'),
  today: "Aujourd'hui",
  pick: 'Quelle montre aujourd\'hui ?',
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
  costTitle: 'Coût par port',
  perWear: 'par port',
  premium: 'Premium',
  discover: 'Découvrir',
  stats: 'Statistiques',
  wearsLabel: (n: number) => (n > 1 ? 'ports notés' : 'port noté'),
  news: 'À lire',
  shortcuts: 'Raccourcis',
  add: 'Ajouter',
  sell: 'Vendre',
  wishlist: 'Wishlist',
  insurance: 'Assurance',
  notifications: 'Notifications',
  profile: 'Profil',
}, {
  hello: h => (h < 12 && h >= 5 ? 'Good morning' : h < 18 && h >= 12 ? 'Good afternoon' : 'Good evening'),
  today: 'Today',
  pick: 'Which watch today?',
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
  costTitle: 'Cost per wear',
  perWear: 'per wear',
  premium: 'Premium',
  discover: 'Discover',
  stats: 'Statistics',
  wearsLabel: n => (n === 1 ? 'wear logged' : 'wears logged'),
  news: 'Worth reading',
  shortcuts: 'Shortcuts',
  add: 'Add',
  sell: 'Sell',
  wishlist: 'Wishlist',
  insurance: 'Insurance',
  notifications: 'Notifications',
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

export default function DashboardPage() {
  const t = useStrings(S);
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
    try { await addWear(uid, w.id, today); toast(`${t.logged} : ${w.model}`); } catch { setJustLogged(null); }
  };

  const hour = new Date().getHours();
  const name = profile?.username;
  const dateLabel = new Date().toLocaleDateString(getLocale(), { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className={`page ${s.page}`}>
      <header className={s.greet}>
        <h1>{t.hello(hour)}{name ? `, ${name}` : ''}</h1>
        <p className={s.date}>{dateLabel}</p>
      </header>

      <div className={s.bento}>
        {/* ---------- Aujourd'hui : la pièce maîtresse du tableau de bord ---------- */}
        <section className={s.hero} data-reveal aria-label={t.today}>
          {todayWatch ? (
            <Link to="/portage" className={s.heroWorn}>
              <Img key={todayWatch.id} src={photoUrl(mainPhoto(todayWatch.photos)?.storage_path) ?? ''} fallback={thumbFor(todayWatch).src} alt={`${todayWatch.brand} ${todayWatch.model}`} className={s.heroPhoto} />
              <span className={s.heroCaption}>
                <span className={s.heroKicker}><Check size={14} strokeWidth={2.6} aria-hidden="true" />{t.today}</span>
                <span className={s.heroBrand}>{todayWatch.brand}</span>
                <span className={s.heroModel}>{todayWatch.model}</span>
              </span>
              <span className={s.heroChange}>{t.change}</span>
            </Link>
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
            </div>
          )}
        </section>

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

        {/* ---------- Raccourcis ---------- */}
        <section className={`panel ${s.tile} ${s.wide} ${s.shortcutsTile}`} data-tone="plain" data-reveal aria-label={t.shortcuts}>
          <span className={s.tileHead}><span className={s.tileTitle}>{t.shortcuts}</span></span>
          <nav className={s.shortcuts}>
            <Link to="/ajouter-montre"><Plus size={20} strokeWidth={1.7} aria-hidden="true" />{t.add}</Link>
            <Link to="/collection"><Tag size={20} strokeWidth={1.7} aria-hidden="true" />{t.sell}</Link>
            <Link to="/wishlist"><Heart size={20} strokeWidth={1.7} aria-hidden="true" />{t.wishlist}</Link>
            <Link to="/export/assurance"><ShieldCheck size={20} strokeWidth={1.7} aria-hidden="true" />{t.insurance}</Link>
            <Link to="/profil#notifications"><Bell size={20} strokeWidth={1.7} aria-hidden="true" />{t.notifications}</Link>
            <Link to="/profil"><UserRound size={20} strokeWidth={1.7} aria-hidden="true" />{t.profile}</Link>
          </nav>
        </section>
      </div>
    </div>
  );
}
