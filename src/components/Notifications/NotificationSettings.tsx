import { useEffect, useState } from 'react';
import { BellRing } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Notice, PremiumTag, SelectField, Toggle } from '../ui';
import { defineStrings, useStrings } from '../../i18n';
import { useToast } from '../Toast/Toast';
import {
  DEFAULT_PREFS, disablePush, enablePush, getNotificationPrefs, getPushState, saveNotificationPrefs,
  type NotificationPrefs, type PushState,
} from '../../lib/push';
import s from './Notifications.module.css';

export const NOTIF = defineStrings({
  title: 'Notifications',
  lead: 'Recevez sur cet appareil ce qui compte, rien de plus.',
  enable: 'Activer sur cet appareil',
  disable: 'Désactiver sur cet appareil',
  enabled: 'Notifications activées sur cet appareil.',
  disabledToast: 'Notifications désactivées sur cet appareil.',
  error: "Activation impossible. Réessayez dans un instant.",
  unconfigured: 'Les notifications seront bientôt disponibles.',
  unsupported: "Ce navigateur ne reçoit pas les notifications. Essayez Chrome, Edge, Firefox ou Safari récent.",
  iosInstall: "Sur iPhone, ajoutez d'abord l'app à l'écran d'accueil (bouton Partager, puis « Sur l'écran d'accueil »), ouvrez-la depuis l'icône, puis revenez ici.",
  denied: "Les notifications sont bloquées pour ce site. Autorisez-les dans les réglages du navigateur, puis revenez ici.",
  messages: 'Nouveaux messages',
  messagesHint: 'Quand un membre vous écrit.',
  daily: 'Rappel du jour',
  dailyHint: "« Quelle montre aujourd'hui ? », seulement si vous n'avez encore rien noté.",
  hour: 'Heure du rappel',
  hourLabel: (h: number) => `${h} h`,
  maintenance: 'Entretien à prévoir',
  maintenanceHint: '7 jours avant la date prévue, et le jour même.',
  recap: 'Bilan du mois',
  recapHint: 'Le 1er du mois : jours notés, montres portées, image du mois.',
  wishlist: 'Wishlist sur le Marché',
  wishlistHint: 'Quand une montre de votre wishlist est mise en vente ou à l’échange.',
  saved: 'Préférences enregistrées.',
}, {
  title: 'Notifications',
  lead: 'Get what matters on this device, nothing more.',
  enable: 'Turn on for this device',
  disable: 'Turn off for this device',
  enabled: 'Notifications turned on for this device.',
  disabledToast: 'Notifications turned off for this device.',
  error: 'Could not turn them on. Try again in a moment.',
  unconfigured: 'Notifications are coming soon.',
  unsupported: 'This browser cannot receive notifications. Try Chrome, Edge, Firefox or a recent Safari.',
  iosInstall: 'On iPhone, first add the app to your Home Screen (Share button, then “Add to Home Screen”), open it from the icon, then come back here.',
  denied: 'Notifications are blocked for this site. Allow them in your browser settings, then come back here.',
  messages: 'New messages',
  messagesHint: 'When a member writes to you.',
  daily: 'Daily reminder',
  dailyHint: '“Which watch today?”, only if you have not logged one yet.',
  hour: 'Reminder time',
  hourLabel: h => `${h}:00`,
  maintenance: 'Service due',
  maintenanceHint: '7 days before the planned date, and on the day.',
  recap: 'Monthly summary',
  recapHint: 'On the 1st: days logged, watches worn, picture of the month.',
  wishlist: 'Wishlist on the Market',
  wishlistHint: 'When a watch from your wishlist is listed for sale or exchange.',
  saved: 'Preferences saved.',
});

const HOURS = Array.from({ length: 18 }, (_, i) => i + 5); // 5 h à 22 h

/** Section « Notifications » de la page Profil : activer cet appareil et choisir quoi recevoir. */
export default function NotificationSettings() {
  const t = useStrings(NOTIF);
  const toast = useToast();
  const { user, isPremium } = useAuth();
  const [state, setState] = useState<PushState | null>(null);
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [busy, setBusy] = useState(false);

  const uid = user?.id;
  useEffect(() => {
    getPushState().then(setState).catch(() => setState('unsupported'));
    if (uid) getNotificationPrefs(uid).then(setPrefs).catch(() => {});
  }, [uid]);

  const toggleDevice = async () => {
    setBusy(true);
    try {
      const next = state === 'on' ? await disablePush() : await enablePush();
      setState(next);
      if (next === 'on') toast(t.enabled);
      else if (state === 'on') toast(t.disabledToast);
    } catch {
      toast(t.error);
    } finally {
      setBusy(false);
    }
  };

  const update = async (patch: Partial<NotificationPrefs>) => {
    if (!user) return;
    const next = { ...prefs, ...patch };
    setPrefs(next);
    try { await saveNotificationPrefs(user.id, next); toast(t.saved); } catch { toast(t.error); }
  };

  if (state === null) return null;
  const blocked = state === 'unconfigured' || state === 'unsupported' || state === 'ios-install' || state === 'denied';

  return (
    <div className={s.settings}>
      <p className={s.lead}>{t.lead}</p>
      {blocked ? (
        <Notice>{state === 'unconfigured' ? t.unconfigured : state === 'ios-install' ? t.iosInstall : state === 'denied' ? t.denied : t.unsupported}</Notice>
      ) : (
        <div>
          <Button variant={state === 'on' ? 'ghost' : 'primary'} onClick={toggleDevice} disabled={busy}>
            {state !== 'on' && <BellRing size={16} strokeWidth={2} aria-hidden="true" />}
            {state === 'on' ? t.disable : t.enable}
          </Button>
        </div>
      )}

      {state === 'on' && (
        <div className={s.prefs}>
          <Toggle label={t.messages} description={t.messagesHint} checked={prefs.messages} onChange={v => update({ messages: v })} />
          <Toggle label={t.daily} description={t.dailyHint} checked={prefs.daily_reminder} onChange={v => update({ daily_reminder: v })} />
          {prefs.daily_reminder && (
            <SelectField label={t.hour} value={String(prefs.reminder_hour)} placeholder={t.hourLabel(prefs.reminder_hour)}
              onChange={e => e.target.value && update({ reminder_hour: Number(e.target.value) })}
              options={HOURS.map(h => ({ value: String(h), label: t.hourLabel(h) }))} className={s.hour} />
          )}
          <Toggle label={t.recap} description={t.recapHint} checked={prefs.monthly_recap} onChange={v => update({ monthly_recap: v })} />
          <Toggle label={t.maintenance} description={<>{t.maintenanceHint} {!isPremium && <PremiumTag />}</>}
            checked={prefs.maintenance && isPremium} disabled={!isPremium} onChange={v => update({ maintenance: v })} />
          <Toggle label={t.wishlist} description={<>{t.wishlistHint} {!isPremium && <PremiumTag />}</>}
            checked={prefs.wishlist && isPremium} disabled={!isPremium} onChange={v => update({ wishlist: v })} />
        </div>
      )}
    </div>
  );
}
