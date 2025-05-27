// client/src/pages/LoginPage/LoginPage.tsx (ou client/src/pages/LoginPage.tsx)
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient'; // Assurez-vous que le chemin est correct
import styles from './AuthPage.module.css'; // Réutilise les styles de AuthPage.module.css

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate(); // Pour la redirection après connexion

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (signInError) {
        throw signInError;
      }

      console.log("Utilisateur connecté:", data.user);
      console.log("Session:", data.session);
      // Ici, vous mettriez à jour votre état global d'authentification
      // et redirigeriez l'utilisateur, par exemple vers son tableau de bord.
      // Pour l'instant, nous allons juste rediriger vers la page d'accueil.
      navigate('/'); // Ou vers une page de tableau de bord '/dashboard'

    } catch (err: any) {
      console.error("Erreur détaillée de connexion:", err);
      if (err.message === "Invalid login credentials") {
        setError("Email ou mot de passe incorrect.");
      } else if (err.message === "Email not confirmed") {
        setError("Veuillez confirmer votre email avant de vous connecter.");
      } else {
        setError(err.error_description || err.message || "Une erreur est survenue lors de la connexion.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPageContainer}>
      <div className={styles.authFormCard}>
        <h2 className={styles.authTitle}>Connexion</h2>
        {error && <p className={styles.errorMessage}>{error}</p>}
        <form onSubmit={handleSubmit} className={styles.authForm}>
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.inputLabel}>Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.inputField}
              disabled={loading}
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.inputLabel}>Mot de passe</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.inputField}
              disabled={loading}
            />
          </div>
          {/* Optionnel : Lien "Mot de passe oublié ?" */}
          {/* <div className={styles.forgotPasswordLinkContainer}>
            <Link to="/forgot-password" className={styles.forgotPasswordLink}>Mot de passe oublié ?</Link>
          </div> */}
          <button type="submit" className={styles.authButton} disabled={loading}>
            {loading ? 'Connexion en cours...' : "Se connecter"}
          </button>
        </form>
        <p className={styles.redirectLink}>
          Pas encore de compte ? <Link to="/signup">S'inscrire</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
