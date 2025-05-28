// client/src/pages/PricingPage.js
// import React from 'react';
import { Link } from 'react-router-dom';

function PricingPage() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Nos Offres</h1>
      <p style={{ marginBottom: '3rem' }}>Choisissez le plan qui vous convient.</p>

      <div style={{ border: '1px solid #007bff', padding: '2rem', borderRadius: '8px', maxWidth: '400px', margin: '0 auto' }}>
        <h2>Plan Gratuit</h2>
        <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '1rem 0' }}>0 € / mois</p>
        <p>Accès complet à toutes les fonctionnalités actuelles :</p>
        <ul style={{ listStyle: 'none', padding: 0, margin: '1.5rem 0' }}>
          <li>✓ Gestion de collection illimitée</li>
          <li>✓ Suivi de la valeur</li>
          <li>✓ Upload de photos</li>
          <li>✓ Accès à la bibliothèque communautaire</li>
          <li>✓ Wishlist</li>
          <li>✓ Espace membre sécurisé</li>
        </ul>
        <Link to="/signup" style={{ display: 'inline-block', marginTop: '1rem', padding: '0.8rem 1.5rem', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '5px', fontWeight: 'bold' }}>
          Commencer Gratuitement
        </Link>
        <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: '#6c757d' }}>
          L'application est en constante évolution. Des plans premium avec des fonctionnalités avancées pourraient être proposés à l'avenir.
        </p>
      </div>
    </div>
  );
}

export default PricingPage;