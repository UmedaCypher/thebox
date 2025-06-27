// client/src/pages/UserProfilePage.tsx
import { useState, useEffect } from 'react';
import type { FC, ChangeEvent, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import styles from './UserProfilePage.module.css';

interface ProfileData {
  id: string;
  username: string | null;
  full_name: string | null;
  profile_picture_url: string | null;
  wrist_size_cm: number | null;
  is_public: boolean;
  phone_number: string | null;
  preferred_language: string | null;
  time_zone: string | null;
  theme_preference: string | null;
  updated_at: string | null;
  created_at?: string;
  allow_private_messages?: boolean;
  account_type?: 'free' | 'pro_basic' | 'pro_premium' | 'admin' | null;
}

type ProfileSection = 'info' | 'security' | 'data' | 'support' | 'account_status';

const generateWristSizeOptions = (start: number, end: number, step: number): { value: string; label: string }[] => {
  const options: { value: string; label: string }[] = [{ value: '', label: 'Sélectionnez...' }];
  for (let i = start; i <= end; i += step) {
    const value = parseFloat(i.toFixed(1));
    options.push({ value: String(value), label: `${String(value).replace('.', ',')} cm` });
  }
  return options;
};
const wristSizeOptions = generateWristSizeOptions(13.0, 23.0, 0.5);

const languageOptions = [
  { value: '', label: 'Sélectionnez...' },
  { value: 'fr-FR', label: 'Français (France)' },
  { value: 'en-US', label: 'English (United States)' },
  { value: 'es-ES', label: 'Español (España)' },
];

const timeZoneOptions = [
  { value: '', label: 'Sélectionnez...' },
  { value: 'Europe/Paris', label: 'Europe/Paris' },
  { value: 'Europe/London', label: 'Europe/London' },
  { value: 'America/New_York', label: 'America/New York' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo' },
];

const UserProfilePage: FC = () => {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState<ProfileSection>('info');
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [fullNameInput, setFullNameInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [wristSizeCmInput, setWristSizeCmInput] = useState<string>('');
  const [isPublicInput, setIsPublicInput] = useState(false);
  const [phoneNumberInput, setPhoneNumberInput] = useState('');
  const [preferredLanguageInput, setPreferredLanguageInput] = useState('');
  const [timeZoneInput, setTimeZoneInput] = useState('');
  const [allowPrivateMessagesInput, setAllowPrivateMessagesInput] = useState(true);
  const [accountType, setAccountType] = useState<'free' | 'pro_basic' | 'pro_premium' | 'admin' | null>(null);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user || !user.id) {
        setLoadingProfile(false);
        return;
      }
      setLoadingProfile(true);
      setError(null);
      setSuccessMessage(null);
      try {
        const { data: profileResult, error: profileError } = await supabase
          .from('profiles')
          .select('*, account_type') 
          .eq('id', user.id)
          .single();

        if (profileError) {
          if (profileError.code === 'PGRST116') {
            console.warn('Aucun profil trouvé pour cet utilisateur. Un profil par défaut va être utilisé/créé.');
            const defaultProfile: ProfileData = {
              id: user.id,
              username: user.user_metadata?.user_name || user.email?.split('@')[0] || `user${user.id.substring(0,6)}`,
              full_name: user.user_metadata?.full_name || '',
              profile_picture_url: user.user_metadata?.avatar_url || null,
              wrist_size_cm: null,
              is_public: false,
              phone_number: user.phone || null,
              preferred_language: 'fr-FR',
              time_zone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'Europe/Paris',
              theme_preference: localStorage.getItem('app-theme') || 'system',
              updated_at: null,
              created_at: user.created_at,
              allow_private_messages: true,
              account_type: 'free',
            };
            setProfileData(defaultProfile);
            setFullNameInput(defaultProfile.full_name || '');
            setUsernameInput(defaultProfile.username || '');
            setWristSizeCmInput(defaultProfile.wrist_size_cm !== null ? String(defaultProfile.wrist_size_cm) : '');
            setIsPublicInput(defaultProfile.is_public);
            setPhoneNumberInput(defaultProfile.phone_number || '');
            setPreferredLanguageInput(defaultProfile.preferred_language || 'fr-FR');
            setTimeZoneInput(defaultProfile.time_zone || 'Europe/Paris');
            setAvatarPreview(defaultProfile.profile_picture_url);
            setAllowPrivateMessagesInput(defaultProfile.allow_private_messages ?? true);
            setAccountType(defaultProfile.account_type);
          } else {
            throw profileError;
          }
        } else if (profileResult) {
          setProfileData(profileResult);
          setFullNameInput(profileResult.full_name || '');
          setUsernameInput(profileResult.username || '');
          setWristSizeCmInput(profileResult.wrist_size_cm !== null ? String(profileResult.wrist_size_cm) : '');
          setIsPublicInput(profileResult.is_public || false);
          setPhoneNumberInput(profileResult.phone_number || '');
          setPreferredLanguageInput(profileResult.preferred_language || '');
          setTimeZoneInput(profileResult.time_zone || '');
          setAvatarPreview(profileResult.profile_picture_url);
          setAllowPrivateMessagesInput(profileResult.allow_private_messages ?? true);
          setAccountType(profileResult.account_type || 'free');
        }
      } catch (err: any) {
        console.error("Erreur lors de la récupération du profil:", err);
        setError(err.message || "Impossible de charger les informations du profil.");
      } finally {
        setLoadingProfile(false);
      }
    };

    if (user && user.id && !authLoading) {
      fetchProfileData();
    }
  }, [user, authLoading]);

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setError("Le fichier est trop volumineux (max 5MB).");
        setSuccessMessage(null);
        return;
      }
      const acceptedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!acceptedTypes.includes(file.type)) {
        setError("Format de fichier non supporté (JPG, PNG, GIF uniquement).");
        setSuccessMessage(null);
        return;
      }
      setError(null);
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setAvatarFile(null);
      setAvatarPreview(profileData?.profile_picture_url || null);
    }
  };

  const handleUpdateProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setError(null);
    setSuccessMessage(null);
    setIsSubmittingProfile(true);

    let newAvatarUrl = profileData?.profile_picture_url || null;

    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `avatar_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, { upsert: true });

      if (uploadError) {
        console.error("Erreur lors de l'upload de l'avatar:", uploadError);
        setError(uploadError.message || "Échec de l'upload de l'avatar.");
        setIsSubmittingProfile(false);
        return;
      }

      const { data: urlDataResult } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      newAvatarUrl = urlDataResult?.publicUrl ? `${urlDataResult.publicUrl}?t=${new Date().getTime()}` : null;
    }

    const updates = {
      full_name: fullNameInput,
      username: usernameInput.trim() === '' ? null : usernameInput.trim(),
      wrist_size_cm: wristSizeCmInput === '' ? null : parseFloat(wristSizeCmInput),
      is_public: isPublicInput,
      phone_number: phoneNumberInput.trim() === '' ? null : phoneNumberInput.trim(),
      preferred_language: preferredLanguageInput === '' ? null : preferredLanguageInput,
      time_zone: timeZoneInput === '' ? null : timeZoneInput,
      profile_picture_url: newAvatarUrl,
      updated_at: new Date().toISOString(),
      allow_private_messages: allowPrivateMessagesInput,
    };

    const query = (profileData && profileData.created_at)
      ? supabase.from('profiles').update(updates).eq('id', user.id)
      : supabase.from('profiles').insert({ ...updates, id: user.id, theme_preference: profileData?.theme_preference || 'system', account_type: 'free' });

    const { error: updateError } = await query;

    setIsSubmittingProfile(false);
    if (updateError) {
      console.error("Erreur lors de la mise à jour/création du profil:", updateError);
      if (updateError.message.includes('duplicate key value violates unique constraint') && updateError.message.includes('profiles_username_key')) {
        setError("Ce nom d'utilisateur est déjà pris. Veuillez en choisir un autre.");
      } else {
        setError(updateError.message || "Échec de la mise à jour du profil.");
      }
    } else {
      console.log("Profil mis à jour/créé avec succès !");
      setProfileData(prev => ({
        ...(prev || { id: user.id, created_at: user.created_at, theme_preference: 'system', account_type: 'free' } as ProfileData),
        ...updates
      }));
      setAvatarFile(null);
      setSuccessMessage("Profil mis à jour avec succès !");
      if (refreshUser) refreshUser();
    }
  };

  const handleChangeEmail = async () => {
    if (!user || !newEmail) {
      setError("Veuillez entrer une nouvelle adresse e-mail.");
      setSuccessMessage(null);
      return;
    }
    if (newEmail === user.email) {
      setError("La nouvelle adresse e-mail est identique à l'actuelle.");
      setSuccessMessage(null);
      return;
    }
    setError(null);
    setSuccessMessage(null);
    setIsSendingEmail(true);

    const { error: emailChangeError } = await supabase.auth.updateUser({ email: newEmail });

    setIsSendingEmail(false);
    if (emailChangeError) {
      console.error("Erreur lors de la demande de changement d'e-mail:", emailChangeError);
      setError(emailChangeError.message || "Échec de la demande de changement d'e-mail.");
    } else {
      setSuccessMessage(`Des e-mails de confirmation ont été envoyés à ${user.email} et ${newEmail}. Veuillez suivre les instructions pour finaliser le changement.`);
      setNewEmail('');
      if (refreshUser) refreshUser();
    }
  };

  const handleChangePassword = async () => {
    if (!user || !user.email) {
      setError("Impossible de trouver l'adresse e-mail de l'utilisateur.");
      setSuccessMessage(null);
      return;
    }
    setError(null);
    setSuccessMessage(null);
    setIsSendingEmail(true);
    const redirectTo = `${window.location.origin}/mettre-a-jour-mot-de-passe`;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo,
    });
    setIsSendingEmail(false);
    if (resetError) {
      console.error("Erreur lors de l'envoi de l'e-mail de réinitialisation:", resetError);
      setError(resetError.message || "Échec de l'envoi de l'e-mail de réinitialisation.");
    } else {
      setSuccessMessage(`Un e-mail de réinitialisation de mot de passe a été envoyé à ${user.email}. Veuillez suivre les instructions pour choisir un nouveau mot de passe.`);
    }
  };

  const handleResendVerificationEmail = async () => {
    if (!user || !user.email) {
      setError("Impossible de trouver l'adresse e-mail de l'utilisateur.");
      setSuccessMessage(null);
      return;
    }
    setError(null);
    setSuccessMessage(null);
    setIsSendingEmail(true);

    const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
            emailRedirectTo: `${window.location.origin}/login`
        }
    });

    setIsSendingEmail(false);
    if (resendError) {
        console.error("Erreur lors du renvoi de l'e-mail de vérification:", resendError);
        setError(resendError.message || "Échec du renvoi de l'e-mail de vérification.");
    } else {
        setSuccessMessage(`Un nouvel e-mail de vérification a été envoyé à ${user.email}.`);
    }
  };

  const handleDeleteAccount = async () => {
    setError(null);
    setSuccessMessage(null);
    if (window.confirm("Êtes-vous absolument sûr de vouloir supprimer votre compte ? Toutes vos données (collection, profil, etc.) seront définitivement perdues. Cette action est irréversible.")) {
      const confirmationText = window.prompt("Pour confirmer, veuillez taper 'SUPPRIMER MON COMPTE' ci-dessous :");
      if (confirmationText === "SUPPRIMER MON COMPTE") {
        setSuccessMessage("Fonction de suppression de compte à implémenter via une Edge Function pour des raisons de sécurité.");
        console.warn("TODO: Appeler une Edge Function Supabase pour la suppression complète et sécurisée du compte utilisateur et de ses données associées (watches, photos, etc.).");
      } else {
        setError("La suppression du compte a été annulée car le texte de confirmation était incorrect.");
      }
    }
  };

  if (authLoading || (loadingProfile && !profileData)) {
    return <div className={styles.pageLoading}>Chargement du profil...</div>;
  }

  if (error && !profileData && !loadingProfile) {
    return <div className={styles.pageError}>Erreur lors du chargement du profil: {error}</div>;
  }

  if (!profileData && !loadingProfile) {
    return <div className={styles.pageLoading}>Impossible de charger les données du profil. Veuillez réessayer.</div>;
  }

  const isEmailVerified = user?.email_confirmed_at;

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'info':
        return (
          <section className={styles.profileContentSection}>
            <h2 className={styles.sectionTitle}>Informations Personnelles & Préférences</h2>
            {user && profileData && (
              <form onSubmit={handleUpdateProfile}>
                <div className={styles.formGroup}>
                  <label htmlFor="avatarUpload">Photo de profil:</label>
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className={styles.avatarPreview} />
                  ) : (
                    <div className={styles.avatarPlaceholder}>Pas d'avatar</div>
                  )}
                  <input
                    type="file"
                    id="avatarUpload"
                    accept="image/png, image/jpeg, image/gif"
                    onChange={handleAvatarChange}
                    className={styles.fileInput}
                    aria-describedby="avatarHelp"
                  />
                  <small id="avatarHelp" className={styles.inputHelp}>Max 5MB. Formats: JPG, PNG, GIF.</small>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="currentEmail">Adresse e-mail actuelle:</label>
                  <input type="email" id="currentEmail" value={user.email || ''} readOnly disabled className={styles.inputField} />
                  {!isEmailVerified && (
                    <div className={styles.emailVerification}>
                      <span className={styles.notVerified}>E-mail non vérifié.</span>
                      <button
                        type="button"
                        onClick={handleResendVerificationEmail}
                        className={styles.linkButton}
                        disabled={isSendingEmail}
                      >
                        {isSendingEmail ? 'Envoi en cours...' : 'Renvoyer l’e-mail de vérification'}
                      </button>
                    </div>
                  )}
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="newEmail">Nouvelle adresse e-mail (optionnel):</label>
                  <div className={styles.inputWithButton}>
                    <input
                        type="email"
                        id="newEmail"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="Entrez la nouvelle adresse e-mail"
                        className={styles.inputField}
                    />
                    <button
                        type="button"
                        onClick={handleChangeEmail}
                        className={styles.inlineButton}
                        disabled={isSendingEmail || !newEmail}
                    >
                        {isSendingEmail ? 'Envoi...' : 'Changer'}
                    </button>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="fullName">Nom complet:</label>
                  <input
                    type="text"
                    id="fullName"
                    value={fullNameInput}
                    onChange={(e) => setFullNameInput(e.target.value)}
                    className={styles.inputField}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="username">Nom d'utilisateur:</label>
                  <input
                    type="text"
                    id="username"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className={styles.inputField}
                    aria-describedby="usernameHelp"
                  />
                    <small id="usernameHelp" className={styles.inputHelp}>Sera utilisé pour votre page de profil publique. Doit être unique.</small>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="wristSizeCm">Tour de poignet (cm):</label>
                  <select
                    id="wristSizeCm"
                    value={wristSizeCmInput}
                    onChange={(e) => setWristSizeCmInput(e.target.value)}
                    className={styles.selectField}
                  >
                    {wristSizeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="phoneNumber">Numéro de téléphone:</label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    value={phoneNumberInput}
                    onChange={(e) => setPhoneNumberInput(e.target.value)}
                    className={styles.inputField}
                    placeholder="Ex: +33612345678"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="preferredLanguage">Langue préférée:</label>
                  <select
                    id="preferredLanguage"
                    value={preferredLanguageInput}
                    onChange={(e) => setPreferredLanguageInput(e.target.value)}
                    className={styles.selectField}
                  >
                    {languageOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="timeZone">Fuseau horaire:</label>
                  <select
                    id="timeZone"
                    value={timeZoneInput}
                    onChange={(e) => setTimeZoneInput(e.target.value)}
                    className={styles.selectField}
                  >
                    {timeZoneOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="isPublic" className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={isPublicInput}
                      onChange={(e) => setIsPublicInput(e.target.checked)}
                      className={styles.checkboxInput}
                    />
                    Rendre mon profil et ma collection visibles publiquement
                  </label>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="allowPrivateMessages" className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      id="allowPrivateMessages"
                      checked={allowPrivateMessagesInput}
                      onChange={(e) => setAllowPrivateMessagesInput(e.target.checked)}
                      className={styles.checkboxInput}
                    />
                    Autoriser les autres membres à m'envoyer des messages privés
                  </label>
                  <small className={styles.inputHelp}>Si désactivé, le bouton "Envoyer un message" n'apparaîtra pas sur votre profil public.</small>
                </div>

                <div className={styles.formGroup}>
                  <label>Date d’inscription:</label>
                  <input type="text" value={profileData.created_at ? new Date(profileData.created_at).toLocaleDateString('fr-FR') : (user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : 'N/A')} readOnly disabled className={styles.inputField} />
                </div>

                <button type="submit" className={styles.submitButton} disabled={isSubmittingProfile || loadingProfile}>
                  {isSubmittingProfile ? 'Mise à jour...' : 'Mettre à jour le profil'}
                </button>
              </form>
            )}
          </section>
        );
      case 'security':
        return (
          <section className={styles.profileContentSection}>
            <h2 className={styles.sectionTitle}>Sécurité du Compte</h2>
            <button onClick={handleChangePassword} className={styles.actionButton} disabled={isSendingEmail || isSubmittingProfile}>
              {isSendingEmail ? 'Envoi en cours...' : 'Changer le mot de passe'}
            </button>
            <button onClick={handleDeleteAccount} className={`${styles.actionButton} ${styles.dangerButton}`} disabled={isSubmittingProfile}>
              Supprimer mon compte
            </button>
              {user && !isEmailVerified && (
                <div className={`${styles.formGroup} ${styles.emailVerification}`}>
                  <span className={styles.notVerified}>Votre adresse e-mail n'est pas vérifiée.</span>
                  <button
                    type="button"
                    onClick={handleResendVerificationEmail}
                    className={styles.linkButton}
                    disabled={isSendingEmail}
                  >
                    {isSendingEmail ? 'Envoi en cours...' : 'Renvoyer l’e-mail de vérification'}
                  </button>
                </div>
              )}
          </section>
        );
      case 'data':
        return (
          <section className={styles.profileContentSection}>
            <h2 className={styles.sectionTitle}>Données & Confidentialité</h2>
            <p className={styles.todoText}>Fonctionnalité d'exportation des données à venir.</p>
            <p><Link to="/politique-confidentialite" className={styles.inlineLink}>Politique de confidentialité</Link></p>
            <p><Link to="/conditions-generales" className={styles.inlineLink}>Conditions Générales d'Utilisation</Link></p>
          </section>
        );
      case 'account_status':
        return (
          <section className={styles.profileContentSection}>
            <h2 className={styles.sectionTitle}>Statut du Compte</h2>
            {profileData && (
              <div className={styles.accountStatusInfo}>
                <p>Votre statut de compte actuel est : **{accountType?.toUpperCase() || 'FREE'}**.</p>
                {accountType === 'free' && (
                  <>
                    <p>Passez au compte professionnel pour débloquer des fonctionnalités avancées de gestion de stock, de CRM et d'analyse de marché.</p>
                    <button className={styles.actionButton} onClick={() => alert("Fonctionnalité de mise à niveau à implémenter prochainement !")}>
                      Passer au compte Professionnel
                    </button>
                  </>
                )}
                {(accountType === 'pro_basic' || accountType === 'pro_premium') && (
                  <p>Vous avez accès aux outils professionnels.</p>
                )}
              </div>
            )}
          </section>
        );
      case 'support':
        return (
          <section className={styles.profileContentSection}>
            <h2 className={styles.sectionTitle}>Aide & Support</h2>
            <Link to="/faq" className={styles.actionButton}>Consulter la FAQ</Link>
            <p className={styles.todoText}>Formulaire de contact du support à venir. En attendant, contactez-nous à support@example.com</p>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.profilePageContainer}>
      <h1 className={styles.pageTitle}>Mon Compte</h1>

      {error && <div className={`${styles.profileContentSection} ${styles.errorMessage}`}>{error}</div>}
      {successMessage && <div className={`${styles.profileContentSection} ${styles.successMessage}`}>{successMessage}</div>}

      <div className={styles.profileLayout}>
        <nav className={styles.sideNav}>
          <button
            onClick={() => setActiveSection('info')}
            className={`${styles.navButton} ${activeSection === 'info' ? styles.navButtonActive : ''}`}
          >
            Infos & Préférences
          </button>
          <button
            onClick={() => setActiveSection('security')}
            className={`${styles.navButton} ${activeSection === 'security' ? styles.navButtonActive : ''}`}
          >
            Sécurité du Compte
          </button>
          <button
            onClick={() => setActiveSection('data')}
            className={`${styles.navButton} ${activeSection === 'data' ? styles.navButtonActive : ''}`}
          >
            Données & Confidentialité
          </button>
          <button
            onClick={() => setActiveSection('account_status')}
            className={`${styles.navButton} ${activeSection === 'account_status' ? styles.navButtonActive : ''}`}
          >
            Statut du Compte
          </button>
          <button
            onClick={() => setActiveSection('support')}
            className={`${styles.navButton} ${activeSection === 'support' ? styles.navButtonActive : ''}`}
          >
            Aide & Support
          </button>
        </nav>

        <div className={styles.contentArea}>
          {renderSectionContent()}
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;