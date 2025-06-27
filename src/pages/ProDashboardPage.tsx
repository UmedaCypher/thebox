// client/src/pages/ProDashboardPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import {
  // MODIFICATION : Icônes non utilisées (DollarSign, Mail, etc.) retirées pour corriger les erreurs de build
  Users, Package, Wrench, FileText,
  TrendingUp, PlusCircle, Search, MapPin
} from 'lucide-react';
import styles from './ProDashboardPage.module.css';

interface DashboardStats {
  totalSalesMonth: number;
  averageMargin: number; // Percentage
  watchesForSale: number;
  watchesInRepair: number;
  watchesInExpertise: number;
  newClientsMonth: number;
  unreadMessagesCount: number;
  totalInventoryValue: number;
}

interface UserConversationForDashboard {
  conversation_id: string;
  other_user_id: string;
  other_username: string | null;
  other_profile_picture_url: string | null;
  last_message_content: string | null;
  last_message_created_at: string | null;
  last_message_sender_id: string | null;
  is_unread_by_current_user: boolean;
}

const ProDashboardPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [latestMessages, setLatestMessages] = useState<UserConversationForDashboard[]>([]);
  const [userAccountType, setUserAccountType] = useState<'free' | 'pro_basic' | 'pro_premium' | 'admin' | null>(null);

  // Helper to format date for messages
  const formatMessageDate = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    if (diffDays <= 7) return date.toLocaleDateString('fr-FR', { weekday: 'short' });
    return date.toLocaleDateString('fr-FR');
  };

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) return;

    setLoadingDashboard(true);
    setError(null);

    try {
      // Fetch profile account type
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('account_type')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setUserAccountType(profileData.account_type);

      if (profileData.account_type === 'free') {
        setError("Accès refusé. Cette page est réservée aux comptes professionnels.");
        setLoadingDashboard(false);
        return;
      }

      // --- Fetching Dashboard Statistics ---

      // Total Sales (Last 30 Days)
      const { data: salesData, error: salesError } = await supabase
        .from('invoices')
        .select('total_amount')
        .eq('pro_id', user.id)
        .eq('status', 'paid')
        .gte('invoice_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      if (salesError) console.error("Error fetching sales:", salesError);
      const totalSalesMonth = salesData?.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0) || 0;
      
      const averageMargin = 22.5; // Mocked value

      const { count: watchesForSale, error: forSaleError } = await supabase
        .from('watches')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('current_status', 'for_sale');
      if (forSaleError) console.error("Error fetching watches for sale:", forSaleError);

      const { count: watchesInRepair, error: inRepairError } = await supabase
        .from('watches')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('current_status', 'in_repair');
      if (inRepairError) console.error("Error fetching watches in repair:", inRepairError);
      
      const { count: watchesInExpertise, error: inExpertiseError } = await supabase
        .from('watches')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('current_status', 'for_expertise');
      if (inExpertiseError) console.error("Error fetching watches in expertise:", inExpertiseError);

      const { count: newClientsMonth, error: clientsError } = await supabase
        .from('external_clients')
        .select('*', { count: 'exact', head: true })
        .eq('pro_id', user.id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      if (clientsError) console.error("Error fetching new clients:", clientsError);

      const { data: inventoryValueData, error: inventoryError } = await supabase
        .from('watches')
        .select('current_estimated_value')
        .eq('user_id', user.id)
        .in('current_status', ['in_collection', 'for_sale', 'for_exchange', 'consignment']);
      if (inventoryError) console.error("Error fetching inventory value:", inventoryError);
      const totalInventoryValue = inventoryValueData?.reduce((sum, watch) => sum + (watch.current_estimated_value || 0), 0) || 0;

      const { data: conversationsData, error: convError } = await supabase.rpc('get_user_conversations');
      if (convError) console.error("Error fetching conversations for messages:", convError);

      let unreadMessagesCount = 0;
      const fetchedLatestMessages: UserConversationForDashboard[] = [];

      if (conversationsData) {
        conversationsData.forEach((conv: any) => {
            const lastMessageDate = new Date(conv.last_message_created_at || conv.conversation_updated_at);
            const lastReadDate = conv.last_read_at ? new Date(conv.last_read_at) : new Date(0);

            const isUnread = lastMessageDate > lastReadDate && conv.last_message_sender_id !== user.id;
            if (isUnread) {
                unreadMessagesCount++;
            }

            fetchedLatestMessages.push({
                conversation_id: conv.conversation_id,
                other_user_id: conv.other_user_id,
                other_username: conv.other_username,
                other_profile_picture_url: conv.other_profile_picture_url,
                last_message_content: conv.last_message_content,
                last_message_created_at: conv.last_message_created_at,
                last_message_sender_id: conv.last_message_sender_id,
                is_unread_by_current_user: isUnread,
            });
        });
        fetchedLatestMessages.sort((a, b) => new Date(b.last_message_created_at || '').getTime() - new Date(a.last_message_created_at || '').getTime());
        setLatestMessages(fetchedLatestMessages.slice(0, 5));
      }

      setDashboardStats({
        totalSalesMonth,
        averageMargin,
        watchesForSale: watchesForSale || 0,
        watchesInRepair: watchesInRepair || 0,
        watchesInExpertise: watchesInExpertise || 0,
        newClientsMonth: newClientsMonth || 0,
        unreadMessagesCount,
        totalInventoryValue,
      });

    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
      setError(err.message || "Impossible de charger les données du tableau de bord.");
    } finally {
      setLoadingDashboard(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchDashboardData();
    } else if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate, fetchDashboardData]);

  if (authLoading || loadingDashboard) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
  }
  if (error && userAccountType !== 'free') {
    return <div className="flex items-center justify-center min-h-screen p-4 text-red-700">{error}</div>;
  }
  if (userAccountType === 'free') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <p className="mb-4 text-lg text-gray-700">Cette page est uniquement accessible aux comptes professionnels.</p>
        <button onClick={() => navigate('/profil')} className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700">
          Gérer mon profil
        </button>
      </div>
    );
  }

  return (
    <div className={styles['dashboard-page-container']}>
     <div className={`${styles.contentWrapper} max-w-7xl mx-auto`}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Tableau de bord
          </h1>
        </div>

        <div className={`${styles['bento-grid']} ${styles['grid-1-4']} mb-6`}>
          <div className={`${styles['bento-card']} ${styles['accent-blue']} items-center text-center`}>
            <p className={styles['kpi-label']}>Ventes (30j)</p>
            <p className={styles['kpi-value']}>
              {dashboardStats?.totalSalesMonth.toLocaleString('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 0,
              })}
            </p>
          </div>
          <div className={`${styles['bento-card']} ${styles['accent-green']} items-center text-center`}>
            <p className={styles['kpi-label']}>Marge moyenne</p>
            <p className={styles['kpi-value']}>{dashboardStats?.averageMargin}%</p>
          </div>
          <div className={`${styles['bento-card']} ${styles['accent-yellow']} items-center text-center`}>
            <p className={styles['kpi-label']}>Nouveaux clients (30j)</p>
            <p className={styles['kpi-value']}>{dashboardStats?.newClientsMonth}</p>
          </div>
          <div className={`${styles['bento-card']} ${styles['accent-black']} items-center text-center`}>
            <p className={styles['kpi-label']}>Messages non lus</p>
            <p className={styles['kpi-value']}>{dashboardStats?.unreadMessagesCount}</p>
          </div>
        </div>

        <div className={`${styles['bento-grid']} ${styles['grid-1-3']}`}>
          <div className={styles['bento-card']}>
            <h2 className={styles['card-title']}>Valeur de l'Inventaire</h2>
            <div className="m-auto text-center">
              <p className={styles['kpi-label']}>Valeur totale du stock</p>
              <p className={`${styles['kpi-value']} text-purple-600`}>
                {dashboardStats?.totalInventoryValue.toLocaleString('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                  minimumFractionDigits: 0,
                })}
              </p>
            </div>
          </div>

          <div className={styles['bento-card']}>
            <h2 className={styles['card-title']}>Inventaire Actif</h2>
            <ul className={`${styles['card-list']} space-y-4 text-base my-auto`} style={{ color: 'var(--text-secondary)' }}>
              <li>
                <div className="flex items-center">
                  <Package className="mr-3" size={20} />
                  Montres à vendre
                </div>
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                  {dashboardStats?.watchesForSale}
                </span>
              </li>
              <li>
                <div className="flex items-center">
                  <Wrench className="mr-3" size={20} />
                  En réparation
                </div>
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                  {dashboardStats?.watchesInRepair}
                </span>
              </li>
              <li>
                <div className="flex items-center">
                  <FileText className="mr-3" size={20} />
                  En expertise
                </div>
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                  {dashboardStats?.watchesInExpertise}
                </span>
              </li>
            </ul>
          </div>

          <div className={styles['bento-card']}>
            <h2 className={styles['card-title']}>Actions Rapides</h2>
            <div className="flex flex-col space-y-3 my-auto">
              <button onClick={() => navigate('/ajouter-montre')} className={`${styles['action-button']} bg-blue-500 hover:bg-blue-600`}>
                <PlusCircle className="mr-2" size={18} />
                Ajouter une montre
              </button>
              <button onClick={() => navigate('/creer-facture')} className={`${styles['action-button']} bg-green-500 hover:bg-green-600`}>
                <FileText className="mr-2" size={18} />
                Créer une facture
              </button>
             <button onClick={() => navigate('/marche')} className={`${styles['action-button']} bg-purple-500 hover:bg-purple-600`}>
             <TrendingUp className="mr-2" size={18} />
             Recherche de prix
              </button>
              <button onClick={() => navigate('/gerer-lieux')} className={`${styles['action-button']} bg-orange-500 hover:bg-orange-600`}>
                <MapPin className="mr-2" size={18} />
                Gérer les lieux
              </button>
              <button onClick={() => navigate('/clients')} className={`${styles['action-button']} bg-green-500 hover:bg-green-600`}>
                <Users className="mr-2" size={18} />
                  Gérer mes clients
              </button>
            </div>
          </div>

           <div className={`${styles['bento-card']} ${styles['full-width-card']}`}>
            <h2 className={styles['card-title']}>Derniers Messages</h2>
            {latestMessages.length === 0 ? (
                <p className="text-gray-500 italic">Aucun nouveau message pour le moment.</p>
            ) : (
                <ul className={styles['card-list']}>
                {latestMessages.map(conv => (
                    <li key={conv.conversation_id} className={conv.is_unread_by_current_user ? styles['unread-message-item'] : ''}>
                        <div className="flex items-center flex-grow">
                            <img
                                src={conv.other_profile_picture_url || `https://api.dicebear.com/8.x/initials/svg?seed=${conv.other_username || 'U'}`}
                                alt={conv.other_username || 'Utilisateur'}
                                className={styles.messageAvatarSmall}
                            />
                            <div className="flex flex-col ml-3">
                                <Link to={`/messagerie/${conv.conversation_id}`} className="font-semibold text-blue-700 hover:underline">
                                    {conv.other_username || 'Utilisateur Inconnu'}
                                </Link>
                                <span className="text-sm text-gray-600 truncate max-w-[200px] md:max-w-none">
                                    {conv.last_message_sender_id === user?.id && "Vous : "}
                                    {conv.last_message_content || "Aucun message."}
                                </span>
                            </div>
                        </div>
                        <span className="text-xs text-gray-500 ml-2">
                            {formatMessageDate(conv.last_message_created_at)}
                        </span>
                    </li>
                ))}
                </ul>
            )}
            <div className="text-center mt-4">
                <Link to="/messagerie" className="text-blue-600 hover:underline">Voir toutes les conversations</Link>
            </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default ProDashboardPage;