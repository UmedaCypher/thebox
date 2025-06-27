// client/src/components/Header/Header.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import styles from './Header.module.css';

// --- Icônes (inchangées) ---
const EnvelopeIcon: React.FC<{ className?: string }> = ({ className }) => ( <svg width="24px" height="24px" strokeWidth="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor" className={className}> <path d="M7 9L12 12.5L17 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path> <path d="M2 17V7C2 5.89543 2.89543 5 4 5H20C21.1046 5 22 5.89543 22 7V17C22 18.1046 21.1046 19 20 19H4C2.89543 19 2 18.1046 2 17Z" stroke="currentColor" strokeWidth="1.5"></path> </svg> );
const BurgerIcon: React.FC = () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line> </svg> );
const CloseIcon: React.FC = () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line> </svg> );
const DefaultAvatarIcon: React.FC<{ className?: string }> = ({ className }) => ( <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"> <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/> </svg> );


function Header() {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); 

  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [loadingUnreadCount, setLoadingUnreadCount] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsMobileMenuOpen(false); 
      navigate('/');
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  useEffect(() => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [location]);

  const fetchUnreadMessagesCount = useCallback(async () => {
    if (user) {
      setLoadingUnreadCount(true);
      try {
        const { data, error } = await supabase.rpc('count_unread_conversations');
        if (error) {
          console.error("Erreur récupération messages non lus:", error);
          setUnreadMessagesCount(0);
        } else {
          setUnreadMessagesCount(data || 0);
        }
      } catch (rpcError) {
        console.error("Exception RPC count_unread_conversations:", rpcError);
        setUnreadMessagesCount(0);
      } finally {
        setLoadingUnreadCount(false);
      }
    } else {
      setUnreadMessagesCount(0); 
    }
  }, [user]); 

  useEffect(() => {
    fetchUnreadMessagesCount();
    if (!user) return; 

    const changesChannel = supabase
      .channel('public-header-listeners-all-v9')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => fetchUnreadMessagesCount())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversation_participants', filter: `user_id=eq.${user.id}` }, () => fetchUnreadMessagesCount())
      .subscribe((_status, err) => {
        if (err) console.error('Header subscription error:', err);
      });

    return () => {
      supabase.removeChannel(changesChannel);
    };
  }, [user, fetchUnreadMessagesCount]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);


  return (
    <header className={styles.header}>
      <div className={styles.headerContentWrapper}>
        <div className={styles.logo}>
          <Link to="/">THE BOX</Link>
        </div>

        <nav className={`${styles.nav} ${styles.navDesktop}`}>
          <ul>
            <li><Link to="/">Accueil</Link></li>
            <li><Link to="/app-details">Application</Link></li>
            <li><Link to="/galerie-poignet">Galerie</Link></li>
            <li><Link to="/actualites">Actualités</Link></li>
            {user && (
              <>
                {/* MODIFICATION : Ajout du lien vers le tableau de bord pour les utilisateurs connectés */}
                <li><Link to="/dashboard-pro">Tableau de bord</Link></li>
                <li><Link to="/ma-collection">Ma Collection</Link></li>
                <li>
                  <Link to="/messagerie" className={styles.navLinkWithIconContainer}>
                    <EnvelopeIcon className={styles.messageSvgIcon} />
                    {!loadingUnreadCount && unreadMessagesCount > 0 && (
                      <span className={styles.notificationBadge}>
                        {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                      </span>
                    )}
                  </Link>
                </li>
              </>
            )}
             <li><Link to="/faq">FAQ</Link></li>
          </ul>
        </nav>

        <div className={styles.controlsContainer}>
          <button onClick={toggleMobileMenu} className={styles.mobileMenuButton} aria-label="Ouvrir le menu" aria-expanded={isMobileMenuOpen}>
            {isMobileMenuOpen ? <CloseIcon /> : <BurgerIcon />}
          </button>

          <div className={`${styles.authButtons} ${styles.authButtonsDesktop}`}>
            {authLoading && !user ? ( 
              <span className={styles.loadingState}>Chargement...</span>
            ) : user ? (
              <>
                <Link to="/profil" className={styles.profileLink}>Profil</Link>
                <button onClick={handleSignOut} className={styles.logoutButton}>Déconnexion</button>
              </>
            ) : (
              <>
                <Link to="/login" className={styles.loginButton}>Connexion</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className={styles.mobileMenu}>
          <div className={styles.mobileMenuScrollContainer}> 
            <nav className={styles.mobileMenuNav}>
              <ul className={styles.mobileMenuList}> 
                <div className={styles.mobileMenuTopGroup}>
                  {user ? (
                    <li className={`${styles.mobileMenuItemHeaderType} ${styles.mobileMenuUserProfile}`}>
                      <Link to="/profil" onClick={toggleMobileMenu}>
                        {user.user_metadata?.profile_picture_url ? (
                          <img src={user.user_metadata.profile_picture_url} alt="Avatar" className={styles.mobileMenuProfileAvatar} />
                        ) : (
                          <DefaultAvatarIcon className={styles.mobileMenuProfileAvatar} />
                        )}
                        <span className={styles.mobileMenuProfileUsername}>
                          {user.user_metadata?.username || user.email?.split('@')[0]}
                        </span>
                      </Link>
                    </li>
                  ) : (
                    <>
                      <li className={styles.mobileMenuItemHeaderType}><Link to="/login" onClick={toggleMobileMenu}>Connexion</Link></li>
                      <li className={styles.mobileMenuItemHeaderType}><Link to="/signup" onClick={toggleMobileMenu}>Inscription</Link></li>
                    </>
                  )}

                  <li className={styles.mobileMenuItemHeaderType}><Link to="/" onClick={toggleMobileMenu}>Accueil</Link></li>
                  <li className={styles.mobileMenuItemHeaderType}><Link to="/app-details" onClick={toggleMobileMenu}>Application</Link></li>
                  
                  {user && (
                      <>
                        {/* MODIFICATION : Ajout du lien vers le tableau de bord dans le menu mobile */}
                        <li className={styles.mobileMenuItemHeaderType}><Link to="/dashboard-pro" onClick={toggleMobileMenu}>Tableau de bord</Link></li>
                        <li className={styles.mobileMenuItemHeaderType}><Link to="/ma-collection" onClick={toggleMobileMenu}>Ma Collection</Link></li>
                      </>
                  )}
                  
                  <li className={styles.mobileMenuItemHeaderType}><Link to="/galerie-poignet" onClick={toggleMobileMenu}>Galerie</Link></li>
                  <li className={styles.mobileMenuItemHeaderType}><Link to="/actualites" onClick={toggleMobileMenu}>Actualités</Link></li>
                  <li className={styles.mobileMenuItemHeaderType}><Link to="/faq" onClick={toggleMobileMenu}>FAQ</Link></li>
                  
                  {user && (
                    <li className={styles.mobileMenuItemHeaderType}>
                      <button onClick={handleSignOut} className={styles.mobileLogoutButton}>Déconnexion</button>
                    </li>
                  )}
                </div>

                <div className={styles.mobileMenuBottomGroup}>
                  <li className={`${styles.mobileMenuItemFooterType} ${styles.mobileMenuSectionTitleCustom}`}>Informations</li>
                  <li className={styles.mobileMenuItemFooterType}><Link to="/a-propos" onClick={toggleMobileMenu}>À Propos</Link></li>
                  <li className={styles.mobileMenuItemFooterType}><Link to="/contact" onClick={toggleMobileMenu}>Contact</Link></li>
                  <li className={styles.mobileMenuItemFooterType}><Link to="/presse" onClick={toggleMobileMenu}>Presse</Link></li>
                  
                  <li className={`${styles.mobileMenuItemFooterType} ${styles.mobileMenuSectionTitleCustom}`}>Légal</li>
                  <li className={styles.mobileMenuItemFooterType}><Link to="/cgu" onClick={toggleMobileMenu}>CGU</Link></li>
                  <li className={styles.mobileMenuItemFooterType}><Link to="/cgv" onClick={toggleMobileMenu}>CGV</Link></li>
                  <li className={styles.mobileMenuItemFooterType}><Link to="/confidentialite" onClick={toggleMobileMenu}>Politique de confidentialité</Link></li>
                  <li className={styles.mobileMenuItemFooterType}><Link to="/mentions-legales" onClick={toggleMobileMenu}>Mentions Légales</Link></li>
                </div>
              </ul>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;