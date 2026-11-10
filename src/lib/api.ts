/** Accès aux données Supabase. Les pages n'appellent jamais supabase directement. */
import { supabase } from './supabaseClient';
import { preparePhoto, preparePhotoWithThumb } from './images';
import { getLang } from '../i18n';
import { readRef } from './source';
import type {
  ConversationSummary, GalleryShot, MaintenanceEntry, MarketFilterOptions, MarketFilters, MarketItem, Message,
  Passport, Photo, Profile, PublicCollection, Subscription, ValuePoint, Watch, WatchInput, WearLog, WishlistItem,
  FitChoice, FitRankingRow, PhotoFit, WearStreak,
} from '../types';

const WATCH_BUCKET = 'watch.images';

export class WatchLimitError extends Error {
  constructor() { super('WATCH_LIMIT_REACHED'); }
}

/** Messages d'erreur : le français est écrit dans le code, l'anglais vient de cette table. */
const EN_MESSAGES: Record<string, string> = {
  "Action impossible.": "That didn't work.",
  "Ajout de l'entretien impossible.": "Couldn't add the service entry.",
  "Ajout de la montre impossible.": "Couldn't add the watch.",
  "Ajout impossible.": "Couldn't add it.",
  "Chargement de l'historique de valeur impossible.": "Couldn't load the value history.",
  "Chargement de la collection impossible.": "Couldn't load your collection.",
  "Chargement de la galerie impossible.": "Couldn't load the gallery.",
  "Chargement de la montre impossible.": "Couldn't load this watch.",
  "Chargement de la wishlist impossible.": "Couldn't load your wishlist.",
  "Chargement des filtres impossible.": "Couldn't load the filters.",
  "Chargement des marques impossible.": "Couldn't load the brands.",
  "Chargement impossible.": "Couldn't load.",
  "Chargement des messages impossible.": "Couldn't load your messages.",
  "Chargement du calendrier impossible.": "Couldn't load the calendar.",
  "Chargement du carnet d'entretien impossible.": "Couldn't load the service log.",
  "Chargement du marché impossible.": "Couldn't load the market.",
  "Conversation indisponible.": "This conversation isn't available.",
  "Enregistrement de la photo impossible.": "Couldn't save the photo.",
  "Enregistrement du profil impossible.": "Couldn't save your profile.",
  "Enregistrement impossible.": "Couldn't save.",
  "Envoi de l'avatar impossible.": "Couldn't upload your profile picture.",
  "Envoi de la photo impossible.": "Couldn't upload the photo.",
  "Envoi impossible.": "Couldn't send.",
  "Impossible d'ouvrir la conversation.": "Couldn't open the conversation.",
  "Impossible de noter le port.": "Couldn't log this wear.",
  "Inscription impossible pour le moment.": "Sign-up isn't available right now.",
  "Mise à jour du partage impossible.": "Couldn't update sharing.",
  "Mise à jour impossible.": "Couldn't update.",
  "Passeport indisponible.": "This passport isn't available.",
  "Profil indisponible.": "This profile isn't available.",
  "Signalement impossible.": "Couldn't send the report.",
  "Suppression de la photo impossible.": "Couldn't delete the photo.",
  "Suppression impossible.": "Couldn't delete.",
  "Ce pseudo est déjà pris.": "This username is already taken.",
  "Cette source est indisponible pour le moment.": "This source is unavailable right now.",
  "Service de paiement indisponible pour le moment.": "Payment is unavailable right now.",
};
/** Message d'erreur dans la langue courante. */
const L = (fr: string) => (getLang() === 'en' ? EN_MESSAGES[fr] ?? fr : fr);

/** Codes renvoyés par les fonctions de la base, traduits pour l'écran. */
const DB_ERRORS_EN: Record<string, string> = {
  STOLEN_WATCH: 'This watch is reported stolen: it cannot be offered on the Market.',
  USERNAME_REQUIRED: 'Choose a username in your profile first: it is what other members see.',
  MESSAGES_DISABLED: 'This member does not accept messages.',
  BLOCKED: 'Messages are not possible with this member.',
  RATE_LIMIT: 'You are writing a lot in a short time. Please try again in a moment.',
  INVALID_CONTENT: 'A message must be between 1 and 2,000 characters.',
  SELF: 'This is your own watch.',
  NOT_FOUND: 'Conversation or listing not found.',
  AUTH_REQUIRED: 'Please log in to continue.',
  CODE_TAKEN: 'This code is already taken. Try another one.',
  INVALID_CODE: 'Your code needs 3 to 30 characters: lowercase letters, digits, dot, dash or underscore.',
  INVALID_IBAN: 'This IBAN does not look right. Check it and try again.',
  NOT_AFFILIATE: 'Join the affiliate programme first.',
  NOTHING_DUE: 'Nothing is due to this affiliate.',
  FORBIDDEN: 'Access restricted.',
  INVALID_KIND: 'Choose a programme type.',
  INVALID_DAYS: 'Enter a number of days between 1 and 3,650.',
  ACTIVE_SUBSCRIPTION: 'Your Premium subscription is still active: cancel it first from your profile (Manage my subscription), then delete your account.',
  AFFILIATE_BALANCE: 'Commissions are still due to you as an ambassador: write to us so we can pay them before deleting your account.',
};

