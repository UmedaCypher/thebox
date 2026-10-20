import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import { EmptyState, LinkButton, Loading } from './components/ui';

import HomePage from './pages/home/HomePage';
import CollectionPage from './pages/collection/CollectionPage';
import WatchPage from './pages/watch/WatchPage';
import WatchEditorPage from './pages/watch/WatchEditorPage';
import WearPage from './pages/wear/WearPage';
import GalleryPage from './pages/gallery/GalleryPage';
import AccountPage from './pages/account/AccountPage';
import PassportPage from './pages/public/PassportPage';
import PublicProfilePage from './pages/public/PublicProfilePage';
import PremiumPage from './pages/premium/PremiumPage';
import { ForgotPasswordPage, LoginPage, NewPasswordPage, SignupPage } from './pages/auth/AuthPages';

// Pages secondaires, chargées à la demande.
const StatsPage = lazy(() => import('./pages/stats/StatsPage'));
const WishlistPage = lazy(() => import('./pages/wishlist/WishlistPage'));
const InsuranceExportPage = lazy(() => import('./pages/export/InsuranceExportPage'));
const WatchNewsPage = lazy(() => import('./pages/WatchNewsPage'));
const FaqPage = lazy(() => import('./pages/FaqPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const PressPage = lazy(() => import('./pages/PressPage'));
const CguPage = lazy(() => import('./pages/CguPage'));
const CgvPage = lazy(() => import('./pages/CgvPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const LegalMentionsPage = lazy(() => import('./pages/LegalMentionsPage'));

/*
 * En pause (voir src/lib/features.ts) : messagerie, marché, espace revendeur.
 * Leurs fichiers restent dans src/pages ; leurs anciennes adresses renvoient vers la collection.
 */

const P = (el: React.ReactElement) => <ProtectedRoute>{el}</ProtectedRoute>;

function LegacyWatchRedirect() {
  const { watchId } = useParams();
  return <Navigate to={`/montre/${watchId}`} replace />;
}

function NotFound() {
  return (
    <div className="page">
      <EmptyState title="Cette page n'existe pas" action={<LinkButton to="/">Retour à l'accueil</LinkButton>}>
        Le lien est peut-être ancien, ou l'adresse contient une faute de frappe.
      </EmptyState>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="page"><Loading /></div>}>
        <Routes>
          <Route element={<Layout />}>
            {/* Public */}
            <Route path="/" element={<HomePage />} />
            <Route path="/galerie" element={<GalleryPage />} />
            <Route path="/passeport/:watchId" element={<PassportPage />} />
            <Route path="/profil/:username" element={<PublicProfilePage />} />
            <Route path="/premium" element={<PremiumPage />} />
            <Route path="/actualites" element={<WatchNewsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/mot-de-passe-oublie" element={<ForgotPasswordPage />} />
            <Route path="/nouveau-mot-de-passe" element={<NewPasswordPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/a-propos" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/presse" element={<PressPage />} />
            <Route path="/cgu" element={<CguPage />} />
            <Route path="/cgv" element={<CgvPage />} />
            <Route path="/confidentialite" element={<PrivacyPolicyPage />} />
            <Route path="/mentions-legales" element={<LegalMentionsPage />} />

            {/* Membre */}
            <Route path="/collection" element={P(<CollectionPage />)} />
            <Route path="/ajouter-montre" element={P(<WatchEditorPage />)} />
            <Route path="/montre/:watchId" element={P(<WatchPage />)} />
            <Route path="/montre/:watchId/modifier" element={P(<WatchEditorPage />)} />
            <Route path="/portage" element={P(<WearPage />)} />
            <Route path="/profil" element={P(<AccountPage />)} />
            <Route path="/stats" element={P(<StatsPage />)} />
            <Route path="/wishlist" element={P(<WishlistPage />)} />
            <Route path="/export/assurance" element={P(<InsuranceExportPage />)} />

            {/* Anciennes adresses */}
            <Route path="/ma-collection" element={<Navigate to="/collection" replace />} />
            <Route path="/galerie-poignet" element={<Navigate to="/galerie" replace />} />
            <Route path="/pricing" element={<Navigate to="/premium" replace />} />
            <Route path="/app-details" element={<Navigate to="/" replace />} />
            <Route path="/montre/:watchId/detail" element={<LegacyWatchRedirect />} />
            {['/messagerie/*', '/marche', '/dashboard-pro', '/gerer-lieux', '/creer-facture', '/clients/*'].map(p => (
              <Route key={p} path={p} element={<Navigate to="/collection" replace />} />
            ))}

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
