import { Link } from 'react-router-dom';
import InfoPage from '../components/InfoPage/InfoPage';
import Fill from '../components/InfoPage/Fill';
import { LEGAL } from '../lib/legal';
import { FREE_WATCH_LIMIT, premiumPrices } from '../lib/features';
import { defineStrings, useStrings } from '../i18n';

const S = defineStrings({
  kicker: 'Informations légales',
  title: 'Conditions générales de vente',
  lead: `Mises à jour le ${LEGAL.updatedAt}.`,
  notice: '',
}, {
  kicker: 'Legal',
  title: 'Terms of sale',
  lead: `Last updated ${LEGAL.updatedAt}.`,
  notice: 'This document is available in French only.',
});

export default function CgvPage() {
  const t = useStrings(S);
  const L = LEGAL;
  const p = premiumPrices();
  return (
    <InfoPage kicker={t.kicker} title={t.title} notice={t.notice || undefined} lead={t.lead} toc>
      <h2>Article 1 : Vendeur et champ d'application</h2>
      <p>
        Ces conditions régissent la vente de l'abonnement {L.appName} Premium par <Fill v={L.companyName} label="dénomination sociale" />,
        {' '}{L.legalForm}, <Fill v={L.address} label="adresse de domiciliation" />, <Fill v={L.rcs} label="RCS et numéro SIREN" />,
        {' '}<a href={`mailto:${L.email}`}>{L.email}</a> (« nous »), à toute personne majeure (« vous »).
        Elles complètent les <Link to="/cgu">conditions générales d'utilisation</Link>. Elles ne concernent pas les ventes de montres
        entre membres sur le Marché, auxquelles nous ne sommes pas partie.
      </p>

      <h2>Article 2 : L'abonnement Premium</h2>
      <p>Premium ajoute au Service gratuit :</p>
      <ul>
        <li>une collection illimitée (le compte gratuit est limité à {FREE_WATCH_LIMIT} montres) ;</li>
        <li>le coût par port de chaque montre et le repérage des montres dormantes ;</li>
        <li>le carnet d'entretien avec rappels, le suivi de valeur et les statistiques de portage ;</li>
        <li>la wishlist, avec une alerte quand une montre recherchée arrive sur le Marché ;</li>
        <li>l'inventaire de la collection pour l'assurance.</li>
      </ul>
      <p>La liste à jour figure sur la page <Link to="/premium">Premium</Link> au moment de la commande.</p>

      <h2>Article 3 : Prix</h2>
      <p>
        Premium coûte <strong>{p.month.amount} {p.month.period}</strong> ou <strong>{p.year.amount} {p.year.period}</strong>, toutes taxes comprises.
        Le prix applicable est celui affiché au moment de la commande. En cas de hausse, nous vous prévenons au moins 30 jours avant
        qu'elle s'applique à votre abonnement ; vous pouvez résilier avant cette date.
      </p>

      <h2>Article 4 : Commande et paiement</h2>
      <p>
        Vous choisissez la formule sur la page Premium, puis payez sur la page sécurisée de notre prestataire Stripe, par carte bancaire
        ou par les autres moyens qu'il propose. Nous n'avons jamais accès à vos données de carte. La commande est confirmée par e-mail,
        avec la facture correspondante.
      </p>
      <p>
        Dans les applications Android et iOS, l'abonnement peut aussi être souscrit et réglé via Google Play ou l'App Store ;
        le paiement, le renouvellement, la résiliation et le remboursement suivent alors les conditions de ces boutiques.
      </p>

      <h2>Article 5 : Durée, renouvellement et résiliation</h2>
      <ul>
        <li>L'abonnement est mensuel ou annuel et se renouvelle automatiquement pour la même durée, au tarif en vigueur.</li>
        <li>Pour l'abonnement annuel, nous vous rappelons par e-mail son renouvellement entre un et trois mois avant l'échéance.</li>
        <li>Vous pouvez résilier à tout moment en quelques clics depuis <Link to="/profil">Profil</Link>, rubrique Offre, bouton « Gérer mon abonnement ». La résiliation prend effet à la fin de la période déjà payée ; Premium reste actif jusque-là.</li>
        <li>À la fin de l'abonnement, votre compte repasse en gratuit. Vos montres, photos et données sont conservées ; au-delà de {FREE_WATCH_LIMIT} montres, vous pouvez toujours les consulter, mais pas en ajouter.</li>
      </ul>

      <h2>Article 6 : Droit de rétractation</h2>
      <p>
        Vous disposez de 14 jours à compter de la souscription pour vous rétracter, sans avoir à vous justifier, en nous écrivant à
        {' '}<a href={`mailto:${L.email}`}>{L.email}</a> (le modèle de formulaire ci-dessous peut être utilisé).
        Premium étant accessible dès le paiement à votre demande, le remboursement correspond au prix payé, diminué de la part
        correspondant aux jours déjà écoulés. Il intervient sous 14 jours, par le même moyen de paiement.
      </p>
      <p>
        <em>Modèle de formulaire de rétractation : « Je vous notifie par la présente ma rétractation du contrat portant sur l'abonnement
        {' '}{L.appName} Premium, souscrit le [date], au nom de [nom], adresse e-mail du compte : [e-mail]. Date et signature (en cas d'envoi papier). »</em>
      </p>

      <h2>Article 7 : Conformité du service</h2>
      <p>
        Nous sommes tenus des défauts de conformité du service numérique dans les conditions des articles L. 224-25-12 et suivants du code de la consommation.
        En cas de problème, écrivez-nous : nous mettons le service en conformité ou, à défaut, vous remboursons tout ou partie du prix.
      </p>

      <h2>Article 8 : Réclamations et médiation</h2>
      <p>
        Toute réclamation peut être adressée à <a href={`mailto:${L.email}`}>{L.email}</a>. Si elle n'est pas résolue, vous pouvez saisir gratuitement,
        dans l'année qui suit, le médiateur de la consommation : <Fill v={L.mediatorName} label="nom du médiateur" />
        {L.mediatorUrl && <> (<a href={L.mediatorUrl} target="_blank" rel="noreferrer">{L.mediatorUrl.replace(/^https?:\/\//, '')}</a>)</>}.
      </p>

      <h2>Article 9 : Droit applicable</h2>
      <p>Ces conditions sont soumises au droit français. Le consommateur peut saisir la juridiction de son lieu de domicile.</p>
    </InfoPage>
  );
}