const DB_ERRORS: Record<string, string> = {
  STOLEN_WATCH: 'Cette montre est déclarée volée : elle ne peut pas être proposée sur le Marché.',
  USERNAME_REQUIRED: 'Choisissez d\'abord un pseudo dans votre profil : c\'est lui qui s\'affiche auprès des autres membres.',
  MESSAGES_DISABLED: 'Ce membre ne reçoit pas de messages.',
  BLOCKED: 'Les messages ne sont pas possibles avec ce membre.',
  RATE_LIMIT: 'Vous écrivez beaucoup en peu de temps. Réessayez dans un moment.',
  INVALID_CONTENT: 'Le message doit faire entre 1 et 2 000 caractères.',
  SELF: 'Il s\'agit de votre propre montre.',
  NOT_FOUND: 'Conversation ou annonce introuvable.',
  AUTH_REQUIRED: 'Connectez-vous pour continuer.',
  CODE_TAKEN: 'Ce code est déjà pris. Essayez-en un autre.',
  INVALID_CODE: 'Le code compte de 3 à 30 caractères : lettres minuscules, chiffres, point, tiret ou tiret bas.',
  INVALID_IBAN: 'Cet IBAN ne semble pas valide. Vérifiez-le et réessayez.',
  NOT_AFFILIATE: "Rejoignez d'abord le programme d'affiliation.",
  NOTHING_DUE: "Rien n'est dû à cet affilié.",
  FORBIDDEN: 'Accès réservé.',
  INVALID_KIND: 'Choisissez un type de programme.',
  INVALID_DAYS: 'Indiquez un nombre de jours entre 1 et 3 650.',
  ACTIVE_SUBSCRIPTION: 'Votre abonnement Premium est encore actif : résiliez-le d\'abord depuis votre profil (Gérer mon abonnement), puis supprimez votre compte.',
  AFFILIATE_BALANCE: 'Des commissions d\'ambassadeur vous sont encore dues : écrivez-nous pour que nous les versions avant de supprimer le compte.',
};

export class AppError extends Error {
  code: string;
  constructor(code: string, message: string) { super(message); this.code = code; }
}

function fail(error: { message: string; code?: string } | null, fallback: string): never | void {
  if (!error) return;
  if (error.message?.includes('WATCH_LIMIT_REACHED')) throw new WatchLimitError();
  const code = Object.keys(DB_ERRORS).find(c => error.message?.includes(c));
  if (code) throw new AppError(code, getLang() === 'en' ? DB_ERRORS_EN[code] : DB_ERRORS[code]);
  // Le message technique reste dans la console ; l'écran affiche un message compréhensible.
  console.warn(error.message);
  throw new Error(L(fallback));
}

export const photoUrl = (path: string | null | undefined) =>
  path ? supabase.storage.from(WATCH_BUCKET).getPublicUrl(path).data.publicUrl : null;

/** Chemin de la miniature d'une photo : même dossier, suffixe « .thumb.jpg ». */
export const thumbPath = (path: string) => path.replace(/\.[^./]+$/, '') + '.thumb.jpg';

/**
 * Miniature pour l'affichage en petit, avec la pleine taille en secours :
 * les photos envoyées avant le 22/10/2026 n'ont pas de miniature.
 */
export const thumbSrc = (path: string | null | undefined) =>
  path ? { src: photoUrl(thumbPath(path)), fallback: photoUrl(path) } : { src: null, fallback: null };

const withThumbs = (paths: string[]) => paths.flatMap(p => [p, thumbPath(p)]);

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
  if (error?.message.includes('profiles_username_key')) throw new Error(L('Ce pseudo est déjà pris.'));
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

const WATCH_SELECT = '*, photos (id, storage_path, photo_type, is_main_photo, is_public_gallery, created_at, worn_on)';

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
  const paths = withThumbs((watch.photos ?? []).map(p => p.storage_path));
  if (paths.length) await supabase.storage.from(WATCH_BUCKET).remove(paths);
  // Les tables liées sont supprimées en cascade par la base (migration du 20/10/2026).
  const { error } = await supabase.from('watches').delete().eq('id', watch.id).eq('user_id', userId);
  fail(error, 'Suppression impossible.');
}

