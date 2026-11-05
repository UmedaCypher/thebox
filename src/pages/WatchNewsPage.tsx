import { useState } from 'react';
import { useLoad } from '../hooks/useLoad';
import { fetchNews } from '../lib/api';
import { NEWS_FEEDS, fetchMagazine } from '../lib/news';
import { formatDate } from '../lib/format';
import { EmptyState, Notice, PageHeader, Segmented } from '../components/ui';
import { defineStrings, useLang, useStrings } from '../i18n';
import s from './WatchNewsPage.module.css';
import { SkeletonList } from '../components/Skeleton/Skeleton';

const S = defineStrings({
  title: 'Actualités',
  subtitle: 'Les guides du magazine Arcora et les derniers articles des sites horlogers.',
  magazine: 'Le magazine Arcora',
  allArticles: 'Tous les articles',
  sites: "L'actu des sites horlogers",
  source: 'Source',
  emptyTitle: 'Aucun article',
  empty: "Cette source n'a rien publié récemment.",
}, {
  title: 'News',
  subtitle: 'Guides from the Arcora magazine and the latest articles from watch sites.',
  magazine: 'The Arcora magazine',
  allArticles: 'All articles',
  sites: 'From watch sites',
  source: 'Source',
  emptyTitle: 'No articles',
  empty: "This source hasn't published anything recently.",
});

const FEEDS = NEWS_FEEDS;

/** Les articles du magazine Arcora en tête, puis les derniers articles de quelques sites horlogers (flux RSS). */
export default function WatchNewsPage() {
  const t = useStrings(S);
  const { lang } = useLang();
  const [feed, setFeed] = useState(FEEDS[0].value);
  const q = useLoad(() => fetchNews(feed), [feed]);
  const mag = useLoad(() => fetchMagazine(lang), [lang]);
  const magazineHome = lang === 'fr' ? '/magazine/' : '/en/magazine/';

  return (
    <div className="page">
      <PageHeader title={t.title} subtitle={t.subtitle} />

      {/* Le magazine est servi à part (site statique) : liens classiques, dans le même onglet. */}
      {!!mag.data?.length && (
        <section className={`${s.section} reveal`} aria-labelledby="magazine-title">
          <div className={s.sectionHead}>
            <h2 id="magazine-title" className={s.sectionTitle}>{t.magazine}</h2>
            <a href={magazineHome} className={s.all}>{t.allArticles}</a>
          </div>
          <div className={s.list}>
            {mag.data.slice(0, 3).map(a => (
              <a key={a.url} href={a.url} className={s.item}>
                {a.cover && <img src={a.cover} alt="" loading="lazy" />}
                <span className={s.text}>
                  <span className={s.kicker}>{a.category}</span>
                  <span className={s.title}>{a.title}</span>
                  <span className={s.snippet}>{a.description}</span>
                  <span className={s.meta}>{formatDate(a.publishedAt)}</span>
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

      <section className={s.section} aria-labelledby="sites-title">
        {!!mag.data?.length && <h2 id="sites-title" className={s.sectionTitle}>{t.sites}</h2>}
        <Segmented label={t.source} value={feed} onChange={setFeed} options={FEEDS} />
        <div className={`${s.list} reveal`}>
          {q.loading ? <SkeletonList rows={6} thumb={104} /> : q.error ? <Notice tone="error">{q.error}</Notice> : !q.data?.length ? (
            <EmptyState title={t.emptyTitle}>{t.empty}</EmptyState>
          ) : q.data.map((n, i) => (
            <a key={n.link ?? i} href={n.link} target="_blank" rel="noopener noreferrer" className={s.item}>
              {n.imageUrl && <img src={n.imageUrl} alt="" loading="lazy" onError={e => (e.currentTarget.style.display = 'none')} />}
              <span className={s.text}>
                <span className={s.title}>{n.title}</span>
                {n.contentSnippet && <span className={s.snippet}>{n.contentSnippet.replace(/\.\.\.$/, '…')}</span>}
                <span className={s.meta}>{formatDate(n.isoDate ?? n.pubDate)}</span>
              </span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
