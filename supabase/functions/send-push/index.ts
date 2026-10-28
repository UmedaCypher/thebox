// supabase/functions/send-push/index.ts
//
// Envoie les notifications en attente dans la table `notifications`.
// Appelée par la base (pg_net) dès qu'une notification entre dans la file, et toutes les 10 minutes
// par une tâche de rattrapage. Ni l'app ni le public ne l'appellent.
//
// Sécurité : la vérification du jeton Supabase est DÉSACTIVÉE (verify_jwt = false) ;
// l'appel doit porter l'en-tête `x-push-secret`, égal au secret PUSH_SECRET.
//
// Secrets : PUSH_SECRET, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:contact@…), SITE_URL.
// SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont fournis automatiquement par Supabase.
//
// Appli Android / iOS (Capacitor) : les appareils de type « fcm » / « apns » seront envoyés ici aussi
// quand les apps natives existeront ; en attendant, ils sont ignorés.

import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2.49.4';

const env = (k: string) => {
  const v = Deno.env.get(k);
  if (!v) throw new Error(`Secret manquant : ${k}`);
  return v;
};

const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));
webpush.setVapidDetails(env('VAPID_SUBJECT'), env('VAPID_PUBLIC_KEY'), env('VAPID_PRIVATE_KEY'));
const SITE = env('SITE_URL').replace(/\/$/, '');

type Lang = 'fr' | 'en';
type Row = { id: number; user_id: string; kind: string; data: Record<string, unknown> };
type Msg = { title: string; body: string; url: string; tag: string };

const MONTHS: Record<Lang, string[]> = {
  fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};
const euros = (n: unknown, lang: Lang) =>
  new Intl.NumberFormat(lang === 'en' ? 'en-GB' : 'fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Number(n));
const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

/** Le texte de chaque notification, en français ou en anglais selon la langue de l'appareil. */
function compose(row: Row, lang: Lang): Msg | null {
  const d = row.data ?? {};
  const watch = `${d.brand ?? ''} ${d.model ?? ''}`.trim();
  const en = lang === 'en';
  switch (row.kind) {
    case 'message':
      return {
        title: d.sender ? `@${d.sender}` : (en ? 'New message' : 'Nouveau message'),
        body: String(d.excerpt ?? ''),
        url: `/messages/${d.conversation_id}`,
        tag: `conv-${d.conversation_id}`,
      };
    case 'daily':
      return {
        title: en ? 'Which watch today?' : "Quelle montre aujourd'hui ?",
        body: en ? 'Log the watch on your wrist in one tap.' : 'Notez la montre du jour en un geste.',
        url: '/portage',
        tag: 'daily',
      };
    case 'maintenance':
      return d.today
        ? { title: en ? 'Service due today' : 'Entretien prévu aujourd\'hui',
            body: en ? `${watch}: today is its service date.` : `${watch} : c'est le jour de sa révision.`,
            url: `/montre/${d.watch_id}?onglet=entretien`, tag: `maintenance-${d.watch_id}` }
        : { title: en ? 'Service in 7 days' : 'Entretien dans 7 jours',
            body: en ? `${watch}: time to book an appointment.` : `${watch} : pensez à prendre rendez-vous.`,
            url: `/montre/${d.watch_id}?onglet=entretien`, tag: `maintenance-${d.watch_id}` };
    case 'recap': {
      const [y, m] = String(d.month ?? '').split('-').map(Number);
      const month = MONTHS[lang][(m || 1) - 1];
      const days = Number(d.days ?? 0), watches = Number(d.watches ?? 0);
      return {
        title: en ? `Your ${month} on the wrist` : `Votre mois de ${month} au poignet`,
        body: en
          ? `${plural(days, 'day', 'days')} logged, ${plural(watches, 'watch', 'watches')}. See your month.`
          : `${plural(days, 'jour noté', 'jours notés')}, ${plural(watches, 'montre', 'montres')}. Voir le bilan du mois.`,
        url: `/portage?mois=${y}-${String(m).padStart(2, '0')}`,
        tag: `recap-${d.month}`,
      };
    }
    case 'wishlist':
      return {
        title: en ? `On the Market: ${watch}` : `Sur le Marché : ${watch}`,
        body: d.exchange
          ? (en ? 'Offered for exchange. It is on your wishlist.' : 'Proposée à l\'échange. Elle figure dans votre wishlist.')
          : d.price != null
            ? (en ? `For sale at ${euros(d.price, lang)}. It is on your wishlist.` : `À vendre ${euros(d.price, lang)}. Elle figure dans votre wishlist.`)
            : (en ? 'For sale. It is on your wishlist.' : 'À vendre. Elle figure dans votre wishlist.'),
        url: `/passeport/${d.watch_id}`,
        tag: `wishlist-${d.watch_id}`,
      };
    default:
      return null;
  }
}

Deno.serve(async req => {
  if (req.method !== 'POST') return new Response('Méthode non autorisée', { status: 405 });
  if (req.headers.get('x-push-secret') !== env('PUSH_SECRET')) return new Response('Accès refusé', { status: 401 });

  const { data: rows, error } = await admin.rpc('claim_notifications', { p_limit: 200 });
  if (error) return new Response(error.message, { status: 500 });
  const batch = (rows ?? []) as Row[];
  if (!batch.length) return Response.json({ sent: 0 });

  const userIds = [...new Set(batch.map(r => r.user_id))];
  const { data: subs } = await admin
    .from('push_subscriptions')
    .select('id, user_id, kind, endpoint, p256dh, auth, lang')
    .in('user_id', userIds)
    .eq('kind', 'web');
  const byUser = new Map<string, typeof subs>();
  for (const s of subs ?? []) byUser.set(s.user_id, [...(byUser.get(s.user_id) ?? []), s]);

  let sent = 0;
  const gone: string[] = [];
  const used: string[] = [];
  for (const row of batch) {
    const targets = byUser.get(row.user_id) ?? [];
    let ok = false;
    let lastError: string | null = targets.length ? null : 'aucun appareil';
    for (const s of targets) {
      const msg = compose(row, s.lang === 'en' ? 'en' : 'fr');
      if (!msg) { lastError = `type inconnu : ${row.kind}`; break; }
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh ?? '', auth: s.auth ?? '' } },
          JSON.stringify({ ...msg, url: `${SITE}${msg.url}` }),
          { TTL: row.kind === 'message' ? 60 * 60 * 24 : 60 * 60 * 6, urgency: row.kind === 'message' ? 'high' : 'normal', topic: msg.tag.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32) },
        );
        ok = true;
        used.push(s.id);
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        // 404 / 410 : l'abonnement n'existe plus (application désinstallée, permission retirée)
        if (code === 404 || code === 410) gone.push(s.id);
        else lastError = `${code ?? ''} ${(e as Error).message}`.trim().slice(0, 300);
      }
    }
    // Sans appareil valide, on considère la notification traitée : rien à réessayer.
    const done = ok || lastError === 'aucun appareil' || targets.every(t => gone.includes(t.id));
    await admin.from('notifications')
      .update(done ? { sent_at: new Date().toISOString(), error: ok ? null : lastError } : { error: lastError })
      .eq('id', row.id);
    if (ok) sent++;
  }

  if (gone.length) await admin.from('push_subscriptions').delete().in('id', gone);
  if (used.length) await admin.from('push_subscriptions').update({ last_used_at: new Date().toISOString() }).in('id', [...new Set(used)]);
  return Response.json({ sent, claimed: batch.length, removed: gone.length });
});
