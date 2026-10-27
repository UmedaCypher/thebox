import type React from 'react';
import { Link } from 'react-router-dom';
import { FREE_WATCH_LIMIT } from '../lib/features';
import { MessageCircle } from 'lucide-react';
import InfoPage from '../components/InfoPage/InfoPage';
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
  kicker: 'Aide',
  lead: "Tout ce qu'il faut savoir pour tenir le registre de vos montres, les porter, et les vendre entre collectionneurs.",
  groups: { collection: 'Votre collection', wear: 'Portage et Premium', market: 'Marché et messages', account: 'Compte' },
  extra: {
    cpw: { q: "Qu'est-ce que le coût par port ?", a: "Le prix d'achat d'une montre divisé par le nombre de jours où vous l'avez portée. Il montre ce que chaque montre vous coûte vraiment, et il baisse à chaque port." },
    sell: { q: 'Comment vendre ou échanger une montre ?', a: "Dans la fiche de la montre, choisissez « À vendre » ou « À échanger », avec un prix et une ville si vous le souhaitez. L'annonce apparaît dans le Marché ; les intéressés vous écrivent par la messagerie." },
    fee: { q: 'The Box prend-elle une commission ?', a: "Non. La vente se fait directement entre membres : The Box n'encaisse rien et n'intervient pas dans la transaction. Préférez une remise en main propre dans un lieu sûr, ou chez un horloger." },
    who: { q: 'Qui peut m\'écrire ?', a: "Les membres, depuis vos annonces et votre profil public, si vous acceptez les messages (réglage dans votre profil). Vous pouvez bloquer un membre ou signaler un message à tout moment." },
  },
  asideTitle: 'Besoin d\'aide ?',
  asideText: 'Nous lisons et répondons nous-mêmes à chaque message.',
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
  kicker: 'Help',
  lead: 'Everything you need to keep a record of your watches, wear them, and sell them among collectors.',
  groups: { collection: 'Your collection', wear: 'Wear and Premium', market: 'Market and messages', account: 'Account' },
  extra: {
    cpw: { q: 'What is cost per wear?', a: 'The purchase price of a watch divided by the number of days you wore it. It shows what each watch really costs you, and it drops every time you wear it.' },
    sell: { q: 'How do I sell or trade a watch?', a: 'On the watch page, choose "For sale" or "For trade", with a price and a city if you like. The listing appears on the Market and interested members write to you through Messages.' },
    fee: { q: 'Does The Box take a commission?', a: 'No. Sales happen directly between members: The Box takes no money and is not part of the transaction. Prefer meeting in person in a safe place, or at a watchmaker.' },
    who: { q: 'Who can write to me?', a: 'Members, from your listings and your public profile, if you accept messages (a setting in your profile). You can block a member or report a message at any time.' },
  },
  asideTitle: 'Need help?',
  asideText: 'We read and answer every message ourselves.',
});

export default function FaqPage() {
  const t = useStrings(S);
  const [what, who, photos, value, calendar, wrist] = t.items;
  const groups: { title: string; items: { q: string; a: React.ReactNode }[] }[] = [
    { title: t.groups.collection, items: [what, who, photos, value, wrist] },
    { title: t.groups.wear, items: [calendar, t.extra.cpw, { q: t.freeQ, a: t.freeA(FREE_WATCH_LIMIT) }] },
    { title: t.groups.market, items: [t.extra.sell, t.extra.fee, t.extra.who] },
    { title: t.groups.account, items: [{ q: t.deleteQ, a: <>{t.deleteBefore}<Link to="/contact">{t.contact}</Link>{t.deleteAfter}</> }] },
  ];
  return (
    <InfoPage
      kicker={t.kicker}
      title={t.title}
      lead={t.lead}
      aside={(
        <div className={s.help}>
          <MessageCircle size={20} strokeWidth={1.6} aria-hidden="true" />
          <strong>{t.asideTitle}</strong>
          <p>{t.asideText}</p>
          <Link to="/contact" className={s.helpLink}>{t.write}</Link>
        </div>
      )}
    >
      {groups.map(g => (
        <section key={g.title} className={s.group}>
          <h2 className={s.groupTitle}>{g.title}</h2>
          <div className={s.list}>
            {g.items.map(item => (
              <details key={item.q} className={s.item}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      ))}
      <p className={s.more}>{t.more} <Link to="/contact">{t.write}</Link>.</p>
    </InfoPage>
  );
}
