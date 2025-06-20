// client/src/pages/WristShotGalleryPage/WristShotGalleryPage.tsx

import { useState, useEffect, useCallback } from 'react';
import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient'; // Assurez-vous que ce chemin est correct
import styles from './WristShotGalleryPage.module.css';

interface GalleryPhoto {
  id: string; // Correspond à photo_id de la RPC
  storage_path: string; // Correspond à photo_storage_path
  publicUrl?: string; // Optionnel car on filtre les URL nulles après récupération
  watch_id: string;
  watch_brand?: string;
  watch_model?: string;
  user_username?: string | null;
  user_wrist_size_cm?: number | null;
  // Si la RPC renvoie le statut de la montre (maintenant watch_current_status), cela pourrait être ajouté ici :
  // watch_current_status?: 'in_collection' | 'for_sale' | 'for_exchange' | ... | null;
}

interface BrandFromRpc {
  brand: string;
}

interface RpcPhotoData {
  photo_id: string;
  photo_storage_path: string;
  watch_id: string;
  watch_brand: string;
  watch_model: string;
  user_username: string | null;
  user_wrist_size_cm: number | null;
  // Si votre RPC 'get_public_wrist_shots' renvoie le statut, assurez-vous que le nom de colonne est 'watch_current_status'
  // et non 'watch_status'. Si oui, ajoutez-le ici :
  // watch_current_status?: string | null;
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
  const [photosPerPage] = useState(20);
  const [hasMorePhotos, setHasMorePhotos] = useState(true);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      setLoadingFilters(true);
      try {
        const { data: brandsData, error: brandsError } = await supabase.rpc('get_gallery_available_brands');

        if (brandsError) {
          console.error("Erreur RPC get_gallery_available_brands:", brandsError);
          throw brandsError;
        }
        
        if (brandsData) {
          const uniqueBrands = (brandsData as BrandFromRpc[]).map(item => item.brand).sort();
          setAvailableBrands(uniqueBrands);
        } else {
          setAvailableBrands([]);
        }
      } catch (err: any) {
        console.error("Erreur dans fetchFilterOptions:", err);
        setError("Impossible de charger les options de filtre.");
        setAvailableBrands([]);
      } finally {
        setLoadingFilters(false);
      }
    };
    fetchFilterOptions();
  }, []);

  const fetchWristShots = useCallback(async (pageToFetch = 1, resetPhotosList = false) => {
    if (resetPhotosList) {
      setPhotos([]);
      setCurrentPage(1);
      setHasMorePhotos(true);
    }
    setLoading(true);
    setError(null);

    try {
      const rpcParams: { [key: string]: any } = {
        selected_brand_filter: selectedBrand === '' ? null : selectedBrand,
        min_wrist_filter: wristSizeMinInput === '' ? null : parseFloat(wristSizeMinInput),
        max_wrist_filter: wristSizeMaxInput === '' ? null : parseFloat(wristSizeMaxInput),
        page_limit: photosPerPage,
        page_offset: (pageToFetch - 1) * photosPerPage
      };

      if (isNaN(rpcParams.min_wrist_filter as number)) rpcParams.min_wrist_filter = null;
      if (isNaN(rpcParams.max_wrist_filter as number)) rpcParams.max_wrist_filter = null;
      
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_public_wrist_shots', rpcParams);

      if (rpcError) {
        console.error("Erreur RPC get_public_wrist_shots:", rpcError);
        setError(rpcError.message || "Erreur lors de la récupération des données de la galerie.");
        if (resetPhotosList || pageToFetch === 1) setPhotos([]);
        setHasMorePhotos(false);
        return;
      }

      if (rpcData && Array.isArray(rpcData)) {
        const newPhotosTransformed = (rpcData as RpcPhotoData[]).map((item): GalleryPhoto => {
          let photoPublicUrl: string | undefined = undefined;
          if (item.photo_storage_path) {
            const { data: urlData } = supabase.storage
              .from('watch.images')
              .getPublicUrl(item.photo_storage_path);
            photoPublicUrl = urlData?.publicUrl || undefined;
          }
          return {
            id: item.photo_id,
            storage_path: item.photo_storage_path,
            publicUrl: photoPublicUrl,
            watch_id: item.watch_id,
            watch_brand: item.watch_brand,
            watch_model: item.watch_model,
            user_username: item.user_username || null,
            user_wrist_size_cm: item.user_wrist_size_cm,
            // Si la RPC retourne watch_current_status, l'ajouter ici:
            // watch_current_status: item.watch_current_status,
          };
        })
        .filter(photo => photo.publicUrl);

        if (resetPhotosList || pageToFetch === 1) {
          setPhotos(newPhotosTransformed);
        } else {
          setPhotos(prevPhotos => [...prevPhotos, ...newPhotosTransformed]);
        }
        
        if (newPhotosTransformed.length < photosPerPage) {
          setHasMorePhotos(false);
        } else {
          setHasMorePhotos(true);
        }
        setCurrentPage(pageToFetch);

      } else {
        if (resetPhotosList || pageToFetch === 1) setPhotos([]);
        setHasMorePhotos(false);
      }
    } catch (err: any) {
      console.error("Erreur dans fetchWristShots (catch global):", err);
      setError(err.message || "Impossible de charger la galerie.");
      if (resetPhotosList || pageToFetch === 1) setPhotos([]); 
      setHasMorePhotos(false);
    } finally {
      setLoading(false);
    }
  }, [selectedBrand, wristSizeMinInput, wristSizeMaxInput, photosPerPage]);

  useEffect(() => {
    fetchWristShots(1, true);
  }, [fetchWristShots]);

  const handleResetFilters = () => {
    setSelectedBrand('');
    setWristSizeMinInput('');
    setWristSizeMaxInput('');
  };

  const loadMorePhotos = () => {
    if (!loading && hasMorePhotos) {
      fetchWristShots(currentPage + 1, false);
    }
  };

  return (
    <div className={styles.galleryPageContainer}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Galerie au Poignet</h1>
      </header>

      <div className={styles.filtersContainer}>
        <div className={styles.filterGroup}>
          <label htmlFor="brandFilter" className={styles.filterLabel}>Marque :</label>
          <select 
            id="brandFilter" 
            value={selectedBrand} 
            onChange={(e) => setSelectedBrand(e.target.value)}
            className={styles.filterSelect}
            disabled={loadingFilters || loading}
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
              disabled={loading}
              step="0.5"
            />
            <span>-</span>
            <input 
              type="number"
              id="wristSizeMax"
              value={wristSizeMaxInput}
              onChange={(e) => setWristSizeMaxInput(e.target.value)}
              placeholder="Max."
              className={styles.filterInput}
              disabled={loading}
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

      {loading && photos.length === 0 && !error && <div className={styles.loadingMessage}>Chargement de la galerie...</div>}
      {error && <div className={`${styles.message} ${styles.errorMessage}`}>Erreur : {error}</div>}
      {!loading && !error && photos.length === 0 && (
        <div className={`${styles.message} ${styles.emptyMessage}`}>Aucune photo ne correspond à vos critères de recherche.</div>
      )}

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
                    loading="lazy"
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
