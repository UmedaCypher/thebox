// client/src/pages/WatchEditorPage/WatchEditorPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import type { FileWithPath } from 'react-dropzone';
import { useDropzone } from 'react-dropzone';
import styles from './WatchEditorPage.module.css';

// Interfaces
export interface WatchFormData {
  brand: string;
  model: string;
  reference_number: string | null;
  year_of_production: number | '' | null;
  case_diameter_mm: string | null;
  notes_history: string | null;
  bracelet_type: string | null;
  condition: string | null;
  lug_to_lug_mm: string | null;
  lug_width_mm: string | null;
  box_papers_status: string | null;
  movement: string | null;
  dial_color: string | null;
  case_material: string | null;
  bracelet_material: string | null;
  purchase_price: number | '' | null;
  purchase_date: string | null;
  purchase_location: string | null;
  current_estimated_value: number | '' | null;
  last_service_date?: string | null;
  // MODIFICATION ICI : Statuts 'for_sale' et 'for_exchange' sont universels
  current_status: 'in_collection' | 'for_sale' | 'for_exchange' | 'consignment' | 'in_repair' | 'for_expertise' | 'sold_by_pro' | 'purchased_by_pro' | 'returned' | null;
  sale_price: number | '' | null;
}

interface Option { id: string; name: string; }
interface UploadableFile extends FileWithPath { preview: string; }

// Fonctions utilitaires pour les options
const generateNumericOptions = (start: number, end: number, step: number, unit: string = 'mm', includeEmpty: boolean = true) => {
  const options = includeEmpty ? [{ value: '', label: 'Sélectionnez...' }] : [];
  for (let i = start; i <= end; i += step) {
    const value = parseFloat(i.toFixed(1));
    options.push({ value: String(value), label: `${value} ${unit}` });
  }
  return options;
};
const caseDiameterOptions = generateNumericOptions(20, 50, 0.5);
const lugToLugOptions = generateNumericOptions(30, 60, 0.5);
const lugWidthOptions = generateNumericOptions(10, 26, 1);

