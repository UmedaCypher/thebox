// client/src/pages/ClientListPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import styles from './ClientListPage.module.css';
import { PlusCircle, Search } from 'lucide-react';

interface Client {
  id: string;
  full_name: string;
  email: string | null;
  phone_number: string | null;
  status: 'prospect' | 'lead' | 'client_active' | 'client_inactive' | 'archive' | null;
}

const ClientListPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchClients = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    
    let query = supabase
      .from('external_clients')
      .select('id, full_name, email, phone_number, status')
      .eq('pro_id', user.id);

    if (searchTerm) {
      query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
    }

    query = query.order('updated_at', { ascending: false });

    try {
      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setClients(data || []);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la récupération des clients.");
    } finally {
      setLoading(false);
    }
  }, [user, searchTerm]);

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
        fetchClients();
    }, 300);
    return () => clearTimeout(debounceTimeout);
  }, [fetchClients]);

  const getStatusClass = (status: Client['status']) => {
    return styles[`status_${status}`] || styles.status_default;
  };

  const statusTranslations: Record<string, string> = {
    prospect: 'Prospect',
    lead: 'Lead',
    client_active: 'Client Actif',
    client_inactive: 'Client Inactif',
    archive: 'Archivé'
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <h1>Mes Clients</h1>
        <Link to="/clients/nouveau" className={styles.primaryButton}>
          <PlusCircle size={20} />
          Ajouter un client
        </Link>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search className={styles.searchIcon} size={18} />
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.clientListContainer}>
        {loading && <p>Chargement...</p>}
        {error && <p className={styles.errorMessage}>{error}</p>}
        {!loading && !error && (
          clients.length > 0 ? (
            <table className={styles.clientTable}>
              <thead>
                <tr>
                  <th>Nom Complet</th>
                  <th>Email</th>
                  <th>Téléphone</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {clients.map(client => (
                  <tr key={client.id} onClick={() => navigate(`/clients/${client.id}`)}>
                    <td>{client.full_name}</td>
                    <td>{client.email || '-'}</td>
                    <td>{client.phone_number || '-'}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${getStatusClass(client.status)}`}>
                        {statusTranslations[client.status || ''] || 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className={styles.emptyState}>
              <p>Aucun client trouvé.</p>
              <p>Commencez par <Link to="/clients/nouveau">en ajouter un</Link>.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ClientListPage;