export async function addWatchPhoto(
  userId: string, watchId: string, file: File,
  opts: { type: 'watch_only' | 'wrist_shot'; isMain?: boolean; inGallery?: boolean; wristSizeCm?: number | null; wornOn?: string | null },
) {
  const { full: prepared, thumb } = await preparePhotoWithThumb(file);
  const path = `${userId}/${watchId}/${opts.type}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
  const opt = { contentType: 'image/jpeg', cacheControl: '31536000' };
  const [up, upThumb] = await Promise.all([
    supabase.storage.from(WATCH_BUCKET).upload(path, prepared, opt),
    supabase.storage.from(WATCH_BUCKET).upload(thumbPath(path), thumb, opt),
  ]);
  fail(up.error, "Envoi de la photo impossible.");
  // Une miniature manquante n'empêche pas l'ajout : l'app affiche alors la pleine taille.
  if (upThumb.error) console.warn('Miniature non envoyée', upThumb.error.message);

  if (opts.isMain) {
    await supabase.from('photos').update({ is_main_photo: false }).eq('watch_id', watchId).eq('user_id', userId);
  }
  const { error } = await supabase.from('photos').insert({
    watch_id: watchId, user_id: userId, storage_path: path, file_name: prepared.name,
    mime_type: prepared.type, size_bytes: prepared.size, photo_type: opts.type,
    is_main_photo: Boolean(opts.isMain),
    is_public_gallery: opts.type === 'wrist_shot' && Boolean(opts.inGallery),
    wrist_shot_on_wrist_size_cm: opts.type === 'wrist_shot' ? opts.wristSizeCm ?? null : null,
    ...(opts.wornOn ? { worn_on: opts.wornOn } : {}),
  });
  fail(error, "Enregistrement de la photo impossible.");
}

export async function deletePhoto(userId: string, photo: Photo) {
  await supabase.storage.from(WATCH_BUCKET).remove(withThumbs([photo.storage_path]));
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

/** Calibres déjà saisis par plusieurs membres (suggestions du champ Calibre). */
export async function fetchCaliberSuggestions(): Promise<string[]> {
  const { data, error } = await supabase.rpc('get_caliber_suggestions');
  if (error) return [];
  return ((data ?? []) as { caliber: string }[]).map(r => r.caliber);
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

export async function addWear(userId: string, watchId: string, day: string, note?: string | null) {
  const { error } = await supabase.from('wear_logs').insert({ user_id: userId, watch_id: watchId, worn_on: day, note: note || null });
  if (error?.code === '23505') {
    // déjà noté ce jour-là : on complète seulement la note
    if (note) {
      const { error: e2 } = await supabase.from('wear_logs').update({ note }).eq('user_id', userId).eq('watch_id', watchId).eq('worn_on', day);
      fail(e2, "Impossible de noter le port.");
    }
    return;
  }
  fail(error, "Impossible de noter le port.");
}

/* ---------- Wrist Check ---------- */

export async function getMyWearStreak(): Promise<WearStreak | null> {
  const { data, error } = await supabase.rpc('get_my_wear_streak');
  if (error) { console.warn(error.message); return null; } // migration pas encore passée
  return data as WearStreak;
}

export type WristCheckPhoto = { id: string; storage_path: string; worn_on: string; watch_id: string; brand: string; model: string; is_public_gallery: boolean };

/** Derniers wrist shots du membre (photos prises lors d'un Wrist Check), du plus récent au plus ancien. */
export async function listMyWristChecks(userId: string, limit = 24): Promise<WristCheckPhoto[]> {
  const { data, error } = await supabase.from('photos')
    .select('id, storage_path, worn_on, watch_id, is_public_gallery, watches (brand, model)')
    .eq('user_id', userId).eq('photo_type', 'wrist_shot').not('worn_on', 'is', null)
    .order('worn_on', { ascending: false }).order('created_at', { ascending: false }).limit(limit);
  if (error) { console.warn(error.message); return []; }
  type Row = { id: string; storage_path: string; worn_on: string; watch_id: string; is_public_gallery: boolean; watches: { brand: string; model: string } | { brand: string; model: string }[] | null };
  return ((data as unknown as Row[]) ?? []).map(r => {
    const w = Array.isArray(r.watches) ? r.watches[0] : r.watches;
    return { id: r.id, storage_path: r.storage_path, worn_on: r.worn_on, watch_id: r.watch_id, is_public_gallery: r.is_public_gallery, brand: w?.brand ?? '', model: w?.model ?? '' };
  });
}

type Social = { likes: number; liked: boolean; fit_small: number; fit_perfect: number; fit_large: number; my_fit: FitChoice | null };
const toFit = (r: Social): PhotoFit => ({ small: Number(r.fit_small), perfect: Number(r.fit_perfect), large: Number(r.fit_large), mine: r.my_fit });

/** Vote « Au poignet ? » (null : retirer son vote). Renvoie les nouveaux totaux. */
export async function setPhotoFit(photoId: string, fit: FitChoice | null): Promise<{ likes: number; liked: boolean; fit: PhotoFit }> {
  const { data, error } = await supabase.rpc('set_photo_fit', { p_photo: photoId, p_fit: fit });
  fail(error, 'Enregistrement impossible.');
  const r = data as Social;
  return { likes: Number(r.likes), liked: r.liked, fit: toFit(r) };
}

export async function togglePhotoLike(photoId: string): Promise<{ likes: number; liked: boolean; fit: PhotoFit }> {
  const { data, error } = await supabase.rpc('toggle_photo_like', { p_photo: photoId });
  fail(error, 'Enregistrement impossible.');
  const r = data as Social;
  return { likes: Number(r.likes), liked: r.liked, fit: toFit(r) };
}

/** Classement des montres qui « tombent parfaitement » pour une fourchette de tours de poignet. */
export async function getFitRanking(minWrist: number | null, maxWrist: number | null, minVotes = 5): Promise<FitRankingRow[]> {
  const { data, error } = await supabase.rpc('get_fit_ranking', { p_min_wrist: minWrist, p_max_wrist: maxWrist, p_min_votes: minVotes, p_limit: 30 });
  fail(error, 'Chargement impossible.');
  return ((data as FitRankingRow[]) ?? []).map(r => ({ ...r, votes: Number(r.votes), photos: Number(r.photos), perfect_pct: Number(r.perfect_pct), small_pct: Number(r.small_pct), large_pct: Number(r.large_pct) }));
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

export async function listGalleryShots(filters: { brand: string | null; minWrist: number | null; maxWrist: number | null; today?: boolean }): Promise<GalleryShot[]> {
  const { data, error } = await supabase.rpc('get_public_wrist_shots', {
    selected_brand_filter: filters.brand, min_wrist_filter: filters.minWrist, max_wrist_filter: filters.maxWrist,
    page_limit: filters.today ? 24 : 60, p_today: Boolean(filters.today),
  });
  fail(error, 'Chargement de la galerie impossible.');
  type Row = Social & {
    photo_id: string; photo_storage_path: string; watch_id: string; watch_brand: string; watch_model: string;
    user_username: string | null; user_wrist_size_cm: number | null; worn_on: string | null; created_at: string; is_mine: boolean;
  };
  return ((data as Row[]) ?? []).map(r => ({
    id: r.photo_id, url: photoUrl(r.photo_storage_path) ?? '', thumb: photoUrl(thumbPath(r.photo_storage_path)) ?? '',
    watch_id: r.watch_id, brand: r.watch_brand,
    model: r.watch_model, username: r.user_username, wrist_size_cm: r.user_wrist_size_cm,
    worn_on: r.worn_on, created_at: r.created_at, is_mine: Boolean(r.is_mine),
    likes: Number(r.likes ?? 0), liked: Boolean(r.liked), fit: toFit(r),
  })).filter(s => s.url);
}

/* ---------- Marché ---------- */

const SIZE_RANGES: Record<MarketFilters['size'], [number | null, number | null]> = {
  '': [null, null], small: [null, 37.9], medium: [38, 41.9], large: [42, null],
};

export const MARKET_PAGE = 48;

/** Mots d'une recherche, en minuscules, sans accents ni ponctuation. */
export const searchWords = (q: string) =>
  q.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean);
export const containsWords = (text: string, words: string[]) => {
  const h = searchWords(text).join(' ');
  return words.every(w => h.includes(w));
};

export async function searchMarket(f: MarketFilters, offset = 0): Promise<MarketItem[]> {
  const n = (v: string) => { const x = Number(v.replace(',', '.').replace(/\s/g, '')); return v.trim() && Number.isFinite(x) ? x : null; };
  const [minD, maxD] = SIZE_RANGES[f.size];
  // La base cherche une suite exacte de caractères : on lui envoie le mot le plus long,
  // puis on ne garde que les annonces qui contiennent tous les mots (sans accents ni tirets : « yacht master » trouve « Yacht-Master »).
  const words = searchWords(f.query);
  const { data, error } = await supabase.rpc('search_market', {
    p_query: words.length ? [...words].sort((a, b) => b.length - a.length)[0] : null, p_brand: f.brand || null, p_kind: f.kind || null,
    p_min_price: n(f.minPrice), p_max_price: n(f.maxPrice), p_condition: f.condition || null,
    p_box_papers: f.boxPapers || null, p_min_diameter: minD, p_max_diameter: maxD,
    p_sort: f.sort, p_limit: MARKET_PAGE, p_offset: offset,
  });
  fail(error, 'Chargement du marché impossible.');
  return ((data as MarketItem[]) ?? [])
    .filter(r => words.length < 2 || containsWords(`${r.brand} ${r.model} ${r.reference_number ?? ''}`, words))
    .map(r => ({ ...r, sale_price: r.sale_price === null ? null : Number(r.sale_price) }));
}

export async function getMarketFilterOptions(): Promise<MarketFilterOptions> {
  const { data, error } = await supabase.rpc('get_market_filters');
  fail(error, 'Chargement des filtres impossible.');
  return (data as MarketFilterOptions) ?? { brands: [], conditions: [], box_papers: [], count: 0 };
}

/* ---------- Messagerie ---------- */

/** Ouvre ou retrouve la conversation avec le vendeur d'une montre, ou avec un membre au profil public. */
export async function startConversation(target: { watchId?: string; username?: string }): Promise<string> {
  const { data, error } = await supabase.rpc('start_conversation', { p_username: target.username ?? null, p_watch_id: target.watchId ?? null });
  fail(error, 'Impossible d\'ouvrir la conversation.');
  return data as string;
}

export async function listConversations(): Promise<ConversationSummary[]> {
  const { data, error } = await supabase.rpc('get_my_conversations');
  fail(error, 'Chargement des messages impossible.');
  return (data as ConversationSummary[]) ?? [];
}

export async function getConversation(id: string): Promise<ConversationSummary | null> {
  const { data, error } = await supabase.rpc('get_my_conversations', { p_conversation_id: id });
  fail(error, 'Conversation indisponible.');
  return ((data as ConversationSummary[]) ?? [])[0] ?? null;
}

export async function listMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase.from('messages').select('id, conversation_id, sender_id, content, created_at')
    .eq('conversation_id', conversationId).order('created_at', { ascending: false }).limit(300);
  fail(error, 'Chargement des messages impossible.');
  return ((data as Message[]) ?? []).reverse();
}

export async function sendMessage(conversationId: string, content: string): Promise<Message> {
  const { data, error } = await supabase.rpc('send_message', { p_conversation_id: conversationId, p_content: content });
  fail(error, 'Envoi impossible.');
  return data as Message;
}

export async function markConversationRead(conversationId: string) {
  await supabase.rpc('mark_conversation_read', { p_conversation_id: conversationId });
  window.dispatchEvent(new Event(UNREAD_REFRESH));
}

export async function getUnreadCount(): Promise<number> {
  const { data, error } = await supabase.rpc('get_unread_count');
  if (error) return 0;
  return Number(data) || 0;
}

export async function setBlocked(conversationId: string, blocked: boolean) {
  const { error } = await supabase.rpc('set_block', { p_conversation_id: conversationId, p_blocked: blocked });
  fail(error, 'Action impossible.');
}

export async function reportMessage(messageId: string, reason?: string) {
  const { error } = await supabase.rpc('report_message', { p_message_id: messageId, p_reason: reason ?? null });
  fail(error, 'Signalement impossible.');
}

/** Événement interne : demande au compteur de non-lus de se mettre à jour. */
export const UNREAD_REFRESH = 'thebox:unread-refresh';

/** Nouveaux messages en direct. Renvoie la fonction de désabonnement. */
export function subscribeToMessages(onInsert: (m: Message) => void): () => void {
  const channel = supabase
    .channel(`messages-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => onInsert(payload.new as Message))
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

