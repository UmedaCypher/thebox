import { defineStrings } from '.';

/** Textes partagés par plusieurs écrans. */
export const COMMON = defineStrings({
  loading: 'Chargement…',
  close: 'Fermer',
  optional: '(facultatif)',
  choose: 'Choisir…',
  save: 'Enregistrer',
  saving: 'Enregistrement…',
  cancel: 'Annuler',
  back: 'Retour',
  retry: 'Réessayer',
  error: 'Une erreur est survenue.',
  premium: 'Premium',
  tabs: { collection: 'Collection', wear: 'Portage', market: 'Marché', messages: 'Messages', gallery: 'Galerie', profile: 'Profil' },
  listing: {
    forSale: 'À vendre',
    forTrade: 'À échanger',
    trade: 'Échange',
    priceOnRequest: 'Prix sur demande',
    mine: 'Mon annonce',
  },
  unread: (n: number) => `${n} non lu${n > 1 ? 's' : ''}`,
  language: { auto: 'Automatique', fr: 'Français', en: 'English' },
  movements: {
    Automatique: 'Automatique', Manuel: 'Manuel', Quartz: 'Quartz', Solaire: 'Solaire',
    'Spring Drive': 'Spring Drive', 'Mécanique connecté': 'Mécanique connecté',
  } as Record<string, string>,
}, {
  loading: 'Loading…',
  close: 'Close',
  optional: '(optional)',
  choose: 'Choose…',
  save: 'Save',
  saving: 'Saving…',
  cancel: 'Cancel',
  back: 'Back',
  retry: 'Try again',
  error: 'Something went wrong.',
  premium: 'Premium',
  tabs: { collection: 'Collection', wear: 'Wear', market: 'Market', messages: 'Messages', gallery: 'Gallery', profile: 'Profile' },
  listing: {
    forSale: 'For sale',
    forTrade: 'For trade',
    trade: 'Trade',
    priceOnRequest: 'Price on request',
    mine: 'My listing',
  },
  unread: n => `${n} unread`,
  language: { auto: 'Automatic', fr: 'Français', en: 'English' },
  movements: {
    Automatique: 'Automatic', Manuel: 'Manual wind', Quartz: 'Quartz', Solaire: 'Solar',
    'Spring Drive': 'Spring Drive', 'Mécanique connecté': 'Hybrid smartwatch',
  },
});

/** Libellé d'un mouvement : la valeur enregistrée reste en français, l'affichage suit la langue. */
export const movementLabel = (v: string | null | undefined, lang: 'fr' | 'en') =>
  (v ? COMMON[lang].movements[v] ?? v : null);
