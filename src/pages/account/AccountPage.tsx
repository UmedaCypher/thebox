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
import type { LangChoice } from '../../i18n';
import s from './AccountPage.module.css';

export default function AccountPage() {
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
    try { await openBillingPortal(); } catch (e) { setPortalError(e instanceof Error ? e.message : 'Indisponible.'); setPortalBusy(false); }
  };

  useEffect(() => {
    setF({
      username: profile?.username ?? '',
      full_name: profile?.full_name ?? '',
      wrist: profile?.wrist_size_cm ? String(profile.wrist_size_cm).replace('.', ',') : '',
      is_public: Boolean(profile?.is_public),
      messages: profile?.allow_private_messages !== false,
    });
  }, [profile]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const username = f.username.trim();
    if (username && !/^[a-z0-9._]{3,30}$/i.test(username)) {
      setMsg({ tone: 'error', text: 'Le pseudo doit faire 3 à 30 caractères : lettres, chiffres, point ou tiret bas.' });
      return;
    }
    const wrist = f.wrist.trim() ? Number(f.wrist.replace(',', '.')) : null;
    if (wrist !== null && (!Number.isFinite(wrist) || wrist < 12 || wrist > 26)) {
      setMsg({ tone: 'error', text: 'Le tour de poignet doit être compris entre 12 et 26 cm.' });
      return;
    }
    if (f.is_public && !username) {
      setMsg({ tone: 'error', text: 'Choisissez un pseudo pour rendre votre profil public.' });
      return;
    }
    setSaving(true);
    try {
      await saveProfile(uid, { username: username || null, full_name: f.full_name.trim() || null, wrist_size_cm: wrist, is_public: f.is_public, allow_private_messages: f.messages }, Boolean(profile));
      await refreshProfile();
      setMsg({ tone: 'ok', text: 'Profil enregistré.' });
    } catch (x) {
      setMsg({ tone: 'error', text: x instanceof Error ? x.message : 'Enregistrement impossible.' });
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
      setMsg({ tone: 'error', text: x instanceof Error ? x.message : "Envoi de l'avatar impossible." });
    } finally { setAvatarBusy(false); }
  };

  const changeEmail = async () => {
    setAccountMsg(null);
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    if (error) setAccountMsg({ tone: 'error', text: error.message });
    else { setAccountMsg({ tone: 'ok', text: `Un lien de confirmation a été envoyé à ${newEmail.trim()} et à votre adresse actuelle.` }); setNewEmail(''); }
  };

  const resetPassword = async () => {
    setAccountMsg(null);
    const { error } = await supabase.auth.resetPasswordForEmail(user!.email!, { redirectTo: `${window.location.origin}/nouveau-mot-de-passe` });
    if (error) setAccountMsg({ tone: 'error', text: error.message });
    else setAccountMsg({ tone: 'ok', text: `Un lien pour choisir un nouveau mot de passe a été envoyé à ${user!.email}.` });
  };

  const logout = async () => { await signOut(); navigate('/', { replace: true }); };

  const initial = (profile?.username || user?.email || '?').charAt(0).toUpperCase();

  return (
    <div className="page page--narrow">
      <PageHeader title="Profil" />

      <section className={s.identity}>
        <label className={s.avatar} aria-label="Changer la photo de profil">
          {profile?.profile_picture_url ? <img src={profile.profile_picture_url} alt="" /> : <span>{initial}</span>}
          <span className={s.avatarEdit}><Camera size={16} strokeWidth={1.8} aria-hidden="true" /></span>
          <input type="file" accept="image/*" className="visually-hidden" onChange={onAvatar} disabled={avatarBusy} />
        </label>
        <div className={s.identityText}>
          <strong className={s.name}>{profile?.username ? `@${profile.username}` : user?.email}</strong>
          <span className={s.plan}>{isPremium ? <PremiumTag /> : 'Collection gratuite'}</span>
          {profile?.is_public && profile.username && <Link to={`/profil/${profile.username}`} className={s.link}>Voir mon profil public</Link>}
        </div>
      </section>

      <form onSubmit={save} className={s.section}>
        <h2 className={s.h}>Informations</h2>
        {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
        <TextField label="Pseudo" value={f.username} onChange={e => setF({ ...f, username: e.target.value })} hint="Votre adresse publique : /profil/pseudo" autoCapitalize="none" autoComplete="username" />
        <TextField label="Nom" optional value={f.full_name} onChange={e => setF({ ...f, full_name: e.target.value })} hint="Jamais affiché publiquement." autoComplete="name" />
        <TextField label="Tour de poignet" optional inputMode="decimal" suffix="cm" value={f.wrist} onChange={e => setF({ ...f, wrist: e.target.value })} hint="Il accompagne vos photos dans la galerie pour aider les autres à se projeter." />
        <Toggle
          label="Profil public"
          description="Votre pseudo et les photos de vos montres deviennent visibles. Les prix, valeurs et lieux d'achat restent toujours privés."
          checked={f.is_public}
          onChange={v => setF({ ...f, is_public: v })}
        />
        <Toggle
          label="Accepter les messages"
          description="Les membres peuvent vous écrire depuis vos annonces et votre profil public. Les conversations déjà ouvertes restent actives ; pour en couper une, bloquez le membre."
          checked={f.messages}
          onChange={v => setF({ ...f, messages: v })}
        />
        <div><Button type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button></div>
      </form>

      <section className={s.section}>
        <h2 className={s.h}>Offre</h2>
        {isPremium && sub.data && (
          <p className={s.muted}>
            {sub.data.cancel_at_period_end
              ? `Abonnement résilié : Premium reste actif jusqu'au ${formatDate(sub.data.current_period_end)}.`
              : sub.data.status === 'past_due'
                ? 'Le dernier paiement a échoué. Mettez à jour votre carte pour garder Premium.'
                : `Abonnement Premium, prochain renouvellement le ${formatDate(sub.data.current_period_end)}.`}
          </p>
        )}
        {portalError && <Notice tone="error">{portalError}</Notice>}
        {isPremium && sub.data && (
          <div><Button variant="secondary" onClick={manage} disabled={portalBusy}>{portalBusy ? 'Ouverture…' : 'Gérer mon abonnement'}</Button></div>
        )}
        {isPremium ? (
          <ul className={s.links}>
            <li><Link to="/stats">Statistiques de portage</Link></li>
            <li><Link to="/wishlist">Wishlist</Link></li>
            <li><Link to="/export/assurance">Inventaire pour l'assurance</Link></li>
          </ul>
        ) : (
          <>
            <p className={s.muted}>La collection gratuite accueille {FREE_WATCH_LIMIT} montres, avec la galerie, le calendrier de portage et le passeport.</p>
            <div><LinkButton to="/premium" variant="secondary">Découvrir Premium</LinkButton></div>
          </>
        )}
      </section>

      <section className={s.section}>
        <h2 className={s.h}>Apparence</h2>
        <Segmented label="Thème" value={theme} onChange={setTheme} options={[{ value: 'ecrin', label: 'Écrin (sombre)' }, { value: 'soie', label: 'Soie (clair)' }]} />
      </section>

      <section className={s.section}>
        <h2 className={s.h}>Langue</h2>
        <Segmented label="Langue" value={language.choice} onChange={(v: LangChoice) => language.change(v)}
          options={[{ value: 'auto', label: 'Automatique' }, { value: 'fr', label: 'Français' }, { value: 'en', label: 'English' }]} />
        <p className={s.small}>« Automatique » suit la langue de votre téléphone ou de votre ordinateur.</p>
      </section>

      <section className={s.section}>
        <h2 className={s.h}>Compte</h2>
        {accountMsg && <Notice tone={accountMsg.tone}>{accountMsg.text}</Notice>}
        <p className={s.muted}>Connecté avec {user?.email}{user?.created_at && `, membre depuis le ${formatDate(user.created_at)}`}.</p>
        <div className={s.inline}>
          <TextField label="Nouvelle adresse e-mail" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} autoComplete="email" />
          <Button variant="secondary" onClick={changeEmail} disabled={!newEmail.includes('@')}>Changer</Button>
        </div>
        <div className={s.row}>
          <Button variant="secondary" onClick={resetPassword}>Changer de mot de passe</Button>
          <Button variant="ghost" onClick={logout}>Se déconnecter</Button>
        </div>
        <p className={s.small}>
          Pour supprimer votre compte et toutes vos données, <Link to="/contact">écrivez-nous</Link>. Nous le faisons sous 7 jours.
        </p>
      </section>

      <section className={s.section}>
        <h2 className={s.h}>Informations</h2>
        <ul className={s.links}>
          <li><Link to="/actualites">Actualités horlogères</Link></li>
          <li><Link to="/faq">Questions fréquentes</Link></li>
          <li><Link to="/a-propos">À propos</Link></li>
          <li><Link to="/presse">Presse</Link></li>
          <li><Link to="/contact">Contact</Link></li>
        </ul>
        <ul className={s.legal}>
          <li><Link to="/cgu">CGU</Link></li>
          <li><Link to="/cgv">CGV</Link></li>
          <li><Link to="/confidentialite">Confidentialité</Link></li>
          <li><Link to="/mentions-legales">Mentions légales</Link></li>
        </ul>
        <p className={s.small}>© {new Date().getFullYear()} The Box</p>
      </section>
    </div>
  );
}