/* ---------- Actualités ---------- */

export interface NewsItem { title?: string; link?: string; isoDate?: string; pubDate?: string; contentSnippet?: string; imageUrl?: string | null; sourceTitle?: string }

export async function fetchNews(feedUrl: string): Promise<NewsItem[]> {
  const { data, error } = await supabase.functions.invoke('rss-feed-parser', { body: { feedUrl } });
  if (error) throw new Error(L("Cette source est indisponible pour le moment."));
  return (data?.items as NewsItem[]) ?? [];
}

/* ---------- Abonnement (Stripe) ---------- */

async function invokeForUrl(fn: 'create-checkout-session' | 'create-portal-session', body: Record<string, string> = {}): Promise<string> {
  const { data, error } = await supabase.functions.invoke(fn, { body });
  if (error) {
    // Le message précis renvoyé par la fonction se trouve dans la réponse.
    const ctx = (error as { context?: Response }).context;
    const detail = ctx && typeof ctx.json === 'function' ? await ctx.json().catch(() => null) : null;
    throw new Error(detail?.error ?? L('Service de paiement indisponible pour le moment.'));
  }
  if (!data?.url) throw new Error(L('Service de paiement indisponible pour le moment.'));
  return data.url as string;
}

/** Envoie vers la page de paiement Stripe, au mois ou à l'année (avec le code d'affilié éventuel). */
/* ---------- Social : abonnements, publications, fil ---------- */

