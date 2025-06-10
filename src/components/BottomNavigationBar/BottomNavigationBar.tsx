// client/src/components/BottomNavigationBar/BottomNavigationBar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './BottomNavigationBar.module.css';

// --- ICÔNES SVG EXISTANTES ---

const NewsIcon: React.FC<{ className?: string }> = ({ className }) => (
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

// --- NOUVELLE ICÔNE PROFIL AJOUTÉE ---
const ProfileIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    className={className} 
    aria-hidden="true" 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    fill="currentColor" 
    viewBox="0 0 24 24"
  >
    <path fillRule="evenodd" d="M12 20a7.966 7.966 0 0 1-5.002-1.756l.002.001v-.683c0-1.794 1.492-3.25 3.333-3.25h3.334c1.84 0 3.333 1.456 3.333 3.25v.683A7.966 7.966 0 0 1 12 20ZM2 12C2 6.477 6.477 2 12 2s10 4.477 10 10c0 5.5-4.44 9.963-9.932 10h-.138C6.438 21.962 2 17.5 2 12Zm10-5c-1.84 0-3.333 1.455-3.333 3.25S10.159 13.5 12 13.5c1.84 0 3.333-1.455 3.333-3.25S13.841 7 12 7Z" clipRule="evenodd"/>
  </svg>
);
// --- FIN DE L'AJOUT DE L'ICÔNE ---

interface NavItemProps {
  to: string;
  icon: React.FC<{ className?: string }>;
  label: string;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon: IconComponent, label }) => {
  return (
    <NavLink 
      to={to}
      className={({ isActive }) => 
        isActive ? `${styles.navItem} ${styles.active}` : styles.navItem
      }
    >
      <IconComponent className={styles.navIcon} />
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
          {/* --- LIEN PROFIL AJOUTÉ ICI --- */}
          <NavItem to="/profil" icon={ProfileIcon} label="Profil" />
        </>
      )}
    </nav>
  );
};

export default BottomNavigationBar;
