import { Link } from 'react-router-dom';
import InfoPage from '../components/InfoPage/InfoPage';
import Fill from '../components/InfoPage/Fill';
import { LEGAL } from '../lib/legal';
import { FREE_WATCH_LIMIT } from '../lib/features';
import { defineStrings, useStrings } from '../i18n';

const S = defineStrings({
  kicker: 'Informations légales',
  title: "Conditions générales d'utilisation",
  lead: `Mises à jour le ${LEGAL.updatedAt}.`,
  notice: '',
}, {
  kicker: 'Legal',
  title: 'Terms of use',
  lead: `Last updated ${LEGAL.updatedAt}.`,
  notice: 'This document is available in French only.',
});

export default function CguPage() {
  const t = useStrings(S);
  const L = LEGAL;
  return (
    <InfoPage kicker={t.kicker} title={t.title} notice={t.notice || undefined} lead={t.lead} toc>
      <h2>Article 1 : Objet</h2>
      <p>
        Les présentes conditions encadrent l'utilisation du site et des applications {L.appName} (« le Service »), édités par
        {' '}<Fill v={L.companyName} label="dénomination sociale" /> (« nous »). Créer un compte vaut acceptation de ces conditions.
        L'abonnement payant Premium est régi en plus par les <Link to="/cgv">conditions générales de vente</Link>.
      </p>

      <h2>Article 2 : Le Service</h2>
      <p>{L.appName} permet aux collectionneurs de montres de :</p>
      <ul>
        <li>tenir le registre de leur collection (gratuit jusqu'à {FREE_WATCH_LIMIT} montres) ;</li>
        <li>noter les montres portées chaque jour et consulter leurs statistiques ;</li>
        <li>partager une galerie de photos au poignet et un passeport public pour chaque montre, s'ils le souhaitent ;</li>
        <li>publier des annonces de vente ou d'échange sur le Marché et échanger avec les autres membres par messagerie ;</li>
        <li>recevoir des notifications, s'ils les activent.</li>
      </ul>
      <p>Nous pouvons faire évoluer, suspendre ou arrêter une fonction ; nous prévenons les membres concernés à l'avance quand c'est possible.</p>

      <h2>Article 3 : Compte</h2>
      <ul>
        <li>Le Service est réservé aux personnes majeures ({L.minAge} ans révolus).</li>
        <li>Vous fournissez une adresse e-mail valide et gardez votre mot de passe confidentiel. Toute action faite depuis votre compte est réputée faite par vous.</li>
        <li>Un pseudo est nécessaire pour publier sur le Marché, apparaître dans la Galerie ou écrire à un membre. Il ne doit ni usurper l'identité d'autrui, ni faire croire à un lien avec une marque ou un professionnel.</li>
        <li>Vous pouvez supprimer votre compte à tout moment. Vos données et photos sont alors effacées, sauf obligation légale de conservation (voir la <Link to="/confidentialite">politique de confidentialité</Link>).</li>
      </ul>

      <h2>Article 4 : Le Marché</h2>
      <p>
        Le Marché est un espace de petites annonces entre membres. <strong>{L.appName} n'est ni vendeur, ni acheteur, ni intermédiaire de paiement</strong> :
        nous hébergeons les annonces et la messagerie, sans intervenir dans les transactions, qui se concluent directement entre membres.
        Nous ne vérifions ni l'authenticité, ni l'état, ni la provenance des montres.
      </p>
      <p>En publiant une annonce, vous déclarez :</p>
      <ul>
        <li>être propriétaire de la montre et libre de la vendre ou de l'échanger ;</li>
        <li>la décrire honnêtement (état, références, boîte et papiers, révisions) avec des photos de cette montre ;</li>
        <li>agir en tant que particulier. Les vendeurs professionnels doivent l'indiquer dans l'annonce et respecter les obligations du droit de la consommation.</li>
      </ul>
      <p>Sont interdits sur le Marché : les contrefaçons et répliques, les montres volées ou d'origine douteuse, les annonces sans montre réelle, les demandes de paiement hors de toute rencontre ou garantie raisonnable, et toute tentative d'escroquerie.</p>
      <p>Nous vous recommandons de demander des photos récentes, de vérifier la référence et les papiers, et de privilégier une remise en main propre dans un lieu sûr ou chez un horloger.</p>

      <h2>Article 5 : Messagerie</h2>
      <p>
        La messagerie sert à échanger à propos d'une montre ou de la collection d'un membre. Le harcèlement, les insultes, le démarchage,
        la publicité et l'envoi de liens frauduleux sont interdits. Chaque membre peut refuser les messages, bloquer un membre
        et signaler un message. Nous pouvons consulter un message signalé pour traiter le signalement.
      </p>

      <h2>Article 6 : Vos contenus</h2>
      <p>
        Vous restez propriétaire des photos et textes que vous publiez. Vous nous accordez une licence gratuite, non exclusive et mondiale
        pour les héberger, les redimensionner et les afficher dans le Service, selon les réglages de visibilité que vous choisissez,
        pendant la durée de leur publication. Vous garantissez détenir les droits sur ces contenus et n'y faire figurer personne sans son accord.
      </p>
      <p>Avant l'envoi, la position GPS est retirée des photos. Les prix et valeurs que vous saisissez dans votre collection ne sont jamais publiés.</p>

      <h2>Article 7 : Signalement et modération</h2>
      <ul>
        <li>Tout contenu peut être signalé avec le bouton « Signaler » ou à <a href={`mailto:${L.email}`}>{L.email}</a>, en précisant le contenu en cause et la raison.</li>
        <li>Nous examinons les signalements avec diligence. Un contenu illicite ou contraire à ces conditions peut être retiré ou rendu invisible.</li>
        <li>En cas de manquements graves ou répétés, le compte peut être suspendu ou supprimé.</li>
        <li>Nous informons le membre concerné de la décision et de ses motifs. Il peut la contester en répondant à ce message ; un humain réexamine alors la décision.</li>
      </ul>

      <h2>Article 8 : Responsabilité</h2>
      <p>
        Nous faisons de notre mieux pour que le Service soit disponible et sûr, sans pouvoir garantir une disponibilité permanente.
        Notre responsabilité ne peut être engagée pour les transactions conclues entre membres, ni pour le contenu publié par un membre.
        Les estimations de valeur et le coût par port sont calculés à partir de vos propres saisies et n'ont qu'une valeur indicative.
      </p>

      <h2>Article 9 : Données personnelles</h2>
      <p>Le traitement de vos données est décrit dans la <Link to="/confidentialite">politique de confidentialité</Link>.</p>

      <h2>Article 10 : Modification des conditions</h2>
      <p>Nous pouvons modifier ces conditions. En cas de changement important, nous vous prévenons au moins 15 jours à l'avance par e-mail ou dans l'app. Si vous refusez, vous pouvez supprimer votre compte.</p>

      <h2>Article 11 : Droit applicable</h2>
      <p>
        Ces conditions sont soumises au droit français. En cas de litige, contactez-nous d'abord à <a href={`mailto:${L.email}`}>{L.email}</a>.
        Les consommateurs peuvent aussi recourir à la médiation (voir les <Link to="/mentions-legales">mentions légales</Link>) et
        aux tribunaux compétents selon les règles de droit commun.
      </p>
    </InfoPage>
  );
}
