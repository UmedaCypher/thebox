// client/src/pages/WristShotGalleryPage/WristShotGalleryPage.tsx

// Correction mineure des imports pour la cohérence
import { useState, useEffect, useCallback } from 'react';
import type { FC } from 'react'; // FC (Functional Component) est un type
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient'; // Assurez-vous que ce chemin est correct
import styles from './WristShotGalleryPage.module.css';

interface GalleryPhoto {
  id: string; // Correspond à photo_id de la RPC
  storage_path: string; // Correspond à photo_storage_path
  publicUrl?: string; // Optionnel car on filtre les URL nulles après récupération
  watch_id: string;
  watch_brand?: string; // Peut être indéfini si non retourné par la RPC ou si la montre n'a pas de marque
  watch_model?: string; // Peut être indéfini
  user_username?: string | null; // Peut être null si l'username n'est pas défini
  user_wrist_size_cm?: number | null; // Peut être null
}

interface BrandFromRpc { // Type pour le retour de get_gallery_available_brands
  brand: string;
}

interface RpcPhotoData { // Type pour les données brutes de la RPC get_public_wrist_shots
  photo_id: string;
  photo_storage_path: string;
  watch_id: string;
  watch_brand: string;
  watch_model: string;
  user_username: string | null;
  user_wrist_size_cm: number | null;
}

