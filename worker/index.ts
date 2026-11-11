/**
 * Arcora : Worker Cloudflare devant l'application.
 *
 * L'app est une page unique : sans aide, un lien partagé (WhatsApp, Instagram, iMessage, Google)
 * n'affiche que « Arcora ». Pour les pages publiques qui se partagent, ce Worker complète le
 * index.html avec le titre, la description et la photo de la montre ou du membre (balises Open Graph).
 * Tout le reste est servi tel quel par les fichiers statiques. En cas de souci, la page part sans aperçu :
 * le Worker ne bloque jamais l'affichage.
 */

interface Env {
  ASSETS: { fetch: (req: Request | string) => Promise<Response> };
}

interface AppConfig { supabaseUrl: string; anonKey: string }
interface Meta { title: string; description: string; image?: string | null; url: string; type?: string; noindex?: boolean }

declare class HTMLRewriter {
  on(selector: string, handlers: {
    element?: (el: { setAttribute(n: string, v: string): void; remove(): void; append(c: string, o?: { html: boolean }): void }) => void;
  }): HTMLRewriter;
  transform(res: Response): Response;
}

const SITE = 'https://arcorawatch.com';
const BUCKET = 'watch.images';
let configPromise: Promise<AppConfig | null> | null = null;

/** Adresse et clé publique Supabase, écrites par la construction de l'app (dist/app-config.json). */
function getConfig(env: Env, origin: string): Promise<AppConfig | null> {
  configPromise ??= env.ASSETS.fetch(`${origin}/app-config.json`)
    .then(r => (r.ok ? (r.json() as Promise<AppConfig>) : null))
    .catch(() => null);
  return configPromise;
}

