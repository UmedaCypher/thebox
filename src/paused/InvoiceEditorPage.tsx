// client/src/pages/InvoiceEditorPage.tsx

// MODIFICATION : 'useCallback' et 'useNavigate' retirés car ils n'étaient pas utilisés.
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import styles from './InvoiceEditorPage.module.css';

// Interfaces
interface InvoiceItem {
  id: number; // Simple ID for React key
  watch_id: string | null;
  item_description: string;
  quantity: number;
  unit_price: number | '';
}

interface ClientSearchResult {
  id: string;
  type: 'profile' | 'external';
  name: string;
  email?: string | null;
}

interface WatchFromInventory {
    id: string;
    brand: string;
    model: string;
    reference_number: string | null;
    sale_price: number | null;
}

const InvoiceEditorPage: React.FC = () => {
  const { user } = useAuth();
  // MODIFICATION : 'navigate' retiré car non utilisé.
  // const navigate = useNavigate();

  // Form states
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: 1, watch_id: null, item_description: '', quantity: 1, unit_price: '' }
  ]);
  
  // Client management states
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [clientSearchResults, setClientSearchResults] = useState<ClientSearchResult[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Modal states
  const [isWatchModalOpen, setIsWatchModalOpen] = useState(false);
  const [inventoryWatches, setInventoryWatches] = useState<WatchFromInventory[]>([]);
  const [itemIndexToLink, setItemIndexToLink] = useState<number | null>(null);

  // Global states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    if (clientSearchTerm.length < 2) {
      setClientSearchResults([]);
      return;
    }

    const search = async () => {
      if (!user) return;
      setIsSearching(true);
      // NOTE: For a real app, create a RPC function 'search_clients' in Supabase
      // that searches both 'profiles' and 'external_clients' for better performance.
      
      // MODIFICATION : 'profileError' retiré car non utilisé.
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username')
        .or(`full_name.ilike.%${clientSearchTerm}%,username.ilike.%${clientSearchTerm}%`)
        .limit(5);

      // MODIFICATION : 'externalError' retiré car non utilisé.
      const { data: externals } = await supabase
        .from('external_clients')
        .select('id, full_name')
        .eq('pro_id', user.id)
        .ilike('full_name', `%${clientSearchTerm}%`)
        .limit(5);

      const combinedResults: ClientSearchResult[] = [];
      if (profiles) {
        profiles.forEach(p => combinedResults.push({ id: p.id, type: 'profile', name: p.full_name || p.username || 'Utilisateur' }));
      }
      if (externals) {
        externals.forEach(e => combinedResults.push({ id: e.id, type: 'external', name: e.full_name }));
      }
      
      setClientSearchResults(combinedResults);
      setIsSearching(false);
    };

    const debounceTimeout = setTimeout(() => search(), 300);
    return () => clearTimeout(debounceTimeout);
  }, [clientSearchTerm, user]);

  const handleItemChange = (index: number, field: keyof Omit<InvoiceItem, 'id'>, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { id: Date.now(), watch_id: null, item_description: '', quantity: 1, unit_price: '' }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const fetchInventory = async () => {
    if(!user) return;
    setIsWatchModalOpen(true);
    const { data, error: fetchInvError } = await supabase
      .from('watches')
      .select('id, brand, model, reference_number, sale_price')
      .eq('user_id', user.id)
      .in('current_status', ['for_sale', 'in_collection', 'purchased_by_pro']);
    
    if (fetchInvError) {
        setError('Impossible de charger l\'inventaire.');
        console.error(fetchInvError);
    } else {
        setInventoryWatches(data || []);
    }
  };
  
  const handleOpenWatchModal = (index: number) => {
    setItemIndexToLink(index);
    fetchInventory();
  };
  
  const handleLinkWatch = (watch: WatchFromInventory) => {
    if (itemIndexToLink === null) return;
  
    const description = `${watch.brand} ${watch.model}` + (watch.reference_number ? ` (Réf: ${watch.reference_number})` : '');
    const price = watch.sale_price || 0;
  
    const newItems = [...items];
    newItems[itemIndexToLink] = {
      ...newItems[itemIndexToLink],
      watch_id: watch.id,
      item_description: description,
      unit_price: price,
    };
    setItems(newItems);
    setIsWatchModalOpen(false);
    setItemIndexToLink(null);
  };

  const calculateTotal = () => {
    return items.reduce((acc, item) => {
      const price = typeof item.unit_price === 'number' ? item.unit_price : 0;
      return acc + (price * item.quantity);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedClient || items.some(item => !item.item_description || !item.unit_price)) {
      setError("Veuillez sélectionner un client et remplir toutes les lignes de la facture.");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const invoice_items_param = items.map(item => ({
      watch_id: item.watch_id,
      item_description: item.item_description,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }));

    try {
      const { data, error: rpcError } = await supabase.rpc('create_invoice_and_update_inventory', {
        client_profile_id_param: selectedClient.type === 'profile' ? selectedClient.id : null,
        external_client_id_param: selectedClient.type === 'external' ? selectedClient.id : null,
        invoice_date_param: invoiceDate,
        due_date_param: dueDate || null,
        notes_param: notes,
        invoice_items_param: invoice_items_param,
      });

      if (rpcError) throw rpcError;

      if (data && data.success) {
        setSuccess(`Facture ${data.invoice_number} créée avec succès !`);
        // Reset form
        setSelectedClient(null);
        setClientSearchTerm('');
        setItems([{ id: 1, watch_id: null, item_description: '', quantity: 1, unit_price: '' }]);
      } else {
        throw new Error("La création de la facture a échoué.");
      }

    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <h1>Créer une Nouvelle Facture</h1>

      <form onSubmit={handleSubmit} className={styles.invoiceForm}>
        {error && <div className={styles.errorMessage}>{error}</div>}
        {success && <div className={styles.successMessage}>{success}</div>}

        <div className={styles.formSection}>
          <div className={styles.clientSection}>
            <h2>Client</h2>
            {selectedClient ? (
              <div className={styles.selectedClient}>
                <span>{selectedClient.name}</span>
                <button type="button" onClick={() => { setSelectedClient(null); setClientSearchTerm(''); }}>Changer</button>
              </div>
            ) : (
              <div className={styles.clientSearch}>
                <input
                  type="text"
                  placeholder="Rechercher un client..."
                  value={clientSearchTerm}
                  onChange={(e) => setClientSearchTerm(e.target.value)}
                />
                {isSearching && <p>Recherche...</p>}
                {clientSearchResults.length > 0 && (
                  <ul className={styles.searchResults}>
                    {clientSearchResults.map(client => (
                      <li key={`${client.type}-${client.id}`} onClick={() => { setSelectedClient(client); setClientSearchResults([]); }}>
                        {client.name} <span className={styles.clientType}>({client.type === 'profile' ? 'Membre' : 'Externe'})</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {/* TODO: Add a button to create a new external client via a modal */}
          </div>

          <div className={styles.invoiceMeta}>
            <h2>Détails</h2>
            <div className={styles.formGroup}>
              <label htmlFor="invoiceDate">Date de facturation</label>
              <input id="invoiceDate" type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} required />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="dueDate">Date d'échéance (optionnel)</label>
              <input id="dueDate" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <h2>Lignes de la facture</h2>
          <div className={styles.itemsTable}>
            <div className={styles.itemsHeader}>
              <span>Description</span>
              <span>Quantité</span>
              <span>Prix Unitaire (€)</span>
              <span>Total (€)</span>
              <span>Action</span>
            </div>
            {items.map((item, index) => (
              <div key={item.id} className={styles.itemRow}>
                <div className={styles.itemDescription}>
                    <textarea 
                        placeholder="Description du produit ou service"
                        value={item.item_description}
                        onChange={(e) => handleItemChange(index, 'item_description', e.target.value)}
                        rows={2}
                    />
                     <button type="button" className={styles.linkButton} onClick={() => handleOpenWatchModal(index)}>Lier une montre</button>
                </div>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={item.unit_price}
                  onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value))}
                />
                <span className={styles.itemTotal}>
                    {((typeof item.unit_price === 'number' ? item.unit_price : 0) * item.quantity).toFixed(2)}
                </span>
                <button type="button" onClick={() => removeItem(index)} className={styles.deleteButton}>×</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addItem} className={styles.addButton}>+ Ajouter une ligne</button>
        </div>

        <div className={styles.formSection}>
            <h2>Notes</h2>
            <textarea
                placeholder="Notes ou conditions de paiement..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className={styles.notesTextarea}
            />
        </div>

        <div className={styles.summarySection}>
          <div className={styles.totalAmount}>
            TOTAL : <span>{calculateTotal().toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
          </div>
          <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
            {isSubmitting ? 'Création en cours...' : 'Créer la facture'}
          </button>
        </div>
      </form>
      
      {isWatchModalOpen && (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <h2>Sélectionner une montre de l'inventaire</h2>
                {inventoryWatches.length > 0 ? (
                    <ul className={styles.watchList}>
                        {inventoryWatches.map(watch => (
                            <li key={watch.id} onClick={() => handleLinkWatch(watch)}>
                                {watch.brand} {watch.model} 
                                <span>{watch.sale_price ? `${watch.sale_price} €` : 'Prix non défini'}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>Aucune montre disponible dans l'inventaire.</p>
                )}
                <button onClick={() => setIsWatchModalOpen(false)}>Fermer</button>
            </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceEditorPage;