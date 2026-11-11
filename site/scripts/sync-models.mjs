// Pages « au poignet » : avant la construction, récupère les photos au poignet publiques regroupées par modèle
// (fonction get_wrist_models, clé publique) et les écrit dans src/data/wrist-models.generated.json.
// Sans connexion à la base, le fichier est vide : le site se construit sans ces pages.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { modelSlug } from '../src/lib/slug.mjs';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'wrist-models.generated.json');
const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/$/, '');
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const BUCKET = 'watch.images';

const write = (models) => { mkdirSync(dirname(OUT), { recursive: true }); writeFileSync(OUT, JSON.stringify(models)); };
const publicUrl = (path) => `${url}/storage/v1/object/public/${BUCKET}/${path.split('/').map(encodeURIComponent).join('/')}`;
const thumb = (path) => path.replace(/\.[^./]+$/, '') + '.thumb.jpg';

async function main() {
  if (!url || !key || key === 'mock-anon') { write([]); console.log('[au-poignet] Pas de connexion Supabase : aucune page modèle.'); return; }
  let rows;
  try {
    const res = await fetch(`${url}/rest/v1/rpc/get_wrist_models`, {
      method: 'POST', headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_min_photos: 2 }),
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    rows = await res.json();
  } catch (e) {
    write([]); console.warn('[au-poignet] Données indisponibles, pages modèles ignorées :', e.message); return;
  }
  const seen = new Map();
  const models = (Array.isArray(rows) ? rows : []).map((m) => {
    let slug = modelSlug(m.brand, m.model) || 'montre';
    const n = (seen.get(slug) ?? 0) + 1; seen.set(slug, n);
    if (n > 1) slug = `${slug}-${n}`;
    return {
      ...m, slug,
      photos: (m.photos ?? []).map((p) => ({ ...p, src: publicUrl(thumb(p.path)), full: publicUrl(p.path) })),
    };
  });
  write(models);
  console.log(`[au-poignet] ${models.length} modèle(s).`);
}

main();
