import { Link } from 'react-router-dom';
import styles from './StaticPage.module.css';

export default function AboutPage() {
  return (
    <div className={styles.staticPageContainer}>
      <div className={styles.staticPageContent}>
        <header className={styles.staticPageHeader}>
          <h1>À propos</h1>
          <p>The Box est né d'une question simple : laquelle de mes montres est-ce que je porte vraiment ?</p>
        </header>
        <section className={styles.staticPageSection}>
          <p>
            Une collection vit dans un tiroir, une boîte, parfois un coffre. Ses papiers sont ailleurs, ses factures d'entretien
            dans une boîte mail, et son histoire dans la tête de son propriétaire. The Box rassemble tout cela au même endroit.
          </p>
          <h2>Ce que fait l'application</h2>
          <ul>
            <li>Une fiche complète pour chaque montre, partageable sous forme de passeport.</li>
            <li>Un calendrier pour noter ce que vous portez, et voir enfin votre vraie rotation.</li>
            <li>Une galerie de photos au poignet, classées par tour de poignet.</li>
            <li>Avec Premium : carnet d'entretien, statistiques, suivi de valeur, wishlist et inventaire pour l'assurance.</li>
          </ul>
          <h2>Pourquoi ce nom</h2>
          <p>
            Parce que c'est ce qu'est l'application : la boîte où chaque montre a sa place, à l'abri,
            et que l'on ouvre avec plaisir.
          </p>
          <h2>Vos données</h2>
          <p>
            Votre collection est privée par défaut. Les prix et valeurs ne sont jamais publiés, et la position GPS
            est retirée de vos photos avant l'envoi. Plus de détails dans la <Link to="/confidentialite" className={styles.inlineLink}>politique de confidentialité</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
