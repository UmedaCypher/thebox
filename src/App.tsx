// client/src/App.tsx (Mis à jour pour utiliser des classes CSS pour le layout)

// import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// Styles globaux et de layout
import './App.css'; // ON IMPORTE NOTRE FICHIER DE LAYOUT MIS À JOUR

// Composants de layout
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import BottomNavigationBar from './components/BottomNavigationBar/BottomNavigationBar';

// Pages
import HomePage from './pages/HomePage';
import AppPage from './pages/AppPage';
import PricingPage from './pages/PricingPage';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import FaqPage from './pages/FaqPage';
import MyCollectionPage from './pages/MyCollectionPage';
import WatchDetailPage from './pages/WatchDetailPage';
import WatchEditorPage from './pages/WatchEditorPage';
import UserProfilePage from './pages/UserProfilePage';
import WatchNewsPage from './pages/WatchNewsPage';
import WristShotGalleryPage from './pages/WristShotGalleryPage';
import PublicProfilePage from './pages/PublicProfilePage';
import MessagingPage from './pages/MessagingPage';
import CguPage from './pages/CguPage';
import CgvPage from './pages/CgvPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import LegalMentionsPage from './pages/LegalMentionsPage';
import PressPage from './pages/PressPage';
import ContactPage from './pages/ContactPage';
import AboutPage from './pages/AboutPage';
// Import du nouveau composant Dashboard Professionnel
// CORRECTION ICI : Le chemin direct vers le fichier dans 'pages'
import ProDashboardPage from './pages/ProDashboardPage'; 

// Composant de protection de routes
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';


function App() {
  return (
    <Router>
      {/* Le style en ligne a été remplacé par une classe CSS pour la clarté et la maintenance.
        La logique reste la même : un conteneur flex vertical.
      */}
      <div className="appContainer">
        <Header />
        
        {/* La classe "mainContent" gère maintenant le flex-grow et le padding */}
        <main className="mainContent">
          <Routes>
            {/* --- Toutes vos routes restent identiques --- */}
            
            {/* Routes Publiques */}
            <Route path="/" element={<HomePage />} />
            <Route path="/app-details" element={<AppPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/actualites" element={<WatchNewsPage />} />
            <Route path="/galerie-poignet" element={<WristShotGalleryPage />} />

            {/* Routes Publiques Statiques */}
            <Route path="/cgu" element={<CguPage />} />
            <Route path="/cgv" element={<CgvPage />} />
            <Route path="/confidentialite" element={<PrivacyPolicyPage />} />
            <Route path="/mentions-legales" element={<LegalMentionsPage />} />
            <Route path="/presse" element={<PressPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/a-propos" element={<AboutPage />} />

            {/* Routes Protégées */}
            <Route path="/ma-collection" element={<ProtectedRoute><MyCollectionPage /></ProtectedRoute>} />
            <Route path="/montre/:watchId" element={<ProtectedRoute><WatchDetailPage /></ProtectedRoute>} />
            <Route path="/ajouter-montre" element={<ProtectedRoute><WatchEditorPage /></ProtectedRoute>} />
            <Route path="/montre/:watchId/modifier" element={<ProtectedRoute><WatchEditorPage /></ProtectedRoute>} />
            <Route path="/profil" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
            <Route path="/profil/:username" element={<PublicProfilePage />} />

            {/* NOUVELLE ROUTE : Dashboard Professionnel */}
            {/* Protégée, car elle nécessite une authentification et un type de compte spécifique géré à l'intérieur du composant */}
            <Route path="/dashboard-pro" element={<ProtectedRoute><ProDashboardPage /></ProtectedRoute>} />

            {/* ROUTES POUR LA MESSAGERIE */}
            <Route path="/messagerie" element={<ProtectedRoute><MessagingPage /></ProtectedRoute>} />
            <Route path="/messagerie/nouvelle/:targetUserId" element={<ProtectedRoute><MessagingPage /></ProtectedRoute>} />
            
            {/* Page 404 */}
            <Route path="*" element={
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <h2>404 - Page non trouvée</h2>
                <p>Désolé, la page que vous cherchez n'existe pas.</p>
                <Link to="/" style={{color: 'var(--primary-color)', fontWeight: 'bold', textDecoration: 'underline'}}>
                  Retour à l'accueil
                </Link>
              </div>
            } />
          </Routes>
        </main>

        <Footer />
        <BottomNavigationBar />
      </div>
    </Router>
  );
}

export default App;
