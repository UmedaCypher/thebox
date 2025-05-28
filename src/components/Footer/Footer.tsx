// client/src/components/Footer/Footer.tsx
import React from 'react'; // React doit être importé pour utiliser React.FC et React.ReactElement
import { Link } from 'react-router-dom';
import styles from './Footer.module.css'; // Assurez-vous que le nom du fichier CSS est correct

interface FooterLinkItem {
  label: string;
  path: string;
}

const Footer: React.FC = () => {
  const currentYear: number = new Date().getFullYear();
  const appName: string = "THE BOX"; // Harmonisation du nom de l'application

  const navLinks: FooterLinkItem[] = [
    { label: 'Accueil', path: '/' },
    { label: 'Application', path: '/app-details' },
    { label: 'Actualités', path: '/actualites' },
    { label: 'Galerie', path: '/galerie-poignet' },
  ];

  const accountLinks: FooterLinkItem[] = [
    { label: 'Mon Compte', path: '/profil' },
    { label: 'Ajouter une Montre', path: '/ajouter-montre' },
    { label: 'Ma Collection', path: '/ma-collection' },
  ];

  const companyLinks: FooterLinkItem[] = [
    { label: 'À Propos', path: '/a-propos' },
    { label: 'Contact', path: '/contact' },
    { label: 'Presse', path: '/presse' },
    { label: 'FAQ', path: '/faq' },
  ];

  const legalLinks: FooterLinkItem[] = [
    { label: "CGU", path: '/cgu' },
    { label: 'CGV', path: '/cgv' },
    { label: 'Confidentialité', path: '/confidentialite' },
    { label: 'Mentions Légales', path: '/mentions-legales' },
  ];

  // CORRECTION: Changement de JSX.Element à React.ReactElement
  const renderLinkList = (links: FooterLinkItem[]): React.ReactElement => (
    <ul>
      {links.map((link: FooterLinkItem) => (
        <li key={link.label}>
          <Link to={link.path} className={styles.link}>{link.label}</Link>
        </li>
      ))}
    </ul>
  );

  return (
    <footer className={styles.footer}>
      <div className={styles.contentWrapper}> {/* Conteneur général pour la largeur max */}
        <div className={styles.mainSection}> {/* Logo et grille de liens */}
          <div className={styles.logoContainer}>
            <Link to="/" className={styles.logoText}>THE BOX</Link>
            {/* <p className={styles.logoTagline}>Votre écrin numérique.</p> */}
          </div>
          <nav className={styles.linksNav}> {/* Grille de liens encapsulée dans nav */}
            <div className={styles.linkColumn}>
              <h4>Navigation</h4>
              {renderLinkList(navLinks)}
            </div>
            <div className={styles.linkColumn}>
              <h4>Mon Espace</h4>
              {renderLinkList(accountLinks)}
            </div>
            <div className={styles.linkColumn}>
              <h4>Société</h4>
              {renderLinkList(companyLinks)}
            </div>
            <div className={styles.linkColumn}>
              <h4>Légal</h4>
              {renderLinkList(legalLinks)}
            </div>
          </nav>
        </div>

        <div className={styles.bottomBar}> {/* Copyright et branding MAHE */}
          <p className={styles.copyright}>
            &copy; {currentYear} {appName}. Tous droits réservés.
          </p>
          <p className={styles.maheBranding}>
            Une application créée par MAHE. Découvrez notre univers sur{' '}
            <a href="https://maison-mahe.com" target="_blank" rel="noopener noreferrer">
              maison-mahe.com
            </a>.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
