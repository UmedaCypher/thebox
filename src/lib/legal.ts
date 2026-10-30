/**
 * Informations légales de l'éditeur : à compléter ici, une seule fois.
 * Elles alimentent les mentions légales, les CGU, les CGV et la politique de confidentialité.
 * Tant qu'un champ est vide, les pages affichent « à compléter » surligné, pour ne rien oublier avant l'ouverture.
 */
export const LEGAL = {
  /** Nom de l'app tel qu'affiché au public (provisoire). */
  appName: 'Arcora',
  /** Adresse du site, sans « / » final. */
  siteUrl: '',

  // ---------- Société éditrice (SIREN 104 672 431) ----------
  companyName: 'Mahé Fine Collectibles',
  legalForm: 'SAS',
  capital: '5 000 €',
  address: '47 rue Vivienne, 75002 Paris',
  rcs: 'RCS Paris 104 672 431',
  /** Calculé à partir du SIREN : à confirmer sur l'espace professionnel impots.gouv.fr ou sur VIES ; vider si la société est en franchise de TVA. */
  vatNumber: 'FR78 104672431',
  director: 'Quentin Mahé, président',
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
