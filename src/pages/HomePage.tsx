// client/src/pages/HomePage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './HomePage.module.css'; // Nous allons mettre à jour ce fichier

// Simuler des données de montres pour l'affichage dans le hero
const placeholderHeroWatches = [
  { id: 'h1', imageUrl: 'https://placehold.co/200x260/F1F1EF/333333?text=Montre', alt: 'Montre de luxe' },
  { id: 'h2', imageUrl: 'https://placehold.co/200x260/F1F1EF/333333?text=Montre', alt: 'Montre de luxe' },
  { id: 'h3', imageUrl: 'https://placehold.co/200x260/F1F1EF/333333?text=Montre', alt: 'Montre de luxe' },
  { id: 'h4', imageUrl: 'https://placehold.co/200x260/F1F1EF/333333?text=Montre', alt: 'Montre de luxe' },
  { id: 'h5', imageUrl: 'https://placehold.co/200x260/F1F1EF/333333?text=Montre', alt: 'Montre de luxe' },
  { id: 'h6', imageUrl: 'https://placehold.co/200x260/F1F1EF/333333?text=Montre', alt: 'Montre de luxe' },
  { id: 'h7', imageUrl: 'https://placehold.co/200x260/F1F1EF/333333?text=Montre', alt: 'Montre de luxe' },
  { id: 'h8', imageUrl: 'https://placehold.co/200x260/F1F1EF/333333?text=Montre', alt: 'Montre de luxe' },
  { id: 'h9', imageUrl: 'https://placehold.co/200x260/F1F1EF/333333?text=Montre', alt: 'Montre de luxe' },
  { id: 'h10', imageUrl: 'https://placehold.co/200x260/F1F1EF/333333?text=Montre', alt: 'Montre de luxe' },
];

// Données placeholder pour les sections existantes (à remplacer par vos vraies données/logique)
const countersData = [
  { id: 'c1', value: '1,200+', label: 'Montres Cataloguées', description: 'Une diversité incroyable à portée de main.' },
  { id: 'c2', value: '500+', label: 'Membres Actifs', description: 'Rejoignez une communauté de passionnés.' },
  { id: 'c3', value: '98%', label: 'Satisfaction Client', description: 'Votre passion, notre priorité.' },
];

const testimonialsData = [
  { id: 't1', name: 'Alexandre P.', date: '2025/05/10', quote: "Depuis que j'utilise THE BOX, ma collection n'a jamais été aussi bien organisée. Un must-have !" },
  { id: 't2', name: 'Sophie L.', date: '2025/04/22', quote: "L'interface est sublime et intuitive. J'adore partager mes plus belles pièces avec la communauté." },
  { id: 't3', name: 'Julien M.', date: '2025/03/15', quote: "Les fiches pédagogiques et les actualités sont une vraie mine d'or. J'apprends tous les jours." },
];


const HomePage: React.FC = () => {
  return (
    <div className={styles.homePage}>
      {/* Section Hero principale (Nouveau Design) */}
      <section className={styles.heroSectionNew}> {/* Renommé pour éviter conflit avec ancien .heroSection */}
        
        
       
        
        <div className={styles.heroSloganContainer}>
          <h2 className={styles.heroSubtitle}>L'ÉCRIN NUMÉRIQUE DE<br/>VOTRE PASSION</h2>
          <p className={styles.heroDescription}>
            Gérez, valorisez et partagez votre collection d'exception
            avec une application à la hauteur de vos exigences.
          </p>
          <Link to="/app-details" className={`${styles.ctaButton} ${styles.ctaButtonHero}`}>
            Découvrir l'expérience
          </Link>
        </div>

         <div className={styles.heroImageGridBottom}>
          {placeholderHeroWatches.slice(5, 10).map(watch => (
            <div key={watch.id} className={styles.heroWatchImageContainer}>
              <img src={watch.imageUrl} alt={watch.alt} />
            </div>
          ))}
        </div>

      </section>

      {/* Section Compteurs (Ancienne section, à styliser) */}
      <section className={styles.countersSection}>
        <div className={styles.sectionContainer}> {/* Conteneur générique pour la largeur max */}
          <h2 className={styles.sectionTitle}>En Quelques Chiffres</h2>
          <div className={styles.countersGrid}>
            {countersData.map(counter => (
              <div key={counter.id} className={styles.counterCard}>
                <span className={styles.counterValue}>{counter.value}</span>
                <h3 className={styles.counterLabel}>{counter.label}</h3>
                <p className={styles.counterDescription}>{counter.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section "Prêt à Sublimer Votre Collection ?" (Ancienne section, à styliser) */}
      <section className={`${styles.contentSection} ${styles.ctaSection}`}>
        <div className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>Prêt à Sublimer Votre Collection ?</h2>
          <p className={styles.sectionDescription}>
            Rejoignez une communauté exclusive et donnez à vos trésors horlogers l'écrin numérique qu'ils méritent.
          </p>
          <Link to="/signup" className={`${styles.ctaButton} ${styles.ctaButtonLarge}`}>
            Créer mon compte gratuitement
          </Link>
        </div>
      </section>
      
      {/* Section Retours Utilisateurs (Ancienne section, à styliser) */}
      <section className={`${styles.contentSection} ${styles.testimonialsSection}`}>
        <div className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>Ce que disent nos membres</h2>
          <div className={styles.testimonialsGrid}>
            {testimonialsData.map(testimonial => (
              <div key={testimonial.id} className={styles.testimonialCard}>
                <p className={styles.testimonialQuote}>"{testimonial.quote}"</p>
                <p className={styles.testimonialAuthor}>- {testimonial.name}, <span className={styles.testimonialDate}>{testimonial.date}</span></p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;
