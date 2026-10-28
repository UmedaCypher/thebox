import { Link } from 'react-router-dom';
import { defineStrings, useStrings } from '../i18n';
import { CalendarDays, Images, Sparkles, Store, Watch } from 'lucide-react';
import InfoPage from '../components/InfoPage/InfoPage';
import s from './AboutPage.module.css';

const S = defineStrings({
  kicker: 'La maison',
  heroAlt: 'Un écrin ouvert, ses coussins de velours',
  title: 'À propos',
  lead: "The Box est né d'une question simple : laquelle de mes montres est-ce que je porte vraiment ?",
  intro: "Une collection vit dans un tiroir, une boîte, parfois un coffre. Ses papiers sont ailleurs, ses factures d'entretien dans une boîte mail, et son histoire dans la tête de son propriétaire. The Box rassemble tout cela au même endroit.",
  whatTitle: "Ce que fait l'application",
  what: [
    'Une fiche complète pour chaque montre, partageable sous forme de passeport.',
    'Un calendrier pour noter ce que vous portez, et voir enfin votre vraie rotation.',
    'Une galerie de photos au poignet, classées par tour de poignet.',
    'Un Marché pour vendre ou échanger entre collectionneurs, sans commission.',
    "Avec Premium : carnet d'entretien, statistiques, suivi de valeur, wishlist et inventaire pour l'assurance.",
  ],
  nameTitle: 'Pourquoi ce nom',
  name: "Parce que c'est ce qu'est l'application : la boîte où chaque montre a sa place, à l'abri, et que l'on ouvre avec plaisir.",
  dataTitle: 'Vos données',
  dataBefore: "Votre collection est privée par défaut. Les prix et valeurs ne sont jamais publiés, et la position GPS est retirée de vos photos avant l'envoi. Plus de détails dans la ",
  privacy: 'politique de confidentialité',
  dataAfter: '.',
}, {
  kicker: 'The house',
  heroAlt: 'An open watch box with velvet cushions',
  title: 'About',
  lead: 'The Box began with a simple question: which of my watches do I actually wear?',
  intro: 'A collection lives in a drawer, a box, sometimes a safe. Its papers are somewhere else, its service invoices in an inbox, and its story in its owner\'s head. The Box brings all of it together in one place.',
  whatTitle: 'What the app does',
  what: [
    'A full page for every watch, shareable as a passport.',
    'A calendar to log what you wear, so you finally see your real rotation.',
    'A gallery of wrist shots, sorted by wrist size.',
    'A Market to sell or trade among collectors, with no commission.',
    'With Premium: service log, statistics, value tracking, wishlist and insurance inventory.',
  ],
  nameTitle: 'Why the name',
  name: 'Because that is what the app is: the box where every watch has its place, safe and sound, and that you always enjoy opening.',
  dataTitle: 'Your data',
  dataBefore: 'Your collection is private by default. Prices and values are never published, and GPS location is removed from your photos before upload. More details in the ',
  privacy: 'privacy policy',
  dataAfter: '.',
});

const ICONS = [Watch, CalendarDays, Images, Store, Sparkles];

export default function AboutPage() {
  const t = useStrings(S);
  return (
    <InfoPage kicker={t.kicker} title={t.title} lead={t.lead}>
      <img src="/landing/ecrin-ouvert.webp" alt={t.heroAlt} className={s.hero} />
      <p className={s.intro}>{t.intro}</p>
      <h2>{t.whatTitle}</h2>
      <ul className={s.features}>
        {t.what.map((item, i) => {
          const Icon = ICONS[i] ?? Sparkles;
          return <li key={item}><span className={s.icon} aria-hidden="true"><Icon size={20} strokeWidth={1.6} /></span><span>{item}</span></li>;
        })}
      </ul>
      <h2>{t.nameTitle}</h2>
      <blockquote className={s.quote}>{t.name}</blockquote>
      <h2>{t.dataTitle}</h2>
      <p>{t.dataBefore}<Link to="/confidentialite">{t.privacy}</Link>{t.dataAfter}</p>
    </InfoPage>
  );
}
