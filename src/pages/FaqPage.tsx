import { Link } from 'react-router-dom';
import { FREE_WATCH_LIMIT } from '../lib/features';
import { PageHeader } from '../components/ui';
import { defineStrings, useStrings } from '../i18n';
import s from './FaqPage.module.css';

const S = defineStrings({
  title: 'Questions fréquentes',
  items: [
    {
      q: 'À quoi sert The Box ?',
      a: "À tenir le registre de votre collection de montres : une fiche complète par montre, un calendrier de ce que vous portez, l'historique des entretiens, et une galerie de photos au poignet pour comparer avec d'autres collectionneurs.",
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
      q: 'Comment fonctionne le filtre par tour de poignet ?',
      a: "Les photos de la galerie sont accompagnées du tour de poignet de leur auteur. Filtrez autour du vôtre pour voir comment une montre tombe sur un poignet comme le vôtre avant de l'acheter.",
    },
  ],
  freeQ: "C'est gratuit ?",
  freeA: (n: number) => `Oui, jusqu'à ${n} montres, avec le passeport, le calendrier de portage et la galerie. Premium, payant, rend la collection illimitée et ajoute le carnet d'entretien, les statistiques, le suivi de valeur, la wishlist et l'inventaire pour l'assurance.`,
  deleteQ: 'Comment supprimer mon compte ?',
  deleteBefore: 'Écrivez-nous depuis la page ',
  contact: 'Contact',
  deleteAfter: " avec l'adresse de votre compte. Toutes vos données et photos sont supprimées sous 7 jours.",
  more: 'Une autre question ?',
  write: 'Écrivez-nous',
}, {
  title: 'Frequently asked questions',
  items: [
    {
      q: 'What is The Box for?',
      a: 'Keeping a record of your watch collection: a full page for every watch, a calendar of what you wear, service history, and a gallery of wrist shots to compare with other collectors.',
    },
    {
      q: 'Who can see my collection?',
      a: "No one, until you decide otherwise. You can make your profile public, share a single watch's passport with a link, or post a wrist shot to the gallery. Purchase prices, values and where you bought a watch are never public.",
    },
    {
      q: 'Do my photos reveal where I live?',
      a: 'No. Before upload, every photo is resized and re-encoded on your device, which strips its metadata, including GPS location.',
    },
    {
      q: 'Where does the value of my watches come from?',
      a: 'From you. You enter the estimated value, and The Box keeps a history of every update. No automatic pricing is used for now.',
    },
    {
      q: 'What is the wear calendar for?',
      a: "In one tap, you log the watch of the day. You see which watches you really wear, which ones are dormant, and the cost per wear of each. Every month, a picture sums up your rotation, ready to share.",
    },
    {
      q: 'How does the wrist size filter work?',
      a: "Gallery photos show the wrist size of the person who posted them. Filter around yours to see how a watch sits on a wrist like yours before you buy it.",
    },
  ],
  freeQ: 'Is it free?',
  freeA: n => `Yes, for up to ${n} watches, including the passport, the wear calendar and the gallery. Premium, a paid plan, makes your collection unlimited and adds the service log, statistics, value tracking, a wishlist and an insurance inventory.`,
  deleteQ: 'How do I delete my account?',
  deleteBefore: 'Write to us from the ',
  contact: 'Contact',
  deleteAfter: ' page using your account email address. All your data and photos are deleted within 7 days.',
  more: 'Another question?',
  write: 'Write to us',
});

export default function FaqPage() {
  const t = useStrings(S);
  const faq: { q: string; a: React.ReactNode }[] = [
    t.items[0],
    { q: t.freeQ, a: t.freeA(FREE_WATCH_LIMIT) },
    ...t.items.slice(1),
    { q: t.deleteQ, a: <>{t.deleteBefore}<Link to="/contact">{t.contact}</Link>{t.deleteAfter}</> },
  ];
  return (
    <div className="page page--narrow">
      <PageHeader title={t.title} />
      <div className={s.list}>
        {faq.map(item => (
          <details key={item.q} className={s.item}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
      <p className={s.more}>{t.more} <Link to="/contact">{t.write}</Link>.</p>
    </div>
  );
}