async function rpc<T>(cfg: AppConfig, fn: string, body: Record<string, unknown>): Promise<T | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 1500); // un aperçu ne vaut pas une page lente
  try {
    const res = await fetch(`${cfg.supabaseUrl}/rest/v1/rpc/${fn}`, {
      method: 'POST', signal: ctrl.signal,
      headers: { apikey: cfg.anonKey, Authorization: `Bearer ${cfg.anonKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.ok ? ((await res.json()) as T) : null;
  } catch { return null; } finally { clearTimeout(timer); }
}

const publicPhoto = (cfg: AppConfig, path: string | null | undefined) =>
  path ? `${cfg.supabaseUrl}/storage/v1/object/public/${BUCKET}/${path.split('/').map(encodeURIComponent).join('/')}` : null;
const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const eur = (n: number) => `${Math.round(n).toLocaleString('fr-FR').replace(/ | /g, ' ')} €`;

interface Passport {
  brand: string; model: string; reference_number: string | null; year_of_production: number | null;
  caliber: string | null; case_diameter_mm: number | null; owner_username: string | null;
  listing: { kind: 'sale' | 'exchange'; price: number | null; city: string | null } | null;
  photos: { storage_path: string; photo_type: string; is_main_photo: boolean }[];
}
interface PublicCollection {
  username: string; is_public: boolean; profile_picture_url: string | null;
  watches: { brand: string; model: string; main_photo_path: string | null }[];
}

async function passportMeta(cfg: AppConfig, id: string, url: string): Promise<Meta | null> {
  if (!uuidRe.test(id)) return null;
  const p = await rpc<Passport>(cfg, 'get_watch_passport', { p_watch_id: id });
  if (!p) return null;
  const name = `${p.brand} ${p.model}`.trim();
  const main = p.photos.find(x => x.is_main_photo) ?? p.photos.find(x => x.photo_type === 'watch_only') ?? p.photos[0];
  const facts = [
    p.reference_number && `Réf. ${p.reference_number}`,
    p.year_of_production && String(p.year_of_production),
    p.case_diameter_mm && `${String(p.case_diameter_mm).replace('.', ',')} mm`,
    p.caliber && `calibre ${p.caliber}`,
  ].filter(Boolean).join(' · ');
  if (p.listing) {
    const offer = p.listing.kind === 'sale' && p.listing.price ? `À vendre : ${eur(p.listing.price)}` : 'À échanger';
    return {
      title: `${name} · ${offer}`,
      description: [facts, p.listing.city, p.owner_username && `Annonce de @${p.owner_username} sur le Marché Arcora, sans commission.`]
        .filter(Boolean).join(' · '),
      image: publicPhoto(cfg, main?.storage_path), url, type: 'product',
    };
  }
  return {
    title: `${name} · Passeport Arcora`,
    description: [facts, p.owner_username ? `Dans la collection de @${p.owner_username}.` : 'Passeport de montre sur Arcora.'].filter(Boolean).join(' · '),
    image: publicPhoto(cfg, main?.storage_path), url,
  };
}

async function profileMeta(cfg: AppConfig, username: string, url: string): Promise<Meta | null> {
  const c = await rpc<PublicCollection>(cfg, 'get_public_collection', { p_username: username });
  if (!c?.username) return null;
  if (!c.is_public) return { title: `@${c.username} · Arcora`, description: 'Collectionneur de montres sur Arcora.', url, noindex: true };
  const n = c.watches.length;
  const brands = [...new Set(c.watches.map(w => w.brand))].slice(0, 4).join(', ');
  const cover = c.watches.find(w => w.main_photo_path)?.main_photo_path;
  return {
    title: `@${c.username} · ${n} montre${n > 1 ? 's' : ''} sur Arcora`,
    description: n ? `La collection de @${c.username} : ${brands}${c.watches.length > 4 ? '…' : ''}. Passeports, photos au poignet et Wrist Checks.`
      : `@${c.username} collectionne des montres sur Arcora.`,
    image: publicPhoto(cfg, cover) ?? c.profile_picture_url, url, type: 'profile',
  };
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function withMeta(res: Response, m: Meta): Response {
  const title = m.title.slice(0, 110);
  const description = m.description.slice(0, 200);
  const tags = [
    `<meta property="og:url" content="${esc(m.url)}" />`,
    `<meta property="og:site_name" content="Arcora" />`,
    `<link rel="canonical" href="${esc(m.url)}" />`,
    m.image ? `<meta property="og:image" content="${esc(m.image)}" />` : `<meta property="og:image" content="${SITE}/icons/icon-1024x1024.png" />`,
    `<meta name="twitter:card" content="${m.image ? 'summary_large_image' : 'summary'}" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    m.noindex ? '<meta name="robots" content="noindex" />' : '',
  ].join('');
  const out = new HTMLRewriter()
    .on('title', { element: el => { el.remove(); } })
    .on('meta[name="description"]', { element: el => el.setAttribute('content', description) })
    .on('meta[property="og:title"]', { element: el => el.setAttribute('content', title) })
    .on('meta[property="og:description"]', { element: el => el.setAttribute('content', description) })
    .on('meta[property="og:type"]', { element: el => el.setAttribute('content', m.type ?? 'website') })
    .on('head', { element: el => el.append(`<title>${esc(title)}</title>${tags}`, { html: true }) })
    .transform(res);
  const headers = new Headers(out.headers);
  headers.set('Cache-Control', 'public, max-age=0, s-maxage=300'); // aperçu frais à 5 minutes près
  return new Response(out.body, { status: out.status, headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const page = await env.ASSETS.fetch(request);
    const isHtml = request.method === 'GET' && (page.headers.get('content-type') ?? '').includes('text/html');
    if (!isHtml) return page;
    try {
      const cfg = await getConfig(env, url.origin);
      if (!cfg) return page;
      const canonical = `${SITE}${url.pathname}`;
      const [, section, slug] = url.pathname.split('/');
      const key = slug ? decodeURIComponent(slug) : '';
      let meta: Meta | null = null;
      if (section === 'passeport' && key) meta = await passportMeta(cfg, key, canonical);
      else if (section === 'profil' && key) meta = await profileMeta(cfg, key, canonical);
      return meta ? withMeta(page, meta) : page;
    } catch {
      return page;
    }
  },
};
