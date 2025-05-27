// client/src/pages/CguPage.tsx
import React from 'react';
import styles from './CguPage.module.css'; // Assurez-vous que ce fichier CSS existe
import { Link } from 'react-router-dom';

const CguPage: React.FC = () => {
  return (
    <div className={styles.staticPageContainer}>
      <div className={styles.staticPageContent}>
        <header className={styles.staticPageHeader}>
          <h1>Conditions Générales d'Utilisation (CGU)</h1>
        </header>
        <section className={styles.staticPageSection}>
          <p><strong>Date de dernière mise à jour :</strong> [Date]</p>

          <h2>Article 1 : Objet</h2>
          <p>
            Les présentes Conditions Générales d'Utilisation (ci-après "CGU") ont pour objet de définir les modalités et conditions
            dans lesquelles THE BOX (ci-après "l'Éditeur") met à la disposition de ses utilisateurs (ci-après "l'Utilisateur")
            le site et les services accessibles à partir de l'URL https://context.reverso.net/translation/french-english/de+votre (ci-après "le Site" ou "l'Application").
            L'accès et l'utilisation du Site impliquent l'acceptation sans réserve des présentes CGU par l'Utilisateur.
          </p>

          <h2>Article 2 : Mentions légales</h2>
          <p>
            L'édition du Site est assurée par THE BOX, [Forme juridique de votre société] au capital de [Montant du capital social] euros,
            immatriculée au RCS de [Ville d'immatriculation] sous le numéro [Numéro RCS], dont le siège social est situé à [Adresse complète de votre société].
            Numéro de téléphone : [Numéro de téléphone]. Adresse e-mail : [Adresse e-mail de contact].
            Le Directeur de la publication est [Nom du directeur de la publication].
            L'hébergement du Site est assuré par [Nom de l'hébergeur], [Adresse de l'hébergeur], [Numéro de téléphone de l'hébergeur].
            (Pour plus de détails, voir notre page <Link to="/mentions-legales" className={styles.inlineLink}>Mentions Légales</Link>).
          </p>

          <h2>Article 3 : Accès au site et aux services</h2>
          <p>
            Le Site est accessible gratuitement en tout lieu à tout Utilisateur ayant un accès à Internet. Tous les frais supportés par
            l'Utilisateur pour accéder au service (matériel informatique, logiciels, connexion Internet, etc.) sont à sa charge.
          </p>
          <p>
            L'Éditeur met en œuvre tous les moyens mis à sa disposition pour assurer un accès de qualité à ses services. L'obligation
            étant de moyens, l'Éditeur ne s'engage pas à atteindre ce résultat.
          </p>
          <p>
            L'accès aux services du Site peut à tout moment faire l'objet d'une interruption, d'une suspension, d'une modification sans préavis
            pour une maintenance ou pour tout autre cas. L'Utilisateur s'oblige à ne réclamer aucune indemnisation suite à l'interruption,
            à la suspension ou à la modification du présent contrat.
          </p>
          <p>
            L'Utilisateur a la possibilité de contacter le site par messagerie électronique à l’adresse [Votre adresse e-mail de support].
          </p>

          <h2>Article 4 : Propriété intellectuelle</h2>
          <p>
            Tous les contenus présents sur le Site de THE BOX, incluant, de façon non limitative, les graphismes, images, textes, vidéos, animations, sons, logos, gifs et icônes ainsi que leur mise en forme sont la propriété exclusive de la société à l'exception des marques, logos ou contenus appartenant à d'autres sociétés partenaires ou auteurs.
            Toute reproduction, distribution, modification, adaptation, retransmission ou publication, même partielle, de ces différents éléments est strictement interdite sans l'accord exprès par écrit de THE BOX. Cette représentation ou reproduction, par quelque procédé que ce soit, constitue une contrefaçon sanctionnée par les articles L.335-2 et suivants du Code de la propriété intellectuelle. Le non-respect de cette interdiction constitue une contrefaçon pouvant engager la responsabilité civile et pénale du contrefacteur. En outre, les propriétaires des Contenus copiés pourraient intenter une action en justice à votre encontre.
          </p>

          <h2>Article 5 : Données personnelles</h2>
          <p>
            L'Utilisateur est informé que la collecte de ses données à caractère personnel est nécessaire à la fourniture des services proposés par l'Éditeur. Ces données à caractère personnel sont récoltées uniquement pour l’exécution du contrat de prestation de services.
            Pour plus d'informations sur la gestion de vos données personnelles, veuillez consulter notre <Link to="/confidentialite" className={styles.inlineLink}>Politique de Confidentialité</Link>.
          </p>

          <h2>Article 6 : Responsabilité</h2>
          <p>
            Les sources des informations diffusées sur le Site sont réputées fiables mais le site ne garantit pas qu’il soit exempt de défauts, d’erreurs ou d’omissions.
            Les informations communiquées sont présentées à titre indicatif et général sans valeur contractuelle. Malgré des mises à jour régulières, l'Éditeur ne peut être tenu responsable de la modification des dispositions administratives et juridiques survenant après la publication. De même, l'Éditeur ne peut être tenue responsable de l’utilisation et de l’interprétation de l’information contenue dans ce site.
            L'Éditeur ne peut être tenu pour responsable d’éventuels virus qui pourraient infecter l’ordinateur ou tout matériel informatique de l’Internaute, suite à une utilisation, à l’accès, ou au téléchargement provenant de ce site.
            La responsabilité du site ne peut être engagée en cas de force majeure ou du fait imprévisible et insurmontable d'un tiers.
          </p>

          <h2>Article 7 : Liens hypertextes</h2>
          <p>
            Des liens hypertextes peuvent être présents sur le site. L’Utilisateur est informé qu’en cliquant sur ces liens, il sortira du site de l'Éditeur. Ce dernier n’a pas de contrôle sur les pages web sur lesquelles aboutissent ces liens et ne saurait, en aucun cas, être responsable de leur contenu.
          </p>

          <h2>Article 8 : Cookies</h2>
          <p>
            L’Utilisateur est informé que lors de ses visites sur le site, un cookie peut s’installer automatiquement sur son logiciel de navigation.
            Les cookies sont de petits fichiers stockés temporairement sur le disque dur de l’ordinateur de l’Utilisateur par votre navigateur et qui sont nécessaires à l’utilisation du site https://context.reverso.net/translation/french-english/de+votre. Les cookies ne contiennent pas d’information personnelle et ne peuvent pas être utilisés pour identifier quelqu’un. Un cookie contient un identifiant unique, généré aléatoirement et donc anonyme. Certains cookies expirent à la fin de la visite de l’Utilisateur, d’autres restent.
            L’information contenue dans les cookies est utilisée pour améliorer le site.
            En naviguant sur le site, L’Utilisateur les accepte. L’Utilisateur pourra désactiver ces cookies par l’intermédiaire des paramètres figurant au sein de son logiciel de navigation.
            Pour plus d'informations sur l'utilisation des cookies, veuillez consulter notre <Link to="/confidentialite" className={styles.inlineLink}>Politique de Confidentialité</Link>.
          </p>

          <h2>Article 9 : Droit applicable et juridiction compétente</h2>
          <p>
            La législation française s'applique au présent contrat. En cas d'absence de résolution amiable d'un litige né entre les parties, les tribunaux français seront seuls compétents pour en connaître.
            Pour toute question relative à l’application des présentes CGU, vous pouvez joindre l’éditeur aux coordonnées inscrites à l’ARTICLE 2.
          </p>

          <h2>Article 10 : Modification des CGU</h2>
          <p>
            L'Éditeur se réserve le droit de modifier les termes, conditions et mentions des présentes CGU à tout moment et sans préavis.
            L'Utilisateur est invité à consulter régulièrement la dernière version des CGU disponible sur le Site.
          </p>
          
          <p className={styles.legalDisclaimer}>
            <em>
              Ce document est un modèle générique et doit être adapté, complété et validé par un professionnel du droit
              pour correspondre précisément aux spécificités de votre activité et aux réglementations en vigueur.
            </em>
          </p>
        </section>
      </div>
    </div>
  );
};

export default CguPage;