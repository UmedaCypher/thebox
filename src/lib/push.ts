import { supabase } from './supabaseClient';
import { getLang } from '../i18n';

/** Clé publique VAPID (la clé privée reste dans les secrets de la fonction send-push). */
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

export type PushState =
  | 'unconfigured'  // clé VAPID absente : fonction pas encore activée
  | 'unsupported'   // navigateur sans notifications push
  | 'ios-install'   // iPhone / iPad : il faut d'abord ajouter l'app à l'écran d'accueil
  | 'denied'        // l'utilisateur a refusé dans le navigateur
  | 'off'           // possible, pas encore activé sur cet appareil
  | 'on';           // activé sur cet appareil

const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

async function registration() {
  if (!('serviceWorker' in navigator)) return null;
  return (await navigator.serviceWorker.getRegistration()) ?? null;
}

export async function getPushState(): Promise<PushState> {
  if (!VAPID_PUBLIC_KEY) return 'unconfigured';
  const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  if (!supported) return isIos() && !isStandalone() ? 'ios-install' : 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  const reg = await registration();
  const sub = await reg?.pushManager.getSubscription();
  return sub && Notification.permission === 'granted' ? 'on' : 'off';
}

function keyToBytes(base64: string) {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}

/** Demande la permission, abonne cet appareil et l'enregistre pour le membre connecté. */
export async function enablePush(): Promise<PushState> {
  if (!VAPID_PUBLIC_KEY) return 'unconfigured';
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return permission === 'denied' ? 'denied' : 'off';
  const reg = (await registration()) ?? (await navigator.serviceWorker.ready);
  const sub = (await reg.pushManager.getSubscription())
    ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(VAPID_PUBLIC_KEY) }));
  const json = sub.toJSON();
  const { error } = await supabase.rpc('register_push_subscription', {
    p_kind: 'web',
    p_endpoint: sub.endpoint,
    p_p256dh: json.keys?.p256dh ?? null,
    p_auth: json.keys?.auth ?? null,
    p_user_agent: navigator.userAgent.slice(0, 300),
    p_lang: getLang(),
  });
  if (error) throw error;
  // Le rappel du jour part à l'heure locale du membre : on retient son fuseau horaire.
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const { data: auth } = await supabase.auth.getUser();
  if (tz && auth.user) await supabase.from('profiles').update({ time_zone: tz }).eq('id', auth.user.id);
  return 'on';
}

/** Désabonne cet appareil (les autres appareils du membre continuent de recevoir). */
export async function disablePush(): Promise<PushState> {
  const reg = await registration();
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
    await sub.unsubscribe();
  }
  return 'off';
}

/** Met à jour la langue des notifications de cet appareil quand le membre change de langue. */
export async function syncPushLanguage() {
  const reg = await registration();
  const sub = await reg?.pushManager.getSubscription();
  if (sub) await supabase.from('push_subscriptions').update({ lang: getLang() }).eq('endpoint', sub.endpoint);
}

export interface NotificationPrefs {
  messages: boolean;
  daily_reminder: boolean;
  reminder_hour: number;
  maintenance: boolean;
  monthly_recap: boolean;
  wishlist: boolean;
}
export const DEFAULT_PREFS: NotificationPrefs = {
  messages: true, daily_reminder: false, reminder_hour: 9, maintenance: true, monthly_recap: true, wishlist: true,
};

export async function getNotificationPrefs(userId: string): Promise<NotificationPrefs> {
  const { data } = await supabase.from('notification_prefs')
    .select('messages, daily_reminder, reminder_hour, maintenance, monthly_recap, wishlist')
    .eq('user_id', userId).maybeSingle();
  return { ...DEFAULT_PREFS, ...(data ?? {}) };
}

export async function saveNotificationPrefs(userId: string, prefs: NotificationPrefs) {
  const { error } = await supabase.from('notification_prefs')
    .upsert({ user_id: userId, ...prefs, updated_at: new Date().toISOString() });
  if (error) throw error;
}
