import { useState } from 'react';
import { useLoad } from '../hooks/useLoad';
import { fetchNews } from '../lib/api';
import { formatDate } from '../lib/format';
import { EmptyState, Loading, Notice, PageHeader, Segmented } from '../components/ui';
import { defineStrings, useStrings } from '../i18n';
import s from './WatchNewsPage.module.css';

const S = defineStrings({
  title: 'Actualités',
  subtitle: 'Les derniers articles de quelques sites horlogers francophones.',
  source: 'Source',
  emptyTitle: 'Aucun article',
  empty: "Cette source n'a rien publié récemment.",
}, {
  title: 'News',
  subtitle: 'The latest articles from a few French-language watch sites.',
  source: 'Source',
  emptyTitle: 'No articles',
  empty: "This source hasn't published anything recently.",
});

const FEEDS = [
  { value: 'https://www.lecalibre.com/feed/', label: 'Le Calibre' },
  { value: 'https://www.lesrhabilleurs.com/feed/', label: 'Les Rhabilleurs' },
  { value: 'https://thewatchobserver.ouest-france.fr/feed/', label: 'Watch Observer' },
  { value: 'https://www.mrmontre.com/feed', label: 'Mr Montre' },
  { value: 'https://www.watches-news.com/fr/feed/', label: 'Watches News' },
];

/** Bonus : les derniers articles de quelques sites horlogers, lus via leur flux RSS. */
export default function WatchNewsPage() {
  const t = useStrings(S);
  const [feed, setFeed] = useState(FEEDS[0].value);
  const q = useLoad(() => fetchNews(feed), [feed]);

  return (
    <div className="page">
      <PageHeader title={t.title} subtitle={t.subtitle} />
      <Segmented label={t.source} value={feed} onChange={setFeed} options={FEEDS} />
      <div className={s.list}>
        {q.loading ? <Loading /> : q.error ? <Notice tone="error">{q.error}</Notice> : !q.data?.length ? (
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
    </div>
  );
}
