import { Link } from 'react-router-dom';
import InfoPage from '../components/InfoPage/InfoPage';
import Fill from '../components/InfoPage/Fill';
import { LEGAL } from '../lib/legal';
import {
  AFFILIATE_HOLD_DAYS, AFFILIATE_MIN_PAYOUT_EUR, AFFILIATE_RATE, AFFILIATE_TYPES, MEMBER_REWARDS_PER_YEAR,
  PREMIUM_YEAR_EUR, affiliateCommissionPerYear,
} from '../lib/features';
import { REF_DAYS } from '../lib/source';
import { formatEuros } from '../lib/format';
import { defineStrings, useStrings } from '../i18n';

const S = defineStrings({
  kicker: 'Informations légales',
  title: 'Conditions du parrainage et de l’affiliation',
  lead: `Mises à jour le ${LEGAL.updatedAt}.`,
  notice: '',
}, {
  kicker: 'Legal',
  title: 'Referral and affiliate terms',
  lead: `Last updated ${LEGAL.updatedAt}.`,
  notice: 'This document is available in French only.',
});

const months = (days: number) => Math.round(days / 30);

export default function AffiliateTermsPage() {
  const t = useStrings(S);
  const L = LEGAL;
  const pct = `${Math.round(AFFILIATE_RATE * 100)}\u00a0%`;
  const { member: M, creator: C, pro: P } = AFFILIATE_TYPES;
  return (
    <InfoPage kicker={t.kicker} title={t.title} notice={t.notice || undefined} lead={t.lead} toc>
      <h2>Article 1 : Objet</h2>
      <p>
        Ces conditions encadrent le parrainage et le programme d'affiliation de {L.appName}, édités par <Fill v={L.companyName} label="dénomination sociale" />
        {' '}(« nous »). Elles complètent les <Link to="/cgu">conditions générales d'utilisation</Link>. Utiliser son lien de parrainage, ou demander
        à rejoindre le programme depuis la page <Link to="/affiliation">Parrainage</Link>, vaut acceptation de ces conditions.
      </p>

      <h2>Article 2 : Les trois programmes</h2>
      <ul>
        <li>
          <strong>Parrainage membre</strong> : ouvert à tout membre majeur ({L.minAge} ans révolus) ayant choisi un pseudo, qui sert de code.
          Le filleul reçoit {months(M.welcomeDays)} mois de Premium à son inscription. Le parrain reçoit {months(M.rewardDays)} mois de Premium
          quand son filleul a enregistré 3 montres, dans la limite de {MEMBER_REWARDS_PER_YEAR} mois par période de 12 mois. Ces avantages
          ne sont ni échangeables ni remboursables.
        </li>
        <li>
          <strong>Ambassadeur créateur</strong> : sur demande validée par nous, pour les créateurs de contenu horloger. L'ambassadeur
          perçoit la commission décrite à l'article 4. Son public reçoit {months(C.welcomeDays)} mois de Premium à l'inscription.
        </li>
        <li>
          <strong>Partenaire pro</strong> : sur demande validée par nous, pour les horlogers, boutiques et revendeurs. Le partenaire
          ne perçoit pas de commission ; il peut être mentionné dans l'app. Ses clients reçoivent {months(P.welcomeDays)} mois de Premium à l'inscription.
        </li>
      </ul>
      <p>
        Les ambassadeurs et partenaires agissent en leur nom propre, de manière indépendante : le programme ne crée ni contrat de travail,
        ni mandat, ni société avec nous. Nous pouvons refuser une demande sans avoir à la motiver, et suspendre une participation
        qui ne respecte pas ces conditions.
      </p>

      <h2>Article 3 : Le lien</h2>
      <ul>
        <li>Le code d'un ambassadeur ou d'un partenaire ne doit pas reprendre une marque, le nom d'un tiers ou le nom {L.appName} de façon trompeuse.</li>
        <li>Une personne qui suit un lien est rattachée à son auteur pendant {REF_DAYS} jours, sur le même navigateur. Si elle suit ensuite un autre lien, c'est le dernier qui compte.</li>
        <li>Seuls les nouveaux comptes, créés dans ce délai, sont rattachés. Un membre déjà inscrit ne peut pas être parrainé.</li>
        <li>Le rattachement repose sur une information enregistrée dans le navigateur. Il peut être perdu si la personne efface ses données de navigation, change d'appareil ou s'inscrit depuis une application mobile : aucun avantage n'est alors dû.</li>
      </ul>

      <h2>Article 4 : La commission des ambassadeurs</h2>
      <ul>
        <li>
          L'ambassadeur reçoit <strong>{pct} du montant hors taxes</strong> effectivement encaissé pour la <strong>première année d'abonnement annuel</strong> Premium
          d'une personne rattachée à son lien, si elle s'abonne dans les 12 mois qui suivent son inscription. Au prix actuel de {formatEuros(PREMIUM_YEAR_EUR)} TTC par an,
          cela représente {formatEuros(affiliateCommissionPerYear(), true)} par abonné.
        </li>
        <li>Seuls les nouveaux abonnés comptent : une personne ayant déjà été abonnée n'ouvre pas droit à commission.</li>
        <li>Ne donnent pas droit à commission : l'abonnement mensuel, les renouvellements après la première année, les abonnements souscrits par l'ambassadeur lui-même ou pour son propre compte, et ceux obtenus par un moyen interdit à l'article 6.</li>
        <li>Une réduction accordée à l'abonné (code promotionnel) réduit d'autant la base de calcul.</li>
        <li>Il n'y a pas de prime par palier : la commission est la même quel que soit le nombre d'abonnés apportés.</li>
      </ul>

      <h2>Article 5 : Validation et paiement des commissions</h2>
      <ul>
        <li>Une commission est confirmée {AFFILIATE_HOLD_DAYS} jours après le paiement de l'abonné, une fois passé le délai de rétractation de 14 jours.</li>
        <li>Elle est annulée si l'abonnement est remboursé ou contesté auprès de la banque pendant ce délai. Si un remboursement ou un litige intervient après le versement, nous pouvons déduire le montant concerné des commissions suivantes.</li>
        <li>Les commissions confirmées sont versées par virement bancaire, au début de chaque mois, dès que leur total atteint {AFFILIATE_MIN_PAYOUT_EUR} €. En dessous, le solde est reporté au mois suivant.</li>
        <li>L'ambassadeur renseigne un IBAN à son nom depuis la page Parrainage. Nous ne sommes pas responsables d'un retard dû à des coordonnées erronées.</li>
        <li>Les montants sont exprimés en euros. Les frais de la banque de l'ambassadeur restent à sa charge.</li>
      </ul>

      <h2>Article 6 : Règles de promotion</h2>
      <p>Chaque participant s'engage à :</p>
      <ul>
        <li><strong>signaler clairement le caractère commercial</strong> de ses publications rémunérées contenant le lien, par exemple avec la mention « collaboration commerciale » ou « lien affilié », conformément à la loi du 9 juin 2023 sur l'influence commerciale ;</li>
        <li>présenter {L.appName} de façon exacte, sans promettre de fonction, de prix ou de réduction qui n'existe pas ;</li>
        <li>ne pas envoyer de messages non sollicités (spam), y compris dans la messagerie de {L.appName} ;</li>
        <li>ne pas acheter de publicité sur le nom {L.appName} ou ses variantes dans les moteurs de recherche ;</li>
        <li>ne pas créer de faux comptes, ne pas s'inscrire ou s'abonner par personne interposée, et ne pas inciter à souscrire puis demander un remboursement.</li>
      </ul>
      <p>En cas de manquement, nous pouvons annuler les avantages et commissions concernés, suspendre le lien ou mettre fin à la participation.</p>

      <h2>Article 7 : Obligations fiscales et sociales</h2>
      <p>
        Les commissions sont des revenus que l'ambassadeur doit déclarer. Selon le montant et la régularité de son activité, il peut devoir adopter un statut
        (par exemple micro-entrepreneur) et nous transmettre une facture. Nous ne prélevons ni impôt ni cotisation sur les sommes versées.
      </p>

      <h2>Article 8 : Données personnelles</h2>
      <p>
        Pour gérer ces programmes, nous conservons la provenance de chaque inscription, le lien suivi, les avantages accordés, et pour les ambassadeurs
        les commissions, versements, nom du titulaire du compte et IBAN. L'IBAN n'est utilisé que pour les virements et n'est jamais affiché en entier
        dans l'app. Les données comptables sont conservées dix ans. Un parrain ne voit jamais l'identité des personnes qu'il a recommandées, seulement
        des nombres et des montants. Pour le reste, voir la <Link to="/confidentialite">politique de confidentialité</Link>.
      </p>

      <h2>Article 9 : Durée, modification et fin</h2>
      <ul>
        <li>Un ambassadeur ou partenaire peut quitter le programme à tout moment en nous écrivant à {L.email}. Les commissions déjà confirmées lui restent dues, même sous le seuil de {AFFILIATE_MIN_PAYOUT_EUR} €.</li>
        <li>Nous pouvons modifier ces conditions ou arrêter un programme en prévenant les participants au moins 30 jours à l'avance. Les avantages et commissions nés avant la modification restent acquis.</li>
        <li>Ces conditions sont soumises au droit français. En cas de désaccord, nous chercherons d'abord une solution amiable.</li>
      </ul>
    </InfoPage>
  );
}
