// client/src/pages/ClientDetailPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import styles from './ClientDetailPage.module.css';

interface ClientData {
  id?: string;
  full_name: string;
  email: string | null;
  phone_number: string | null;
  address: string | null;
  notes: string | null;
  status: 'prospect' | 'lead' | 'client_active' | 'client_inactive' | 'archive' | null;
  budget: number | '' | null;
  source: string | null;
}

const ClientDetailPage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const location = useLocation(); // On utilise useLocation pour vérifier le chemin
  const { user } = useAuth();

  // --- CORRECTION APPLIQUÉE ICI ---
  // La manière la plus fiable de savoir si on crée un nouveau client.
  const isNewClient = location.pathname === '/clients/nouveau';

  const [clientData, setClientData] = useState<ClientData>({
    full_name: '', email: '', phone_number: '', address: '', notes: '',
    status: 'prospect', budget: '', source: ''
  });
  const [loading, setLoading] = useState(!isNewClient);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClientData = useCallback(async () => {
    if (isNewClient || !user || !clientId) {
        setLoading(false);
        return;
    };
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('external_clients')
        .select('*')
        .eq('id', clientId)
        .eq('pro_id', user.id)
        .single();
      
      if (fetchError) throw fetchError;
      if (data) {
        setClientData(data);
      } else {
        setError("Client non trouvé ou accès non autorisé.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [clientId, user, isNewClient]);

  useEffect(() => {
    if(!isNewClient) {
      fetchClientData();
    }
  }, [fetchClientData, isNewClient]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setClientData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !clientData.full_name) {
        setError("Le nom complet est obligatoire.");
        return;
    }
    setIsSubmitting(true);
    setError(null);

    const { id, ...dataForDb } = clientData;

    const dataToSave = {
        ...dataForDb,
        pro_id: user.id,
        budget: clientData.budget === '' ? null : Number(clientData.budget)
    };
    
    try {
        let errorUpsert;
        if (isNewClient) {
            const { error } = await supabase.from('external_clients').insert(dataToSave);
            errorUpsert = error;
        } else {
            const { error } = await supabase.from('external_clients').update(dataToSave).eq('id', clientId);
            errorUpsert = error;
        }
        if (errorUpsert) throw errorUpsert;

        navigate('/clients');
    } catch(err: any) {
        setError(err.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loading) return <div className={styles.pageContainer}>Chargement...</div>

  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <h1>{isNewClient ? 'Nouveau Client' : `Fiche de ${clientData.full_name}`}</h1>
      </header>

      <form onSubmit={handleSubmit} className={styles.clientForm}>
        {error && <p className={styles.errorMessage}>{error}</p>}
        
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label htmlFor="full_name">Nom complet *</label>
            <input id="full_name" name="full_name" type="text" value={clientData.full_name} onChange={handleInputChange} required />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" value={clientData.email || ''} onChange={handleInputChange} />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="phone_number">Téléphone</label>
            <input id="phone_number" name="phone_number" type="tel" value={clientData.phone_number || ''} onChange={handleInputChange} />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="address">Adresse</label>
            <input id="address" name="address" type="text" value={clientData.address || ''} onChange={handleInputChange} />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="status">Statut</label>
            <select id="status" name="status" value={clientData.status || 'prospect'} onChange={handleInputChange}>
              <option value="prospect">Prospect</option>
              <option value="lead">Lead</option>
              <option value="client_active">Client Actif</option>
              <option value="client_inactive">Client Inactif</option>
              <option value="archive">Archivé</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="budget">Budget (€)</label>
            <input id="budget" name="budget" type="number" value={clientData.budget || ''} onChange={handleInputChange} />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="source">Source</label>
            <input id="source" name="source" type="text" placeholder="Ex: Instagram, Recommandation..." value={clientData.source || ''} onChange={handleInputChange} />
          </div>
          <div className={styles.formGroupFullWidth}>
            <label htmlFor="notes">Notes</label>
            <textarea id="notes" name="notes" rows={6} value={clientData.notes || ''} onChange={handleInputChange}></textarea>
          </div>
        </div>

        <div className={styles.formActions}>
            <button type="button" onClick={() => navigate('/clients')} className={styles.secondaryButton}>Annuler</button>
            <button type="submit" className={styles.primaryButton} disabled={isSubmitting}>
                {isSubmitting ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
        </div>
      </form>
    </div>
  );
};

export default ClientDetailPage;
