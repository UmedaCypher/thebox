// client/src/pages/LegalMentionsPage.tsx
import React from 'react';
import styles from './LegalMentionsPage.module.css'; // Ce fichier CSS sera créé
import { Link } from 'react-router-dom';

const LegalMentionsPage: React.FC = () => {
  return (
    <div className={styles.staticPageContainer}>
      <div className={styles.staticPageContent}>
        <header className={styles.staticPageHeader}>
          <h1>Mentions Légales</h1>
        </header>
        <section className={styles.staticPageSection}>
          <p>Conformément aux dispositions des Articles 6-III et 19 de la Loi n°2004-575 du 21 juin 2004 pour la Confiance dans l’économie numérique, dite L.C.E.N., il est porté à la connaissance des utilisateurs et visiteurs de l'application THE BOX les présentes mentions légales.</p>

          <h2>1. Éditeur de l'Application</h2>
          <p>
            <strong>Nom de la société :</strong> THE BOX / [Votre Nom si entreprise individuelle]<br />
            <strong>Forme juridique :</strong> [Ex : SAS, SARL, Auto-entrepreneur, etc.]<br />
            <strong>Capital social :</strong> [Montant du capital social] euros (si applicable)<br />
            <strong>Adresse du siège social :</strong> [Votre adresse complète]<br />
            <strong>Numéro de téléphone :</strong> [Votre numéro de téléphone professionnel]<br />
            <strong>Adresse e-mail :</strong> [Votre adresse e-mail de contact, ex: contact@thebox.com]<br />
            <strong>Numéro RCS :</strong> Immatriculée au RCS de [Ville d'immatriculation] sous le numéro [Votre numéro RCS] (si applicable)<br />
            <strong>Numéro de TVA intracommunautaire :</strong> [Votre numéro de TVA] (si applicable)<br />
            <strong>Directeur de la publication :</strong> [Nom et prénom du directeur de la publication / Votre nom]
          </p>

          <h2>2. Hébergement</h2>
          <p>
            L'Application est hébergée par :<br />
            <strong>Nom de l'hébergeur :</strong> [Nom de votre hébergeur (ex: Supabase, Vercel, Netlify, AWS, OVH, etc.)]<br />
            <strong>Adresse :</strong> [Adresse de l'hébergeur]<br />
            <strong>Numéro de téléphone / Contact :</strong> [Numéro de téléphone de l'hébergeur ou lien vers leur support/contact]
          </p>

          <h2>3. Accès à l'Application</h2>
          <p>L'Application est accessible par tout endroit, 7j/7, 24h/24 sauf cas de force majeure, interruption programmée ou non et pouvant découler d’une nécessité de maintenance.</p>
          <p>En cas de modification, interruption ou suspension des services, l'Éditeur ne saurait être tenu responsable.</p>

          <h2>4. Collecte des données</h2>
          <p>
            L'application assure à l'Utilisateur une collecte et un traitement d'informations personnelles dans le respect de la vie privée conformément à la loi n°78-17 du 6 janvier 1978 relative à l'informatique, aux fichiers et aux libertés.
            Pour plus d'informations sur la manière dont nous collectons et utilisons vos données personnelles, veuillez consulter notre <Link to="/confidentialite" className={styles.inlineLink}>Politique de Confidentialité</Link>.
          </p>
          <p>
            En vertu de la loi Informatique et Libertés, en date du 6 janvier 1978, l'Utilisateur dispose d'un droit d'accès, de rectification, de suppression et d'opposition de ses données personnelles. L'Utilisateur exerce ce droit :
          </p>
          <ul>
            <li>par mail à l'adresse email [Votre adresse e-mail de contact pour la protection des données, ex: privacy@thebox.com]</li>
            <li>via son espace personnel dans l'Application (si les fonctionnalités le permettent).</li>
          </ul>


          <h2>5. Propriété Intellectuelle</h2>
          <p>
            Toute utilisation, reproduction, diffusion, commercialisation, modification de toute ou partie de l'Application THE BOX, sans autorisation de l’Éditeur est prohibée et pourra entraîner des actions et poursuites judiciaires telles que notamment prévues par le Code de la propriété intellectuelle et le Code civil.
          </p>
          <p>
            Pour plus d'informations, se reporter aux <Link to="/cgu" className={styles.inlineLink}>CGU</Link> de l'application.
          </p>
           <p className={styles.legalDisclaimer}>
            <em>
              Ce document est un modèle et doit être adapté et complété par des conseils juridiques professionnels
              pour correspondre aux spécificités de votre activité et aux réglementations en vigueur.
            </em>
          </p>
        </section>
      </div>
    </div>
  );
};

export default LegalMentionsPage;