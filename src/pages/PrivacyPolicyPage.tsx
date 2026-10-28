import { Link } from 'react-router-dom';
import InfoPage from '../components/InfoPage/InfoPage';
import Fill from '../components/InfoPage/Fill';
import { LEGAL, contactEmail } from '../lib/legal';
import { defineStrings, useStrings } from '../i18n';

const S = defineStrings({
  kicker: 'Informations légales',
  title: 'Politique de confidentialité',
  lead: `Mise à jour le ${LEGAL.updatedAt}.`,
  notice: '',
}, {
  kicker: 'Legal',
  title: 'Privacy policy',
  lead: `Last updated ${LEGAL.updatedAt}.`,
  notice: 'This document is available in French only.',
});

export default function PrivacyPolicyPage() {
  const t = useStrings(S);
  const L = LEGAL;
  const mail = contactEmail();
  return (
    <InfoPage kicker={t.kicker} title={t.title} notice={t.notice || undefined} lead={t.lead} toc>
      <p>
        {L.appName} sert à tenir le registre d'une collection de montres. Nous collectons ce qu'il faut pour cela, rien de plus :
        pas de publicité, pas de revente de données, pas de cookies publicitaires.
      </p>

      <h2>Responsable du traitement</h2>
      <p>
        <Fill v={L.companyName} label="dénomination sociale" />, {L.legalForm}, <Fill v={L.address} label="adresse de domiciliation" />.
        Contact pour vos données : <a href={`mailto:${mail}`}>{mail}</a>.
      </p>

      <h2>Données collectées</h2>
      <ul>
        <li><strong>Compte</strong> : adresse e-mail, mot de passe (stocké chiffré), date de création.</li>
        <li><strong>Profil</strong> : pseudo, photo de profil, tour de poignet, langue, thème, fuseau horaire, choix de visibilité et de messagerie.</li>
        <li><strong>Collection</strong> : montres, caractéristiques, photos, prix et valeurs déclarés, lieu et date d'achat, notes, entretiens, wishlist, jours de portage. La position GPS est retirée des photos avant l'envoi.</li>
        <li><strong>Marché et messagerie</strong> : annonces (prix, ville, mot du vendeur), messages, blocages et signalements.</li>
        <li><strong>Notifications</strong> : si vous les activez, l'adresse technique de votre appareil auprès du service de notification de votre navigateur ou de votre téléphone, et vos préférences.</li>
        <li><strong>Abonnement Premium</strong> : formule, dates, identifiants client et d'abonnement chez Stripe. Nous ne voyons jamais votre numéro de carte.</li>
        <li><strong>Liste d'attente</strong> : adresse e-mail, nombre de montres déclaré, intérêt pour Premium.</li>
        <li><strong>Données techniques</strong> : journaux de connexion (adresse IP, date, navigateur), pour la sécurité du Service.</li>
      </ul>

      <h2>Finalités et bases légales</h2>
      <table>
        <thead><tr><th>Pourquoi</th><th>Base légale</th></tr></thead>
        <tbody>
          <tr><td>Fournir le Service : compte, collection, portage, galerie, passeport, Marché, messagerie</td><td>Exécution du contrat (CGU)</td></tr>
          <tr><td>Abonnement Premium, facturation</td><td>Exécution du contrat (CGV) et obligation légale (comptabilité)</td></tr>
          <tr><td>Notifications push</td><td>Consentement, retirable à tout moment dans Profil ou dans les réglages de l'appareil</td></tr>
          <tr><td>Liste d'attente et annonce de l'ouverture</td><td>Consentement</td></tr>
          <tr><td>Sécurité, prévention de la fraude, traitement des signalements et modération</td><td>Intérêt légitime et obligations légales d'hébergeur</td></tr>
          <tr><td>Conservation des données d'identification des auteurs de contenus</td><td>Obligation légale</td></tr>
        </tbody>
      </table>

      <h2>Ce qui est visible par les autres membres</h2>
      <ul>
        <li>Par défaut, votre collection est privée.</li>
        <li>Si vous rendez votre profil public, vos montres sont visibles, sans prix ni valeurs. Un passeport n'est visible que si vous le partagez.</li>
        <li>Vos photos de la Galerie et vos annonces du Marché sont publiques, avec votre pseudo. Votre e-mail n'est jamais affiché.</li>
      </ul>

      <h2>Destinataires et sous-traitants</h2>
      <p>Vos données ne sont ni vendues ni louées. Elles sont traitées par nous et par des prestataires techniques, liés par contrat :</p>
      <table>
        <thead><tr><th>Prestataire</th><th>Rôle</th><th>Localisation</th></tr></thead>
        <tbody>
          <tr><td>Supabase</td><td>Base de données, comptes, stockage des photos</td><td>Région <Fill v={L.dataRegion} label="région Supabase" /></td></tr>
          <tr><td>Cloudflare</td><td>Hébergement et diffusion du site</td><td>Réseau mondial, société aux États-Unis</td></tr>
          <tr><td>Stripe</td><td>Paiement de l'abonnement Premium</td><td>Irlande et États-Unis</td></tr>
          <tr><td><Fill v={L.emailProvider} label="prestataire d'e-mails" /></td><td>Envoi des e-mails du Service (confirmation, mot de passe)</td><td>À préciser</td></tr>
          <tr><td>Google, Apple, Mozilla</td><td>Acheminement des notifications push vers votre appareil (contenu chiffré)</td><td>Selon votre navigateur ou téléphone</td></tr>
        </tbody>
      </table>
      <p>
        Lorsque des données sont transférées hors de l'Union européenne, ce transfert est encadré par les clauses contractuelles types
        de la Commission européenne ou par le cadre de protection des données UE–États-Unis.
      </p>

      <h2>Durées de conservation</h2>
      <table>
        <thead><tr><th>Données</th><th>Durée</th></tr></thead>
        <tbody>
          <tr><td>Compte, profil, collection, photos, messages</td><td>Jusqu'à la suppression du compte. Un compte inactif depuis 3 ans est supprimé après un e-mail d'avertissement.</td></tr>
          <tr><td>Données d'identification des auteurs de contenus</td><td>1 an après la publication ou la suppression du compte</td></tr>
          <tr><td>Signalements et décisions de modération</td><td>1 an</td></tr>
          <tr><td>Factures et pièces comptables</td><td>10 ans</td></tr>
          <tr><td>Historique des notifications</td><td>60 jours</td></tr>
          <tr><td>Liste d'attente</td><td>Jusqu'à l'ouverture, puis 12 mois au plus, ou jusqu'à votre désinscription</td></tr>
        </tbody>
      </table>

      <h2>Cookies et stockage local</h2>
      <p>
        {L.appName} n'utilise ni cookie publicitaire ni traceur tiers. L'app enregistre sur votre appareil uniquement ce qui est nécessaire
        à son fonctionnement : votre session de connexion, votre langue, votre thème et quelques préférences d'affichage.
        Ce stockage étant strictement nécessaire, il ne requiert pas de consentement.
      </p>

      <h2>Vos droits</h2>
      <p>
        Vous pouvez accéder à vos données, les rectifier, les effacer, en limiter le traitement, vous y opposer, demander leur portabilité,
        retirer votre consentement et définir des directives sur leur sort après votre décès. La plupart de ces actions se font
        directement dans l'app (Profil, Collection) ; pour le reste, écrivez à <a href={`mailto:${mail}`}>{mail}</a>.
        Nous répondons sous un mois.
      </p>
      <p>
        Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir la CNIL
        (<a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noreferrer">cnil.fr/fr/plaintes</a>).
      </p>

      <h2>Âge minimum</h2>
      <p>Le Service est réservé aux personnes de {L.minAge} ans et plus. Nous supprimons tout compte dont nous apprenons qu'il appartient à un mineur.</p>

      <h2>Sécurité</h2>
      <p>
        Les échanges sont chiffrés (HTTPS), l'accès aux données est limité par des règles strictes au niveau de la base (chaque membre ne lit
        que ce qui lui revient), les mots de passe sont chiffrés et les sauvegardes sont automatiques.
      </p>

      <h2>Modifications</h2>
      <p>
        Nous pouvons mettre à jour cette politique ; la date en haut de page l'indique. En cas de changement important, nous vous prévenons.
        Voir aussi les <Link to="/cgu">CGU</Link> et les <Link to="/mentions-legales">mentions légales</Link>.
      </p>
    </InfoPage>
  );
}
