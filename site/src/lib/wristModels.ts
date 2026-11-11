// Données des pages « au poignet », écrites par scripts/sync-models.mjs juste avant la construction.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface WristPhoto {
  path: string; src: string; full: string; wrist: number | null; username: string | null;
  likes: number; fit_small: number; fit_perfect: number; fit_large: number; created_at: string;
}
export interface WristModel {
  slug: string; brand: string; model: string; reference_number: string | null;
  photo_count: number; wrist_min: number | null; wrist_max: number | null;
  case_diameter_mm: number | null; lug_to_lug_mm: number | null;
  fit_small: number; fit_perfect: number; fit_large: number; updated_at: string;
  photos: WristPhoto[];
}

/** En dessous, la page existe (lien depuis l'app) mais n'est pas proposée à Google : trop peu de contenu. */
export const MIN_INDEXED_PHOTOS = 3;

let cache: WristModel[] | null = null;
export function getWristModels(): WristModel[] {
  if (cache) return cache;
  // La construction du site se lance depuis le dossier site/
  const file = join(process.cwd(), 'src', 'data', 'wrist-models.generated.json');
  try { cache = existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as WristModel[]) : []; }
  catch { cache = []; }
  return cache;
}

export const cm = (v: number | null) => (v == null ? '' : String(Math.round(v * 10) / 10).replace('.', ','));
export const wristRange = (m: Pick<WristModel, 'wrist_min' | 'wrist_max'>) =>
  m.wrist_min == null ? null : m.wrist_min === m.wrist_max ? `${cm(m.wrist_min)} cm` : `${cm(m.wrist_min)} à ${cm(m.wrist_max)} cm`;
