import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { getSubscription, openBillingPortal, saveProfile, uploadAvatar } from '../../lib/api';
import { useLoad } from '../../hooks/useLoad';
import { supabase } from '../../lib/supabaseClient';
import { FREE_WATCH_LIMIT, PAYMENTS_ENABLED } from '../../lib/features';
import { formatDate } from '../../lib/format';
import { Button, LinkButton, Notice, PageHeader, PremiumTag, Segmented, TextField, Toggle } from '../../components/ui';
import { useLanguageSetting } from '../../i18n/useLanguageSetting';
import { defineStrings, tr, useStrings } from '../../i18n';
import type { LangChoice } from '../../i18n';
import { COMMON } from '../../i18n/common';
import { formatDecimal } from '../../lib/format';
import { useToast } from '../../components/Toast/Toast';
import NotificationSettings, { NOTIF } from '../../components/Notifications/NotificationSettings';
import s from './AccountPage.module.css';

const S = defineStrings({
  unavailable: 'Indisponible.',
  usernameInvalid: 'Le pseudo doit faire 3 à 30 caractères : lettres, chiffres, point ou tiret bas.',
  wristInvalid: 'Le tour de poignet doit être compris entre 12 et 26 cm.',
  usernameForPublic: 'Choisissez un pseudo pour rendre votre profil public.',
  saved: 'Profil enregistré.',
  saveError: 'Enregistrement impossible.',
  avatarError: 'Envoi de l\'avatar impossible.',
  emailSent: (email: string) => `Un lien de confirmation a été envoyé à ${email} et à votre adresse actuelle.`,
  passwordSent: (email: string) => `Un lien pour choisir un nouveau mot de passe a été envoyé à ${email}.`,
  changePhoto: 'Changer la photo de profil',
  freePlan: 'Collection gratuite',
  viewPublic: 'Voir mon profil public',
  info: 'Informations',
  helpInfo: 'Aide et informations',
  username: 'Pseudo',
  usernameHint: 'Votre adresse publique : /profil/pseudo',
  name: 'Nom',
  nameHint: 'Jamais affiché publiquement.',
  wrist: 'Tour de poignet',
  wristHint: 'Il accompagne vos photos dans la galerie pour aider les autres à se projeter.',
  publicLabel: 'Profil public',
  publicHint: 'Votre pseudo et les photos de vos montres deviennent visibles. Les prix, valeurs et lieux d\'achat restent toujours privés.',
  messagesLabel: 'Accepter les messages',
  messagesHint: 'Les membres peuvent vous écrire depuis vos annonces et votre profil public. Les conversations déjà ouvertes restent actives ; pour en couper une, bloquez le membre.',
  plan: 'Offre',
  cancelled: (date: string) => `Abonnement résilié : Premium reste actif jusqu'au ${date}.`,
  pastDue: 'Le dernier paiement a échoué. Mettez à jour votre carte pour garder Premium.',
  renews: (date: string) => `Abonnement Premium, prochain renouvellement le ${date}.`,
  opening: 'Ouverture…',
  manage: 'Gérer mon abonnement',
  stats: 'Statistiques de portage',
  wishlist: 'Wishlist',
  insurance: 'Inventaire pour l\'assurance',
  freeText: (n: number) => `La collection gratuite accueille ${n} montres, avec la galerie, le calendrier de portage et le passeport.`,
  discoverPremium: 'Découvrir Premium',
  appearance: 'Apparence',
  theme: 'Thème',
  themeDark: 'Écrin (sombre)',
  themeLight: 'Soie (clair)',
  language: 'Langue',
  autoHint: '« Automatique » suit la langue de votre téléphone ou de votre ordinateur.',
  account: 'Compte',
  signedInAs: (email: string) => `Connecté avec ${email}`,
  memberSince: (date: string) => `, membre depuis le ${date}`,
  newEmail: 'Nouvelle adresse e-mail',
  change: 'Changer',
  changePassword: 'Changer de mot de passe',
  signOut: 'Se déconnecter',
  deleteBefore: 'Pour supprimer votre compte et toutes vos données, ',
  deleteLink: 'écrivez-nous',
  deleteAfter: '. Nous le faisons sous 7 jours.',
  news: 'Actualités horlogères',
  faq: 'Questions fréquentes',
  about: 'À propos',
  press: 'Presse',
  contact: 'Contact',
  terms: 'CGU',
  sales: 'CGV',
  privacy: 'Confidentialité',
  legal: 'Mentions légales',
}, {
  unavailable: 'Unavailable.',
  usernameInvalid: 'Your username must be 3 to 30 characters: letters, numbers, dot or underscore.',
  wristInvalid: 'Wrist size must be between 12 and 26 cm.',
  usernameForPublic: 'Choose a username to make your profile public.',
  saved: 'Profile saved.',
  saveError: 'We couldn’t save your profile.',
  avatarError: 'We couldn’t upload your photo.',
  emailSent: email => `A confirmation link has been sent to ${email} and to your current address.`,
  passwordSent: email => `A link to choose a new password has been sent to ${email}.`,
  changePhoto: 'Change profile photo',
  freePlan: 'Free collection',
  viewPublic: 'View my public profile',
  info: 'Details',
  helpInfo: 'Help and information',
  username: 'Username',
  usernameHint: 'Your public address: /profil/username',
  name: 'Name',
  nameHint: 'Never shown publicly.',
  wrist: 'Wrist size',
  wristHint: 'It appears with your photos in the gallery to help others picture the watch.',
  publicLabel: 'Public profile',
  publicHint: 'Your username and watch photos become visible. Prices, values and places of purchase always stay private.',
  messagesLabel: 'Accept messages',
  messagesHint: 'Members can write to you from your listings and your public profile. Conversations already open stay active. To end one, block the member.',
  plan: 'Plan',
  cancelled: date => `Subscription cancelled. Premium stays active until ${date}.`,
  pastDue: 'Your last payment failed. Update your card to keep Premium.',
  renews: date => `Premium subscription, next renewal on ${date}.`,
  opening: 'Opening…',
  manage: 'Manage my subscription',
  stats: 'Wear statistics',
  wishlist: 'Wishlist',
  insurance: 'Insurance inventory',
  freeText: n => `The free collection holds ${n} watches, with the gallery, the wear calendar and the passport.`,
  discoverPremium: 'Discover Premium',
  appearance: 'Appearance',
  theme: 'Theme',
  themeDark: 'Écrin (dark)',
  themeLight: 'Soie (light)',
  language: 'Language',
  autoHint: '“Automatic” follows the language of your phone or computer.',
  account: 'Account',
  signedInAs: email => `Signed in as ${email}`,
  memberSince: date => `, member since ${date}`,
  newEmail: 'New email address',
  change: 'Change',
  changePassword: 'Change password',
  signOut: 'Sign out',
  deleteBefore: 'To delete your account and all your data, ',
  deleteLink: 'write to us',
  deleteAfter: '. We do it within 7 days.',
  news: 'Watch news',
  faq: 'FAQ',
  about: 'About',
  press: 'Press',
  contact: 'Contact',
  terms: 'Terms of use',
  sales: 'Terms of sale',
  privacy: 'Privacy',
  legal: 'Legal notice',
});

