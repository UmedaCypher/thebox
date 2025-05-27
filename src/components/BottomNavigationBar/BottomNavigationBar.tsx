// client/src/components/BottomNavigationBar/BottomNavigationBar.tsx
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './BottomNavigationBar.module.css';

// --- NOUVELLES ICÔNES SVG ---

const NewsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    className={className} // Permet de styler via CSS Modules si besoin
    width="24" 
    height="24" 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor" // Hérite la couleur du parent
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth="2" // Utilisation de la stroke-width des paths originaux
      d="M19 7h1v12a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h11.5M7 14h6m-6 3h6m0-10h.5m-.5 3h.5M7 7h3v3H7V7Z"
    />
  </svg>
);

const GalleryIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    className={className}
    width="24" 
    height="24" 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth="2" 
      d="m3 16 5-7 6 6.5m6.5 2.5L16 13l-4.286 6M14 10h.01M4 19h16a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Z"
    />
  </svg>
);

const CollectionIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    className={className}
    width="24" 
    height="24" 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth="2" 
      d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  </svg>
);

const MessagesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    className={className}
    width="24" 
    height="24" 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth="2" 
      d="M9 17h6l3 3v-3h2V9h-2M4 4h11v8H9l-3 3v-3H4V4Z"
    />
  </svg>
);

// --- FIN DES NOUVELLES ICÔNES SVG ---

interface NavItemProps {
  to: string;
  icon: React.FC<{ className?: string }>; // L'icône est un composant React
  label: string;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon: IconComponent, label }) => {
  // NavLink gère la classe 'active' automatiquement.
  // Le style de l'icône active sera géré par CSS en ciblant .navItem.active svg
  return (
    <NavLink 
      to={to}
      className={({ isActive }) => 
        isActive ? `${styles.navItem} ${styles.active}` : styles.navItem
      }
    >
      <IconComponent className={styles.navIcon} /> {/* Appliquer une classe pour un style ciblé si besoin */}
      <span className={styles.navLabel}>{label}</span>
    </NavLink>
  );
};

const BottomNavigationBar: React.FC = () => {
  const { user } = useAuth();

  return (
    <nav className={styles.bottomNavContainer}>
      <NavItem to="/galerie-poignet" icon={GalleryIcon} label="Galerie" />
      <NavItem to="/actualites" icon={NewsIcon} label="Actualités" />
      {user && (
        <>
          <NavItem to="/ma-collection" icon={CollectionIcon} label="Collection" />
          <NavItem to="/messagerie" icon={MessagesIcon} label="Messages" />
        </>
      )}
    </nav>
  );
};

export default BottomNavigationBar;