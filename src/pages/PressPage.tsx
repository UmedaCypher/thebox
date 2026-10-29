import { Mail } from 'lucide-react';
import { CONTACT_EMAIL, FREE_WATCH_LIMIT } from '../lib/features';
import InfoPage from '../components/InfoPage/InfoPage';
import { defineStrings, useStrings } from '../i18n';
import s from './PressPage.module.css';

const S = defineStrings({
  kicker: 'Presse',
  title: 'Espace presse',
  lead: "The Box est l'écrin numérique des collectionneurs de montres : une fiche par montre, le calendrier de ce qu'on porte, et un Marché entre passionnés.",
  factsTitle: "L'essentiel",
  facts: [
    { k: 'Pour qui', v: 'Les collectionneurs de montres, de la première pièce à la collection établie.' },
    { k: 'Ce que fait l\'app', v: "Registre de collection, calendrier de portage et coût par port, galerie au poignet, passeport partageable, Marché et messagerie entre membres." },
    { k: 'Modèle', v: `Gratuit jusqu'à ${FREE_WATCH_LIMIT} montres. Premium à 30 € par an pour la collection illimitée et les outils du collectionneur.` },
    { k: 'Confidentialité', v: "Collection privée par défaut ; prix et valeurs jamais publiés ; position GPS retirée des photos avant l'envoi." },
    { k: 'Langues', v: 'Français et anglais.' },
  ],
  kitTitle: 'Kit presse',
  kit: "Logos, captures d'écran et photos de l'application. Le kit sera disponible au lancement ; en attendant, écrivez-nous et nous vous l'enverrons.",
  contactTitle: 'Contact presse',
  contact: "Demandes d'entretien, de visuels ou d'accès anticipé :",
  subject: 'Presse',
  soon: "L'adresse de contact sera publiée à l'ouverture.",
}, {
  kicker: 'Press',
  title: 'Press room',
  lead: 'The Box is the digital watch box for collectors: a page for every watch, a calendar of what you wear, and a Market among enthusiasts.',
  factsTitle: 'Key facts',
  facts: [
    { k: 'For whom', v: 'Watch collectors, from the first piece to an established collection.' },
    { k: 'What it does', v: 'Collection register, wear calendar and cost per wear, wrist gallery, shareable passport, Market and messages between members.' },
    { k: 'Model', v: `Free up to ${FREE_WATCH_LIMIT} watches. Premium at €30 a year for an unlimited collection and the collector's tools.` },
    { k: 'Privacy', v: 'Collections are private by default; prices and values are never published; GPS location is removed from photos before upload.' },
    { k: 'Languages', v: 'French and English.' },
  ],
  kitTitle: 'Press kit',
  kit: 'Logos, screenshots and product photos. The kit will be available at launch; in the meantime, write to us and we will send it to you.',
  contactTitle: 'Press contact',
  contact: 'Interview, visuals or early access requests:',
  subject: 'Press',
  soon: 'Our contact address will be published at launch.',
});

export default function PressPage() {
  const t = useStrings(S);
  return (
    <InfoPage kicker={t.kicker} title={t.title} lead={t.lead}>
      <h2>{t.factsTitle}</h2>
      <dl className={s.facts}>
        {t.facts.map(f => <div key={f.k}><dt>{f.k}</dt><dd>{f.v}</dd></div>)}
      </dl>
      <h2>{t.kitTitle}</h2>
      <p>{t.kit}</p>
      <h2>{t.contactTitle}</h2>
      {CONTACT_EMAIL ? (
        <p className={s.contact}>
          {t.contact}{' '}
          <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(t.subject)}`}><Mail size={16} strokeWidth={1.8} aria-hidden="true" />{CONTACT_EMAIL}</a>
        </p>
      ) : <p>{t.soon}</p>}
    </InfoPage>
  );
}
