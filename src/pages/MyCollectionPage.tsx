// client/src/pages/MyCollectionPage.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import styles from './MyCollectionPage.module.css';

interface PhotoInfo {
  storage_path: string;
  is_main_photo: boolean;
  photo_type: 'watch_only' | 'wrist_shot';
  id: string;
}

interface Watch {
  id: string;
  brand: string;
  model: string;
  year_of_production?: number | null;
  reference_number?: string | null;
  case_diameter_mm?: number | null;
  condition?: string | null;
  current_estimated_value?: number | '' | null;
  last_service_date?: string | null;
  current_status?: 'in_collection' | 'for_sale' | 'for_exchange' | 'consignment' | 'in_repair' | 'for_expertise' | 'sold_by_pro' | 'purchased_by_pro' | 'returned' | null;
  sale_price?: number | null;
  // MODIFICATION : Ajout des propriétés optionnelles pour corriger les erreurs de type
  photos?: PhotoInfo[] | null;
  main_photo_url?: string | null;
}

interface CollectionStats {
  totalWatches: number;
  totalEstimatedValue: number;
  uniqueBrands: number;
}

const MyCollectionPage: React.FC = () => {
  const { user, loading: authLoading, session } = useAuth();
  const navigate = useNavigate();
  const [watches, setWatches] = useState<Watch[]>([]);
  const [loadingWatches, setLoadingWatches] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingWatchId, setDeletingWatchId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const fetchWatches = useCallback(async () => {
    if (!user || !user.id) {
      setLoadingWatches(false);
      setWatches([]);
      return;
    }
    setError(null);
    setLoadingWatches(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('watches')
        .select(`
          id,
          brand,
          model,
          year_of_production,
          reference_number,
          case_diameter_mm,
          condition,
          current_estimated_value,
          last_service_date,
          current_status, 
          sale_price,
          photos (
            id,
            storage_path,
            is_main_photo,
            photo_type
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error("MyCollectionPage: Erreur lors de la récupération des montres:", fetchError);
        setError(fetchError.message);
        setWatches([]);
      } else if (data) {
        const watchesWithPhotoUrls = data.map(watch => {
          let photoToDisplay: PhotoInfo | undefined = undefined;
          let mainPhotoUrl: string | null = null;

          if (watch.photos && Array.isArray(watch.photos) && watch.photos.length > 0) {
            photoToDisplay = watch.photos.find(
              (p: PhotoInfo) => p.is_main_photo === true && p.photo_type === 'watch_only'
            );

            if (!photoToDisplay) {
              photoToDisplay = watch.photos.find(
                (p: PhotoInfo) => p.photo_type === 'wrist_shot'
              );
            }

            if (photoToDisplay && photoToDisplay.storage_path) {
              const { data: urlData } = supabase.storage
                .from('watch.images')
                .getPublicUrl(photoToDisplay.storage_path);
              mainPhotoUrl = urlData?.publicUrl || null;
            }
          }
          return { ...watch, main_photo_url: mainPhotoUrl };
        });
        setWatches(watchesWithPhotoUrls);
      } else {
        setWatches([]);
      }

    } catch (err: any) {
      console.error("MyCollectionPage: Erreur inattendue dans fetchWatches:", err);
      setError(err.message || "Une erreur inattendue est survenue lors du chargement de la collection.");
      setWatches([]);
    } finally {
      setLoadingWatches(false);
      setDeletingWatchId(null);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user && user.id) {
      fetchWatches();
    } else if (!authLoading && !user) {
      setLoadingWatches(false);
      setWatches([]);
    }
  }, [user, authLoading, session, fetchWatches]);

  const collectionStats = useMemo((): CollectionStats => {
    const totalWatches = watches.length;
    const totalEstimatedValue = watches.reduce((sum, watch) => {
      const value = typeof watch.current_estimated_value === 'number'
                    ? watch.current_estimated_value
                    : (watch.current_estimated_value === '' || watch.current_estimated_value === null ? 0 : parseFloat(String(watch.current_estimated_value)));
      return sum + (isNaN(value) ? 0 : value);
    }, 0);
    const uniqueBrands = new Set(watches.map(watch => watch.brand)).size;

    return {
      totalWatches,
      totalEstimatedValue,
      uniqueBrands,
    };
  }, [watches]);


  const handleDeleteWatch = async (watchId: string, photosToDelete: PhotoInfo[] | null) => {
    if (!user) {
      setError("Vous devez être connecté pour supprimer une montre.");
      return;
    }
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette montre et toutes ses photos ? Cette action est irréversible.")) {
      return;
    }

    setDeletingWatchId(watchId);
    setError(null);

    try {
      await supabase.from('watch_service_history').delete().eq('watch_id', watchId);
      await supabase.from('documents').delete().eq('watch_id', watchId);
      await supabase.from('invoice_items').delete().eq('watch_id', watchId);

      if (photosToDelete && photosToDelete.length > 0) {
        const photoPaths = photosToDelete.map(p => p.storage_path);
        const { error: storageError } = await supabase.storage
          .from('watch.images')
          .remove(photoPaths);
        if (storageError) {
          console.error("Erreur lors de la suppression des fichiers du stockage:", storageError);
        }
      }

      const { error: photosTableError } = await supabase
        .from('photos')
        .delete()
        .eq('watch_id', watchId)
        .eq('user_id', user.id);

      if (photosTableError) {
        throw new Error(`Erreur de suppression des photos de la base de données: ${photosTableError.message}`);
      }

      const { error: watchTableError } = await supabase
        .from('watches')
        .delete()
        .eq('id', watchId)
        .eq('user_id', user.id);

      if (watchTableError) {
        throw new Error(`Erreur de suppression de la montre: ${watchTableError.message}`);
      }
      setWatches(prevWatches => prevWatches.filter(w => w.id !== watchId));

    } catch (err: any) {
      console.error("Erreur lors de la suppression de la montre (catch global):", err);
      setError(err.message || "Impossible de supprimer la montre.");
    } finally {
      setDeletingWatchId(null);
    }
  };


  if (authLoading) {
    return (
      <div className={styles.pageStateContainer}>
        <p>Vérification de l'authentification...</p>
      </div>
    );
  }

  if (loadingWatches && !error && watches.length === 0 && user) {
    return (
      <div className={styles.pageStateContainer}>
        <p>Chargement de votre collection...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.pageStateContainer}>
        <p className={styles.errorMessage}>{error}</p>
        <button onClick={fetchWatches} className={styles.retryButton}>Réessayer</button>
      </div>
    );
  }

  return (
    <div className={styles.myCollectionPageContainer}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Ma Collection</h1>
      </header>

      <Link to="/ajouter-montre" className={styles.addWatchButton}>
        Ajouter une Montre
      </Link>

      {!loadingWatches && watches.length > 0 && (
        <div className={styles.collectionSummary}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryValue}>{collectionStats.totalWatches}</span>
            <span className={styles.summaryLabel}>Montre{collectionStats.totalWatches > 1 ? 's' : ''}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryValue}>
              {collectionStats.totalEstimatedValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            <span className={styles.summaryLabel}>Valeur Estimée</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryValue}>{collectionStats.uniqueBrands}</span>
            <span className={styles.summaryLabel}>Marque{collectionStats.uniqueBrands > 1 ? 's' : ''} Unique{collectionStats.uniqueBrands > 1 ? 's' : ''}</span>
          </div>
        </div>
      )}


      {watches.length === 0 && !loadingWatches && user ? (
        <div className={styles.emptyCollection}>
          <p>Votre collection est actuellement vide.</p>
          <p>Commencez par <Link to="/ajouter-montre">ajouter votre première pièce</Link> !</p>
        </div>
      ) : (
        !loadingWatches && watches.length > 0 && (
          <div className={styles.watchesGrid}>
            {watches.map((watch) => {
              const isCurrentlyDeleting = deletingWatchId === watch.id;
              return (
                <div key={watch.id} className={styles.watchCard}>
                  {watch.current_status === 'for_sale' && (
                    <div className={styles.cardStatusIndicatorSale} title={watch.sale_price ? `À vendre : ${watch.sale_price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}` : 'À vendre'}>
                      💰 {watch.sale_price ? `${watch.sale_price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits:0, maximumFractionDigits:0 })}` : ''}
                    </div>
                  )}
                  {watch.current_status === 'for_exchange' && (
                    <div className={styles.cardStatusIndicatorTrade} title="À échanger">
                      🔄 À échanger
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (watch.photos) {
                          handleDeleteWatch(watch.id, watch.photos);
                      }
                    }}
                    className={styles.deleteWatchButtonCard}
                    disabled={isCurrentlyDeleting}
                    aria-label="Supprimer la montre"
                  >
                    {isCurrentlyDeleting ? '...' : '×'}
                  </button>
                  <Link to={`/montre/${watch.id}`} className={styles.watchCardLink}>
                    <div className={styles.watchImageContainer}>
                      {watch.main_photo_url ? (
                        <img
                          src={watch.main_photo_url}
                          alt={`${watch.brand} ${watch.model}`}
                          className={styles.watchImage}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            const parent = (e.target as HTMLImageElement).parentNode;
                            if (parent) {
                              let placeholder = parent.querySelector(`.${styles.imageLoadErrorPlaceholder}`);
                              if (!placeholder) {
                                  placeholder = document.createElement('div');
                                  placeholder.className = `${styles.watchImagePlaceholder} ${styles.imageLoadErrorPlaceholder}`;
                                  placeholder.innerHTML = '<span>⚠️</span><p style="font-size:0.7rem; text-align: center;">Erreur image</p>';
                                  parent.appendChild(placeholder);
                              }
                            }
                          }}
                        />
                      ) : (
                        <div className={styles.watchImagePlaceholder}>
                          <span>⌚</span>
                        </div>
                      )}
                    </div>
                    <div className={styles.watchInfo}>
                      <h3 className={styles.watchBrandModel}>{watch.brand}</h3>
                      <p className={styles.watchModelName}>{watch.model}</p>
                      {watch.reference_number && <p className={styles.watchDetail}>Réf : {watch.reference_number}</p>}
                      {watch.year_of_production && <p className={styles.watchDetail}>Année : {watch.year_of_production}</p>}
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
};

export default MyCollectionPage;