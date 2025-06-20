import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import {
  DollarSign, Users, Package, Wrench, FileText,
  TrendingUp, Mail, PlusCircle, Search, MapPin
} from 'lucide-react';
import styles from './ProDashboardPage.module.css';

interface DashboardStats {
  totalSalesMonth: number;
  averageMargin: number;
  watchesForSale: number;
  watchesInRepair: number;
  newClientsMonth: number;
  unreadMessages: number;
  totalInventoryValue: number;
}

const ProDashboardPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [userAccountType, setUserAccountType] = useState<'free' | 'pro_basic' | 'pro_premium' | 'admin' | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
        return;
      }
      const fetchAccountType = async () => {
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('account_type')
            .eq('id', user.id)
            .single();

          if (profileError) {
            setError("Impossible de charger les informations du profil.");
            setUserAccountType('free');
          } else if (profileData) {
            setUserAccountType(profileData.account_type);
            if (profileData.account_type === 'free') {
              setError("Accès refusé. Cette page est réservée aux comptes professionnels.");
            }
          } else {
            setError("Profil introuvable. Accès refusé.");
            setUserAccountType('free');
          }
        } catch (err: any) {
          setError(err.message || "Une erreur inattendue est survenue.");
          setUserAccountType('free');
        } finally {
          setLoadingDashboard(false);
        }
      };
      fetchAccountType();
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (userAccountType && ['pro_basic', 'pro_premium', 'admin'].includes(userAccountType)) {
      setLoadingDashboard(true);
      const timer = setTimeout(() => {
        setDashboardStats({
          totalSalesMonth: 12500,
          averageMargin: 22.5,
          watchesForSale: 15,
          watchesInRepair: 3,
          newClientsMonth: 7,
          unreadMessages: 2,
          totalInventoryValue: 150000,
        });
        setLoadingDashboard(false);
      }, 500);
      return () => clearTimeout(timer);
    } else if (userAccountType === 'free') {
      setLoadingDashboard(false);
    }
  }, [userAccountType]);

  if (authLoading || loadingDashboard) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
  }
  if (error) {
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
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Tableau de bord
          </h1>
        </div>

        {/* Grille 1 : KPIs */}
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
            <p className={styles['kpi-value']}>{dashboardStats?.unreadMessages}</p>
          </div>
        </div>

        {/* Grille 2 : Cartes principales */}
        <div className={`${styles['bento-grid']} ${styles['grid-1-3']}`}>
          {/* Valeur inventaire */}
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

          {/* Inventaire actif */}
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
                  2
                </span>
              </li>
            </ul>
          </div>

          {/* Actions rapides */}
          <div className={styles['bento-card']}>
            <h2 className={styles['card-title']}>Actions Rapides</h2>
            <div className="flex flex-col space-y-3 my-auto">
              <button className={styles['action-button']}>
                <PlusCircle className="mr-2" size={18} />
                Ajouter une montre
              </button>
              <button className={styles['action-button']}>
                <FileText className="mr-2" size={18} />
                Créer une facture
              </button>
              <button className={styles['action-button']}>
                <Search className="mr-2" size={18} />
                Recherche de prix
              </button>
              <button className={styles['action-button']}>
                <MapPin className="mr-2" size={18} />
                Gérer les lieux
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProDashboardPage;
