/**
 * Informations légales de l'éditeur : à compléter ici, une seule fois.
 * Elles alimentent les mentions légales, les CGU, les CGV et la politique de confidentialité.
 * Tant qu'un champ est vide, les pages affichent « à compléter » surligné, pour ne rien oublier avant l'ouverture.
 */
export const LEGAL = {
  /** Nom de l'app tel qu'affiché au public (provisoire). */
  appName: 'The Box',
  /** Adresse du site, sans « / » final. */
  siteUrl: '',

  // ---------- Société éditrice (SASU) ----------
  companyName: '',            // dénomination sociale, ex. « Maison Mahé SAS »
  legalForm: 'SASU',          // ou « SAS »
  capital: '',                // ex. « 1 000 € »
  address: '',                // adresse de domiciliation complète
  rcs: '',                    // ex. « RCS Paris 123 456 789 »
  vatNumber: '',              // ex. « FR12 123456789 » (laisser vide si non assujettie)
  director: '',               // président(e), directeur(trice) de la publication
  phone: '',                  // numéro joignable (obligatoire pour une société)
  email: 'contact@maison-mahe.com',
  privacyEmail: '',           // adresse dédiée aux données personnelles (sinon l'adresse de contact)

  // ---------- Médiateur de la consommation (obligatoire avant de vendre le Premium) ----------
  mediatorName: '',
  mediatorUrl: '',

  // ---------- Hébergement ----------
  /** Région du projet Supabase (Settings → General). Idéalement dans l'UE, ex. « Francfort (Allemagne) ». */
  dataRegion: '',
  /** Prestataire d'envoi des e-mails (ex. Resend, Brevo), une fois choisi. */
  emailProvider: '',

  /** Date de dernière mise à jour des documents (à changer à chaque modification). */
  updatedAt: '28 octobre 2026',
  /** Âge minimum pour créer un compte. */
  minAge: 18,
};

export const contactEmail = () => LEGAL.privacyEmail || LEGAL.email;
