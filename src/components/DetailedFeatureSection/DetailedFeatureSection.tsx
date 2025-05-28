// client/src/components/DetailedFeatureSection/DetailedFeatureSection.tsx
import React from 'react';
// import { Link } from 'react-router-dom'; // Optionnel, si vous avez des liens "En savoir plus"
import styles from './DetailedFeatureSection.module.css';

interface DetailedFeatureSectionProps {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imagePlaceholder: string;
  imageAlt: string;
  imagePosition?: 'left' | 'right'; // Pour contrôler l'alternance
  backgroundColor?: 'default' | 'light'; // Pour contrôler le fond
  isFirst?: boolean; // Pour un padding spécial si c'est la première section de feature
}

const DetailedFeatureSection: React.FC<DetailedFeatureSectionProps> = ({
  id,
  title,
  subtitle,
  description,
  imagePlaceholder,
  imageAlt,
  imagePosition = 'left',
  backgroundColor = 'default',
  isFirst = false,
}) => {
  const sectionClasses = `
    ${styles.detailedFeatureSection}
    ${backgroundColor === 'light' ? styles.bgLightDetailed : ''}
    ${isFirst ? styles.firstDetailedFeature : ''}
  `;

  const contentClasses = `
    ${styles.container}
    ${styles.detailedFeatureContent}
    ${imagePosition === 'right' ? styles.layoutImageRight : styles.layoutImageLeft}
  `;

  return (
    <section id={id} className={sectionClasses}>
      <div className={contentClasses}>
        <div className={styles.detailedFeatureImageContainer}>
          <div className={styles.detailedFeatureImage} aria-label={imageAlt}>
            {/* Idéalement, ceci serait un composant <Image /> ou une balise <img> */}
            {imagePlaceholder}
          </div>
        </div>
        <div className={styles.detailedFeatureTextContainer}>
          <span className={styles.detailedFeatureSubtitle}>{subtitle}</span>
          <h3 className={styles.detailedFeatureTitle}>{title}</h3>
          <p className={styles.detailedFeatureDescription}>{description}</p>
          {/* Exemple de lien optionnel :
          <Link to={`/features/${id}`} className={styles.learnMoreLink}>
            En savoir plus <span className={styles.arrowIcon}>&rarr;</span>
          </Link>
          */}
        </div>
      </div>
    </section>
  );
};

export default DetailedFeatureSection;
