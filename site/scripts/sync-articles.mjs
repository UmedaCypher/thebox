// Magazine : avant la construction, récupère les articles publiés depuis le backoffice (Supabase)
// et les écrit en Markdown dans src/content/articles/<langue>/, comme s'ils avaient été écrits à la main.
// Le site garde ainsi la même chaîne : vérification des champs, images optimisées, typographie, RSS.
//
// La base fait foi dès qu'elle contient des articles : un article dépublié ou supprimé disparaît du site.
// Si la base est injoignable, on construit avec les fichiers du dépôt (le site reste en ligne tel quel).
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'content', 'articles');
const IMAGES = join(ROOT, 'images');
const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/$/, '');
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

const yaml = (v) => JSON.stringify(v); // une chaîne JSON est une chaîne YAML valide
const edited = (r) => r.updated_at.slice(0, 10) > r.published_at
  && new Date(r.updated_at).getTime() - new Date(r.created_at).getTime() > 10 * 60 * 1000;

async function main() {
  if (!url || !key || key === 'mock-anon') {
    console.log('[magazine] Pas de connexion Supabase : articles du dépôt uniquement.');
    return;
  }
  let rows;
  try {
    const res = await fetch(`${url}/rest/v1/magazine_articles?status=eq.published&select=*`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    rows = await res.json();
  } catch (e) {
    console.warn('[magazine] Articles du backoffice indisponibles, construction avec le dépôt :', e.message);
    return;
  }
  if (!Array.isArray(rows) || rows.length === 0) {
    console.log('[magazine] Aucun article publié dans le backoffice : articles du dépôt uniquement.');
    return;
  }

  const keep = new Set(rows.map((r) => `${r.lang}/${r.slug}.md`));
  for (const lang of ['fr', 'en']) {
    const dir = join(ROOT, lang);
    mkdirSync(dir, { recursive: true });
    for (const f of readdirSync(dir)) if (f.endsWith('.md') && !keep.has(`${lang}/${f}`)) rmSync(join(dir, f));
  }

  for (const r of rows) {
    let cover = null;
    if (r.cover_path?.startsWith('local:')) {
      const name = basename(r.cover_path.slice(6));
      if (existsSync(join(IMAGES, name))) cover = `../images/${name}`;
    } else if (r.cover_path) {
      // Image envoyée depuis le backoffice : copiée dans le dossier des images pour être optimisée
      const name = `bo-${basename(r.cover_path).replace(/[^\w.-]/g, '-')}`;
      const file = join(IMAGES, name);
      if (!existsSync(file)) {
        try {
          const img = await fetch(`${url}/storage/v1/object/public/magazine/${r.cover_path.split('/').map(encodeURIComponent).join('/')}`);
          if (!img.ok) throw new Error(String(img.status));
          writeFileSync(file, Buffer.from(await img.arrayBuffer()));
        } catch (e) { console.warn(`[magazine] Couverture introuvable pour ${r.slug} :`, e.message); }
      }
      if (existsSync(file)) cover = `../images/${name}`;
    }
    const fm = [
      '---',
      `title: ${yaml(r.title)}`,
      `description: ${yaml(r.description)}`,
      `lang: ${r.lang}`,
      `translationKey: ${yaml(r.translation_key)}`,
      `category: ${yaml(r.category)}`,
      `publishedAt: ${r.published_at}`,
      // « Mis à jour le » seulement pour une vraie modification après la création
      ...(edited(r) ? [`updatedAt: ${r.updated_at.slice(0, 10)}`] : []),
      `author: ${yaml(r.author || 'Arcora')}`,
      ...(cover ? [`cover: ${cover}`, `coverAlt: ${yaml(r.cover_alt || '')}`] : []),
      ...(cover && r.cover_caption ? [`coverCaption: ${yaml(r.cover_caption)}`] : []),
      '---',
      '',
    ].join('\n');
    writeFileSync(join(ROOT, r.lang, `${r.slug}.md`), fm + r.body_md.trim() + '\n');
  }
  console.log(`[magazine] ${rows.length} article(s) du backoffice.`);
}

main();
