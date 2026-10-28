import { Link } from 'react-router-dom';
import InfoPage from '../components/InfoPage/InfoPage';
import Fill from '../components/InfoPage/Fill';
import { LEGAL, contactEmail } from '../lib/legal';
import { defineStrings, useStrings } from '../i18n';

const S = defineStrings({
  kicker: 'Informations légales',
  title: 'Mentions légales',
  lead: `Mises à jour le ${LEGAL.updatedAt}.`,
  notice: '',
}, {
  kicker: 'Legal',
  title: 'Legal notice',
  lead: `Last updated ${LEGAL.updatedAt}.`,
  notice: 'This document is available in French only.',
});

export default function LegalMentionsPage() {
  const t = useStrings(S);
  const L = LEGAL;
  return (
    <InfoPage kicker={t.kicker} title={t.title} notice={t.notice || undefined} lead={t.lead} toc>
      <p>
        Conformément à l'article 6 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique,
        voici les informations relatives à l'éditeur et aux hébergeurs du site et des applications {L.appName}.
      </p>

      <h2>Éditeur</h2>
      <p>
        <Fill v={L.companyName} label="dénomination sociale" />, {L.legalForm} au capital de <Fill v={L.capital} label="capital social" /><br />
        Siège social : <Fill v={L.address} label="adresse de domiciliation" /><br />
        Immatriculation : <Fill v={L.rcs} label="RCS et numéro SIREN" /><br />
        {L.vatNumber && <>TVA intracommunautaire : {L.vatNumber}<br /></>}
        Téléphone : <Fill v={L.phone} label="téléphone" /><br />
        E-mail : <a href={`mailto:${L.email}`}>{L.email}</a>
      </p>
      <p>Directeur de la publication : <Fill v={L.director} label="président(e) de la société" />.</p>

      <h2>Hébergement</h2>
      <p>
        <strong>Site et applications</strong> : Cloudflare, Inc., 101 Townsend Street, San Francisco, CA 94107, États-Unis
        (<a href="https://www.cloudflare.com" target="_blank" rel="noreferrer">cloudflare.com</a>).
      </p>
      <p>
        <strong>Comptes, données et photos</strong> : Supabase Pte. Ltd., 65 Chulia Street #38-02/03, OCBC Centre, Singapour 049513
        (<a href="https://supabase.com" target="_blank" rel="noreferrer">supabase.com</a>). Les données sont stockées
        dans la région <Fill v={L.dataRegion} label="région Supabase" />.
      </p>

      <h2>Signaler un contenu</h2>
      <p>
        {L.appName} héberge des contenus publiés par ses membres (annonces du Marché, photos, messages). Pour signaler
        un contenu illicite, utilisez le bouton « Signaler » dans la messagerie ou écrivez à <a href={`mailto:${L.email}`}>{L.email}</a> en
        précisant l'adresse du contenu, sa nature et la raison du signalement. Cette adresse est aussi le point de contact
        unique des autorités et des utilisateurs au sens du règlement européen sur les services numériques (DSA) ;
        les échanges peuvent avoir lieu en français ou en anglais.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        La marque, le nom, le design, les textes et le code de {L.appName} sont protégés. Toute reproduction sans autorisation
        est interdite. Les photos et textes publiés par les membres restent leur propriété (voir les <Link to="/cgu">CGU</Link>).
        Les noms de marques horlogères sont cités à titre descriptif et appartiennent à leurs titulaires ;
        {' '}{L.appName} n'est affilié à aucune d'entre elles.
      </p>

      <h2>Données personnelles</h2>
      <p>
        Le traitement des données est décrit dans la <Link to="/confidentialite">politique de confidentialité</Link>.
        Contact : <a href={`mailto:${contactEmail()}`}>{contactEmail()}</a>.
      </p>

      <h2>Médiation de la consommation</h2>
      <p>
        En cas de litige non résolu avec notre service client, vous pouvez saisir gratuitement le médiateur de la consommation :
        {' '}<Fill v={L.mediatorName} label="nom du médiateur" />
        {L.mediatorUrl && <> (<a href={L.mediatorUrl} target="_blank" rel="noreferrer">{L.mediatorUrl.replace(/^https?:\/\//, '')}</a>)</>}.
      </p>
    </InfoPage>
  );
}
