// client/src/pages/PublicProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext'; // Assurez-vous que le chemin est correct
import styles from './PublicProfilePage.module.css';

interface ProfileInfo {
  id: string;
  username: string | null;
  full_name: string | null;
  profile_picture_url: string | null;
  created_at: string | null;
  is_public: boolean;
  allow_private_messages?: boolean;
}

interface WatchPhotoInfo {
  storage_path: string;
  is_main_photo: boolean;
  photo_type: 'watch_only' | 'wrist_shot';
}

interface PublicWatch {
  id: string;
  brand: string;
  model: string;
  reference_number?: string | null;
  year_of_production?: number | null;
  main_photo_url?: string | null;
  // MODIFICATION ICI : 'current_status' utilise les valeurs ENUM universelles
  current_status?: 'in_collection' | 'for_sale' | 'for_exchange' | 'consignment' | 'in_repair' | 'for_expertise' | 'sold_by_pro' | 'purchased_by_pro' | 'returned' | null;
  sale_price?: number | null;
}

const PublicProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser, session } = useAuth(); 
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [watches, setWatches] = useState<PublicWatch[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingWatches, setLoadingWatches] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileAndWatches = async () => {
      if (!username) {
        setError("Nom d'utilisateur non spécifié.");
        setLoadingProfile(false);
        return;
      }

      setLoadingProfile(true);
      setError(null);
      setProfile(null);
      setWatches([]);

      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, full_name, profile_picture_url, created_at, is_public, allow_private_messages')
          .eq('username', username)
          .single();

        if (profileError) {
          if (profileError.code === 'PGRST116') {
            setError(`Profil pour "${username}" non trouvé.`);
          } else {
            console.error("Erreur fetchProfile (public):", profileError);
            setError(profileError.message || "Erreur lors de la récupération du profil.");
          }
          setLoadingProfile(false);
          return;
        }

        if (!profileData) {
          setError(`Profil pour "${username}" non trouvé.`);
          setLoadingProfile(false);
          return;
        }
        
        setProfile(profileData as ProfileInfo);

        if (profileData.is_public && profileData.id) {
          setLoadingWatches(true);
          const { data: watchesData, error: watchesError } = await supabase
            .from('watches')
            .select(`
              id,
              brand,
              model,
              reference_number,
              year_of_production,
              current_status, 
              sale_price,
              photos (
                storage_path,
                is_main_photo,
                photo_type
              )
            `)
            .eq('user_id', profileData.id)
            .order('created_at', { ascending: false });

          if (watchesError) {
            console.error("Erreur fetchWatches (public):", watchesError);
            setError(prevError => prevError ? `${prevError}\nErreur chargement collection: ${watchesError.message}` : `Erreur chargement collection: ${watchesError.message}`);
          } else if (watchesData) {
            const watchesWithMainPhoto = watchesData.map(watch => {
              let mainPhotoUrl: string | null = null;
              if (watch.photos && watch.photos.length > 0) {
                const mainPhoto = 
                  watch.photos.find((p: WatchPhotoInfo) => p.is_main_photo && p.photo_type === 'watch_only') ||
                  watch.photos.find((p: WatchPhotoInfo) => p.photo_type === 'wrist_shot') || 
                  watch.photos[0]; 

                if (mainPhoto?.storage_path) {
                  const { data: urlData } = supabase.storage
                    .from('watch.images')
                    .getPublicUrl(mainPhoto.storage_path);
                  mainPhotoUrl = urlData?.publicUrl || null;
                }
              }
              return { ...watch, main_photo_url: mainPhotoUrl } as PublicWatch;
            });
            setWatches(watchesWithMainPhoto);
          }
          setLoadingWatches(false);
        }
        setLoadingProfile(false);

      } catch (err: any) {
        console.error("Erreur inattendue dans fetchProfileAndWatches:", err);
        setError(err.message || "Une erreur inconnue est survenue.");
        setLoadingProfile(false);
        setLoadingWatches(false);
      }
    };

    fetchProfileAndWatches();
  }, [username]);

  const handleSendMessage = () => {
    if (!profile || !currentUser || !session) {
        navigate('/login?redirect=/profil/' + username);
        return;
    }
    if (profile.id === currentUser.id) {
        alert("Vous ne pouvez pas vous envoyer un message à vous-même depuis cette page.");
        return;
    }
    // Rediriger vers la page de messagerie avec l'ID de l'utilisateur cible comme paramètre
    navigate(`/messagerie/nouvelle/${profile.id}`);
  };


  if (loadingProfile) {
    return <div className={styles.pageStateContainer}><p>Chargement du profil...</p></div>;
  }

  if (error && !profile) { 
    return <div className={styles.pageStateContainer}><p className={styles.errorMessage}>{error}</p></div>;
  }

  if (!profile) {
    return <div className={styles.pageStateContainer}><p>Profil non trouvé.</p></div>;
  }
  
  const memberSince = profile.created_at ? new Date(profile.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' }) : 'Date inconnue';
  const isOwnPublicProfile = currentUser && profile.id === currentUser.id;

  return (
    <div className={styles.publicProfilePageContainer}>
      <header className={styles.profileHeader}>
        <div className={styles.avatarContainer}>
          {profile.profile_picture_url ? (
            <img src={profile.profile_picture_url} alt={`Avatar de ${profile.username}`} className={styles.avatar} />
          ) : (
            <div className={styles.avatarPlaceholder}>👤</div>
          )}
        </div>
        <div className={styles.profileInfoMain}>
          <h1 className={styles.username}>{profile.username}</h1>
          {profile.full_name && <p className={styles.fullName}>{profile.full_name}</p>}
          <p className={styles.memberSince}>Membre depuis {memberSince}</p>
          
          {!isOwnPublicProfile && profile.allow_private_messages && currentUser && session && (
            <button onClick={handleSendMessage} className={styles.sendMessageButton}>
              Envoyer un message
            </button>
          )}
          {isOwnPublicProfile && (
             <Link to="/profil" className={styles.editProfileButton}>Modifier mon profil</Link>
          )}
        </div>
      </header>

      {error && profile && <p className={`${styles.errorMessage} ${styles.collectionErrorMessage}`}>{error}</p>}

      {profile.is_public ? (
        <>
          <h2 className={styles.collectionTitle}>Collection de {profile.username}</h2>
          {loadingWatches && <div className={styles.pageStateContainer}><p>Chargement de la collection...</p></div>}
          {!loadingWatches && watches.length === 0 && (
            <p className={styles.emptyCollectionMessage}>La collection de {profile.username} est privée ou ne contient aucune montre pour le moment.</p>
          )}
          {watches.length > 0 && (
            <div className={styles.watchesGrid}>
              {watches.map((watch) => (
                <div key={watch.id} className={styles.watchCard}>
                  {/* MODIFICATION ICI : 'current_status' pour l'affichage public */}
                  {watch.current_status === 'for_sale' && (
                    <div 
                        className={styles.cardStatusIndicatorSale} 
                        title={watch.sale_price ? `À vendre : ${watch.sale_price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}` : 'À vendre'}
                    >
                      💰 
                      {watch.sale_price ? ` ${watch.sale_price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits:0, maximumFractionDigits:0 })}` : ' À VENDRE'}
                    </div>
                  )}
                  {watch.current_status === 'for_exchange' && (
                    <div className={styles.cardStatusIndicatorTrade} title="À échanger">
                      🔄 À ÉCHANGER
                    </div>
                  )}
                  {/* Si vous voulez afficher d'autres statuts pro sur la page publique, ajoutez des conditions ici */}
                  {/* Par exemple, si une montre est en dépôt-vente (consignment) mais que le pro la rend visible publiquement */}
                  {/*
                  {watch.current_status === 'consignment' && (
                    <div className={`${styles.cardStatusIndicatorSale} !bg-purple-500`}>
                      EN DÉPÔT-VENTE
                    </div>
                  )}
                  */}
                  <Link to={`/montre/${watch.id}`} className={styles.watchCardLink}>
                    <div className={styles.watchImageContainer}>
                      {watch.main_photo_url ? (
                        <img src={watch.main_photo_url} alt={`${watch.brand} ${watch.model}`} className={styles.watchImage} />
                      ) : (
                        <div className={styles.watchImagePlaceholder}><span>⌚</span></div>
                      )}
                    </div>
                    <div className={styles.watchInfo}>
                      <h3 className={styles.watchBrandModel}>{watch.brand}</h3>
                      <p className={styles.watchModelName}>{watch.model}</p>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <p className={styles.profilePrivateMessage}>{profile.username} a choisi de garder son profil et sa collection privés.</p>
      )}
    </div>
  );
};

export default PublicProfilePage;
