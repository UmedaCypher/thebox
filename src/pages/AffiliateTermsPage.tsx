import { Link } from 'react-router-dom';
import InfoPage from '../components/InfoPage/InfoPage';
import Fill from '../components/InfoPage/Fill';
import { LEGAL } from '../lib/legal';
import {
  AFFILIATE_HOLD_DAYS, AFFILIATE_MIN_PAYOUT_EUR, AFFILIATE_RATE, PREMIUM_YEAR_EUR, affiliateCommissionPerYear,
} from '../lib/features';
import { REF_DAYS } from '../lib/source';
import { formatEuros } from '../lib/format';
import { defineStrings, useStrings } from '../i18n';

const S = defineStrings({
  kicker: 'Informations légales',
  title: "Conditions du programme d'affiliation",
  lead: `Mises à jour le ${LEGAL.updatedAt}.`,
  notice: '',
}, {
  kicker: 'Legal',
  title: 'Affiliate programme terms',
  lead: `Last updated ${LEGAL.updatedAt}.`,
  notice: 'This document is available in French only.',
});

export default function AffiliateTermsPage() {
  const t = useStrings(S);
  const L = LEGAL;
  const pct = `${Math.round(AFFILIATE_RATE * 100)} %`;
  return (
    <InfoPage kicker={t.kicker} title={t.title} notice={t.notice || undefined} lead={t.lead} toc>
      <h2>Article 1 : Objet</h2>
      <p>
        Ces conditions encadrent le programme d'affiliation de {L.appName}, édité par <Fill v={L.companyName} label="dénomination sociale" />
        {' '}(« nous »). Elles complètent les <Link to="/cgu">conditions générales d'utilisation</Link>. Rejoindre le programme
        depuis la page <Link to="/affiliation">Affiliation</Link> vaut acceptation de ces conditions.
      </p>

      <h2>Article 2 : Qui peut participer</h2>
      <ul>
        <li>Tout membre majeur ({L.minAge} ans révolus) disposant d'un compte {L.appName} avec un pseudo.</li>
        <li>L'affilié agit en son nom propre, de manière indépendante. Le programme ne crée ni contrat de travail, ni mandat, ni société entre l'affilié et nous.</li>
        <li>Nous pouvons refuser ou suspendre une participation qui ne respecte pas ces conditions.</li>
      </ul>

      <h2>Article 3 : Le lien d'affiliation</h2>
      <ul>
        <li>Chaque affilié choisit un code et reçoit un lien personnel. Le code ne doit pas reprendre une marque, le nom d'un tiers ou le nom {L.appName} de façon trompeuse.</li>
        <li>Une personne qui suit ce lien est rattachée à l'affilié pendant {REF_DAYS} jours, sur le même navigateur. Si elle suit ensuite le lien d'un autre affilié, c'est le dernier lien suivi qui compte.</li>
        <li>Le rattachement repose sur une information enregistrée dans le navigateur. Il peut être perdu si la personne efface ses données de navigation, change d'appareil ou souscrit depuis une application mobile : aucune commission n'est alors due.</li>
      </ul>

      <h2>Article 4 : La commission</h2>
      <ul>
        <li>
          L'affilié reçoit <strong>{pct} du montant hors taxes</strong> effectivement encaissé pour la <strong>première année d'abonnement annuel</strong> Premium
          d'une personne rattachée à son lien. Au prix actuel de {formatEuros(PREMIUM_YEAR_EUR)} TTC par an, cela représente {formatEuros(affiliateCommissionPerYear(), true)} par abonné.
        </li>
        <li>Seuls les nouveaux abonnés comptent : une personne ayant déjà été abonnée n'ouvre pas droit à commission.</li>
        <li>Ne donnent pas droit à commission : l'abonnement mensuel, les renouvellements après la première année, les abonnements souscrits par l'affilié lui-même ou pour son propre compte, et ceux obtenus par un moyen interdit à l'article 6.</li>
        <li>Une réduction accordée à l'abonné (code promotionnel) réduit d'autant la base de calcul.</li>
      </ul>

      <h2>Article 5 : Validation et paiement</h2>
      <ul>
        <li>Une commission est confirmée {AFFILIATE_HOLD_DAYS} jours après le paiement de l'abonné, une fois passé le délai de rétractation de 14 jours.</li>
        <li>Elle est annulée si l'abonnement est remboursé ou contesté auprès de la banque pendant ce délai. Si un remboursement ou un litige intervient après le versement, nous pouvons déduire le montant concerné des commissions suivantes.</li>
        <li>Les commissions confirmées sont versées par virement bancaire, au début de chaque mois, dès que leur total atteint {AFFILIATE_MIN_PAYOUT_EUR} €. En dessous, le solde est reporté au mois suivant.</li>
        <li>L'affilié renseigne un IBAN à son nom depuis la page Affiliation. Nous ne sommes pas responsables d'un retard dû à des coordonnées erronées.</li>
        <li>Les montants sont exprimés en euros. Les frais de la banque de l'affilié restent à sa charge.</li>
      </ul>

      <h2>Article 6 : Règles de promotion</h2>
      <p>L'affilié s'engage à :</p>
      <ul>
        <li><strong>signaler clairement le caractère commercial</strong> de ses publications contenant le lien, par exemple avec la mention « collaboration commerciale » ou « lien affilié », conformément à la loi du 9 juin 2023 sur l'influence commerciale ;</li>
        <li>présenter {L.appName} de façon exacte, sans promettre de fonction, de prix ou de réduction qui n'existe pas ;</li>
        <li>ne pas envoyer de messages non sollicités (spam), y compris dans la messagerie de {L.appName} ;</li>
        <li>ne pas acheter de publicité sur le nom {L.appName} ou ses variantes dans les moteurs de recherche ;</li>
        <li>ne pas créer de faux comptes, ne pas s'abonner par personne interposée et ne pas inciter à souscrire puis demander un remboursement.</li>
      </ul>
      <p>En cas de manquement, nous pouvons annuler les commissions concernées, suspendre le lien ou mettre fin à la participation.</p>

      <h2>Article 7 : Obligations fiscales et sociales</h2>
      <p>
        Les commissions sont des revenus que l'affilié doit déclarer. Selon le montant et la régularité de son activité, il peut devoir adopter un statut
        (par exemple micro-entrepreneur) et nous transmettre une facture. Nous ne prélevons ni impôt ni cotisation sur les sommes versées.
      </p>

      <h2>Article 8 : Données personnelles</h2>
      <p>
        Pour gérer le programme, nous conservons le code de l'affilié, les commissions et versements, son nom de titulaire de compte et son IBAN.
        L'IBAN n'est utilisé que pour les virements et n'est jamais affiché en entier dans l'app. Les données comptables sont conservées dix ans.
        L'affilié ne voit jamais l'identité des personnes qu'il a recommandées, seulement des montants. Pour le reste, voir la{' '}
        <Link to="/confidentialite">politique de confidentialité</Link>.
      </p>

      <h2>Article 9 : Durée, modification et fin</h2>
      <ul>
        <li>L'affilié peut quitter le programme à tout moment en nous écrivant à {L.email}. Les commissions déjà confirmées lui restent dues, même sous le seuil de {AFFILIATE_MIN_PAYOUT_EUR} €.</li>
        <li>Nous pouvons modifier ces conditions ou arrêter le programme en prévenant les affiliés au moins 30 jours à l'avance. Les commissions nées avant la modification restent calculées selon les conditions en vigueur au moment de l'abonnement.</li>
        <li>Ces conditions sont soumises au droit français. En cas de désaccord, nous chercherons d'abord une solution amiable.</li>
      </ul>
    </InfoPage>
  );
}
