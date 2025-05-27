// client/src/pages/WristShotGalleryPage/WristShotGalleryPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom'; // Assurez-vous que Link est importé
import { supabase } from '../lib/supabaseClient';
import styles from './WristShotGalleryPage.module.css';

interface GalleryPhoto {
  id: string; // Correspond à photo_id de la RPC
  storage_path: string; // Correspond à photo_storage_path
  publicUrl?: string;
  watch_id: string; 
  watch_brand?: string;
  watch_model?: string;
  user_username?: string | null; // Peut être null si l'username n'est pas défini
  user_wrist_size_cm?: number | null;
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


const WristShotGalleryPage: React.FC = () => {
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
        setAvailableBrands([]); 
      } finally {
        setLoadingFilters(false);
      }
    };
    fetchFilterOptions();
  }, []);

  const fetchWristShots = useCallback(async (pageToFetch = 1, resetPhotos = false) => {
    if (resetPhotos) {
        setPhotos([]); // Vider les photos existantes si resetPhotos est vrai
        setCurrentPage(1); // Réinitialiser la page actuelle
        setHasMorePhotos(true); // S'attendre à plus de photos
    }
    setLoading(true);
    setError(null); 

    try {
      const rpcParams = {
        selected_brand_filter: selectedBrand === '' ? null : selectedBrand,
        min_wrist_filter: wristSizeMinInput === '' ? null : parseFloat(wristSizeMinInput),
        max_wrist_filter: wristSizeMaxInput === '' ? null : parseFloat(wristSizeMaxInput),
        page_limit: photosPerPage,
        page_offset: (pageToFetch - 1) * photosPerPage
      };

      // Assurer que les valeurs numériques sont bien des nombres ou null
      if (isNaN(rpcParams.min_wrist_filter as number)) rpcParams.min_wrist_filter = null;
      if (isNaN(rpcParams.max_wrist_filter as number)) rpcParams.max_wrist_filter = null;
      
      console.log("Appel RPC get_public_wrist_shots avec params:", rpcParams);

      const { data: rpcData, error: rpcError } = await supabase.rpc('get_public_wrist_shots', rpcParams);

      if (rpcError) {
        console.error("Erreur RPC get_public_wrist_shots:", rpcError);
        setError(rpcError.message || "Erreur lors de la récupération des données de la galerie.");
        setPhotos([]); // Vider en cas d'erreur
        setHasMorePhotos(false);
        return; // Arrêter si la RPC échoue
      }

      console.log("Données brutes reçues de la RPC get_public_wrist_shots:", rpcData);

      if (rpcData && Array.isArray(rpcData)) {
        const newPhotos = (rpcData as RpcPhotoData[]).map((item) => {
          let publicUrl: string | null = null;
          if (item.photo_storage_path) {
            const { data: urlData } = supabase.storage
              .from('watch.images') // Assurez-vous que 'watch.images' est le nom de votre bucket
              .getPublicUrl(item.photo_storage_path);
            publicUrl = urlData?.publicUrl || null;
          }
          return {
            id: item.photo_id,
            storage_path: item.photo_storage_path,
            publicUrl: publicUrl,
            watch_id: item.watch_id,
            watch_brand: item.watch_brand,
            watch_model: item.watch_model,
            user_username: item.user_username || null, // Garder null si l'username n'est pas défini
            user_wrist_size_cm: item.user_wrist_size_cm,
          };
        }).filter(photo => photo.publicUrl); // Garder uniquement celles avec une URL valide

        if (resetPhotos || pageToFetch === 1) {
            setPhotos(newPhotos);
        } else {
            setPhotos(prevPhotos => [...prevPhotos, ...newPhotos]);
        }
        
        if (newPhotos.length < photosPerPage) {
            setHasMorePhotos(false);
        } else {
            setHasMorePhotos(true); // Il pourrait y en avoir plus
        }
        setCurrentPage(pageToFetch);

      } else {
        if (resetPhotos || pageToFetch === 1) setPhotos([]);
        setHasMorePhotos(false);
      }
    } catch (err: any) {
      console.error("Erreur dans fetchWristShots (catch global):", err);
      setError(err.message || "Impossible de charger la galerie.");
      if (resetPhotos || pageToFetch === 1) setPhotos([]); 
    } finally {
      setLoading(false);
    }
  }, [selectedBrand, wristSizeMinInput, wristSizeMaxInput, photosPerPage]); 

  // useEffect pour charger les photos initialement et lors du changement de filtres
  useEffect(() => {
    fetchWristShots(1, true); // Charger la première page et réinitialiser les photos
  }, [selectedBrand, wristSizeMinInput, wristSizeMaxInput, fetchWristShots]); // fetchWristShots est une dépendance

  const handleResetFilters = () => {
    setSelectedBrand('');
    setWristSizeMinInput('');
    setWristSizeMaxInput('');
    // Le useEffect ci-dessus s'occupera de re-fetcher avec la page 1 et resetPhotos=true
  };

  const loadMorePhotos = () => {
    if (!loading && hasMorePhotos) {
      fetchWristShots(currentPage + 1, false); // Ne pas réinitialiser les photos, ajouter à la suite
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
        <div className={styles.emptyMessage}>Aucune photo ne correspond à vos critères de recherche.</div>
      )}

      {photos.length > 0 && ( 
        <div className={styles.photosGrid}>
          {photos.map((photo) => (
            <div key={photo.id} className={styles.photoCard}>
              <Link to={`/montre/${photo.watch_id}`}> 
                {photo.publicUrl ? (
                  <img 
                    src={photo.publicUrl} 
                    alt={`Montre ${photo.watch_brand} ${photo.watch_model} au poignet`} 
                    className={styles.photoImage}
                  />
                ) : (
                  <div className={styles.photoPlaceholder}>📷</div>
                )}
              </Link>
              <div className={styles.photoInfo}>
                <p className={styles.watchName}>{photo.watch_brand} {photo.watch_model}</p>
                <p className={styles.userInfo}>
                  Par: 
                  {/* MODIFICATION ICI : Lien vers le profil public si user_username existe */}
                  {photo.user_username ? (
                    <Link to={`/profil/${photo.user_username}`} className={styles.profileLink}>
                      {' '}{photo.user_username}
                    </Link>
                  ) : (
                    // Fallback si pas de username, vous pouvez ajuster ce texte
                    ' Utilisateur anonyme' 
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
          <button onClick={loadMorePhotos} className={styles.loadMoreButton}>
            Charger plus
          </button>
        </div>
      )}
    </div>
  );
};

export default WristShotGalleryPage;