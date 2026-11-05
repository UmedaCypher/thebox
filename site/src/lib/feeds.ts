import rss from '@astrojs/rss';
import { SITE, T, articlePath, getArticles, magazinePath, type Lang } from './i18n';

/** Flux RSS du magazine (lu par les agrégateurs et par l'app). */
export async function rssFeed(lang: Lang) {
  const articles = await getArticles(lang);
  return rss({
    title: `Arcora — ${T[lang].magazine}`,
    description: T[lang].magazineDescription,
    site: SITE + magazinePath(lang),
    items: articles.map((a) => ({
      title: a.data.title,
      description: a.data.description,
      link: articlePath(a),
      pubDate: a.data.publishedAt,
      categories: [a.data.category],
    })),
    customData: `<language>${T[lang].locale}</language>`,
  });
}

/** Liste légère au format JSON, lue directement par la page Actualités de l'app (même domaine). */
export async function jsonIndex(lang: Lang) {
  const articles = await getArticles(lang);
  const body = articles.slice(0, 20).map((a) => ({
    title: a.data.title,
    description: a.data.description,
    category: a.data.category,
    url: articlePath(a),
    cover: a.data.cover ?? null,
    publishedAt: a.data.publishedAt.toISOString(),
  }));
  return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
