// client/src/pages/SignupPage.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // <--- useNavigate supprimé car innutilisé
import { supabase } from '../lib/supabaseClient'; // Assurez-vous que ce chemin est correct
import styles from './AuthPage.module.css'; // Fichier CSS module partagé

const SignupPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  // const navigate = useNavigate(); // Optionnel, pour rediriger après inscription

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setLoading(true);
    try {
      // Inscription avec Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          // Vous pouvez ajouter des données ici qui seront disponibles dans le trigger `handle_new_user`
          // par exemple, si vous avez un champ username dans le formulaire d'inscription :
          // data: { username: 'valeur_du_champ_username' },
          // Supabase enverra un email de confirmation par défaut.
          // L'URL de redirection dans l'email de confirmation peut être configurée dans les paramètres de votre projet Supabase.
        }
      });

      if (signUpError) {
        throw signUpError;
      }

      // data.user contient l'utilisateur s'il est créé.
      // data.session est null si la confirmation d'email est requise (ce qui est le cas par défaut).
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        // Ce cas peut arriver si l'utilisateur existe déjà mais n'est pas confirmé
         setMessage("Cet utilisateur existe déjà. Veuillez vérifier vos emails pour confirmer votre inscription si ce n'est pas déjà fait, ou essayez de vous connecter.");
      } else if (data.user) {
        setMessage("Inscription réussie ! Veuillez vérifier vos emails pour confirmer votre compte avant de vous connecter.");
        // Le trigger `handle_new_user` que nous avons configuré dans Supabase devrait créer une entrée dans la table `profiles`.
      } else {
         // Cas où l'utilisateur est créé mais la session n'est pas établie immédiatement (confirmation d'email requise)
         setMessage("Veuillez vérifier vos emails pour confirmer votre inscription.");
      }

      // Optionnel: vider les champs après succès
      // setEmail('');
      // setPassword('');
      // setConfirmPassword('');

    } catch (err: any) {
      console.error("Erreur détaillée d'inscription:", err);
      setError(err.error_description || err.message || "Une erreur est survenue lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPageContainer}>
      <div className={styles.authFormCard}>
        <h2 className={styles.authTitle}>Créer un compte</h2>
        {error && <p className={styles.errorMessage}>{error}</p>}
        {message && <p className={styles.successMessage}>{message}</p>}
        <form onSubmit={handleSubmit} className={styles.authForm}>
          <div className={styles.inputGroup}>
            <label htmlFor="signup-email" className={styles.inputLabel}>Email</label>
            <input
              type="email"
              id="signup-email" // ID unique pour le label
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.inputField}
              disabled={loading}
              autoComplete="email"
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="signup-password" className={styles.inputLabel}>Mot de passe</label>
            <input
              type="password"
              id="signup-password" // ID unique
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className={styles.inputField}
              disabled={loading}
              autoComplete="new-password"
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="signup-confirmPassword" className={styles.inputLabel}>Confirmer le mot de passe</label>
            <input
              type="password"
              id="signup-confirmPassword" // ID unique
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={styles.inputField}
              disabled={loading}
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className={styles.authButton} disabled={loading}>
            {loading ? 'Inscription en cours...' : "S'inscrire"}
          </button>
        </form>
        <p className={styles.redirectLink}>
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
