// client/src/pages/PrivacyPolicyPage.tsx
import React from 'react';
import styles from './PrivacyPolicyPage.module.css'; // Ce fichier CSS sera créé
import { Link } from 'react-router-dom';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className={styles.staticPageContainer}>
      <div className={styles.staticPageContent}>
        <header className={styles.staticPageHeader}>
          <h1>Politique de Confidentialité</h1>
        </header>
        <section className={styles.staticPageSection}>
          <p><strong>Date de dernière mise à jour :</strong> [Date]</p>

          <h2>Introduction</h2>
          <p>
            THE BOX (ci-après "Nous", "Notre", "Nos") s'engage à protéger la vie privée de ses utilisateurs
            (ci-après "Vous", "Votre", "Vos"). Cette Politique de Confidentialité explique comment nous collectons, utilisons,
            divulguons et protégeons vos informations lorsque vous utilisez notre application THE BOX
            (ci-après "l'Application").
          </p>
          <p>
            Veuillez lire attentivement cette politique de confidentialité. Si vous n'êtes pas d'accord avec les termes de cette politique de confidentialité,
            veuillez ne pas accéder à l'Application.
          </p>

          <h2>Collecte de vos informations</h2>
          <p>
            Nous pouvons collecter des informations vous concernant de différentes manières. Les informations que nous pouvons collecter sur l'Application incluent :
          </p>
          <ul>
            <li>
              <strong>Données personnelles identifiables :</strong> Informations personnellement identifiables, telles que votre nom, votre adresse e-mail,
              votre numéro de téléphone (optionnel), et des informations démographiques (optionnelles), telles que votre tour de poignet,
              que vous nous donnez volontairement lorsque vous vous inscrivez à l'Application ou lorsque vous choisissez de participer à diverses activités
              liées à l'Application (par exemple, compléter votre profil).
            </li>
            <li>
              <strong>Données de collection :</strong> Informations relatives aux objets que vous ajoutez à votre collection, telles que marque, modèle, photos, date d'achat, prix, notes, etc. Ces données sont essentielles au fonctionnement de l'Application.
            </li>
            <li>
              <strong>Données dérivées :</strong> Informations que nos serveurs collectent automatiquement lorsque vous accédez à l'Application, telles que
              votre adresse IP, votre type d'appareil/navigateur, votre système d'exploitation, vos heures d'accès, et les pages/fonctionnalités que vous avez consultées.
            </li>
             <li>
              <strong>Données de localisation :</strong> Nous pouvons demander l'accès ou la permission de suivre les informations basées sur la localisation de votre appareil mobile, soit en continu, soit pendant que vous utilisez l'Application, pour fournir des services basés sur la localisation. Si vous souhaitez modifier notre accès ou nos permissions, vous pouvez le faire dans les paramètres de votre appareil.
            </li>
            <li>
                <strong>Données des appareils mobiles :</strong> Informations sur l'appareil telles que l'ID de votre appareil mobile, le modèle et le fabricant, la version du système d'exploitation, les informations sur le réseau téléphonique et l'adresse IP.
            </li>
          </ul>

          <h2>Utilisation de vos informations</h2>
          <p>
            Avoir des informations précises à votre sujet nous permet de vous fournir une expérience fluide, efficace et personnalisée.
            Plus précisément, nous pouvons utiliser les informations collectées à votre sujet via l'Application pour :
          </p>
          <ul>
            <li>Créer et gérer votre compte.</li>
            <li>Vous permettre de cataloguer et gérer votre collection.</li>
            <li>Vous envoyer des notifications relatives à votre compte ou à l'Application (par exemple, rappels d'entretien).</li>
            <li>Personnaliser et améliorer votre expérience utilisateur.</li>
            <li>Analyser l'utilisation et les tendances pour améliorer l'Application.</li>
            <li>Répondre à vos demandes et vous fournir un support client.</li>
            <li>Vous informer des mises à jour de l'Application.</li>
            <li>Prévenir les activités frauduleuses, surveiller contre le vol et protéger contre les activités criminelles.</li>
            {/* Ajoutez d'autres utilisations spécifiques à THE BOX */}
          </ul>

          <h2>Divulgation de vos informations</h2>
          <p>
            Nous pouvons partager les informations que nous avons collectées à votre sujet dans certaines situations. Vos informations peuvent être divulguées comme suit :
          </p>
          <ul>
            <li>
              <strong>Par la loi ou pour protéger les droits :</strong> Si nous estimons que la divulgation d'informations vous concernant est nécessaire pour répondre à une procédure légale, pour enquêter ou remédier à des violations potentielles de nos politiques, ou pour protéger les droits, la propriété et la sécurité d'autrui, nous pouvons partager vos informations comme permis ou requis par toute loi, règle ou réglementation applicable.
            </li>
            <li>
              <strong>Fournisseurs de services tiers :</strong> Nous pouvons partager vos informations avec des tiers qui effectuent des services pour nous ou en notre nom, y compris l'hébergement de données (par exemple, Supabase), l'analyse de données, le service client et l'assistance marketing.
            </li>
            <li>
              <strong>Interactions entre utilisateurs :</strong> Si vous interagissez avec d'autres utilisateurs de l'Application (par exemple, via la galerie publique si vous rendez votre profil public), ces utilisateurs peuvent voir votre nom d'utilisateur, votre photo de profil (si fournie), et des descriptions de votre activité, y compris les objets de collection que vous choisissez de partager.
            </li>
            <li>
              <strong>Avec votre consentement :</strong> Nous pouvons divulguer vos informations personnelles à d'autres fins avec votre consentement explicite.
            </li>
          </ul>
          <p>Nous ne vendons pas vos informations personnelles à des tiers.</p>

          <h2>Technologies de suivi (Cookies et autres)</h2>
          <p>
            Nous pouvons utiliser des cookies, des balises web, des pixels de suivi et d'autres technologies de suivi sur l'Application pour aider à personnaliser l'Application et améliorer votre expérience. Lorsque vous accédez à l'Application, vos informations personnelles ne sont pas collectées par l'utilisation de la technologie de suivi. La plupart des navigateurs sont configurés pour accepter les cookies par défaut. Vous pouvez généralement choisir de configurer votre navigateur pour supprimer les cookies et pour rejeter les cookies. Si vous choisissez de supprimer les cookies ou de rejeter les cookies, cela pourrait affecter certaines fonctionnalités de l'Application.
            {/* Préciser si utilisation de services d'analyse type Google Analytics */}
          </p>

          <h2>Sécurité de vos informations</h2>
          <p>
            Nous utilisons des mesures de sécurité administratives, techniques et physiques pour aider à protéger vos informations personnelles. Bien que nous ayons pris des mesures raisonnables pour sécuriser les informations personnelles que vous nous fournissez, veuillez être conscient que malgré nos efforts, aucune mesure de sécurité n'est parfaite ou impénétrable, et aucune méthode de transmission de données ne peut être garantie contre toute interception ou autre type d'abus.
          </p>

          <h2>Vos droits concernant vos informations (RGPD)</h2>
          <p>
            Si vous êtes résident de l'Espace Économique Européen (EEE), vous disposez de certains droits en matière de protection des données. THE BOX vise à prendre des mesures raisonnables pour vous permettre de corriger, modifier, supprimer ou limiter l'utilisation de vos Données Personnelles.
          </p>
          <ul>
            <li><strong>Droit d'accès :</strong> Vous avez le droit d'accéder aux informations que nous détenons à votre sujet.</li>
            <li><strong>Droit de rectification :</strong> Vous avez le droit de faire rectifier vos informations si ces informations sont inexactes ou incomplètes.</li>
            <li><strong>Droit à l'effacement :</strong> Dans certaines circonstances, vous avez le droit de nous demander d'effacer vos données personnelles.</li>
            <li><strong>Droit à la limitation du traitement :</strong> Vous avez le droit de demander que nous limitions le traitement de vos informations personnelles.</li>
            <li><strong>Droit à la portabilité des données :</strong> Vous avez le droit de recevoir une copie des informations que nous détenons à votre sujet dans un format structuré, couramment utilisé et lisible par machine.</li>
            <li><strong>Droit d'opposition :</strong> Vous avez le droit de vous opposer à notre traitement de vos Données Personnelles.</li>
            <li><strong>Droit de retirer son consentement :</strong> Vous avez également le droit de retirer votre consentement à tout moment lorsque THE BOX s'est appuyé sur votre consentement pour traiter vos informations personnelles.</li>
          </ul>
          <p>
            Pour exercer ces droits, veuillez nous contacter à [Adresse e-mail pour les droits RGPD, ex: privacy@thebox.com]. Vous pouvez également gérer certaines de vos informations directement depuis votre page de profil dans l'Application.
          </p>

          <h2>Politique concernant les enfants</h2>
          <p>
            Nous ne sollicitons pas sciemment des informations auprès des enfants de moins de 13 ans et ne commercialisons pas sciemment auprès d'eux. Si vous prenez connaissance de données que nous avons collectées auprès d'enfants de moins de 13 ans, veuillez nous contacter en utilisant les informations de contact fournies ci-dessous.
          </p>
          
          <h2>Modifications de cette politique de confidentialité</h2>
          <p>
            Nous pouvons mettre à jour cette Politique de Confidentialité de temps à autre. Nous vous informerons de tout changement en publiant la nouvelle Politique de Confidentialité sur cette page et en mettant à jour la date de "Dernière mise à jour" en haut de cette Politique de Confidentialité.
            Il vous est conseillé de consulter cette Politique de Confidentialité périodiquement pour tout changement. Les changements à cette Politique de Confidentialité sont effectifs lorsqu'ils sont publiés sur cette page.
          </p>

          <h2>Contactez-nous</h2>
          <p>
            Si vous avez des questions ou des commentaires concernant cette Politique de Confidentialité, veuillez nous contacter à :
            <br />
            THE BOX
            <br />
            [Votre Adresse Postale]
            <br />
            [Votre Ville, Code Postal]
            <br />
            Email : [Votre adresse e-mail de contact pour la confidentialité, ex: privacy@thebox.com]
          </p>

          <p className={styles.legalDisclaimer}>
            <em>
              Ce document est un modèle et doit être impérativement adapté et complété par des conseils juridiques professionnels
              pour correspondre aux spécificités de votre activité et aux réglementations en vigueur (notamment le RGPD).
            </em>
          </p>
           <p>
            Pour plus d'informations sur les conditions d'utilisation de notre service, veuillez consulter nos <Link to="/cgu" className={styles.inlineLink}>Conditions Générales d'Utilisation</Link>.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;