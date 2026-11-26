// supabase/functions/rss-feed-parser/index.ts
// Lit un des flux d'actualités horlogères affichés dans l'app (liste fixe, src/lib/news.ts)
// et renvoie ses 20 derniers articles. Aucune autre adresse n'est acceptée : la fonction
// est publique et ne doit pas servir de relais vers des adresses arbitraires.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Parser from 'https://esm.sh/rss-parser@3.13.0';

// Même liste que src/lib/news.ts : à tenir à jour ensemble
const FEEDS = new Set([
  'https://www.lecalibre.com/feed/',
  'https://www.lesrhabilleurs.com/feed/',
  'https://thewatchobserver.ouest-france.fr/feed/',
  'https://www.mrmontre.com/feed',
  'https://www.watches-news.com/fr/feed/',
]);

const ORIGINS = new Set([
  'https://arcorawatch.com',
  'https://www.arcorawatch.com',
  'http://localhost:5173',
  'http://localhost:4173',
]);

const TIMEOUT_MS = 8000;
const MAX_BYTES = 2 * 1024 * 1024;

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: false }],
      ['media:thumbnail', 'mediaThumbnail', { keepArray: false }],
      ['image', 'image'],
    ],
  },
});

function cors(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? '';
  return {
    'Access-Control-Allow-Origin': ORIGINS.has(origin) ? origin : 'https://arcorawatch.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    Vary: 'Origin',
  };
}

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors(req) },
  });
}

/** Lit la réponse en s'arrêtant à MAX_BYTES : un flux anormalement lourd est refusé. */
async function readLimited(res: Response): Promise<string> {
  const declared = Number(res.headers.get('content-length') ?? 0);
  if (declared > MAX_BYTES) throw new Error('FEED_TOO_LARGE');
  const reader = res.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BYTES) { await reader.cancel(); throw new Error('FEED_TOO_LARGE'); }
    chunks.push(value);
  }
  const all = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) { all.set(c, offset); offset += c.byteLength; }
  return new TextDecoder().decode(all);
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });
  if (req.method !== 'POST') return json(req, { error: 'Méthode non autorisée.' }, 405);

  let feedUrl: unknown;
  try {
    ({ feedUrl } = await req.json());
  } catch {
    return json(req, { error: 'Requête invalide.' }, 400);
  }
  if (typeof feedUrl !== 'string' || !FEEDS.has(feedUrl)) {
    return json(req, { error: 'Flux non pris en charge.' }, 400);
  }

  try {
    const response = await fetch(feedUrl, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        'User-Agent': 'Arcora/1.0 (RSS; +https://arcorawatch.com)',
        Accept: 'application/rss+xml, application/xml, text/xml',
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const feed = await parser.parseString(await readLimited(response));
    const items = (feed.items ?? []).slice(0, 20).map((item) => {
      const snippet = item.contentSnippet ?? item.summary;
      return {
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        isoDate: item.isoDate,
        creator: item.creator || item['dc:creator'],
        contentSnippet: snippet ? `${snippet.substring(0, 200)}...` : undefined,
        imageUrl: item.mediaContent?.$?.url || item.mediaThumbnail?.$?.url || item.enclosure?.url || item.image?.url || null,
        sourceTitle: feed.title,
      };
    });

    return new Response(JSON.stringify({ items }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=900', ...cors(req) },
    });
  } catch (error) {
    // Le détail reste dans les journaux de la fonction ; le client reçoit un message générique
    console.error('rss-feed-parser', feedUrl, error);
    return json(req, { error: 'Flux momentanément indisponible.' }, 502);
  }
});