const WristShotGalleryPage: FC = () => {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [wristSizeMinInput, setWristSizeMinInput] = useState<string>('');
  const [wristSizeMaxInput, setWristSizeMaxInput] = useState<string>('');
  const [loadingFilters, setLoadingFilters] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [photosPerPage] = useState(20); // Nombre de photos par page
  const [hasMorePhotos, setHasMorePhotos] = useState(true);

  // Effet pour récupérer les options de filtre (marques)
  useEffect(() => {
    const fetchFilterOptions = async () => {
      setLoadingFilters(true);
      try {
        const { data: brandsData, error: brandsError } = await supabase.rpc('get_gallery_available_brands');

        if (brandsError) {
          console.error("Erreur RPC get_gallery_available_brands:", brandsError);
          throw brandsError; // Propage l'erreur pour être attrapée par le catch
        }
        
        if (brandsData) {
          // S'assurer que brandsData est traité comme un tableau de BrandFromRpc
          const uniqueBrands = (brandsData as BrandFromRpc[]).map(item => item.brand).sort();
          setAvailableBrands(uniqueBrands);
        } else {
          setAvailableBrands([]); // Initialiser avec un tableau vide si pas de données
        }
      } catch (err: any) {
        console.error("Erreur dans fetchFilterOptions:", err);
        setError("Impossible de charger les options de filtre."); // Message d'erreur pour l'utilisateur
        setAvailableBrands([]); // Assurer un état cohérent en cas d'erreur
      } finally {
        setLoadingFilters(false);
      }
    };
    fetchFilterOptions();
  }, []); // Dépendance vide pour exécuter une seule fois au montage

  // Fonction pour récupérer les photos de la galerie avec pagination et filtres
  const fetchWristShots = useCallback(async (pageToFetch = 1, resetPhotosList = false) => {
    if (resetPhotosList) {
      setPhotos([]); // Vider les photos existantes si resetPhotosList est vrai
      setCurrentPage(1); // Réinitialiser la page actuelle à 1
      setHasMorePhotos(true); // S'attendre à ce qu'il y ait plus de photos
    }
    setLoading(true); // Indiquer le début du chargement
    setError(null); // Réinitialiser les erreurs précédentes

    try {
      const rpcParams: { [key: string]: any } = { // Typage plus flexible pour les paramètres RPC
        selected_brand_filter: selectedBrand === '' ? null : selectedBrand,
        min_wrist_filter: wristSizeMinInput === '' ? null : parseFloat(wristSizeMinInput),
        max_wrist_filter: wristSizeMaxInput === '' ? null : parseFloat(wristSizeMaxInput),
        page_limit: photosPerPage,
        page_offset: (pageToFetch - 1) * photosPerPage // Calcul de l'offset pour la pagination
      };

      // Assurer que les valeurs numériques sont bien des nombres ou null avant l'appel RPC
      if (isNaN(rpcParams.min_wrist_filter as number)) rpcParams.min_wrist_filter = null;
      if (isNaN(rpcParams.max_wrist_filter as number)) rpcParams.max_wrist_filter = null;
      
      // Appel à la fonction RPC Supabase
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_public_wrist_shots', rpcParams);

      if (rpcError) {
        console.error("Erreur RPC get_public_wrist_shots:", rpcError);
        setError(rpcError.message || "Erreur lors de la récupération des données de la galerie.");
        if (resetPhotosList || pageToFetch === 1) setPhotos([]); // Vider en cas d'erreur sur le premier chargement/reset
        setHasMorePhotos(false); // Indiquer qu'il n'y a plus de photos à charger
        return; // Arrêter l'exécution si la RPC échoue
      }

      if (rpcData && Array.isArray(rpcData)) {
        // Transformation des données RPC en type GalleryPhoto
        // Ajout du type de retour explicite ': GalleryPhoto' à la fonction map
        const newPhotosTransformed = (rpcData as RpcPhotoData[]).map((item): GalleryPhoto => {
          let photoPublicUrl: string | undefined = undefined; // Utiliser undefined pour la cohérence avec publicUrl?
          if (item.photo_storage_path) {
            const { data: urlData } = supabase.storage
              .from('watch.images') // Assurez-vous que 'watch.images' est le nom correct de votre bucket
              .getPublicUrl(item.photo_storage_path);
            photoPublicUrl = urlData?.publicUrl || undefined; // undefined si pas d'URL
          }
          return {
            id: item.photo_id,
            storage_path: item.photo_storage_path,
            publicUrl: photoPublicUrl, // Peut être undefined ici
            watch_id: item.watch_id,
            watch_brand: item.watch_brand,
            watch_model: item.watch_model,
            user_username: item.user_username || null, // Garder null si l'username n'est pas défini
            user_wrist_size_cm: item.user_wrist_size_cm,
          };
        })
        .filter(photo => photo.publicUrl); // Garder uniquement les photos avec une URL publique valide

        // Mise à jour de l'état des photos
        if (resetPhotosList || pageToFetch === 1) {
          setPhotos(newPhotosTransformed);
        } else {
            // Ajout des nouvelles photos à la liste existante pour la pagination "infinite scroll"
          setPhotos(prevPhotos => [...prevPhotos, ...newPhotosTransformed]);
        }
        
        // Vérifier s'il y a plus de photos à charger pour la pagination
        if (newPhotosTransformed.length < photosPerPage) {
          setHasMorePhotos(false); // Moins de photos que la limite, donc fin de la liste
        } else {
          setHasMorePhotos(true); // Potentiellement plus de photos
        }
        setCurrentPage(pageToFetch); // Mettre à jour la page actuelle

      } else {
        // Si rpcData est null ou n'est pas un tableau
        if (resetPhotosList || pageToFetch === 1) setPhotos([]);
        setHasMorePhotos(false);
      }
    } catch (err: any) {
      console.error("Erreur dans fetchWristShots (catch global):", err);
      setError(err.message || "Impossible de charger la galerie.");
      if (resetPhotosList || pageToFetch === 1) setPhotos([]); 
      setHasMorePhotos(false);
    } finally {
      setLoading(false); // Indiquer la fin du chargement
    }
  }, [selectedBrand, wristSizeMinInput, wristSizeMaxInput, photosPerPage]); // Dépendances de useCallback

  // Effet pour charger les photos initialement et lors du changement de filtres
  useEffect(() => {
    fetchWristShots(1, true); // Charger la première page et réinitialiser les photos
  }, [fetchWristShots]); // fetchWristShots est maintenant stable grâce à useCallback

  // Gestionnaire pour réinitialiser les filtres
  const handleResetFilters = () => {
    setSelectedBrand('');
    setWristSizeMinInput('');
    setWristSizeMaxInput('');
    // Le useEffect dépendant de fetchWristShots (qui dépend des filtres) se chargera de re-fetcher
  };

  // Gestionnaire pour charger plus de photos (pagination)
  const loadMorePhotos = () => {
    if (!loading && hasMorePhotos) { // Charger uniquement si pas déjà en chargement et s'il y a plus de photos
      fetchWristShots(currentPage + 1, false); // Charger la page suivante, ne pas réinitialiser
    }
  };

  // Rendu du composant
  return (
    <div className={styles.galleryPageContainer}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Galerie au Poignet</h1>
      </header>

      {/* Section des filtres */}
      <div className={styles.filtersContainer}>
        <div className={styles.filterGroup}>
          <label htmlFor="brandFilter" className={styles.filterLabel}>Marque :</label>
          <select 
            id="brandFilter" 
            value={selectedBrand} 
            onChange={(e) => setSelectedBrand(e.target.value)}
            className={styles.filterSelect}
            disabled={loadingFilters || loading} // Désactiver pendant le chargement des filtres ou des photos
          >
            <option value="">Toutes les marques</option>
            {availableBrands.map(brand => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="wristSizeMin" className={styles.filterLabel}>Tour de poignet (cm) :</label>
          <div className={styles.rangeInputContainer}>
            <input 
              type="number"
              id="wristSizeMin"
              value={wristSizeMinInput}
              onChange={(e) => setWristSizeMinInput(e.target.value)}
              placeholder="Min."
              className={styles.filterInput}
              disabled={loading} // Désactiver pendant le chargement des photos
              step="0.5" // Pas de 0.5 pour la taille du poignet
            />
            <span>-</span>
            <input 
              type="number"
              id="wristSizeMax"
              value={wristSizeMaxInput}
              onChange={(e) => setWristSizeMaxInput(e.target.value)}
              placeholder="Max."
              className={styles.filterInput}
              disabled={loading} // Désactiver pendant le chargement des photos
              step="0.5"
            />
          </div>
        </div>
        
        <div className={styles.filterActions}>
            <button onClick={handleResetFilters} className={styles.resetButton} disabled={loading}>
                Réinitialiser les filtres
            </button>
        </div>
      </div>

      {/* Messages de chargement, d'erreur ou de galerie vide */}
      {loading && photos.length === 0 && !error && <div className={styles.loadingMessage}>Chargement de la galerie...</div>}
      {error && <div className={`${styles.message} ${styles.errorMessage}`}>Erreur : {error}</div>}
      {!loading && !error && photos.length === 0 && (
        <div className={`${styles.message} ${styles.emptyMessage}`}>Aucune photo ne correspond à vos critères de recherche.</div>
      )}

      {/* Grille des photos */}
      {photos.length > 0 && ( 
        <div className={styles.photosGrid}>
          {photos.map((photo) => (
            <div key={photo.id} className={styles.photoCard}>
              <Link to={`/montre/${photo.watch_id}`} title={`Voir détails de ${photo.watch_brand} ${photo.watch_model}`}> 
                {photo.publicUrl ? (
                  <img 
                    src={photo.publicUrl} 
                    alt={`Montre ${photo.watch_brand || ''} ${photo.watch_model || ''} au poignet`} 
                    className={styles.photoImage}
                    loading="lazy" // Ajout du lazy loading pour les images
                  />
                ) : (
                  <div className={styles.photoPlaceholder}>📷 <span className={styles.srOnly}>Image non disponible</span></div>
                )}
              </Link>
              <div className={styles.photoInfo}>
                <p className={styles.watchName}>{photo.watch_brand} {photo.watch_model}</p>
                <p className={styles.userInfo}>
                  Par: 
                  {photo.user_username ? (
                    <Link to={`/profil/${photo.user_username}`} className={styles.profileLink} title={`Voir le profil de ${photo.user_username}`}>
                      {' '}{photo.user_username}
                    </Link>
                  ) : (
                    <span className={styles.anonymousUser}> Utilisateur anonyme</span> 
                  )}
                  {photo.user_wrist_size_cm && ` | Poignet: ${String(photo.user_wrist_size_cm).replace('.',',')} cm`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Bouton pour charger plus de photos */}
      {!loading && hasMorePhotos && photos.length > 0 && (
        <div className={styles.loadMoreContainer}>
          <button onClick={loadMorePhotos} className={styles.loadMoreButton} disabled={loading}>
            {loading ? 'Chargement...' : 'Charger plus'}
          </button>
        </div>
      )}
    </div>
  );
};

export default WristShotGalleryPage;
