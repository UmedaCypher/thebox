// client/src/pages/WatchNewsPage/WatchNewsPage.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient'; // Ajustez le chemin si nécessaire
import styles from './WatchNewsPage.module.css';

interface NewsItem {
  title?: string;
  link?: string;
  pubDate?: string;
  isoDate?: string;
  creator?: string;
  contentSnippet?: string;
  imageUrl?: string | null;
  sourceTitle?: string;
}

// Liste des flux RSS que vous souhaitez agréger
const RSS_FEEDS = [
  
  { name: 'thewatchobserver', url: 'https://thewatchobserver.ouest-france.fr/feed/' },
  { name: 'lecalibre', url: 'https://www.lecalibre.com/feed/' },
  { name: 'lesrhabilleurs', url: 'https://www.lesrhabilleurs.com/feed/' },
  { name: 'mrmontre', url: 'https://www.mrmontre.com/feed' },
  { name: 'watches-news', url: 'https://www.watches-news.com/fr/feed/' },

  // Ajoutez d'autres flux ici
];

const WatchNewsPage: React.FC = () => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFeed, setSelectedFeed] = useState<string>(RSS_FEEDS[0].url); // Premier flux par défaut

  useEffect(() => {
    const fetchNews = async (feedUrl: string) => {
      setLoading(true);
      setError(null);
      setNewsItems([]); // Vider les anciennes actualités lors du changement de flux

      try {
        console.log(`Appel de la fonction Edge 'rss-feed-parser' pour l'URL: ${feedUrl}`);
        const { data, error: functionError } = await supabase.functions.invoke('rss-feed-parser', {
          body: { feedUrl },
        });

        if (functionError) {
          console.error("Erreur de la fonction Edge:", functionError);
          throw new Error(functionError.message || "Erreur lors de l'appel de la fonction Edge.");
        }

        if (data && data.items) {
          console.log("Actualités reçues:", data.items);
          setNewsItems(data.items);
        } else if (data && data.error) { // Si la fonction Edge retourne une erreur formatée
          console.error("Erreur retournée par la fonction Edge:", data.error);
          throw new Error(data.error);
        } else {
          console.warn("Aucun item retourné par la fonction Edge ou format de réponse inattendu:", data);
          setNewsItems([]);
        }
      } catch (err: any) {
        console.error("Erreur lors de la récupération des actualités:", err);
        setError(err.message || "Impossible de charger les actualités.");
      } finally {
        setLoading(false);
      }
    };

    if (selectedFeed) {
      fetchNews(selectedFeed);
    }
  }, [selectedFeed]); // Se redéclenche si selectedFeed change

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Date inconnue';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        // hour: '2-digit',
        // minute: '2-digit',
      });
    } catch (e) {
      return dateString; // Retourner la chaîne originale si le formatage échoue
    }
  };

  return (
    <div className={styles.newsPageContainer}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Actualités Horlogères</h1>
        <div className={styles.feedSelectorContainer}>
          <label htmlFor="feedSelector" className={styles.feedSelectorLabel}>Source :</label>
          <select 
            id="feedSelector"
            value={selectedFeed} 
            onChange={(e) => setSelectedFeed(e.target.value)}
            className={styles.feedSelector}
          >
            {RSS_FEEDS.map(feed => (
              <option key={feed.url} value={feed.url}>
                {feed.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      {loading && <div className={styles.loadingMessage}>Chargement des actualités...</div>}
      {error && <div className={`${styles.message} ${styles.errorMessage}`}>Erreur : {error}</div>}

      {!loading && !error && newsItems.length === 0 && (
        <div className={styles.emptyMessage}>Aucune actualité trouvée pour cette source.</div>
      )}

      {!loading && newsItems.length > 0 && (
        <div className={styles.newsGrid}>
          {newsItems.map((item, index) => (
            <a 
              key={item.link || index} 
              href={item.link} 
              target="_blank" 
              rel="noopener noreferrer" 
              className={styles.newsCard}
            >
              {item.imageUrl && (
                <div className={styles.cardImageContainer}>
                  <img 
                    src={item.imageUrl} 
                    alt={`Image pour ${item.title}`} 
                    className={styles.cardImage} 
                    onError={(e) => (e.currentTarget.style.display = 'none')} // Cacher si l'image ne se charge pas
                  />
                </div>
              )}
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{item.title || 'Titre non disponible'}</h3>
                {item.contentSnippet && <p className={styles.cardSnippet}>{item.contentSnippet}</p>}
                <div className={styles.cardMeta}>
                  {item.creator && <span className={styles.cardCreator}>Par : {item.creator}</span>}
                  <span className={styles.cardDate}>{formatDate(item.isoDate || item.pubDate)}</span>
                </div>
                {item.sourceTitle && <span className={styles.cardSource}>Source : {item.sourceTitle}</span>}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default WatchNewsPage;