export interface FeedItem {
  kind: 'post' | 'wrist' | 'listing'; id: string; created_at: string; body: string | null; price: number | null;
  photo_path: string | null; author: { id: string; username: string; avatar: string | null };
  watch: { id: string; brand: string; model: string } | null;
  likes: number | null; liked: boolean | null; comments: number | null; mine: boolean;
}
export interface ProfileSocial { user_id: string; bio: string | null; followers: number; following: number; posts: number; i_follow: boolean; follows_me: boolean; is_me: boolean }
export interface PostComment { id: string; body: string; created_at: string; author: { username: string; avatar: string | null }; mine: boolean }
export interface FollowSuggestion { username: string; avatar: string | null; watches: number; followers: number }

export async function getFeed(mode: 'following' | 'all', before?: string | null, userId?: string): Promise<FeedItem[]> {
  const { data, error } = await supabase.rpc('get_feed', { p_mode: mode, p_before: before ?? null, p_limit: 20, p_user: userId ?? null });
  fail(error, 'Fil indisponible.');
  return (data ?? []) as FeedItem[];
}

export async function getProfileSocial(username: string): Promise<ProfileSocial | null> {
  const { data, error } = await supabase.rpc('get_profile_social', { p_username: username });
  if (error) return null; // fonctions sociales pas encore installées
  return (data as ProfileSocial) ?? null;
}

export async function setFollow(userId: string, followeeId: string, follow: boolean) {
  const { error } = follow
    ? await supabase.from('follows').insert({ follower_id: userId, followee_id: followeeId })
    : await supabase.from('follows').delete().eq('follower_id', userId).eq('followee_id', followeeId);
  fail(error, 'Abonnement impossible.');
}

export async function getFollowSuggestions(): Promise<FollowSuggestion[]> {
  const { data, error } = await supabase.rpc('get_follow_suggestions', { p_limit: 8 });
  if (error) return [];
  return (data ?? []) as FollowSuggestion[];
}

export async function followByUsername(userId: string, username: string) {
  const { data } = await supabase.rpc('get_profile_social', { p_username: username });
  const target = (data as ProfileSocial | null)?.user_id;
  if (!target) throw new Error(L('Membre introuvable.'));
  await setFollow(userId, target, true);
}

