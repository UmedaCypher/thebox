// client/src/pages/LocationManagerPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import styles from './LocationManagerPage.module.css';

interface Location {
  id: string;
  name: string;
  address: string | null;
  is_active: boolean;
}

const LocationManagerPage: React.FC = () => {
  const { user } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for the form/modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState({ name: '', address: '' });

  const fetchLocations = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('pro_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLocations(data || []);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la récupération des lieux.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleOpenModal = (location: Location | null = null) => {
    setCurrentLocation(location);
    if (location) {
      setFormData({ name: location.name, address: location.address || '' });
    } else {
      setFormData({ name: '', address: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentLocation(null);
  };

  const handleDelete = async (locationId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce lieu ?')) {
      try {
        const { error } = await supabase.from('locations').delete().eq('id', locationId);
        if (error) throw error;
        setLocations(prev => prev.filter(loc => loc.id !== locationId));
      } catch (err: any) {
        setError(err.message || 'Erreur lors de la suppression.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.name) return;

    const locationData = {
      pro_id: user.id,
      name: formData.name,
      address: formData.address || null,
    };

    try {
      let error;
      if (currentLocation) {
        // Update
        ({ error } = await supabase.from('locations').update(locationData).eq('id', currentLocation.id));
      } else {
        // Insert
        ({ error } = await supabase.from('locations').insert(locationData));
      }

      if (error) throw error;
      await fetchLocations(); // Re-fetch all locations to get the updated list
      handleCloseModal();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde.');
    }
  };

  if (loading) {
    return <div className={styles.pageStateContainer}>Chargement...</div>;
  }

  if (error) {
    return <div className={`${styles.pageStateContainer} ${styles.error}`}>{error}</div>;
  }

  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <h1>Gérer mes Lieux</h1>
        <button onClick={() => handleOpenModal()} className={styles.primaryButton}>
          Ajouter un lieu
        </button>
      </header>

      {locations.length === 0 ? (
        <p>Vous n'avez encore ajouté aucun lieu.</p>
      ) : (
        <ul className={styles.locationList}>
          {locations.map(loc => (
            <li key={loc.id} className={styles.locationItem}>
              <div>
                <p className={styles.locationName}>{loc.name}</p>
                <p className={styles.locationAddress}>{loc.address || 'Adresse non spécifiée'}</p>
              </div>
              <div className={styles.actions}>
                <button onClick={() => handleOpenModal(loc)} className={styles.editButton}>Modifier</button>
                <button onClick={() => handleDelete(loc.id)} className={styles.deleteButton}>Supprimer</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>{currentLocation ? 'Modifier le lieu' : 'Ajouter un lieu'}</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Nom du lieu (ex: "Boutique Paris", "Coffre-fort")</label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="address">Adresse (optionnel)</label>
                <input
                  id="address"
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={handleCloseModal} className={styles.secondaryButton}>Annuler</button>
                <button type="submit" className={styles.primaryButton}>Sauvegarder</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationManagerPage;