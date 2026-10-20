import { useState } from 'react';
import { useLoad } from '../hooks/useLoad';
import { fetchNews } from '../lib/api';
import { formatDate } from '../lib/format';
import { EmptyState, Loading, Notice, PageHeader, Segmented } from '../components/ui';
import s from './WatchNewsPage.module.css';

const FEEDS = [
  { value: 'https://www.lecalibre.com/feed/', label: 'Le Calibre' },
  { value: 'https://www.lesrhabilleurs.com/feed/', label: 'Les Rhabilleurs' },
  { value: 'https://thewatchobserver.ouest-france.fr/feed/', label: 'Watch Observer' },
  { value: 'https://www.mrmontre.com/feed', label: 'Mr Montre' },
  { value: 'https://www.watches-news.com/fr/feed/', label: 'Watches News' },
];

/** Bonus : les derniers articles de quelques sites horlogers, lus via leur flux RSS. */
export default function WatchNewsPage() {
  const [feed, setFeed] = useState(FEEDS[0].value);
  const q = useLoad(() => fetchNews(feed), [feed]);

  return (
    <div className="page">
      <PageHeader title="Actualités" subtitle="Les derniers articles de quelques sites horlogers francophones." />
      <Segmented label="Source" value={feed} onChange={setFeed} options={FEEDS} />
      <div className={s.list}>
        {q.loading ? <Loading /> : q.error ? <Notice tone="error">{q.error}</Notice> : !q.data?.length ? (
          <EmptyState title="Aucun article">Cette source n'a rien publié récemment.</EmptyState>
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