/** Publication : texte, montre de la collection et photo facultatives. */
export async function createPost(userId: string, body: string, watchId: string | null, file: File | null) {
  let photo_path: string | null = null;
  if (file) {
    const { full, thumb } = await preparePhotoWithThumb(file);
    photo_path = `${userId}/posts/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
    const opt = { contentType: 'image/jpeg', upsert: false };
    const [a, b] = await Promise.all([
      supabase.storage.from(WATCH_BUCKET).upload(photo_path, full, opt),
      supabase.storage.from(WATCH_BUCKET).upload(thumbPath(photo_path), thumb, opt),
    ]);
    fail(a.error ?? b.error, 'Envoi de la photo impossible.');
  }
  const { error } = await supabase.from('posts').insert({ user_id: userId, body: body.trim(), watch_id: watchId, photo_path });
  fail(error, 'Publication impossible.');
}

export async function deletePost(id: string, photoPath: string | null) {
  const { error } = await supabase.from('posts').delete().eq('id', id);
  fail(error, 'Suppression impossible.');
  if (photoPath) await supabase.storage.from(WATCH_BUCKET).remove(withThumbs([photoPath]));
}

export async function togglePostLike(userId: string, postId: string, like: boolean) {
  const { error } = like
    ? await supabase.from('post_likes').insert({ post_id: postId, user_id: userId })
    : await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId);
  fail(error, 'Action impossible.');
}

export async function getPostComments(postId: string): Promise<PostComment[]> {
  const { data, error } = await supabase.rpc('get_post_comments', { p_post: postId });
  fail(error, 'Commentaires indisponibles.');
  return (data ?? []) as PostComment[];
}

export async function addPostComment(userId: string, postId: string, body: string) {
  const { error } = await supabase.from('post_comments').insert({ post_id: postId, user_id: userId, body: body.trim() });
  fail(error, 'Commentaire impossible.');
}

export async function deletePostComment(id: string) {
  const { error } = await supabase.from('post_comments').delete().eq('id', id);
  fail(error, 'Suppression impossible.');
}

/* ---------- Précision (timegrapher) ---------- */

export type MeasurePosition = 'dial_up' | 'dial_down' | 'crown_up' | 'crown_down' | 'crown_left' | 'crown_right' | 'wrist';
export interface AccuracyMeasurement {
  id: string; watch_id: string | null; measured_at: string; rate_s_day: number; beat_error_ms: number | null;
  amplitude_deg: number | null; bph: number | null; position: MeasurePosition | null; source: 'timegrapher' | 'manual';
  quality: number | null; note: string | null;
}
export type AccuracyInput = Omit<AccuracyMeasurement, 'id' | 'measured_at'> & { measured_at?: string };

export async function listAccuracy(userId: string, watchId?: string): Promise<AccuracyMeasurement[]> {
  let q = supabase.from('accuracy_measurements').select('*').eq('user_id', userId).order('measured_at', { ascending: true });
  if (watchId) q = q.eq('watch_id', watchId);
  const { data, error } = await q;
  if (error) return []; // table pas encore installée
  return (data ?? []).map(r => ({ ...r, rate_s_day: Number(r.rate_s_day), beat_error_ms: r.beat_error_ms === null ? null : Number(r.beat_error_ms) })) as AccuracyMeasurement[];
}

export async function addAccuracy(userId: string, input: AccuracyInput) {
  const { error } = await supabase.from('accuracy_measurements').insert({ ...input, user_id: userId });
  fail(error, 'Enregistrement de la mesure impossible.');
}

export async function deleteAccuracy(id: string) {
  const { error } = await supabase.from('accuracy_measurements').delete().eq('id', id);
  fail(error, 'Suppression impossible.');
}

/* ---------- Déclaration de vol ---------- */

export const THEFT_BUCKET = 'theft-proofs';

export interface StolenReport {
  id: string; user_id: string; watch_id: string | null; brand: string; model: string; reference_number: string | null;
  serial_number: string; stolen_on: string; city: string | null; police_report_ref: string | null; description: string | null;
  is_public: boolean; status: 'stolen' | 'recovered'; proofs: { path: string; name: string; kind: string }[];
  created_at: string; recovered_at: string | null;
}
export type StolenReportInput = Pick<StolenReport, 'watch_id' | 'brand' | 'model' | 'reference_number' | 'serial_number' | 'stolen_on' | 'city' | 'police_report_ref' | 'description' | 'is_public'>;

export async function getStolenReport(userId: string, watchId: string): Promise<StolenReport | null> {
  const { data, error } = await supabase.from('stolen_reports').select('*').eq('user_id', userId).eq('watch_id', watchId)
    .order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) return null; // table pas encore installée
  return data as StolenReport | null;
}

export async function createStolenReport(userId: string, input: StolenReportInput): Promise<StolenReport> {
  const { data, error } = await supabase.from('stolen_reports').insert({ ...input, user_id: userId }).select().single();
  fail(error, 'Déclaration impossible.');
  return data as StolenReport;
}

export async function updateStolenReport(id: string, patch: Partial<StolenReport>) {
  const { error } = await supabase.from('stolen_reports').update(patch).eq('id', id);
  fail(error, 'Mise à jour impossible.');
}

/** Justificatif (facture, carte de garantie, plainte) dans le stockage privé du membre. */
export async function uploadTheftProof(userId: string, reportId: string, file: File, kind: string) {
  const safe = file.name.normalize('NFD').replace(/[^\w.-]+/g, '-').slice(-80);
  const path = `${userId}/${reportId}/${Date.now()}-${safe}`;
  const { error } = await supabase.storage.from(THEFT_BUCKET).upload(path, file, { contentType: file.type || undefined });
  fail(error, 'Envoi du justificatif impossible.');
  return { path, name: file.name, kind };
}

/** Lien temporaire (10 minutes) pour ouvrir un justificatif. */
export async function theftProofUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from(THEFT_BUCKET).createSignedUrl(path, 600);
  return data?.signedUrl ?? null;
}

export async function checkStolenSerial(serial: string): Promise<{ stolen: boolean; invalid?: boolean; brand?: string; model?: string; reference_number?: string | null; stolen_on?: string; city?: string | null; owner_username?: string | null }> {
  const { data, error } = await supabase.rpc('check_stolen_serial', { p_serial: serial });
  fail(error, 'Vérification indisponible.');
  return data;
}

export interface StolenWatch { id: string; brand: string; model: string; reference_number: string | null; stolen_on: string; city: string | null; description: string | null; photo_path: string | null; owner_username: string | null }
export async function listStolenWatches(): Promise<StolenWatch[]> {
  const { data, error } = await supabase.rpc('list_stolen_watches', { p_limit: 60 });
  if (error) return [];
  return (data ?? []) as StolenWatch[];
}

/* ---------- Offre membres fondateurs ---------- */

export interface FoundersOffer { limit: number; taken: number; remaining: number; open: boolean; claimed: boolean }

/** Places restantes de l'offre fondateurs (null si la fonction n'est pas encore installée). */
export async function getFoundersOffer(): Promise<FoundersOffer | null> {
  const { data, error } = await supabase.rpc('get_founders_offer');
  if (error) return null;
  return data as FoundersOffer;
}

/** Nombre de montres de la collection (pour proposer Premium quand l'écrin gratuit est plein). */
export async function countMyWatches(userId: string): Promise<number> {
  const { count, error } = await supabase.from('watches').select('id', { count: 'exact', head: true }).eq('user_id', userId);
  if (error) return 0;
  return count ?? 0;
}

export async function startCheckout(interval: 'month' | 'year') {
  const ref = interval === 'year' ? readRef() : null;
  window.location.assign(await invokeForUrl('create-checkout-session', { interval, lang: getLang(), ...(ref ? { ref } : {}) }));
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


/* ---------- Parrainage ---------- */

export type MyReferrals = {
  invited: number; active: number; days_earned: number; rewards_left: number; premium_until: string | null; founder: boolean;
};

/** À appeler une fois après la création du compte : provenance, parrain, statut fondateur, Premium de bienvenue. */
export async function recordSignup(ref: string | null, source: string | null) {
  const { data, error } = await supabase.rpc('record_signup', { p_ref: ref, p_source: source });
  if (error) { console.warn(error.message); return null; }
  return data as { founder: boolean; referrer_kind: string | null; welcome_days: number };
}

/** Chiffres du parrainage du membre connecté, ou null si la migration n'est pas passée. */
export async function getMyReferrals(): Promise<MyReferrals | null> {
  const { data, error } = await supabase.rpc('get_my_referrals');
  if (error) return null;
  return data as MyReferrals;
}

/** Compte un partage (passeport, image du mois, lien), pour le suivi de l'activation. Sans effet en cas d'échec. */
export function trackEvent(event: 'passport_shared' | 'month_shared' | 'link_shared') {
  supabase.rpc('track_event', { p_event: event }).then(() => {}, () => {});
}

/* ---------- Programme d'affiliation ---------- */

export type AffiliateCommission = {
  created_at: string; amount_cents: number; available_at: string; paid_at: string | null;
  status: 'pending' | 'due' | 'paid' | 'cancelled';
};
export type Affiliate = {
  code: string; kind: 'creator' | 'pro'; status: 'pending' | 'active' | 'suspended'; website: string | null; signups: number; payout_holder: string | null; payout_iban_last4: string | null; created_at: string;
  referrals: number; pending_cents: number; due_cents: number; paid_cents: number; commissions: AffiliateCommission[];
};
export type AffiliatePayoutDue = {
  affiliate_id: string; code: string; username: string | null; payout_holder: string | null; payout_iban: string | null;
  due_cents: number; commissions: number;
};

/** Fiche de l'affilié connecté, ou null s'il n'a pas rejoint le programme (ou si la migration n'est pas passée). */
export async function getMyAffiliate(): Promise<Affiliate | null> {
  const { data, error } = await supabase.rpc('get_my_affiliate');
  if (error) { console.warn(error.message); return null; }
  return (data as Affiliate) ?? null;
}

export async function joinAffiliateProgram(code: string, kind: 'creator' | 'pro', website: string): Promise<string> {
  const { data, error } = await supabase.rpc('join_affiliate_program', { p_code: code, p_kind: kind, p_website: website || null });
  fail(error, 'Enregistrement impossible.');
  return data as string;
}

/** `iban` à null : l'IBAN déjà enregistré est conservé. */
export async function updateAffiliatePayout(holder: string, iban: string | null) {
  const { error } = await supabase.rpc('update_affiliate_payout', { p_holder: holder, p_iban: iban });
  fail(error, 'Enregistrement impossible.');
}

/** Administration : affiliés à qui un virement est dû (50 € minimum par défaut). */
export async function getAffiliatePayoutsDue(minCents = 5000): Promise<AffiliatePayoutDue[]> {
  const { data, error } = await supabase.rpc('get_affiliate_payouts_due', { p_min_cents: minCents });
  fail(error, 'Chargement impossible.');
  return (data as AffiliatePayoutDue[]) ?? [];
}

/** Administration : à appeler une fois le virement fait. Renvoie le montant marqué comme versé, en centimes. */
export async function recordAffiliatePayout(affiliateId: string, reference: string): Promise<number> {
  const { data, error } = await supabase.rpc('record_affiliate_payout', { p_affiliate: affiliateId, p_reference: reference });
  fail(error, 'Enregistrement impossible.');
  return Number(data);
}

/* ---------- Backoffice ---------- */

export type AdminWeek = { week: string; signups: number; members: number; activated: number; watches: number; premium_starts: number };
export type AdminMonth = {
  month: string; revenue_cents: number; revenue_excl_tax_cents: number; refunds_cents: number; stripe_fees_cents: number;
  commissions_cents: number; payouts_cents: number; expenses_cents: number;
};
export type AdminExpense = { id: string; spent_on: string; category: ExpenseCategory; label: string; amount_cents: number };
export type ExpenseCategory = 'ads' | 'tools' | 'hosting' | 'design' | 'legal' | 'other';
export type AdminDashboard = {
  generated_at: string;
  founders_open: boolean;
  totals: {
    members: number; members_7d: number; members_30d: number; founders: number; premium_paying: number; premium_offered: number;
    mrr_cents: number; watches: number; watches_value_eur: number; collectors_3plus: number; listings: number;
    wears_30d: number; wearers_30d: number; messages_30d: number;
  };
  rates: {
    activation: number | null; activation_base: number; sharing: number | null; retention: number | null;
    retention_base: number; conversion: number | null;
  };
  weekly: AdminWeek[];
  monthly: AdminMonth[];
  sources: { label: string; n: number; activated: number }[];
  brands: { brand: string; n: number }[];
  expenses: AdminExpense[];
};
export type AdminAffiliate = {
  user_id: string; code: string; kind: 'creator' | 'pro'; status: 'pending' | 'active' | 'suspended'; website: string | null;
  username: string | null; created_at: string; has_iban: boolean; signups: number; activated: number; subscriptions: number;
  pending_cents: number; due_cents: number; paid_cents: number;
};
export type AdminAffiliates = { affiliates: AdminAffiliate[]; top_members: { username: string; invited: number; activated: number }[] };

export async function getAdminDashboard(): Promise<AdminDashboard> {
  const { data, error } = await supabase.rpc('admin_dashboard');
  fail(error, 'Chargement impossible.');
  return data as AdminDashboard;
}

export async function getAdminAffiliates(): Promise<AdminAffiliates> {
  const { data, error } = await supabase.rpc('admin_affiliates');
  fail(error, 'Chargement impossible.');
  return data as AdminAffiliates;
}

export async function adminUpdateAffiliate(userId: string, kind: 'creator' | 'pro', status: 'pending' | 'active' | 'suspended') {
  const { error } = await supabase.rpc('admin_update_affiliate', { p_user: userId, p_kind: kind, p_status: status });
  fail(error, 'Mise à jour impossible.');
}

export async function adminSetFoundersOpen(open: boolean) {
  const { error } = await supabase.rpc('admin_set_founders_open', { p_open: open });
  fail(error, 'Mise à jour impossible.');
}

export async function adminAddExpense(spentOn: string, category: ExpenseCategory, label: string, amountCents: number) {
  const { error } = await supabase.rpc('admin_add_expense', { p_spent_on: spentOn, p_category: category, p_label: label, p_amount_cents: amountCents });
  fail(error, 'Enregistrement impossible.');
}

export async function adminDeleteExpense(id: string) {
  const { error } = await supabase.rpc('admin_delete_expense', { p_id: id });
  fail(error, 'Suppression impossible.');
}

export async function adminGrantPremium(username: string, days: number): Promise<string> {
  const { data, error } = await supabase.rpc('admin_grant_premium', { p_username: username.replace(/^@/, ''), p_days: days });
  fail(error, 'Enregistrement impossible.');
  return data as string;
}

export type AdminWaitlistEntry = {
  id: string; email: string; watch_count: string | null; premium: boolean; source: string | null; created_at: string; is_member: boolean;
};
export type AdminWaitlist = {
  total: number; last_7d: number; last_30d: number; premium: number; members: number;
  by_source: { label: string; n: number }[];
  by_watch_count: { label: string; n: number }[];
  recent: AdminWaitlistEntry[];
};

export async function getAdminWaitlist(): Promise<AdminWaitlist> {
  const { data, error } = await supabase.rpc('admin_waitlist');
  fail(error, 'Chargement impossible.');
  return data as AdminWaitlist;
}

/** Toute la liste d'attente, pour l'export CSV. */
export async function exportAdminWaitlist() {
  const { data, error } = await supabase.rpc('admin_waitlist_export');
  fail(error, 'Chargement impossible.');
  return (data ?? []) as { email: string; watch_count: string | null; interested_in_premium: boolean; source: string | null; created_at: string; is_member: boolean }[];
}

export async function adminDeleteWaitlist(id: string) {
  const { error } = await supabase.rpc('admin_delete_waitlist', { p_id: id });
  fail(error, 'Suppression impossible.');
}

/* ---------- Backoffice : indicateurs et OKR ---------- */

export interface AdminKpis {
  generated_at: string; members: number; paying: number; mrr_cents: number; arr_cents: number;
  arpu_cents: number | null; arppu_cents: number | null; revenue_30d_cents: number; conversion_pct: number | null;
  churn_30d_pct: number | null; ltv_cents: number | null; dau: number; wau: number; mau: number; stickiness_pct: number | null;
  wearers_7d: number; listings: number; listing_conversations_30d: number; watches_30d: number; founders_taken: number;
  activation_pct: number | null; retention_pct: number | null;
}
export type KpiKey = Exclude<keyof AdminKpis, 'generated_at'>;
export interface AdminOkr { id: string; period: string; objective: string; key_result: string; metric: KpiKey; target: number; sort: number }

export async function getAdminKpis(): Promise<AdminKpis | null> {
  const { data, error } = await supabase.rpc('admin_kpis');
  if (error) return null; // fonction pas encore installée
  return data as AdminKpis;
}

export async function listAdminOkrs(): Promise<AdminOkr[]> {
  const { data, error } = await supabase.from('admin_okrs').select('*').order('period', { ascending: false }).order('sort');
  if (error) return [];
  return (data ?? []) as AdminOkr[];
}

export async function saveAdminOkr(okr: Omit<AdminOkr, 'id'> & { id?: string }) {
  const { error } = okr.id
    ? await supabase.from('admin_okrs').update(okr).eq('id', okr.id)
    : await supabase.from('admin_okrs').insert(okr);
  fail(error, 'Enregistrement impossible.');
}

export async function deleteAdminOkr(id: string) {
  const { error } = await supabase.from('admin_okrs').delete().eq('id', id);
  fail(error, 'Suppression impossible.');
}

export async function adminSetFoundersOfferOpen(open: boolean) {
  const { error } = await supabase.rpc('admin_set_founders_offer_open', { p_open: open });
  fail(error, 'Réglage impossible.');
}

/* ---------- Backoffice : marques ---------- */

export type AdminBrandReview = {
  official: string[];
  /** Marques saisies hors de la liste officielle */
  unknown: { name: string; watches: number; wishlist: number; members: number }[];
};

export async function getAdminBrandReview(): Promise<AdminBrandReview> {
  const { data, error } = await supabase.rpc('admin_brand_review');
  fail(error, 'Marques indisponibles.');
  return data as AdminBrandReview;
}

export async function adminAddBrand(name: string) {
  const { error } = await supabase.rpc('admin_add_brand', { p_name: name });
  fail(error, 'Ajout impossible.');
}

/** Renomme une écriture dans toutes les montres et wishlists ; renvoie le nombre de lignes modifiées. */
export async function adminMergeBrand(from: string, to: string): Promise<number> {
  const { data, error } = await supabase.rpc('admin_merge_brand', { p_from: from, p_to: to });
  fail(error, 'Fusion impossible.');
  return (data as number) ?? 0;
}

export type AdminMember = {
  id: string; email: string; username: string | null; created_at: string; last_sign_in_at: string | null; confirmed: boolean;
  source: string | null; referrer_kind: 'member' | 'creator' | 'pro' | null; referrer: string | null; founder: boolean;
  watches: number; plan: 'paying' | 'offered' | 'admin' | 'free';
};

/** Derniers comptes créés (100 par défaut), avec recherche par e-mail, pseudo ou provenance. */
export async function getAdminMembers(search = '', limit = 100): Promise<AdminMember[]> {
  const { data, error } = await supabase.rpc('admin_members', { p_search: search || null, p_limit: limit });
  fail(error, 'Chargement impossible.');
  return (data as AdminMember[]) ?? [];
}

/* ---------- Suppression du compte ---------- */

/**
 * Supprime définitivement le compte : d'abord les photos (fichiers), puis toutes les données et le compte
 * de connexion (fonction delete_my_account). La session est fermée à la fin.
 */
export async function deleteMyAccount(userId: string) {
  // Les refus (abonnement actif…) sont vérifiés par la base ; on les teste avant d'effacer les fichiers.
  const { data: sub } = await supabase.from('subscriptions').select('status, cancel_at_period_end').eq('user_id', userId).maybeSingle();
  if (sub && ['active', 'trialing', 'past_due'].includes(sub.status) && !sub.cancel_at_period_end) {
    fail({ message: 'ACTIVE_SUBSCRIPTION' }, 'Suppression impossible.');
  }
  const { data: photos } = await supabase.from('photos').select('storage_path').eq('user_id', userId);
  const paths = withThumbs((photos ?? []).map(p => p.storage_path as string).filter(Boolean));
  for (let i = 0; i < paths.length; i += 100) await supabase.storage.from(WATCH_BUCKET).remove(paths.slice(i, i + 100));
  const { data: avatars } = await supabase.storage.from('avatars').list(userId, { limit: 100 });
  if (avatars?.length) await supabase.storage.from('avatars').remove(avatars.map(f => `${userId}/${f.name}`));

  const { error } = await supabase.rpc('delete_my_account');
  fail(error, 'Suppression impossible.');
  await supabase.auth.signOut();
}
