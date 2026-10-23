// client/src/pages/PressPage.tsx
import React from 'react';
import { defineStrings, useStrings } from '../i18n';
import styles from './StaticPage.module.css';

const S = defineStrings({
  title: 'Espace Presse',
  welcome: 'Bienvenue dans notre espace presse',
  intro: "Vous trouverez ici toutes les informations relatives à THE BOX, nos communiqués de presse, notre kit média, ainsi que les contacts pour toute demande d'interview ou d'information complémentaire.",
  aboutTitle: 'À Propos de THE BOX',
  about: "THE BOX est une application innovante dédiée aux collectionneurs de montres de luxe, de bijoux et de petite maroquinerie. Notre mission est d'offrir une plateforme complète et élégante pour gérer, valoriser et partager leur passion. Nous combinons technologie de pointe et design soigné pour une expérience utilisateur inégalée.",
  kitTitle: 'Dossier de Presse / Kit Média',
  kit: "Téléchargez notre dossier de presse complet pour en savoir plus sur notre histoire, notre équipe, nos fonctionnalités clés et notre vision. Notre kit média inclut des logos haute résolution, des captures d'écran de l'application et des photos officielles.",
  kitDownload: 'Télécharger le Kit Média (Bientôt disponible)',
  releasesTitle: 'Communiqués de Presse',
  releaseTitle: 'Lancement officiel de THE BOX - [Date de lancement]',
  releaseText: "THE BOX annonce aujourd'hui le lancement de son application révolutionnaire pour les collectionneurs d'objets de luxe...",
  releaseSoon: '(Communiqué à venir)',
  contactTitle: 'Contact Presse',
  contactIntro: "Pour toute demande d'information, interview, ou collaboration, veuillez contacter :",
  contactName: '[Nom du contact presse / Service Presse]',
  email: 'Email :',
  disclaimer: 'Adaptez ce contenu avec vos informations réelles. Pensez à créer un vrai kit média (logo, images HD, etc.) et à rédiger vos communiqués de presse.',
}, {
  title: 'Press',
  welcome: 'Welcome to our press area',
  intro: 'Here you will find everything about THE BOX: our press releases, our media kit, and who to contact for interviews or further information.',
  aboutTitle: 'About THE BOX',
  about: 'THE BOX is an app for collectors of fine watches, jewellery and small leather goods. Our mission is to offer a complete and elegant place to manage, enhance and share their passion. We combine modern technology and careful design for an outstanding experience.',
  kitTitle: 'Press pack / Media kit',
  kit: 'Download our full press pack to learn more about our story, our team, our key features and our vision. Our media kit includes high-resolution logos, app screenshots and official photos.',
  kitDownload: 'Download the media kit (coming soon)',
  releasesTitle: 'Press releases',
  releaseTitle: 'Official launch of THE BOX - [Launch date]',
  releaseText: 'THE BOX today announces the launch of its app for collectors of luxury items...',
  releaseSoon: '(Release coming soon)',
  contactTitle: 'Press contact',
  contactIntro: 'For information requests, interviews or partnerships, please contact:',
  contactName: '[Press contact name / Press office]',
  email: 'Email:',
  disclaimer: 'Adapt this content with your real information. Remember to create a real media kit (logo, HD images, etc.) and to write your press releases.',
});

const PressPage: React.FC = () => {
  const t = useStrings(S);
  return (
    <div className={styles.staticPageContainer}>
      <div className={styles.staticPageContent}>
        <header className={styles.staticPageHeader}>
          <h1>{t.title}</h1>
        </header>
        <section className={styles.staticPageSection}>
          <h2>{t.welcome}</h2>
          <p>{t.intro}</p>

          <div className={styles.pressSectionItem}>
            <h3>{t.aboutTitle}</h3>
            <p>{t.about}</p>
          </div>

          <div className={styles.pressSectionItem}>
            <h3>{t.kitTitle}</h3>
            <p>{t.kit}</p>
            {/* Remplacez '#' par le lien réel vers votre kit média */}
            <a href="#" className={styles.downloadButton} download>
              {t.kitDownload}
            </a>
          </div>

          <div className={styles.pressSectionItem}>
            <h3>{t.releasesTitle}</h3>
            {/* Exemple de communiqué */}
            <div className={styles.pressRelease}>
              <h4>{t.releaseTitle}</h4>
              <p>{t.releaseText}</p>
              {/* <a href="/path-to-press-release-1.pdf" target="_blank" rel="noopener noreferrer" className={styles.readMoreLink}>Lire le communiqué</a> */}
              <p><em>{t.releaseSoon}</em></p>
            </div>
            {/* Ajoutez d'autres communiqués ici au fur et à mesure */}
          </div>

          <div className={styles.pressSectionItem}>
            <h3>{t.contactTitle}</h3>
            <p>{t.contactIntro}</p>
            <p>
              <strong>{t.contactName}</strong><br />
              {t.email} <a href="mailto:presse@thebox.com" className={styles.emailLink}>presse@thebox.com</a><br />
              {/* Téléphone : [Numéro de téléphone presse] (optionnel) */}
            </p>
          </div>
          <p className={styles.legalDisclaimer}>
            <em>{t.disclaimer}</em>
          </p>
        </section>
      </div>
    </div>
  );
};

export default PressPage;
