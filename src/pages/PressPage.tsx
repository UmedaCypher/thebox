// client/src/pages/PressPage.tsx
import React from 'react';
import styles from './PressPage.module.css'; // Ce fichier CSS sera créé

const PressPage: React.FC = () => {
  return (
    <div className={styles.staticPageContainer}>
      <div className={styles.staticPageContent}>
        <header className={styles.staticPageHeader}>
          <h1>Espace Presse</h1>
        </header>
        <section className={styles.staticPageSection}>
          <h2>Bienvenue dans notre espace presse</h2>
          <p>
            Vous trouverez ici toutes les informations relatives à THE BOX, nos communiqués de presse,
            notre kit média, ainsi que les contacts pour toute demande d'interview ou d'information complémentaire.
          </p>

          <div className={styles.pressSectionItem}>
            <h3>À Propos de THE BOX</h3>
            <p>
              THE BOX est une application innovante dédiée aux collectionneurs de montres de luxe, de bijoux et de petite maroquinerie. Notre mission est d'offrir une plateforme complète et élégante pour gérer, valoriser et partager leur passion. Nous combinons technologie de pointe et design soigné pour une expérience utilisateur inégalée.
            </p>
          </div>

          <div className={styles.pressSectionItem}>
            <h3>Dossier de Presse / Kit Média</h3>
            <p>
              Téléchargez notre dossier de presse complet pour en savoir plus sur notre histoire, notre équipe, nos fonctionnalités clés et notre vision.
              Notre kit média inclut des logos haute résolution, des captures d'écran de l'application et des photos officielles.
            </p>
            {/* Remplacez '#' par le lien réel vers votre kit média */}
            <a href="#" className={styles.downloadButton} download>
              Télécharger le Kit Média (Bientôt disponible)
            </a>
          </div>

          <div className={styles.pressSectionItem}>
            <h3>Communiqués de Presse</h3>
            {/* Exemple de communiqué */}
            <div className={styles.pressRelease}>
              <h4>Lancement officiel de THE BOX - [Date de lancement]</h4>
              <p>THE BOX annonce aujourd'hui le lancement de son application révolutionnaire pour les collectionneurs d'objets de luxe...</p>
              {/* <a href="/path-to-press-release-1.pdf" target="_blank" rel="noopener noreferrer" className={styles.readMoreLink}>Lire le communiqué</a> */}
              <p><em>(Communiqué à venir)</em></p>
            </div>
            {/* Ajoutez d'autres communiqués ici au fur et à mesure */}
          </div>

          <div className={styles.pressSectionItem}>
            <h3>Contact Presse</h3>
            <p>
              Pour toute demande d'information, interview, ou collaboration, veuillez contacter :
            </p>
            <p>
              <strong>[Nom du contact presse / Service Presse]</strong><br />
              Email : <a href="mailto:presse@thebox.com" className={styles.emailLink}>presse@thebox.com</a><br />
              {/* Téléphone : [Numéro de téléphone presse] (optionnel) */}
            </p>
          </div>
           <p className={styles.legalDisclaimer}>
            <em>
              Adaptez ce contenu avec vos informations réelles. Pensez à créer un vrai kit média (logo, images HD, etc.) et à rédiger vos communiqués de presse.
            </em>
          </p>
        </section>
      </div>
    </div>
  );
};

export default PressPage;