export default function AccountPage() {
  const t = useStrings(S);
  const n = useStrings(NOTIF);
  const c = useStrings(COMMON);
  const toast = useToast();
  const { user, profile, isPremium, refreshProfile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const language = useLanguageSetting();
  const navigate = useNavigate();
  const uid = user!.id;

  const [f, setF] = useState({ username: '', full_name: '', wrist: '', is_public: false, messages: true });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [accountMsg, setAccountMsg] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const sub = useLoad(() => getSubscription(uid), [uid], PAYMENTS_ENABLED);
  const [portalBusy, setPortalBusy] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  const manage = async () => {
    setPortalBusy(true); setPortalError(null);
    try { await openBillingPortal(); } catch (e) { setPortalError(e instanceof Error ? e.message : tr(S).unavailable); setPortalBusy(false); }
  };

  useEffect(() => {
    setF({
      username: profile?.username ?? '',
      full_name: profile?.full_name ?? '',
      wrist: profile?.wrist_size_cm ? formatDecimal(profile.wrist_size_cm) : '',
      is_public: Boolean(profile?.is_public),
      messages: profile?.allow_private_messages !== false,
    });
  }, [profile]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const username = f.username.trim();
    if (username && !/^[a-z0-9._]{3,30}$/i.test(username)) {
      setMsg({ tone: 'error', text: t.usernameInvalid });
      return;
    }
    const wrist = f.wrist.trim() ? Number(f.wrist.replace(',', '.')) : null;
    if (wrist !== null && (!Number.isFinite(wrist) || wrist < 12 || wrist > 26)) {
      setMsg({ tone: 'error', text: t.wristInvalid });
      return;
    }
    if (f.is_public && !username) {
      setMsg({ tone: 'error', text: t.usernameForPublic });
      return;
    }
    setSaving(true);
    try {
      await saveProfile(uid, { username: username || null, full_name: f.full_name.trim() || null, wrist_size_cm: wrist, is_public: f.is_public, allow_private_messages: f.messages }, Boolean(profile));
      await refreshProfile();
      setMsg(null);
      toast(c.toast.profileSaved);
    } catch (x) {
      setMsg({ tone: 'error', text: x instanceof Error ? x.message : t.saveError });
    } finally { setSaving(false); }
  };

  const onAvatar = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAvatarBusy(true);
    try {
      const url = await uploadAvatar(uid, file);
      await saveProfile(uid, { profile_picture_url: url }, Boolean(profile));
      await refreshProfile();
    } catch (x) {
      setMsg({ tone: 'error', text: x instanceof Error ? x.message : t.avatarError });
    } finally { setAvatarBusy(false); }
  };

  const changeEmail = async () => {
    setAccountMsg(null);
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    if (error) setAccountMsg({ tone: 'error', text: error.message });
    else { setAccountMsg({ tone: 'ok', text: t.emailSent(newEmail.trim()) }); setNewEmail(''); }
  };

  const resetPassword = async () => {
    setAccountMsg(null);
    const { error } = await supabase.auth.resetPasswordForEmail(user!.email!, { redirectTo: `${window.location.origin}/nouveau-mot-de-passe` });
    if (error) setAccountMsg({ tone: 'error', text: error.message });
    else setAccountMsg({ tone: 'ok', text: t.passwordSent(user!.email!) });
  };

  const logout = async () => { await signOut(); navigate('/', { replace: true }); };

  const initial = (profile?.username || user?.email || '?').charAt(0).toUpperCase();

  return (
    <div className="page page--narrow">
      <PageHeader title={c.tabs.profile} />

      <section className={s.identity}>
        <label className={s.avatar} aria-label={t.changePhoto}>
          {profile?.profile_picture_url ? <img src={profile.profile_picture_url} alt="" /> : <span>{initial}</span>}
          <span className={s.avatarEdit}><Camera size={16} strokeWidth={1.8} aria-hidden="true" /></span>
          <input type="file" accept="image/*" className="visually-hidden" onChange={onAvatar} disabled={avatarBusy} />
        </label>
        <div className={s.identityText}>
          <strong className={s.name}>{profile?.username ? `@${profile.username}` : user?.email}</strong>
          <span className={s.plan}>{isPremium ? <PremiumTag /> : t.freePlan}</span>
          {profile?.is_public && profile.username && <Link to={`/profil/${profile.username}`} className={s.link}>{t.viewPublic}</Link>}
        </div>
      </section>

      <form onSubmit={save} className={s.section}>
        <h2 className={s.h}>{t.info}</h2>
        {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
        <TextField label={t.username} value={f.username} onChange={e => setF({ ...f, username: e.target.value })} hint={t.usernameHint} autoCapitalize="none" autoComplete="username" />
        <TextField label={t.name} optional value={f.full_name} onChange={e => setF({ ...f, full_name: e.target.value })} hint={t.nameHint} autoComplete="name" />
        <TextField label={t.wrist} optional inputMode="decimal" suffix="cm" value={f.wrist} onChange={e => setF({ ...f, wrist: e.target.value })} hint={t.wristHint} />
        <Toggle
          label={t.publicLabel}
          description={t.publicHint}
          checked={f.is_public}
          onChange={v => setF({ ...f, is_public: v })}
        />
        <Toggle
          label={t.messagesLabel}
          description={t.messagesHint}
          checked={f.messages}
          onChange={v => setF({ ...f, messages: v })}
        />
        <div><Button type="submit" disabled={saving}>{saving ? c.saving : c.save}</Button></div>
      </form>

      <section className={`panel ${s.section}`} data-tone="brass">
        <h2 className={s.h}>{t.plan}</h2>
        {isPremium && sub.data && (
          <p className={s.muted}>
            {sub.data.cancel_at_period_end
              ? t.cancelled(formatDate(sub.data.current_period_end))
              : sub.data.status === 'past_due'
                ? t.pastDue
                : t.renews(formatDate(sub.data.current_period_end))}
          </p>
        )}
        {portalError && <Notice tone="error">{portalError}</Notice>}
        {isPremium && sub.data && (
          <div><Button variant="secondary" onClick={manage} disabled={portalBusy}>{portalBusy ? t.opening : t.manage}</Button></div>
        )}
        {isPremium ? (
          <ul className={s.links}>
            <li><Link to="/stats">{t.stats}</Link></li>
            <li><Link to="/wishlist">{t.wishlist}</Link></li>
            <li><Link to="/export/assurance">{t.insurance}</Link></li>
          </ul>
        ) : (
          <>
            <p className={s.muted}>{t.freeText(FREE_WATCH_LIMIT)}</p>
            <div><LinkButton to="/premium" variant="secondary">{t.discoverPremium}</LinkButton></div>
          </>
        )}
      </section>

      <section className={s.section} id="notifications">
        <h2 className={s.h}>{n.title}</h2>
        <NotificationSettings />
      </section>

      <section className={s.section}>
        <h2 className={s.h}>{t.appearance}</h2>
        <Segmented label={t.theme} value={theme} onChange={setTheme} options={[{ value: 'ecrin', label: t.themeDark }, { value: 'soie', label: t.themeLight }]} />
      </section>

      <section className={s.section}>
        <h2 className={s.h}>{t.language}</h2>
        <Segmented label={t.language} value={language.choice} onChange={(v: LangChoice) => language.change(v)}
          options={[{ value: 'auto', label: c.language.auto }, { value: 'fr', label: c.language.fr }, { value: 'en', label: c.language.en }]} />
        <p className={s.small}>{t.autoHint}</p>
      </section>

      <section className={s.section}>
        <h2 className={s.h}>{t.account}</h2>
        {accountMsg && <Notice tone={accountMsg.tone}>{accountMsg.text}</Notice>}
        <p className={s.muted}>{t.signedInAs(user?.email ?? '')}{user?.created_at && t.memberSince(formatDate(user.created_at))}.</p>
        <div className={s.inline}>
          <TextField label={t.newEmail} type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} autoComplete="email" />
          <Button variant="secondary" onClick={changeEmail} disabled={!newEmail.includes('@')}>{t.change}</Button>
        </div>
        <div className={s.row}>
          <Button variant="secondary" onClick={resetPassword}>{t.changePassword}</Button>
          <Button variant="ghost" onClick={logout}>{t.signOut}</Button>
        </div>
        <p className={s.small}>
          {t.deleteBefore}<Link to="/contact">{t.deleteLink}</Link>{t.deleteAfter}
        </p>
      </section>

      <section className={`${s.section} ${s.helpSection}`}>
        <h2 className={s.h}>{t.helpInfo}</h2>
        <ul className={s.links}>
          <li><Link to="/actualites">{t.news}</Link></li>
          <li><Link to="/faq">{t.faq}</Link></li>
          <li><Link to="/a-propos">{t.about}</Link></li>
          <li><Link to="/presse">{t.press}</Link></li>
          <li><Link to="/contact">{t.contact}</Link></li>
        </ul>
        <ul className={s.legal}>
          <li><Link to="/cgu">{t.terms}</Link></li>
          <li><Link to="/cgv">{t.sales}</Link></li>
          <li><Link to="/confidentialite">{t.privacy}</Link></li>
          <li><Link to="/mentions-legales">{t.legal}</Link></li>
        </ul>
        <p className={s.small}>© {new Date().getFullYear()} The Box</p>
      </section>
    </div>
  );
}
