/** Accès aux données Supabase. Les pages n'appellent jamais supabase directement. */
import { supabase } from './supabaseClient';
import { preparePhoto } from './images';
import type {
  GalleryShot, MaintenanceEntry, Passport, Photo, Profile, PublicCollection, Subscription,
  ValuePoint, Watch, WatchInput, WearLog, WishlistItem,
} from '../types';

const WATCH_BUCKET = 'watch.images';

export class WatchLimitError extends Error {
  constructor() { super('WATCH_LIMIT_REACHED'); }
}

function fail(error: { message: string; code?: string } | null, fallback: string): never | void {
  if (!error) return;
  if (error.message?.includes('WATCH_LIMIT_REACHED')) throw new WatchLimitError();
  throw new Error(error.message || fallback);
}

export const photoUrl = (path: string | null | undefined) =>
  path ? supabase.storage.from(WATCH_BUCKET).getPublicUrl(path).data.publicUrl : null;

/** Photo principale : la photo « montre seule » marquée principale, sinon la première disponible. */
export function mainPhoto(photos: Pick<Photo, 'storage_path' | 'photo_type' | 'is_main_photo'>[] | undefined) {
  if (!photos?.length) return null;
  return photos.find(p => p.is_main_photo) ?? photos.find(p => p.photo_type === 'watch_only') ?? photos[0];
}

/* ---------- Profil ---------- */

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  fail(error, 'Profil indisponible.');
  return (data as Profile) ?? null;
}

export async function saveProfile(userId: string, patch: Partial<Profile>, exists: boolean) {
  const row = { ...patch, updated_at: new Date().toISOString() };
  const { error } = exists
    ? await supabase.from('profiles').update(row).eq('id', userId)
    : await supabase.from('profiles').insert({ ...row, id: userId });
  if (error?.message.includes('profiles_username_key')) throw new Error('Ce pseudo est déjà pris.');
  fail(error, 'Enregistrement du profil impossible.');
}

export async function uploadAvatar(userId: string, file: File) {
  const prepared = await preparePhoto(file, 600, 0.85);
  const path = `${userId}/avatar_${Date.now()}.jpg`;
  const { error } = await supabase.storage.from('avatars').upload(path, prepared, { upsert: true, contentType: 'image/jpeg' });
  fail(error, "Envoi de l'avatar impossible.");
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
}

/* ---------- Montres ---------- */

const WATCH_SELECT = '*, photos (id, storage_path, photo_type, is_main_photo, is_public_gallery, created_at)';

export async function listWatches(userId: string): Promise<Watch[]> {
  const { data, error } = await supabase.from('watches').select(WATCH_SELECT)
    .eq('user_id', userId).order('created_at', { ascending: false });
  fail(error, 'Chargement de la collection impossible.');
  return (data as Watch[]) ?? [];
}

export async function getWatch(userId: string, id: string): Promise<Watch | null> {
  const { data, error } = await supabase.from('watches').select(WATCH_SELECT)
    .eq('id', id).eq('user_id', userId).maybeSingle();
  fail(error, 'Chargement de la montre impossible.');
  return (data as Watch) ?? null;
}

export async function createWatch(userId: string, input: Partial<WatchInput>): Promise<Watch> {
  const { data, error } = await supabase.from('watches').insert({ ...input, user_id: userId }).select().single();
  fail(error, 'Ajout de la montre impossible.');
  return data as Watch;
}