const WatchEditorPage: React.FC = () => {
  const { watchId } = useParams<{ watchId?: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const isEditMode = Boolean(watchId);

  // États pour les données du formulaire
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [referenceNumber, setReferenceNumber] = useState<string | null>('');
  const [yearOfProduction, setYearOfProduction] = useState<number | ''>('');
  const [caseDiameterMm, setCaseDiameterMm] = useState<string>('');
  const [notesHistory, setNotesHistory] = useState<string | null>('');
  const [braceletType, setBraceletType] = useState<string | null>('');
  const [condition, setCondition] = useState<string | null>('');
  const [lugToLugMm, setLugToLugMm] = useState<string>('');
  const [lugWidthMm, setLugWidthMm] = useState<string>('');
  const [boxPapersStatus, setBoxPapersStatus] = useState<string | null>('');
  const [movement, setMovement] = useState<string | null>('');
  const [dialColor, setDialColor] = useState<string | null>('');
  const [caseMaterial, setCaseMaterial] = useState<string | null>('');
  const [braceletMaterial, setBraceletMaterial] = useState<string | null>('');
  const [purchasePrice, setPurchasePrice] = useState<number | ''>('');
  const [purchaseDate, setPurchaseDate] = useState<string | null>('');
  const [purchaseLocation, setPurchaseLocation] = useState<string | null>('');
  const [currentEstimatedValue, setCurrentEstimatedValue] = useState<number | ''>('');
  const [lastServiceDate, setLastServiceDate] = useState<string | null>('');

  // MODIFICATION ICI : Statuts 'for_sale' et 'for_exchange' sont universels
  const [currentStatus, setCurrentStatus] = useState<'in_collection' | 'for_sale' | 'for_exchange' | 'consignment' | 'in_repair' | 'for_expertise' | 'sold_by_pro' | 'purchased_by_pro' | 'returned' | null>(null);
  const [salePrice, setSalePrice] = useState<number | ''>('');

  const [watchOnlyFile, setWatchOnlyFile] = useState<UploadableFile | null>(null);
  const [wristShotFile, setWristShotFile] = useState<UploadableFile | null>(null);

  const [brandOptions, setBrandOptions] = useState<Option[]>([]);
  const [conditionOptions, setConditionOptions] = useState<Option[]>([]);
  const [boxPapersOptions, setBoxPapersOptions] = useState<Option[]>([]);
  const [materialOptions, setMaterialOptions] = useState<Option[]>([]);
  const [dialColorOptions, setDialColorOptions] = useState<Option[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [pageLoading, setPageLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);

  // NOUVEL ÉTAT pour le type de compte du profil
  const [userAccountType, setUserAccountType] = useState<'free' | 'pro_basic' | 'pro_premium' | 'admin' | null>(null);


  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // NOUVEAU useEffect pour récupérer le type de compte
  useEffect(() => {
    const fetchUserAccountType = async () => {
      if (user) {
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('account_type')
            .eq('id', user.id)
            .single();

          if (profileError) {
            console.error("Error fetching profile account type:", profileError);
            setUserAccountType('free'); // Fallback to free if error or not found
          } else if (profileData) {
            setUserAccountType(profileData.account_type);
          } else {
            setUserAccountType('free'); // Default if no profile found
          }
        } catch (err) {
          console.error("Unexpected error fetching account type:", err);
          setUserAccountType('free');
        }
      }
    };
    if (!authLoading) { // Fetch only after auth status is known
      fetchUserAccountType();
    }
  }, [user, authLoading]);


  useEffect(() => {
    if (isEditMode && user && watchId) {
      setPageLoading(true);
      const fetchWatchData = async () => {
        try {
          const { data, error } = await supabase
            .from('watches')
            .select('*') 
            .eq('id', watchId)
            .eq('user_id', user.id)
            .single();

          if (error) {
            console.error("Erreur chargement données montre (édition):", error);
            if (error.code === 'PGRST116') setFormError("Montre non trouvée ou accès non autorisé.");
            else throw error;
          }
          if (data) {
            setBrand(data.brand || '');
            setModel(data.model || '');
            setReferenceNumber(data.reference_number || '');
            setMovement(data.movement || '');
            setYearOfProduction(data.year_of_production || '');
            setCaseDiameterMm(String(data.case_diameter_mm || ''));
            setDialColor(data.dial_color || '');
            setCaseMaterial(data.case_material || '');
            setBraceletMaterial(data.bracelet_material || '');
            setPurchasePrice(data.purchase_price === null ? '' : data.purchase_price);
            setPurchaseDate(data.purchase_date || '');
            setPurchaseLocation(data.purchase_location || '');
            setNotesHistory(data.notes_history || '');
            setCurrentEstimatedValue(data.current_estimated_value === null ? '' : data.current_estimated_value);
            setBraceletType(data.bracelet_type || '');
            setCondition(data.condition || '');
            setLugToLugMm(String(data.lug_to_lug_mm || ''));
            setLugWidthMm(String(data.lug_width_mm || ''));
            setBoxPapersStatus(data.box_papers_status || '');
            setLastServiceDate(data.last_service_date || '');
            setCurrentStatus(data.current_status || null); 
            setSalePrice(data.sale_price === null ? '' : data.sale_price); 
          } else if (!error) {
            setFormError("Aucune donnée trouvée pour cette montre ou accès non autorisé.");
          }
        } catch (err: any) {
          console.error("Exception chargement données montre (édition):", err);
          setFormError(err.message || "Erreur chargement des données de la montre.");
        } finally {
          setPageLoading(false);
        }
      };
      fetchWatchData();
    } else if (!isEditMode) { // Mode Ajout
        setBrand(''); setModel(''); setReferenceNumber(''); setMovement('');
        setYearOfProduction(''); setCaseDiameterMm(''); setDialColor('');
        setCaseMaterial(''); setBraceletMaterial(''); setPurchasePrice('');
        setPurchaseDate(''); setPurchaseLocation(''); setNotesHistory('');
        setCurrentEstimatedValue(''); setBraceletType(''); setCondition('');
        setLugToLugMm(''); setLugWidthMm(''); setBoxPapersStatus('');
        setLastServiceDate('');
        setCurrentStatus(null);
        setSalePrice('');
        setWatchOnlyFile(null); setWristShotFile(null);
        setPageLoading(false);
    }
  }, [watchId, user, isEditMode, navigate]);


  useEffect(() => {
    const fetchOptions = async () => {
      setLoadingOptions(true);
      try {
        const [brandsRes, conditionsRes, boxPapersRes, materialsRes, dialColorsRes] = await Promise.all([
          supabase.from('brands').select('id, name').order('name', { ascending: true }),
          supabase.from('watch_conditions').select('id, name').order('sort_order', { ascending: true }),
          supabase.from('box_papers_options').select('id, name').order('sort_order', { ascending: true }),
          supabase.from('materials').select('id, name').order('name', { ascending: true }),
          supabase.from('dial_colors').select('id, name').order('name', { ascending: true })
        ]);
        setBrandOptions(brandsRes.data?.map(item => ({ id: item.id, name: item.name })) || []);
        setConditionOptions(conditionsRes.data?.map(item => ({ id: item.id, name: item.name })) || []);
        setBoxPapersOptions(boxPapersRes.data?.map(item => ({ id: item.id, name: item.name })) || []);
        setMaterialOptions(materialsRes.data?.map(item => ({ id: item.id, name: item.name })) || []);
        setDialColorOptions(dialColorsRes.data?.map(item => ({ id: item.id, name: item.name })) || []);
      } catch (err) { console.error("Erreur chargement options selects:", err); }
      finally { setLoadingOptions(false); }
    };
    fetchOptions();
  }, []);

  const removeWatchOnlyFile = useCallback(() => { if (watchOnlyFile) URL.revokeObjectURL(watchOnlyFile.preview); setWatchOnlyFile(null); }, [watchOnlyFile]);
  const removeWristShotFile = useCallback(() => { if (wristShotFile) URL.revokeObjectURL(wristShotFile.preview); setWristShotFile(null); }, [wristShotFile]);

  const onDropWatchOnly = useCallback((acceptedFiles: FileWithPath[]) => { if (acceptedFiles?.[0]) { if (watchOnlyFile) URL.revokeObjectURL(watchOnlyFile.preview); setWatchOnlyFile(Object.assign(acceptedFiles[0], { preview: URL.createObjectURL(acceptedFiles[0]) })); }}, [watchOnlyFile]);
  const onDropWristShot = useCallback((acceptedFiles: FileWithPath[]) => { if (acceptedFiles?.[0]) { if (wristShotFile) URL.revokeObjectURL(wristShotFile.preview); setWristShotFile(Object.assign(acceptedFiles[0], { preview: URL.createObjectURL(acceptedFiles[0]) })); }}, [wristShotFile]);

  const { getRootProps: getRootPropsWatchOnly, getInputProps: getInputPropsWatchOnly, isDragActive: isDragActiveWatchOnly } = useDropzone({ onDrop: onDropWatchOnly, accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] }, maxFiles: 1, maxSize: 5 * 1024 * 1024 });
  const { getRootProps: getRootPropsWristShot, getInputProps: getInputPropsWristShot, isDragActive: isDragActiveWristShot } = useDropzone({ onDrop: onDropWristShot, accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] }, maxFiles: 1, maxSize: 5 * 1024 * 1024 });

  useEffect(() => {
    return () => {
      if (watchOnlyFile) URL.revokeObjectURL(watchOnlyFile.preview);
      if (wristShotFile) URL.revokeObjectURL(wristShotFile.preview);
    };
  }, [watchOnlyFile, wristShotFile]);

  const uploadPhotoAndRecord = async (file: UploadableFile, currentWatchIdForUpload: string, photoType: 'watch_only' | 'wrist_shot', isMain: boolean = false) => {
    if (!user) {
        console.error("uploadPhotoAndRecord: User not authenticated for upload.");
        throw new Error("Utilisateur non authentifié pour l'upload.");
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${user.id}/${currentWatchIdForUpload}/${photoType}/${fileName}`;

    const { error: uploadError } = await supabase.storage.from('watch.images').upload(filePath, file);
    if (uploadError) {
        console.error("uploadPhotoAndRecord: Storage upload error:", uploadError);
        throw new Error(`Échec de l'upload (${photoType}): ${uploadError.message}`);
    }

    const photoDataToInsert = {
      watch_id: currentWatchIdForUpload,
      user_id: user.id,
      storage_path: filePath,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      photo_type: photoType,
      is_main_photo: isMain,
    };

    const { error: recordError } = await supabase.from('photos').insert(photoDataToInsert);
    if (recordError) {
        console.error("uploadPhotoAndRecord: Database record error for 'photos':", recordError);
        throw new Error(`Échec enregistrement DB photo (${photoType}): ${recordError.message}`);
    }
    return filePath;
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      setFormError("Vous devez être connecté.");
      return;
    }
    setIsSubmitting(true);
    setFormError(null);
    setFormSuccessMessage(null);

    const currentFormData: WatchFormData = {
      brand, model, reference_number: referenceNumber, year_of_production: yearOfProduction,
      case_diameter_mm: caseDiameterMm, notes_history: notesHistory, bracelet_type: braceletType,
      condition, lug_to_lug_mm: lugToLugMm, lug_width_mm: lugWidthMm, box_papers_status: boxPapersStatus,
      movement, dial_color: dialColor, case_material: caseMaterial, bracelet_material: braceletMaterial,
      purchase_price: purchasePrice, purchase_date: purchaseDate, purchase_location: purchaseLocation,
      current_estimated_value: currentEstimatedValue,
      last_service_date: lastServiceDate,
      current_status: currentStatus, 
      sale_price: salePrice,
    };

    const watchDataForDb = {
      user_id: user.id,
      brand: currentFormData.brand,
      model: currentFormData.model,
      reference_number: currentFormData.reference_number,
      movement: currentFormData.movement,
      year_of_production: currentFormData.year_of_production === '' ? null : Number(currentFormData.year_of_production),
      case_diameter_mm: currentFormData.case_diameter_mm === '' || currentFormData.case_diameter_mm === null ? null : parseFloat(currentFormData.case_diameter_mm),
      dial_color: currentFormData.dial_color,
      case_material: currentFormData.case_material,
      bracelet_material: currentFormData.bracelet_material,
      purchase_price: currentFormData.purchase_price === '' || currentFormData.purchase_price === null ? null : Number(currentFormData.purchase_price),
      purchase_date: currentFormData.purchase_date,
      purchase_location: currentFormData.purchase_location,
      notes_history: currentFormData.notes_history,
      current_estimated_value: currentFormData.current_estimated_value === '' || currentFormData.current_estimated_value === null ? null : Number(currentFormData.current_estimated_value),
      bracelet_type: currentFormData.bracelet_type,
      condition: currentFormData.condition,
      lug_to_lug_mm: currentFormData.lug_to_lug_mm === '' || currentFormData.lug_to_lug_mm === null ? null : parseFloat(currentFormData.lug_to_lug_mm),
      lug_width_mm: currentFormData.lug_width_mm === '' || currentFormData.lug_width_mm === null ? null : parseFloat(currentFormData.lug_width_mm),
      box_papers_status: currentFormData.box_papers_status,
      last_service_date: currentFormData.last_service_date === '' ? null : currentFormData.last_service_date,
      current_status: currentFormData.current_status, 
      // MODIFICATION ICI : La condition pour sale_price est simplifiée à 'for_sale'
      sale_price: currentFormData.current_status === 'for_sale' && currentFormData.sale_price !== '' && currentFormData.sale_price !== null ? Number(currentFormData.sale_price) : null,
    };

    try {
      let successMessageText = "";
      let currentWatchIdForOp = watchId;

      if (isEditMode && currentWatchIdForOp) {
        const { error: updateError } = await supabase
          .from('watches')
          .update({ ...watchDataForDb, updated_at: new Date().toISOString() })
          .eq('id', currentWatchIdForOp)
          .eq('user_id', user.id);
        if (updateError) {
            console.error("handleFormSubmit: Error updating watch:", updateError);
            throw updateError;
        }
        successMessageText = `Montre "${currentFormData.brand} ${currentFormData.model}" mise à jour !`;
      } else {
        const { data: watchInsertData, error: insertError } = await supabase
          .from('watches')
          .insert([{ ...watchDataForDb }]) 
          .select()
          .single();

        if (insertError) {
            console.error("handleFormSubmit: Error inserting new watch:", insertError);
            throw insertError;
        }
        if (!watchInsertData || !watchInsertData.id) {
            console.error("handleFormSubmit: Watch insert did not return data or ID.");
            throw new Error("La création de la montre n'a pas retourné d'ID valide.");
        }
        currentWatchIdForOp = watchInsertData.id;
        successMessageText = `Montre "${currentFormData.brand} ${currentFormData.model}" ajoutée !`;
      }

      if (currentWatchIdForOp) {
        let photoMessage = "";
        if (watchOnlyFile) {
          await uploadPhotoAndRecord(watchOnlyFile, currentWatchIdForOp, 'watch_only', true);
          photoMessage += " Photo principale traitée.";
        }
        if (wristShotFile) {
          await uploadPhotoAndRecord(wristShotFile, currentWatchIdForOp, 'wrist_shot', false);
          photoMessage += " Photo au poignet traitée.";
        }
        setFormSuccessMessage(`${successMessageText}${photoMessage}`);
      }

      if (!isEditMode) {
        setBrand(''); setModel(''); setReferenceNumber(''); setMovement('');
        setYearOfProduction(''); setCaseDiameterMm(''); setDialColor('');
        setCaseMaterial(''); setBraceletMaterial(''); setPurchasePrice('');
        setPurchaseDate(''); setPurchaseLocation(''); setNotesHistory('');
        setCurrentEstimatedValue(''); setBraceletType(''); setCondition('');
        setLugToLugMm(''); setLugWidthMm(''); setBoxPapersStatus('');
        setLastServiceDate('');
        setCurrentStatus(null); 
        setSalePrice('');
        removeWatchOnlyFile();
        removeWristShotFile();
      } else if (currentWatchIdForOp) {
        // Optionnel: Rediriger vers la page de détail après la modification
        // navigate(`/montre/${currentWatchIdForOp}`);
      }

    } catch (err: any) {
      console.error("Erreur soumission formulaire:", err);
      setFormError(err.message || (isEditMode ? "Erreur lors de la mise à jour." : "Erreur lors de l'ajout."));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || pageLoading) {
    return <div className={styles.pageLoading}>Chargement...</div>;
  }

  if (isEditMode && watchId && formError && !brand) {
     return <div className={styles.pageContainer}><p className={styles.errorMessage}>{formError}</p></div>;
  }

  // Fonction pour obtenir les options de statut en fonction du type de compte
  const getStatusOptions = () => {
    // Statuts de base, toujours disponibles pour tous
    const baseOptions = [
      { value: 'in_collection', label: 'Collection privée (aucun statut spécial)' },
      { value: 'for_sale', label: 'À vendre' },
      { value: 'for_exchange', label: 'À échanger' },
    ];

    // Si l'utilisateur est un compte Pro ou Admin, ajoutez les statuts professionnels
    if (userAccountType === 'pro_basic' || userAccountType === 'pro_premium' || userAccountType === 'admin') {
      return [
        ...baseOptions, // On garde les statuts de base
        { value: 'consignment', label: 'En dépôt-vente (Pro)' },
        { value: 'in_repair', label: 'En réparation (Pro)' },
        { value: 'for_expertise', label: 'En expertise (Pro)' },
        { value: 'purchased_by_pro', label: 'Achetée (en stock Pro)' },
        { value: 'sold_by_pro', label: 'Vendue (par le Pro)' },
        { value: 'returned', label: 'Retournée (client Pro)' },
        // Ajoutez d'autres statuts pro si nécessaire
      ];
    }
    // Pour les utilisateurs 'free' ou si le type de compte n'est pas encore chargé
    return baseOptions;
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.formCard}>
        <h1 className={styles.pageTitle}>{isEditMode ? 'Modifier la Montre' : 'Ajouter une Nouvelle Montre'}</h1>

        <form onSubmit={handleFormSubmit} className={styles.watchForm}>
          {formError && <p className={styles.errorMessage}>{formError}</p>}
          {formSuccessMessage && <p className={styles.successMessage}>{formSuccessMessage}</p>}

          <div className={styles.formSectionTitle}>Informations Générales</div>
          <div className={styles.formGrid}>
            <div className={styles.inputGroup}>
              <label htmlFor="brand" className={styles.inputLabel} data-required="*">Marque</label>
              <select id="brand" value={brand} onChange={(e) => setBrand(e.target.value)} required className={styles.selectField} disabled={isSubmitting || loadingOptions}>
                <option value="">Sélectionnez une marque</option>
                {brandOptions.map(opt => <option key={opt.id} value={opt.name}>{opt.name}</option>)}
              </select>
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="model" className={styles.inputLabel} data-required="*">Modèle</label>
              <input type="text" id="model" value={model} onChange={(e) => setModel(e.target.value)} required className={styles.inputField} disabled={isSubmitting} />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="referenceNumber" className={styles.inputLabel}>N° de Référence</label>
              <input type="text" id="referenceNumber" value={referenceNumber ?? ''} onChange={(e) => setReferenceNumber(e.target.value)} className={styles.inputField} disabled={isSubmitting} />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="movement" className={styles.inputLabel}>Mouvement</label>
              <input type="text" id="movement" value={movement ?? ''} onChange={(e) => setMovement(e.target.value)} className={styles.inputField} disabled={isSubmitting} placeholder="Ex: Automatique, Quartz..."/>
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="yearOfProduction" className={styles.inputLabel}>Année (approx.)</label>
              <input type="number" id="yearOfProduction" value={yearOfProduction} onChange={(e) => setYearOfProduction(e.target.value === '' ? '' : parseInt(e.target.value))} min="1800" max={new Date().getFullYear()} className={styles.inputField} disabled={isSubmitting} />
            </div>
          </div>

          <div className={styles.formSectionTitle}>Caractéristiques Physiques</div>
          <div className={styles.formGrid}>
            <div className={styles.inputGroup}>
              <label htmlFor="caseDiameterMm" className={styles.inputLabel}>Diamètre Boîtier (mm)</label>
              <select id="caseDiameterMm" value={caseDiameterMm} onChange={(e) => setCaseDiameterMm(e.target.value)} className={styles.selectField} disabled={isSubmitting}>
                {caseDiameterOptions.map(opt => <option key={`diam-${opt.value}`} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="lugToLugMm" className={styles.inputLabel}>Corne à Corne (mm)</label>
              <select id="lugToLugMm" value={lugToLugMm} onChange={(e) => setLugToLugMm(e.target.value)} className={styles.selectField} disabled={isSubmitting}>
                  {lugToLugOptions.map(opt => <option key={`ltl-${opt.value}`} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="lugWidthMm" className={styles.inputLabel}>Entrecorne (mm)</label>
              <select id="lugWidthMm" value={lugWidthMm} onChange={(e) => setLugWidthMm(e.target.value)} className={styles.selectField} disabled={isSubmitting}>
                {lugWidthOptions.map(opt => <option key={`lw-${opt.value}`} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="dialColor" className={styles.inputLabel}>Couleur du Cadran</label>
              <select id="dialColor" value={dialColor ?? ''} onChange={(e) => setDialColor(e.target.value)} className={styles.selectField} disabled={isSubmitting || loadingOptions}>
                <option value="">Sélectionnez une couleur</option>
                {dialColorOptions.map(opt => <option key={opt.id} value={opt.name}>{opt.name}</option>)}
              </select>
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="caseMaterial" className={styles.inputLabel}>Matériau Boîtier</label>
              <select id="caseMaterial" value={caseMaterial ?? ''} onChange={(e) => setCaseMaterial(e.target.value)} className={styles.selectField} disabled={isSubmitting || loadingOptions}>
                <option value="">Sélectionnez un matériau</option>
                {materialOptions.map(opt => <option key={opt.id} value={opt.name}>{opt.name}</option>)}
              </select>
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="braceletMaterial" className={styles.inputLabel}>Matériau Bracelet</label>
              <select id="braceletMaterial" value={braceletMaterial ?? ''} onChange={(e) => setBraceletMaterial(e.target.value)} className={styles.selectField} disabled={isSubmitting || loadingOptions}>
                <option value="">Sélectionnez un matériau</option>
                {materialOptions.map(opt => <option key={opt.id} value={opt.name}>{opt.name}</option>)}
              </select>
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="braceletType" className={styles.inputLabel}>Type de Bracelet Spécifique</label>
              <input type="text" id="braceletType" value={braceletType ?? ''} onChange={(e) => setBraceletType(e.target.value)} className={styles.inputField} disabled={isSubmitting} placeholder="Ex: Oyster, Jubilee..."/>
            </div>
          </div>

          <div className={styles.formSectionTitle}>Informations d'Achat & Valeur</div>
            <div className={styles.formGrid}>
            <div className={styles.inputGroup}>
              <label htmlFor="purchasePrice" className={styles.inputLabel}>Prix d'Achat (€)</label>
              <input type="number" id="purchasePrice" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value === '' ? '' : parseFloat(e.target.value))} step="0.01" min="0" className={styles.inputField} disabled={isSubmitting} />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="purchaseDate" className={styles.inputLabel}>Date d'Achat</label>
              <input type="date" id="purchaseDate" value={purchaseDate ?? ''} onChange={(e) => setPurchaseDate(e.target.value)} className={styles.inputField} disabled={isSubmitting} />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="purchaseLocation" className={styles.inputLabel}>Lieu d'Achat</label>
              <input type="text" id="purchaseLocation" value={purchaseLocation ?? ''} onChange={(e) => setPurchaseLocation(e.target.value)} className={styles.inputField} disabled={isSubmitting} />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="currentEstimatedValue" className={styles.inputLabel}>Valeur Estimée (si connue, €)</label>
              <input type="number" id="currentEstimatedValue" value={currentEstimatedValue} onChange={(e) => setCurrentEstimatedValue(e.target.value === '' ? '' : parseFloat(e.target.value))} step="0.01" min="0" className={styles.inputField} disabled={isSubmitting} />
            </div>
          </div>

          <div className={styles.formSectionTitle}>État, Documentation, Révision & Statut</div>
          <div className={styles.formGrid}>
            <div className={styles.inputGroup}>
              <label htmlFor="condition" className={styles.inputLabel}>État</label>
              <select id="condition" value={condition ?? ''} onChange={(e) => setCondition(e.target.value)} className={styles.selectField} disabled={isSubmitting || loadingOptions}>
                <option value="">Sélectionnez un état</option>
                {conditionOptions.map(opt => <option key={opt.id} value={opt.name}>{opt.name}</option>)}
              </select>
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="boxPapersStatus" className={styles.inputLabel}>Boîte & Papiers</label>
              <select id="boxPapersStatus" value={boxPapersStatus ?? ''} onChange={(e) => setBoxPapersStatus(e.target.value)} className={styles.selectField} disabled={isSubmitting || loadingOptions}>
                <option value="">Sélectionnez un statut</option>
                {boxPapersOptions.map(opt => <option key={opt.id} value={opt.name}>{opt.name}</option>)}
              </select>
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="lastServiceDate" className={styles.inputLabel}>Dernière Révision (Date)</label>
              <input
                type="date"
                id="lastServiceDate"
                value={lastServiceDate || ''}
                onChange={(e) => setLastServiceDate(e.target.value)}
                className={styles.inputField}
                disabled={isSubmitting}
              />
            </div>
             {/* MODIFICATION ICI : Champ pour le statut de la montre avec les options dynamiques */}
            <div className={styles.inputGroup}>
                <label htmlFor="current_status" className={styles.inputLabel}>Statut de la montre :</label>
                <select
                    id="current_status"
                    value={currentStatus ?? ''}
                    onChange={(e) => {
                      const value = e.target.value; // On récupère la valeur brute (qui peut être "")
                      
                      // On met à jour l'état : si la valeur est "", on met null, sinon on la type.
                      const newStatus = value === '' ? null : (value as WatchFormData['current_status']);
                      setCurrentStatus(newStatus);

                      // La logique de réinitialisation du prix reste la même
                      if (newStatus !== 'for_sale') {
                          setSalePrice('');
                      }
                  }}
                    className={styles.selectField}
                    disabled={isSubmitting}
                >
                    {getStatusOptions().map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                </select>
            </div>
            {/* MODIFICATION ICI : Champ conditionnel pour le prix de vente basé sur le statut 'for_sale' */}
            {currentStatus === 'for_sale' && (
                <div className={styles.inputGroup}>
                    <label htmlFor="salePrice" className={styles.inputLabel}>Prix de vente (€) (optionnel) :</label>
                    <input
                        type="number"
                        id="salePrice"
                        value={salePrice}
                        onChange={(e) => setSalePrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        step="0.01"
                        min="0"
                        className={styles.inputField}
                        disabled={isSubmitting}
                        placeholder="Ex: 2500"
                    />
                </div>
            )}
          </div>

          <div className={styles.formSectionTitle}>Photos</div>
          <div className={styles.photoUploadGrid}>
            <div className={styles.dropzoneContainer}>
              <label htmlFor="watchOnlyDropzone" className={styles.inputLabel}>Photo de la montre (principale)</label>
              <div id="watchOnlyDropzone" {...getRootPropsWatchOnly()} className={`${styles.dropzone} ${isDragActiveWatchOnly ? styles.dropzoneActive : ''}`}>
                <input {...getInputPropsWatchOnly()} />
                {watchOnlyFile ? ( <div className={styles.previewContainer}><img src={watchOnlyFile.preview} alt="Aperçu montre" className={styles.imagePreview} /><p className={styles.fileName}>{watchOnlyFile.name}</p><button type="button" onClick={(e) => { e.stopPropagation(); removeWatchOnlyFile();}} className={styles.removeFileButton}>×</button></div>) :
                (<><span className={styles.dropzoneIcon}></span><p className={styles.dropzoneText}>Glissez-déposez ou cliquez</p><p className={styles.dropzoneTextSmall}>Max 5MB</p></>)}
              </div>
            </div>
            <div className={styles.dropzoneContainer}>
              <label htmlFor="wristShotDropzone" className={styles.inputLabel}>Photo au poignet (optionnel)</label>
              <div id="wristShotDropzone" {...getRootPropsWristShot()} className={`${styles.dropzone} ${isDragActiveWristShot ? styles.dropzoneActive : ''}`}>
                <input {...getInputPropsWristShot()} />
                {wristShotFile ? ( <div className={styles.previewContainer}><img src={wristShotFile.preview} alt="Aperçu poignet" className={styles.imagePreview} /><p className={styles.fileName}>{wristShotFile.name}</p><button type="button" onClick={(e) => { e.stopPropagation(); removeWristShotFile();}} className={styles.removeFileButton}>×</button></div>) :
                (<><span className={styles.dropzoneIcon}></span><p className={styles.dropzoneText}>Glissez-déposez ou cliquez</p><p className={styles.dropzoneTextSmall}>Max 5MB</p></>)}
              </div>
            </div>
          </div>

          <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
            <label htmlFor="notesHistory" className={styles.inputLabel}>Histoire & Notes Personnelles</label>
            <textarea id="notesHistory" value={notesHistory ?? ''} onChange={(e) => setNotesHistory(e.target.value)} rows={6} className={styles.textareaField} disabled={isSubmitting} placeholder="Racontez l'histoire de cette pièce..."/>
          </div>

          <p className={styles.infoText}>* Champs obligatoires.</p>
          <button type="submit" className={styles.submitButton} disabled={isSubmitting || loadingOptions}>
            {isSubmitting ? 'Enregistrement...' : (isEditMode ? 'Enregistrer les Modifications' : 'Ajouter la Montre')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default WatchEditorPage;