// client/src/pages/CgvPage.tsx
import React from 'react';
import styles from './CgvPage.module.css'; // Ce fichier CSS sera créé
import { Link } from 'react-router-dom';

const CgvPage: React.FC = () => {
  return (
    <div className={styles.staticPageContainer}>
      <div className={styles.staticPageContent}>
        <header className={styles.staticPageHeader}>
          <h1>Conditions Générales de Vente (CGV)</h1>
        </header>
        <section className={styles.staticPageSection}>
          <p><strong>Date de dernière mise à jour :</strong> [Date]</p>

          <h2>Article 1 : Champ d'application</h2>
          <p>
            Les présentes Conditions Générales de Vente (ci-après "CGV") s'appliquent, sans restriction ni réserve, à l'ensemble des ventes
            conclues par THE BOX (ci-après "le Vendeur" ou "l'Éditeur") auprès d'acheteurs non professionnels (ci-après "les Clients" ou "le Client"),
            désirant acquérir les produits ou services (ci-après "les Produits" ou "les Services") proposés à la vente par le Vendeur sur l'application
            THE BOX (ci-après "l'Application").
          </p>
          <p>
            Elles précisent notamment les conditions de commande, de paiement, et le cas échéant, de fourniture des Services.
            Ces CGV sont accessibles à tout moment sur l'Application et prévaudront, le cas échéant, sur toute autre version ou tout autre document contradictoire.
          </p>

          <h2>Article 2 : Produits et Services</h2>
          <p>
            Les Services proposés par le Vendeur sont décrits sur l'Application. Il s'agit principalement de [Décrire brièvement les services payants s'il y en a, par exemple : fonctionnalités premium, abonnements, etc.].
            Si votre application est entièrement gratuite, cet article et potentiellement l'ensemble des CGV pourraient ne pas être pertinents ou nécessiter une adaptation majeure.
          </p>
          <p>
            Les caractéristiques principales des Services sont présentées sur l'Application. Le Client est tenu d'en prendre connaissance avant toute passation de commande.
            Le choix et l'achat d'un Service sont de la seule responsabilité du Client.
          </p>

          <h2>Article 3 : Prix</h2>
          <p>
            Les Services sont fournis aux tarifs en vigueur figurant sur l'Application, lors de l'enregistrement de la commande par le Vendeur. Les prix sont exprimés en Euros, HT et TTC.
            Ces tarifs sont fermes et non révisables pendant leur période de validité, telle qu'indiquée sur l'Application, le Vendeur se réservant le droit, hors cette période de validité, de modifier les prix à tout moment.
            [Préciser si les prix incluent des frais supplémentaires ou non].
            Une facture est établie par le Vendeur et remise au Client lors de la fourniture des Services commandés.
          </p>
          
          <h2>Article 4 : Commandes</h2>
          <p>
            Il appartient au Client de sélectionner sur l'Application les Services qu'il désire commander, selon les modalités suivantes : [Décrire le processus de commande].
            La vente ne sera considérée comme définitive qu'après l'envoi au Client de la confirmation de l'acceptation de la commande par le Vendeur par courrier électronique et après encaissement par celui-ci de l'intégralité du prix.
          </p>

          <h2>Article 5 : Conditions de paiement</h2>
          <p>
            Le prix est payable comptant, en totalité au jour de la passation de la commande par le Client, par voie de paiement sécurisé, selon les modalités suivantes : [Cartes bancaires acceptées, PayPal, etc.].
            Le Vendeur ne sera pas tenu de procéder à la fourniture des Services commandés par le Client si le prix ne lui a pas été préalablement réglé en totalité.
          </p>

          <h2>Article 6 : Fourniture des Prestations</h2>
           <p>
            Les Services commandés par le Client seront fournis selon les modalités et le délai décrits sur l'Application lors de la commande.
            [Détailler les modalités de fourniture des services numériques].
          </p>

          <h2>Article 7 : Droit de rétractation</h2>
          <p>
            Concernant les services numériques fournis sur un support immatériel et dont l'exécution a commencé avec l'accord préalable exprès du consommateur et renoncement exprès à son droit de rétractation, le droit de rétractation ne peut être exercé, conformément à l'article L.221-28 13° du Code de la consommation.
            [Si des biens matériels sont vendus, les conditions de rétractation classiques s'appliquent et doivent être détaillées].
          </p>

          <h2>Article 8 : Responsabilité du Vendeur - Garanties</h2>
          <p>
            Le Vendeur garantit, conformément aux dispositions légales, le Client, contre tout défaut de conformité des Services et tout vice caché, provenant d'un défaut de conception ou de fourniture desdits Services à l'exclusion de toute négligence ou faute du Client.
            La responsabilité du Vendeur ne saurait être engagée en cas de mauvaise utilisation, d'utilisation à des fins professionnelles, négligence ou défaut d'entretien de la part du Client, comme en cas d'usure normale du Produit, d'accident ou de force majeure.
          </p>
          
          <h2>Article 9 : Données personnelles</h2>
          <p>
            Les données personnelles recueillies auprès des Clients font l'objet d'un traitement informatique réalisé par le Vendeur. Elles sont enregistrées dans son fichier Clients et sont indispensables au traitement de sa commande.
            Pour plus d'informations, veuillez consulter notre <Link to="/confidentialite" className={styles.inlineLink}>Politique de Confidentialité</Link>.
          </p>

          <h2>Article 10 : Propriété Intellectuelle</h2>
          <p>
             Le contenu de l'Application est la propriété du Vendeur et de ses partenaires et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle.
             Toute reproduction totale ou partielle de ce contenu est strictement interdite et est susceptible de constituer un délit de contrefaçon. Voir aussi <Link to="/cgu" className={styles.inlineLink}>CGU</Link>.
          </p>

          <h2>Article 11 : Droit applicable - Langue</h2>
          <p>
            Les présentes CGV et les opérations qui en découlent sont régies par le droit français.
            Elles sont rédigées en langue française. Dans le cas où elles seraient traduites en une ou plusieurs langues, seul le texte français ferait foi en cas de litige.
          </p>

          <h2>Article 12 : Litiges</h2>
          <p>
            Tous les litiges auxquels les opérations d'achat et de vente conclues en application des présentes CGV pourraient donner lieu, concernant tant leur validité, leur interprétation, leur exécution, leur résiliation, leurs conséquences et leurs suites et qui n'auraient pu être résolues entre le vendeur et le client seront soumis aux tribunaux compétents dans les conditions de droit commun.
            Le Client est informé qu'il peut en tout état de cause recourir à une médiation conventionnelle, notamment auprès de la Commission de la médiation de la consommation (C. consom. art. L 612-1) ou auprès des instances de médiation sectorielles existantes.
          </p>

          <p className={styles.legalDisclaimer}>
            <em>
              Ce document est un modèle et doit être impérativement adapté et complété par des conseils juridiques professionnels,
              surtout si vous proposez des services payants. Si votre application est entièrement gratuite, cette page pourrait ne pas être nécessaire
              ou être considérablement simplifiée. Consultez un juriste.
            </em>
          </p>
          <p>
            Pour l'utilisation générale de notre application, veuillez consulter nos <Link to="/cgu" className={styles.inlineLink}>Conditions Générales d'Utilisation</Link>.
          </p>
        </section>
      </div>
    </div>
  );
};

export default CgvPage;