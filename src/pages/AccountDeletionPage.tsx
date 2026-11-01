import { Link } from 'react-router-dom';
import InfoPage from '../components/InfoPage/InfoPage';
import { LEGAL } from '../lib/legal';
import { defineStrings, useStrings } from '../i18n';

/** Page publique demandée par Google Play : comment supprimer son compte et ses données, avec ou sans l'app. */
const S = defineStrings({
  kicker: 'Vos données',
  title: 'Supprimer votre compte Arcora',
  lead: 'Vous pouvez supprimer votre compte et toutes vos données à tout moment, depuis l’app ou par e-mail.',
  inApp: 'Depuis l’app (immédiat)',
  steps: [
    'Connectez-vous, sur le site ou dans l’application Android.',
    'Ouvrez votre Profil (votre photo, en haut à droite).',
    'Dans la section « Compte », touchez « Supprimer mon compte », puis confirmez.',
  ],
  subNote: 'Si vous avez un abonnement Premium, résiliez-le d’abord depuis le Profil (« Gérer mon abonnement »).',
  byEmail: 'Sans l’app (sous 7 jours)',
  emailText: (email: string) => `Écrivez à ${email} depuis l’adresse e-mail de votre compte, avec pour objet « Suppression de compte ». Nous supprimons le compte sous 7 jours et vous le confirmons par e-mail.`,
  deleted: 'Ce qui est supprimé',
  deletedList: [
    'votre profil, votre pseudo et votre photo de profil ;',
    'votre collection : montres, photos, prix et valeurs déclarés, documents ;',
    'votre calendrier de portage, vos entretiens et votre wishlist ;',
    'vos messages et vos annonces du Marché ;',
    'vos préférences et appareils de notification, votre parrainage.',
  ],
  kept: 'Ce qui est conservé',
  keptText: 'Les factures et paiements d’un abonnement Premium sont conservés dix ans, sans lien avec un compte, car la loi l’exige. Les messages que d’autres membres vous ont envoyés restent dans leur propre messagerie.',
  more: 'Pour le reste, voir la ',
  privacy: 'politique de confidentialité',
}, {
  kicker: 'Your data',
  title: 'Delete your Arcora account',
  lead: 'You can delete your account and all your data at any time, from the app or by email.',
  inApp: 'From the app (immediate)',
  steps: [
    'Sign in, on the website or in the Android app.',
    'Open your Profile (your picture, top right).',
    'In the “Account” section, tap “Delete my account”, then confirm.',
  ],
  subNote: 'If you have a Premium subscription, cancel it first from your Profile (“Manage my subscription”).',
  byEmail: 'Without the app (within 7 days)',
  emailText: (email: string) => `Write to ${email} from your account’s email address, with the subject “Account deletion”. We delete the account within 7 days and confirm by email.`,
  deleted: 'What is deleted',
  deletedList: [
    'your profile, username and profile picture;',
    'your collection: watches, photos, declared prices and values, documents;',
    'your wear calendar, service log and wishlist;',
    'your messages and Market listings;',
    'your notification settings and devices, your referrals.',
  ],
  kept: 'What is kept',
  keptText: 'Invoices and payments for a Premium subscription are kept for ten years, unlinked from any account, as the law requires. Messages other members sent you remain in their own inbox.',
  more: 'For everything else, see the ',
  privacy: 'privacy policy',
});

export default function AccountDeletionPage() {
  const t = useStrings(S);
  return (
    <InfoPage kicker={t.kicker} title={t.title} lead={t.lead}>
      <h2>{t.inApp}</h2>
      <ol>{t.steps.map(x => <li key={x}>{x}</li>)}</ol>
      <p>{t.subNote}</p>
      <h2>{t.byEmail}</h2>
      <p>{t.emailText(LEGAL.email)}</p>
      <h2>{t.deleted}</h2>
      <ul>{t.deletedList.map(x => <li key={x}>{x}</li>)}</ul>
      <h2>{t.kept}</h2>
      <p>{t.keptText}</p>
      <p>{t.more}<Link to="/confidentialite">{t.privacy}</Link>.</p>
    </InfoPage>
  );
}