export async function updateWatch(userId: string, id: string, input: Partial<WatchInput>) {
  const { error } = await supabase.from('watches')
    .update({ ...input, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', userId);
  fail(error, 'Enregistrement impossible.');
}

export async function deleteWatch(userId: string, watch: Watch) {
  const paths = (watch.photos ?? []).map(p => p.storage_path);
  if (paths.length) await supabase.storage.from(WATCH_BUCKET).remove(paths);
  // Les tables liées sont supprimées en cascade par la base (migration du 20/10/2026).
  const { error } = await supabase.from('watches').delete().eq('id', watch.id).eq('user_id', userId);
  fail(error, 'Suppression impossible.');
}

export async function addWatchPhoto(
  userId: string, watchId: string, file: File,
  opts: { type: 'watch_only' | 'wrist_shot'; isMain?: boolean; inGallery?: boolean; wristSizeCm?: number | null },
) {
  const prepared = await preparePhoto(file);
  const path = `${userId}/${watchId}/${opts.type}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
  const up = await supabase.storage.from(WATCH_BUCKET).upload(path, prepared, { contentType: 'image/jpeg' });
  fail(up.error, "Envoi de la photo impossible.");

  if (opts.isMain) {
    await supabase.from('photos').update({ is_main_photo: false }).eq('watch_id', watchId).eq('user_id', userId);
  }
  const { error } = await supabase.from('photos').insert({
    watch_id: watchId, user_id: userId, storage_path: path, file_name: prepared.name,
    mime_type: prepared.type, size_bytes: prepared.size, photo_type: opts.type,
    is_main_photo: Boolean(opts.isMain),
    is_public_gallery: opts.type === 'wrist_shot' && Boolean(opts.inGallery),
    wrist_shot_on_wrist_size_cm: opts.type === 'wrist_shot' ? opts.wristSizeCm ?? null : null,
  });
  fail(error, "Enregistrement de la photo impossible.");
}

export async function deletePhoto(userId: string, photo: Photo) {
  await supabase.storage.from(WATCH_BUCKET).remove([photo.storage_path]);
  const { error } = await supabase.from('photos').delete().eq('id', photo.id).eq('user_id', userId);
  fail(error, 'Suppression de la photo impossible.');
}

export async function setPhotoInGallery(userId: string, photoId: string, inGallery: boolean) {
  const { error } = await supabase.from('photos').update({ is_public_gallery: inGallery }).eq('id', photoId).eq('user_id', userId);
  fail(error, 'Mise à jour impossible.');
}

export async function setMainPhoto(userId: string, watchId: string, photoId: string) {
  await supabase.from('photos').update({ is_main_photo: false }).eq('watch_id', watchId).eq('user_id', userId);
  const { error } = await supabase.from('photos').update({ is_main_photo: true }).eq('id', photoId).eq('user_id', userId);
  fail(error, 'Mise à jour impossible.');
}

export interface ReferenceOptions { brands: string[]; conditions: string[]; boxPapers: string[]; materials: string[]; dialColors: string[] }

export async function fetchReferenceOptions(): Promise<ReferenceOptions> {
  const names = (r: { data: { name: string }[] | null }) => (r.data ?? []).map(x => x.name);
  const [b, c, bp, m, d] = await Promise.all([
    supabase.from('brands').select('name').order('name'),
    supabase.from('watch_conditions').select('name').order('sort_order'),
    supabase.from('box_papers_options').select('name').order('sort_order'),
    supabase.from('materials').select('name').order('name'),
    supabase.from('dial_colors').select('name').order('name'),
  ]);
  return { brands: names(b), conditions: names(c), boxPapers: names(bp), materials: names(m), dialColors: names(d) };
}

/* ---------- Passeport & public ---------- */

export async function getPassport(id: string): Promise<Passport | null> {
  const { data, error } = await supabase.rpc('get_watch_passport', { p_watch_id: id });
  fail(error, 'Passeport indisponible.');
  return (data as Passport) ?? null;
}

export async function setPassportPublic(userId: string, id: string, value: boolean) {
  const { error } = await supabase.from('watches').update({ passport_public: value }).eq('id', id).eq('user_id', userId);
  fail(error, 'Mise à jour du partage impossible.');
}

export async function getPublicCollection(username: string): Promise<PublicCollection | null> {
  const { data, error } = await supabase.rpc('get_public_collection', { p_username: username });
  fail(error, 'Profil indisponible.');
  return (data as PublicCollection) ?? null;
}

/* ---------- Portage ---------- */

export async function listWearLogs(userId: string, from?: string, to?: string): Promise<WearLog[]> {
  let q = supabase.from('wear_logs').select('id, watch_id, worn_on, note').eq('user_id', userId);
  if (from) q = q.gte('worn_on', from);
  if (to) q = q.lte('worn_on', to);
  const { data, error } = await q.order('worn_on', { ascending: false });
  fail(error, 'Chargement du calendrier impossible.');
  return (data as WearLog[]) ?? [];
}

export async function addWear(userId: string, watchId: string, day: string) {
  const { error } = await supabase.from('wear_logs').insert({ user_id: userId, watch_id: watchId, worn_on: day });
  if (error?.code === '23505') return; // déjà noté ce jour-là
  fail(error, "Impossible de noter le port.");
}

export async function removeWear(userId: string, watchId: string, day: string) {
  const { error } = await supabase.from('wear_logs').delete().eq('user_id', userId).eq('watch_id', watchId).eq('worn_on', day);
  fail(error, 'Suppression impossible.');
}

/* ---------- Entretien ---------- */

export async function listMaintenance(userId: string, watchId?: string): Promise<MaintenanceEntry[]> {
  let q = supabase.from('maintenance_entries').select('id, watch_id, performed_on, kind, provider, cost, notes, next_due_on').eq('user_id', userId);
  if (watchId) q = q.eq('watch_id', watchId);
  const { data, error } = await q.order('performed_on', { ascending: false });
  fail(error, "Chargement du carnet d'entretien impossible.");
  return (data as MaintenanceEntry[]) ?? [];
}

export async function addMaintenance(userId: string, entry: Omit<MaintenanceEntry, 'id'>) {
  const { error } = await supabase.from('maintenance_entries').insert({ ...entry, user_id: userId });
  fail(error, "Ajout de l'entretien impossible.");
}

export async function deleteMaintenance(userId: string, id: string) {
  const { error } = await supabase.from('maintenance_entries').delete().eq('id', id).eq('user_id', userId);
  fail(error, 'Suppression impossible.');
}

/* ---------- Valeur ---------- */

export async function listValueHistory(userId: string, watchId?: string): Promise<ValuePoint[]> {
  let q = supabase.from('watch_value_history').select('watch_id, value, recorded_at').eq('user_id', userId);
  if (watchId) q = q.eq('watch_id', watchId);
  const { data, error } = await q.order('recorded_at', { ascending: true });
  fail(error, "Chargement de l'historique de valeur impossible.");
  return ((data as ValuePoint[]) ?? []).map(p => ({ ...p, value: Number(p.value) }));
}

/* ---------- Wishlist ---------- */

export async function listWishlist(userId: string): Promise<WishlistItem[]> {
  const { data, error } = await supabase.from('wishlist_items')
    .select('id, brand, model, reference_number, target_price, priority, notes, acquired_at, created_at')
    .eq('user_id', userId).order('priority').order('created_at', { ascending: false });
  fail(error, 'Chargement de la wishlist impossible.');
  return (data as WishlistItem[]) ?? [];
}

export async function addWishlistItem(userId: string, item: Omit<WishlistItem, 'id' | 'created_at' | 'acquired_at'>) {
  const { error } = await supabase.from('wishlist_items').insert({ ...item, user_id: userId });
  fail(error, "Ajout impossible.");
}

export async function updateWishlistItem(userId: string, id: string, patch: Partial<WishlistItem>) {
  const { error } = await supabase.from('wishlist_items').update(patch).eq('id', id).eq('user_id', userId);
  fail(error, 'Mise à jour impossible.');
}

export async function deleteWishlistItem(userId: string, id: string) {
  const { error } = await supabase.from('wishlist_items').delete().eq('id', id).eq('user_id', userId);
  fail(error, 'Suppression impossible.');
}

/* ---------- Liste d'attente ---------- */

export async function joinWaitlist(entry: { email: string; watch_count: string | null; interested_in_premium: boolean; source: string | null }) {
  const { error } = await supabase.from('waitlist').insert({ ...entry, email: entry.email.trim().toLowerCase() });
  if (error?.code === '23505') return; // déjà inscrit : on confirme quand même
  fail(error, "Inscription impossible pour le moment.");
}

/* ---------- Galerie ---------- */

export async function listGalleryBrands(): Promise<string[]> {
  const { data, error } = await supabase.rpc('get_gallery_available_brands');
  fail(error, 'Chargement des marques impossible.');
  return ((data as { brand: string }[]) ?? []).map(b => b.brand).sort((a, b) => a.localeCompare(b));
}

export async function listGalleryShots(filters: { brand: string | null; minWrist: number | null; maxWrist: number | null }): Promise<GalleryShot[]> {
  const { data, error } = await supabase.rpc('get_public_wrist_shots', {
    selected_brand_filter: filters.brand, min_wrist_filter: filters.minWrist, max_wrist_filter: filters.maxWrist,
  });
  fail(error, 'Chargement de la galerie impossible.');
  type Row = { photo_id: string; photo_storage_path: string; watch_id: string; watch_brand: string; watch_model: string; user_username: string | null; user_wrist_size_cm: number | null };
  return ((data as Row[]) ?? []).map(r => ({
    id: r.photo_id, url: photoUrl(r.photo_storage_path) ?? '', watch_id: r.watch_id, brand: r.watch_brand,
    model: r.watch_model, username: r.user_username, wrist_size_cm: r.user_wrist_size_cm,
  })).filter(s => s.url);
}

/* ---------- Actualités ---------- */

export interface NewsItem { title?: string; link?: string; isoDate?: string; pubDate?: string; contentSnippet?: string; imageUrl?: string | null; sourceTitle?: string }

export async function fetchNews(feedUrl: string): Promise<NewsItem[]> {
  const { data, error } = await supabase.functions.invoke('rss-feed-parser', { body: { feedUrl } });
  if (error) throw new Error("Cette source est indisponible pour le moment.");
  return (data?.items as NewsItem[]) ?? [];
}

/* ---------- Abonnement (Stripe) ---------- */

async function invokeForUrl(fn: 'create-checkout-session' | 'create-portal-session'): Promise<string> {
  const { data, error } = await supabase.functions.invoke(fn, { body: {} });
  if (error) {
    // Le message précis renvoyé par la fonction se trouve dans la réponse.
    const ctx = (error as { context?: Response }).context;
    const detail = ctx && typeof ctx.json === 'function' ? await ctx.json().catch(() => null) : null;
    throw new Error(detail?.error ?? 'Service de paiement indisponible pour le moment.');
  }
  if (!data?.url) throw new Error('Service de paiement indisponible pour le moment.');
  return data.url as string;
}

/** Envoie vers la page de paiement Stripe. */
export async function startCheckout() {
  window.location.assign(await invokeForUrl('create-checkout-session'));
}

/** Envoie vers l'espace client Stripe (carte, factures, résiliation). */
export async function openBillingPortal() {
  window.location.assign(await invokeForUrl('create-portal-session'));
}

export async function getSubscription(userId: string): Promise<Subscription | null> {
  const { data, error } = await supabase.from('subscriptions')
    .select('status, current_period_end, cancel_at_period_end').eq('user_id', userId).maybeSingle();
  if (error) return null; // table absente tant que la migration n'est pas passée
  return (data as Subscription) ?? null;
}
