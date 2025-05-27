// client/src/pages/AboutPage.tsx
import React from 'react';
import styles from './AboutPage.module.css'; // Ce fichier CSS sera créé
import { Link } from 'react-router-dom'; // Si besoin de liens internes

const AboutPage: React.FC = () => {
  return (
    <div className={styles.staticPageContainer}>
      <div className={styles.staticPageContent}>
        <header className={styles.staticPageHeader}>
          <h1>À Propos de THE BOX</h1>
        </header>
        <section className={styles.staticPageSection}>
          <h2>Notre Histoire, Votre Passion</h2>
          <p>
            THE BOX est née d'une passion profonde pour l'horlogerie d'exception, les bijoux scintillants et la petite maroquinerie raffinée.
            Nous avons constaté un besoin : celui d'un espace numérique élégant, intuitif et sécurisé où les collectionneurs
            pourraient non seulement cataloguer leurs trésors, mais aussi approfondir leurs connaissances, suivre la valeur de leurs biens,
            et, s'ils le souhaitent, échanger avec une communauté de connaisseurs partageant les mêmes centres d'intérêt.
          </p>
          <p>
            Fatigués des solutions génériques ou incomplètes, nous avons décidé de créer l'écrin numérique ultime,
            une application qui comprend véritablement les nuances et les exigences de la collection d'objets de luxe.
          </p>

          <div className={styles.aboutSectionItem}>
            <h3>Notre Mission</h3>
            <p>
              Notre mission est de fournir aux collectionneurs une application qui transcende la simple gestion d'inventaire.
              Nous visons à enrichir l'expérience de chaque collectionneur en offrant :
            </p>
            <ul>
              <li><strong>Organisation Impeccable :</strong> Des outils de catalogage détaillés et personnalisables pour chaque type d'objet.</li>
              <li><strong>Valorisation Éclairée :</strong> Des fonctionnalités de suivi de la valeur et d'intégration (à venir) avec des données de marché.</li>
              <li><strong>Entretien Simplifié :</strong> Un carnet d'entretien numérique et des rappels pour préserver la longévité de vos pièces.</li>
              <li><strong>Communauté Raffinée :</strong> Un espace de partage optionnel et sécurisé pour échanger avec d'autres passionnés.</li>
              <li><strong>Connaissance Approfondie :</strong> Des ressources pédagogiques pour parfaire votre expertise.</li>
            </ul>
          </div>

          <div className={styles.aboutSectionItem}>
            <h3>Nos Valeurs</h3>
            <ul>
              <li><strong>Excellence :</strong> Nous nous efforçons d'atteindre les plus hauts standards de qualité dans la conception et la fonctionnalité de THE BOX.</li>
              <li><strong>Passion :</strong> L'amour des beaux objets est au cœur de notre démarche.</li>
              <li><strong>Confidentialité :</strong> La sécurité et la discrétion des données de nos utilisateurs sont primordiales.</li>
              <li><strong>Innovation :</strong> Nous cherchons constamment à intégrer des technologies et des fonctionnalités qui apportent une réelle valeur ajoutée.</li>
              <li><strong>Communauté :</strong> Nous croyons au pouvoir du partage et de l'échange entre connaisseurs.</li>
            </ul>
          </div>

          <div className={styles.aboutSectionItem}>
            <h3>L'Équipe (Optionnel)</h3>
            <p>
              [Présentez brièvement l'équipe derrière THE BOX si vous le souhaitez. Par exemple : "THE BOX est développée par une petite équipe de passionnés de technologie et de collectionneurs, basés à [Ville/Pays]. Notre expertise combinée nous permet de comprendre intimement les besoins de nos utilisateurs."]
            </p>
            {/* Vous pourriez ajouter des photos ou des mini-bios ici */}
          </div>
          
          <div className={styles.aboutSectionItem}>
            <h3>Pourquoi "THE BOX" ?</h3>
            <p>
              Le nom "THE BOX" évoque l'écrin précieux qui protège un objet de valeur, le coffre-fort personnel où l'on conserve ses trésors.
              Il symbolise également la structure et l'organisation que notre application apporte à votre collection. C'est votre "boîte à trésors" numérique, personnelle et sécurisée.
            </p>
          </div>

          <p className={styles.legalDisclaimer}>
            <em>
              Nous sommes constamment à l'écoute de nos utilisateurs pour améliorer THE BOX. N'hésitez pas à nous faire part de vos suggestions via notre page <Link to="/contact" className={styles.inlineLink}>Contact</Link>.
            </em>
          </p>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;