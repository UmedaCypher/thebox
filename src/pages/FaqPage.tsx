import { Link } from 'react-router-dom';
import { FREE_WATCH_LIMIT } from '../lib/features';
import { PageHeader } from '../components/ui';
import s from './FaqPage.module.css';

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: 'À quoi sert The Box ?',
    a: "À tenir le registre de votre collection de montres : une fiche complète par montre, un calendrier de ce que vous portez, l'historique des entretiens, et une galerie de photos au poignet pour comparer avec d'autres collectionneurs.",
  },
  {
    q: "C'est gratuit ?",
    a: `Oui, jusqu'à ${FREE_WATCH_LIMIT} montres, avec le passeport, le calendrier de portage et la galerie. Premium, payant, rend la collection illimitée et ajoute le carnet d'entretien, les statistiques, le suivi de valeur, la wishlist et l'inventaire pour l'assurance.`,
  },
  {
    q: 'Qui voit ma collection ?',
    a: "Personne tant que vous ne le décidez pas. Vous pouvez rendre votre profil public, partager le passeport d'une seule montre par lien, ou montrer une photo au poignet dans la galerie. Les prix d'achat, valeurs et lieux d'achat ne sont jamais publics.",
  },
  {
    q: 'Mes photos révèlent-elles où je vis ?',
    a: "Non. Avant l'envoi, chaque photo est réduite et ré-encodée sur votre appareil, ce qui supprime ses métadonnées, dont la position GPS.",
  },
  {
    q: "D'où vient la valeur de mes montres ?",
    a: "De vous. Vous indiquez la valeur estimée, et The Box garde l'historique de chaque mise à jour. Aucune cotation automatique n'est utilisée pour l'instant.",
  },
  {
    q: 'À quoi sert le calendrier de portage ?',
    a: "D'un geste, vous notez la montre du jour. Vous voyez ainsi lesquelles vous portez vraiment, lesquelles dorment, et combien vous coûte chaque port. Chaque mois, une image résume votre rotation pour la partager.",
  },
  {
    q: "Comment fonctionne le filtre par tour de poignet ?",
    a: "Les photos de la galerie sont accompagnées du tour de poignet de leur auteur. Filtrez autour du vôtre pour voir comment une montre tombe sur un poignet comme le vôtre avant de l'acheter.",
  },
  {
    q: 'Comment supprimer mon compte ?',
    a: <>Écrivez-nous depuis la page <Link to="/contact">Contact</Link> avec l'adresse de votre compte. Toutes vos données et photos sont supprimées sous 7 jours.</>,
  },
];

export default function FaqPage() {
  return (
    <div className="page page--narrow">
      <PageHeader title="Questions fréquentes" />
      <div className={s.list}>
        {FAQ.map(item => (
          <details key={item.q} className={s.item}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
      <p className={s.more}>Une autre question ? <Link to="/contact">Écrivez-nous</Link>.</p>
    </div>
  );
}
