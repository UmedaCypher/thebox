// client/src/pages/MarketplacePage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import styles from './MarketplacePage.module.css';

interface MarketWatch {
  id: string;
  brand: string;
  model: string;
  reference_number: string | null;
  year_of_production: number | null;
  sale_price: number | null;
  current_status: 'for_sale' | 'for_exchange';
  main_photo_storage_path: string | null;
  main_photo_url: string | null;
  seller_username: string | null;
}

const MarketplacePage: React.FC = () => {
  const [watches, setWatches] = useState<MarketWatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    brand: '',
    minPrice: '',
    maxPrice: '',
    query: ''
  });
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const watchesPerPage = 20;

  useEffect(() => {
    const fetchBrands = async () => {
      const { data, error } = await supabase.rpc('get_market_available_brands');
      if (error) {
        console.error("Error fetching market brands:", error);
      } else {
        setAvailableBrands(data.map((item: { brand: string }) => item.brand));
      }
    };
    fetchBrands();
  }, []);

  const fetchWatches = useCallback(async (page: number, newFilters = filters) => {
    setLoading(true);
    setError(null);
    if (page === 1) {
      setWatches([]);
    }

    try {
      const { data, error: rpcError } = await supabase.rpc('search_market_watches', {
        brand_filter: newFilters.brand || null,
        min_price: newFilters.minPrice ? Number(newFilters.minPrice) : null,
        max_price: newFilters.maxPrice ? Number(newFilters.maxPrice) : null,
        search_query: newFilters.query || null,
        page_limit: watchesPerPage,
        page_offset: (page - 1) * watchesPerPage,
      });

      if (rpcError) throw rpcError;

      const newWatchesData = data || [];
      const watchesWithUrls = newWatchesData.map((watch: Omit<MarketWatch, 'main_photo_url'>) => {
        let publicUrl = null;
        if (watch.main_photo_storage_path) {
          const { data: urlData } = supabase.storage
            .from('watch.images')
            .getPublicUrl(watch.main_photo_storage_path);
          publicUrl = urlData?.publicUrl || null;
        }
        return { ...watch, main_photo_url: publicUrl };
      });

      setWatches(prev => page === 1 ? watchesWithUrls : [...prev, ...watchesWithUrls]);
      setHasMore(watchesWithUrls.length === watchesPerPage);
      setCurrentPage(page);

    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de la récupération des montres.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchWatches(1, filters);
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchWatches(1);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchWatches(currentPage + 1);
    }
  };

  return (
    <div className={styles.marketplacePageContainer}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Marché</h1>
      </header>

      <div className={styles.filtersContainer}>
        <input
          type="text"
          name="query"
          placeholder="Rechercher marque, modèle, réf..."
          value={filters.query}
          onChange={handleFilterChange}
          className={styles.searchInput}
        />
        <select name="brand" value={filters.brand} onChange={handleFilterChange}>
          <option value="">Toutes les marques</option>
          {availableBrands.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <input
          type="number"
          name="minPrice"
          placeholder="Prix min (€)"
          value={filters.minPrice}
          onChange={handleFilterChange}
        />
        <input
          type="number"
          name="maxPrice"
          placeholder="Prix max (€)"
          value={filters.maxPrice}
          onChange={handleFilterChange}
        />
        <button onClick={handleApplyFilters} className={styles.filterButton} disabled={loading}>
          {loading ? '...' : 'Filtrer'}
        </button>
      </div>

      {loading && watches.length === 0 && <div className={styles.statusMessage}>Chargement du marché...</div>}
      {error && <div className={`${styles.statusMessage} ${styles.errorMessage}`}>{error}</div>}
      {!loading && watches.length === 0 && <div className={styles.statusMessage}>Aucune montre ne correspond à votre recherche.</div>}

      <div className={styles.watchesGrid}>
        {watches.map(watch => (
          <div key={watch.id} className={styles.watchCard}>
            {watch.current_status === 'for_sale' && (
              <div className={styles.cardStatusIndicatorSale} title={watch.sale_price ? `À vendre : ${watch.sale_price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}` : 'À vendre'}>
                À VENDRE {watch.sale_price ? ` - ${watch.sale_price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : ''}
              </div>
            )}
            {watch.current_status === 'for_exchange' && (
              <div className={styles.cardStatusIndicatorTrade} title="À échanger">
                À ÉCHANGER
              </div>
            )}
            
            <Link to={`/montre/${watch.id}`} className={styles.watchCardLink}>
                <div className={styles.watchImageContainer}>
                    {watch.main_photo_url ? (
                        <img src={watch.main_photo_url} alt={`${watch.brand} ${watch.model}`} className={styles.watchImage} />
                    ) : (
                        <div className={styles.watchImagePlaceholder}><span>⌚</span></div>
                    )}
                </div>
                <div className={styles.watchInfo}>
                    <h3 className={styles.watchBrandModel}>{watch.brand}</h3>
                    <p className={styles.watchModelName}>{watch.model}</p>
                    {watch.seller_username && (
                        <p className={styles.sellerInfo}>
                            Vendu par <Link to={`/profil/${watch.seller_username}`} className={styles.sellerLink}>{watch.seller_username}</Link>
                        </p>
                    )}
                </div>
            </Link>
          </div>
        ))}
      </div>

      {hasMore && !loading && (
        <div className={styles.loadMoreContainer}>
          <button onClick={loadMore} disabled={loading} className={styles.loadMoreButton}>
            Charger plus
          </button>
        </div>
      )}
    </div>
  );
};

export default MarketplacePage;
