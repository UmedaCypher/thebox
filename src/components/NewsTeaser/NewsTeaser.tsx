import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useLoad } from '../../hooks/useLoad';
import { fetchNews } from '../../lib/api';
import type { NewsItem } from '../../lib/api';
import { NEWS_FEEDS } from '../../lib/news';
import { formatDate } from '../../lib/format';
import { defineStrings, useStrings } from '../../i18n';
import s from './NewsTeaser.module.css';

const S = defineStrings(
  { title: 'À lire', all: 'Toutes les actualités' },
  { title: 'Worth reading', all: 'All news' },
);

/** Les trois derniers articles des sites horlogers, les plus récents d'abord. Rien ne s'affiche si les flux sont indisponibles. */
async function latest(n: number): Promise<(NewsItem & { source: string })[]> {
  // Deux sources en parallèle : si l'une ne répond pas, l'autre suffit.
  const results = await Promise.allSettled(NEWS_FEEDS.slice(0, 2).map(f => fetchNews(f.value).then(items => items.map(i => ({ ...i, source: f.label })))));
  const items = results.flatMap(r => (r.status === 'fulfilled' ? r.value : []));
  const time = (i: NewsItem) => new Date(i.isoDate ?? i.pubDate ?? 0).getTime() || 0;
  const seen = new Set<string>();
  return items
    .filter(i => i.title && i.link && !seen.has(i.title.trim().toLowerCase()) && seen.add(i.title.trim().toLowerCase()))
    .sort((a, b) => time(b) - time(a))
    .slice(0, n);
}

export default function NewsTeaser() {
  const t = useStrings(S);
  const q = useLoad(() => latest(3), []);
  if (q.loading || !q.data?.length) return null;

  return (
    <section className={s.block} aria-labelledby="news-teaser-title">
      <div className={s.head}>
        <h2 id="news-teaser-title" className={s.title}>{t.title}</h2>
        <Link to="/actualites" className={s.all}>{t.all}<ChevronRight size={16} strokeWidth={1.8} aria-hidden="true" /></Link>
      </div>
      <ul className={s.list}>
        {q.data.map(n => (
          <li key={n.link}>
            <a href={n.link} target="_blank" rel="noopener noreferrer" className={s.item}>
              {n.imageUrl
                ? <img src={n.imageUrl} alt="" loading="lazy" onError={e => (e.currentTarget.style.visibility = 'hidden')} />
                : <span className={s.noImage} aria-hidden="true" />}
              <span className={s.text}>
                <span className={s.itemTitle}>{n.title}</span>
                <span className={s.meta}>{n.source} · {formatDate(n.isoDate ?? n.pubDate, { day: 'numeric', month: 'short' })}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
