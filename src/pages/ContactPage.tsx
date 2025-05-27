// client/src/pages/ContactPage.tsx
import React, { useState } from 'react';
import styles from './ContactPage.module.css'; // Ce fichier CSS sera créé
import { Link } from 'react-router-dom';

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitted(false);
    setIsSubmitting(true);

    // Logique d'envoi du formulaire (simulation ici)
    // Remplacez ceci par votre logique d'appel API (ex: Supabase Edge Function, Formspree, etc.)
    console.log('Données du formulaire à envoyer :', formData);
    try {
      // Simule un appel API qui prend 1.5 secondes
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simuler une réponse (succès ou échec)
      // const success = Math.random() > 0.2; // 80% de chance de succès pour la démo
      const success = true; // Forcer le succès pour la démo

      if (success) {
        setIsSubmitted(true);
        setFormData({ name: '', email: '', subject: '', message: '' }); // Réinitialiser le formulaire
      } else {
        throw new Error("Une erreur s'est produite lors de l'envoi du message. Veuillez réessayer.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur inconnue s'est produite.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.staticPageContainer}>
      <div className={styles.staticPageContent}>
        <header className={styles.staticPageHeader}>
          <h1>Contactez-Nous</h1>
        </header>
        <section className={styles.staticPageSection}>
          <p>
            Une question ? Une suggestion ? Besoin d'assistance pour THE BOX ? N'hésitez pas à nous contacter.
            Remplissez le formulaire ci-dessous ou consultez notre <Link to="/faq" className={styles.inlineLink}>FAQ</Link> pour trouver rapidement une réponse.
          </p>

          {isSubmitted && (
            <div className={styles.formMessageSuccess}>
              Merci ! Votre message a bien été envoyé. Nous vous répondrons dans les plus brefs délais.
            </div>
          )}
          {error && (
            <div className={styles.formMessageError}>
              Erreur : {error}
            </div>
          )}

          {!isSubmitted && (
            <form onSubmit={handleSubmit} className={styles.contactForm}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Nom complet</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className={styles.inputField}
                  disabled={isSubmitting}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="email">Adresse e-mail</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={styles.inputField}
                  disabled={isSubmitting}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="subject">Sujet</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className={styles.inputField}
                  disabled={isSubmitting}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="message">Votre message</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className={styles.textareaField}
                  disabled={isSubmitting}
                />
              </div>
              <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                {isSubmitting ? 'Envoi en cours...' : 'Envoyer le message'}
              </button>
            </form>
          )}

          <div className={styles.alternativeContact}>
            <h2>Autres moyens de nous joindre</h2>
            <p>
              <strong>Support Client :</strong> Pour toute question technique ou liée à votre compte, notre équipe support est là pour vous aider.
              Vous pouvez également consulter notre <Link to="/faq" className={styles.inlineLink}>FAQ</Link>.
            </p>
            <p>
              <strong>Presse :</strong> Pour les demandes médias, veuillez visiter notre <Link to="/presse" className={styles.inlineLink}>Espace Presse</Link>.
            </p>
            <p>
              <strong>Adresse Postale :</strong><br />
              THE BOX<br />
              [Votre Adresse Postale]<br />
              [Votre Code Postal] [Votre Ville]<br />
              France
            </p>
            <p className={styles.legalDisclaimer}>
              <em>
                N'oubliez pas de configurer un backend (par exemple, une Edge Function Supabase qui envoie un email ou sauvegarde en base de données)
                ou un service tiers (comme Formspree, Netlify Forms, etc.) pour que ce formulaire fonctionne réellement et envoie les données.
              </em>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ContactPage;