// client/src/pages/FaqPage.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // <<< IMPORT AJOUTÉ ICI
import styles from './FaqPage.module.css';
// Optionnel: Importer une icône pour l'accordéon, par exemple de react-icons
// import { FiChevronDown, FiChevronUp } from 'react-icons/fi';

interface FaqItem {
  id: number;
  question: string;
  answer: string; // Peut être du JSX si vous avez besoin de formatage complexe ou de liens
}

const faqData: FaqItem[] = [
  {
    id: 1,
    question: "Qu'est-ce que l'application [Votre Marque] exactement ?",
    answer: "L'application [Votre Marque] est une plateforme numérique sophistiquée conçue pour les collectionneurs exigeants de montres, bijoux et petite maroquinerie de luxe. Elle vous permet de cataloguer, valoriser, suivre l'entretien, partager (si vous le souhaitez) et approfondir vos connaissances sur vos pièces d'exception.",
  },
  {
    id: 2,
    question: "L'application est-elle gratuite ?",
    answer: "Oui, l'accès à l'ensemble des fonctionnalités actuelles de [Votre Marque] App est offert. Nous souhaitons que chaque passionné puisse bénéficier d'outils d'excellence pour gérer sa collection. Des fonctionnalités premium avancées pourraient être proposées à l'avenir.",
  },
  {
    id: 3,
    question: "Comment mes données de collection sont-elles sécurisées ?",
    answer: "La sécurité et la confidentialité de vos données sont notre priorité absolue. Nous utilisons des sauvegardes cloud chiffrées et des protocoles de sécurité de pointe pour protéger toutes les informations relatives à votre collection. Vous disposez également d'options de confidentialité granulaires pour chaque pièce.",
  },
  {
    id: 4,
    question: "Puis-je ajouter tous types d'objets de luxe ?",
    answer: "Bien que l'application soit initialement optimisée pour les montres, elle est conçue pour être flexible. Vous pouvez y cataloguer vos bijoux précieux et articles de petite maroquinerie de luxe, en adaptant les champs d'information selon la nature de l'objet.",
  },
  {
    id: 5,
    question: "Comment fonctionne l'estimation de valeur ?",
    answer: "Pour les montres, nous prévoyons d'intégrer des API de plateformes reconnues (comme eBay, Chrono24) pour fournir des estimations de valeur basées sur les ventes récentes de modèles similaires. Cette fonctionnalité sera déployée progressivement.",
  },
  {
    id: 6,
    question: "L'essayage virtuel en Réalité Augmentée est-il disponible pour toutes les montres ?",
    answer: "L'essayage virtuel en RA est une fonctionnalité innovante que nous développons activement. Elle sera initialement disponible pour une sélection de modèles populaires et nous étendrons progressivement sa compatibilité.",
  },
  // Ajoutez d'autres questions ici
];

const FaqPage: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    if (activeIndex === index) {
      setActiveIndex(null); // Ferme l'élément si déjà ouvert
    } else {
      setActiveIndex(index); // Ouvre le nouvel élément
    }
  };

  return (
    <div className={styles.faqPageWrapper}> {/* Wrapper pour le fond pleine largeur */}
      <div className={styles.container}> {/* Conteneur pour le contenu centré */}
        <header className={styles.faqHeader}>
          <h1 className={styles.pageTitle}>Questions Fréquemment Posées</h1>
          <p className={styles.pageSubtitle}>
            Trouvez ici les réponses à vos interrogations concernant l'application [Votre Marque] et ses fonctionnalités.
          </p>
        </header>

        <div className={styles.faqList}>
          {faqData.map((item, index) => (
            <div key={item.id} className={styles.faqItem}>
              <button
                className={`${styles.faqQuestion} ${activeIndex === index ? styles.active : ''}`}
                onClick={() => toggleAccordion(index)}
                aria-expanded={activeIndex === index}
                aria-controls={`faq-answer-${item.id}`}
              >
                {item.question}
                <span className={styles.accordionIcon}>
                  {/* Remplacer par des icônes SVG ou react-icons si souhaité */}
                  {activeIndex === index ? '-' : '+'}
                  {/* Exemple avec react-icons: activeIndex === index ? <FiChevronUp /> : <FiChevronDown /> */}
                </span>
              </button>
              <div
                id={`faq-answer-${item.id}`}
                className={`${styles.faqAnswer} ${activeIndex === index ? styles.open : ''}`}
                aria-hidden={activeIndex !== index}
              >
                <p>{item.answer}</p>
              </div>
            </div>
          ))}
        </div>

        <section className={styles.contactSupport}>
          <h2 className={styles.contactTitle}>Vous ne trouvez pas votre réponse ?</h2>
          <p className={styles.contactText}>
            Notre équipe est à votre disposition pour toute question supplémentaire. N'hésitez pas à nous contacter.
          </p>
          {/* Optionnel: Ajouter un bouton ou un lien vers une page de contact */}
          {/* La ligne 101 est probablement ici si vous avez un lien vers une page /contact */}
          <Link to="/contact" className={`${styles.ctaButton} ${styles.contactButton}`}>
            Nous Contacter
          </Link>
        </section>
      </div>
    </div>
  );
};

export default FaqPage;
