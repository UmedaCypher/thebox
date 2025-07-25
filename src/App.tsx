// client/src/App.tsx (Mis à jour pour inclure les routes du CRM)

import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// Styles globaux et de layout
import './App.css'; 

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

// Pages Professionnelles
import ProDashboardPage from './pages/ProDashboardPage'; 
import LocationManagerPage from './pages/LocationManagerPage';
import InvoiceEditorPage from './pages/InvoiceEditorPage';
import MarketplacePage from './pages/MarketplacePage';
import ClientListPage from './pages/ClientListPage';
import ClientDetailPage from './pages/ClientDetailPage';


// Composant de protection de routes
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';


function App() {
  return (
    <Router>
      <div className="appContainer">
        <Header />
        
        <main className="mainContent">
          <Routes>
            {/* --- Routes Publiques --- */}
            <Route path="/" element={<HomePage />} />
            <Route path="/app-details" element={<AppPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/actualites" element={<WatchNewsPage />} />
            <Route path="/galerie-poignet" element={<WristShotGalleryPage />} />
            <Route path="/marche" element={<MarketplacePage />} />
            <Route path="/profil/:username" element={<PublicProfilePage />} />

            {/* --- Routes Publiques Statiques (Footer) --- */}
            <Route path="/cgu" element={<CguPage />} />
            <Route path="/cgv" element={<CgvPage />} />
            <Route path="/confidentialite" element={<PrivacyPolicyPage />} />
            <Route path="/mentions-legales" element={<LegalMentionsPage />} />
            <Route path="/presse" element={<PressPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/a-propos" element={<AboutPage />} />

            {/* --- Routes Utilisateur Protégées --- */}
            <Route path="/ma-collection" element={<ProtectedRoute><MyCollectionPage /></ProtectedRoute>} />
            <Route path="/montre/:watchId" element={<ProtectedRoute><WatchDetailPage /></ProtectedRoute>} />
            <Route path="/ajouter-montre" element={<ProtectedRoute><WatchEditorPage /></ProtectedRoute>} />
            <Route path="/montre/:watchId/modifier" element={<ProtectedRoute><WatchEditorPage /></ProtectedRoute>} />
            <Route path="/profil" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
            <Route path="/messagerie" element={<ProtectedRoute><MessagingPage /></ProtectedRoute>} />
            <Route path="/messagerie/nouvelle/:targetUserId" element={<ProtectedRoute><MessagingPage /></ProtectedRoute>} />

            {/* --- Routes Professionnelles (Protégées) --- */}
            <Route path="/dashboard-pro" element={<ProtectedRoute><ProDashboardPage /></ProtectedRoute>} />
            <Route path="/gerer-lieux" element={<ProtectedRoute><LocationManagerPage /></ProtectedRoute>} />
            <Route path="/creer-facture" element={<ProtectedRoute><InvoiceEditorPage /></ProtectedRoute>} />
            <Route path="/clients" element={<ProtectedRoute><ClientListPage /></ProtectedRoute>} />
            <Route path="/clients/nouveau" element={<ProtectedRoute><ClientDetailPage /></ProtectedRoute>} />
            <Route path="/clients/:clientId" element={<ProtectedRoute><ClientDetailPage /></ProtectedRoute>} />
            
            {/* --- Page 404 --- */}
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
