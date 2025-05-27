// client/src/pages/WatchDetailPage.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import styles from './WatchDetailPage.module.css';

interface PhotoDetail {
  storage_path: string;
  is_main_photo: boolean;
  photo_type: 'watch_only' | 'wrist_shot';
  publicUrl?: string;
}

interface WatchDetails {
  id: string;
  brand: string;
  model: string;
  reference_number?: string | null;
  movement?: string | null;
  year_of_production?: number | null;
  case_diameter_mm?: number | null;
  dial_color?: string | null;
  case_material?: string | null;
  bracelet_material?: string | null;
  purchase_price?: number | null;
  purchase_date?: string | null;
  purchase_location?: string | null;
  notes_history?: string | null;
  current_estimated_value?: number | null;
  bracelet_type?: string | null;
  condition?: string | null;
  lug_to_lug_mm?: number | null;
  lug_width_mm?: number | null;
  box_papers_status?: string | null;
  last_service_date?: string | null;
  created_at: string;
  updated_at: string;
  photos: PhotoDetail[] | null;
  // Ajouts pour le statut
  status?: 'for_sale' | 'for_trade' | null;
  sale_price?: number | null;
}

const WatchDetailPage: React.FC = () => {
  const { watchId } = useParams<{ watchId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [watchDetails, setWatchDetails] = useState<WatchDetails | null>(null);
  const [loadingWatch, setLoadingWatch] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mainPhotoUrl, setMainPhotoUrl] = useState<string | null>(null);
  const [wristShotUrl, setWristShotUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchWatchDetails = async () => {
      if (!user || !watchId) {
        if (!authLoading) setLoadingWatch(false);
        return;
      }
      setLoadingWatch(true);
      setError(null);
      setMainPhotoUrl(null);
      setWristShotUrl(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('watches')
          .select(`
            *,
            photos (
              storage_path,
              is_main_photo,
              photo_type
            )
          `)
          .eq('id', watchId)
          .eq('user_id', user.id)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            setError("Montre non trouvée ou vous n'avez pas la permission de la voir.");
          } else {
            throw fetchError;
          }
        }

        if (data) {
          setWatchDetails(data as WatchDetails); // Cast avec les nouveaux champs
          if (data.photos && data.photos.length > 0) {
            const mainPhotoInfo = data.photos.find(
              (p: PhotoDetail) => p.is_main_photo && p.photo_type === 'watch_only'
            );
            if (mainPhotoInfo?.storage_path) {
              const { data: urlData } = supabase.storage
                .from('watch.images')
                .getPublicUrl(mainPhotoInfo.storage_path);
              setMainPhotoUrl(urlData?.publicUrl || null);
            }

            const wristShotInfo = data.photos.find(
              (p: PhotoDetail) => p.photo_type === 'wrist_shot'
            );
            if (wristShotInfo?.storage_path) {
              const { data: urlData } = supabase.storage
                .from('watch.images')
                .getPublicUrl(wristShotInfo.storage_path);
              setWristShotUrl(urlData?.publicUrl || null);
            }
          }
        } else {
          setWatchDetails(null);
        }

      } catch (err: any) {
        console.error("WatchDetailPage: Erreur détaillée lors de la récupération des détails:", err);
        setError(err.error_description || err.message || "Impossible de charger les détails de la montre.");
      } finally {
        setLoadingWatch(false);
      }
    };

    if (user && !authLoading && watchId) {
      fetchWatchDetails();
    } else if (!authLoading && !user) {
      setLoadingWatch(false);
    }
  }, [user, authLoading, watchId]);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Date invalide";
      const adjustedDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
      return adjustedDate.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      console.error("Erreur de formatage de date:", e);
      return "Date invalide";
    }
  };

  const renderDetail = (label: string, value?: string | number | null, isDate: boolean = false) => {
    if (value === null || value === undefined || String(value).trim() === '') return null;
    const displayValue = isDate ? formatDate(String(value)) : String(value);
    if (displayValue === "Date invalide" && isDate) return null;

    return (
      <div className={styles.detailItem}>
        <span className={styles.detailLabel}>{label}:</span>
        <span className={styles.detailValue}>{displayValue}</span>
      </div>
    );
  };

  let primaryDisplayUrl: string | null = mainPhotoUrl;
  let primaryDisplayAltText: string = watchDetails ? `Photo principale de ${watchDetails.brand} ${watchDetails.model}` : "Photo principale";

  if (!primaryDisplayUrl && wristShotUrl) {
    primaryDisplayUrl = wristShotUrl;
    primaryDisplayAltText = watchDetails ? `Photo au poignet de ${watchDetails.brand} ${watchDetails.model}` : "Photo au poignet";
  }

  const showSeparateWristShot = wristShotUrl && (mainPhotoUrl && wristShotUrl !== mainPhotoUrl);

  if (authLoading || loadingWatch) {
    return (
      <div className={styles.pageStateContainer}>
        <p>Chargement des détails de la montre...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.pageStateContainer}>
        <p className={styles.errorMessage}>{error}</p>
        <Link to="/ma-collection" className={styles.backLink}>Retour à ma collection</Link>
      </div>
    );
  }

  if (!watchDetails) {
    return (
      <div className={styles.pageStateContainer}>
        <p>Aucun détail trouvé pour cette montre.</p>
        <Link to="/ma-collection" className={styles.backLink}>Retour à ma collection</Link>
      </div>
    );
  }

  return (
    <div className={styles.watchDetailPageContainer}>
      <Link to="/ma-collection" className={styles.backLink}>&larr; Retour à Ma Collection</Link>

      <header className={styles.watchHeader}>
        <h1 className={styles.watchTitle}>{watchDetails.brand} - {watchDetails.model}</h1>
        {watchDetails.reference_number && <p className={styles.watchReference}>Réf : {watchDetails.reference_number}</p>}
         {/* Affichage du statut */}
         {watchDetails.status === 'for_sale' && (
          <div className={styles.statusBadgeForSale}>
            À VENDRE
            {watchDetails.sale_price ? ` - ${watchDetails.sale_price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}` : ''}
          </div>
        )}
        {watchDetails.status === 'for_trade' && (
          <div className={styles.statusBadgeForTrade}>
            À ÉCHANGER
          </div>
        )}
      </header>

      <div className={styles.watchContentGrid}>
        <div className={styles.watchImageSection}>
          {primaryDisplayUrl ? (
            <img
              src={primaryDisplayUrl}
              alt={primaryDisplayAltText}
              className={styles.mainImage}
            />
          ) : (
            <div className={styles.mainImagePlaceholder}>
              <span>📷</span>
              <p>Image non disponible</p>
            </div>
          )}
          {showSeparateWristShot && wristShotUrl && (
            <img
              src={wristShotUrl}
              alt={watchDetails ? `Photo au poignet de ${watchDetails.brand} ${watchDetails.model}` : "Photo au poignet"}
              className={styles.wristShotImage}
            />
          )}
        </div>

        <div className={styles.watchDetailsSection}>
          <div className={styles.detailBlock}>
            <h2 className={styles.sectionTitle}>Informations Générales</h2>
            {renderDetail("Année de production", watchDetails.year_of_production)}
            {renderDetail("Mouvement", watchDetails.movement)}
            {renderDetail("État", watchDetails.condition)}
            {renderDetail("Boîte & Papiers", watchDetails.box_papers_status)}
            {renderDetail("Dernière Révision", watchDetails.last_service_date, true)}
          </div>

          <div className={styles.detailBlock}>
            <h2 className={styles.sectionTitle}>Caractéristiques Physiques</h2>
            {renderDetail("Diamètre Boîtier", watchDetails.case_diameter_mm ? `${watchDetails.case_diameter_mm} mm` : null)}
            {renderDetail("Corne à Corne", watchDetails.lug_to_lug_mm ? `${watchDetails.lug_to_lug_mm} mm` : null)}
            {renderDetail("Entrecorne", watchDetails.lug_width_mm ? `${watchDetails.lug_width_mm} mm` : null)}
            {renderDetail("Couleur du Cadran", watchDetails.dial_color)}
            {renderDetail("Matériau Boîtier", watchDetails.case_material)}
            {renderDetail("Matériau Bracelet", watchDetails.bracelet_material)}
            {renderDetail("Type de Bracelet", watchDetails.bracelet_type)}
          </div>

          <div className={styles.detailBlock}>
            <h2 className={styles.sectionTitle}>Achat & Valeur</h2>
            {renderDetail("Prix d'Achat", watchDetails.purchase_price ? `${watchDetails.purchase_price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}` : null)}
            {renderDetail("Date d'Achat", watchDetails.purchase_date, true)}
            {renderDetail("Lieu d'Achat", watchDetails.purchase_location)}
            {renderDetail("Valeur Estimée Actuelle", watchDetails.current_estimated_value ? `${watchDetails.current_estimated_value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}` : null)}
          </div>
        </div>
      </div>

      {watchDetails.notes_history && (
        <div className={`${styles.detailBlock} ${styles.notesSection}`}>
          <h2 className={styles.sectionTitle}>Histoire & Notes Personnelles</h2>
          <p className={styles.notesText}>{watchDetails.notes_history}</p>
        </div>
      )}
      <div className={styles.actionsContainer}>
        <Link to={`/montre/${watchId}/modifier`} className={styles.editButton}>Modifier</Link>
      </div>
    </div>
  );
};

export default WatchDetailPage;