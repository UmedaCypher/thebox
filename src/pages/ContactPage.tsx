import { CONTACT_EMAIL } from '../lib/features';
import { Link } from 'react-router-dom';
import { ArrowUpRight, HelpCircle, Mail, MessageCircle, Newspaper, UserX } from 'lucide-react';
import { Notice } from '../components/ui';
import InfoPage from '../components/InfoPage/InfoPage';
import { defineStrings, useStrings } from '../i18n';
import s from './ContactPage.module.css';

const S = defineStrings({
  kicker: 'Contact',
  title: 'Écrivez-nous',
  askText: 'Une question sur l\'app, une idée, un problème.',
  deleteText: "Depuis l'adresse de votre compte : tout est effacé sous 7 jours.",
  pressText: 'Journalistes et créateurs : kit presse et demandes d\'entretien.',
  faqText: 'La réponse est peut-être déjà là.',
  reply: 'Chaque message est lu par une vraie personne.',
  subtitle: 'Une question, une idée, un souci avec votre compte : écrivez-nous, nous répondons nous-mêmes.',
  address: 'Notre adresse :',
  askSubject: 'Question sur Arcora',
  ask: 'Poser une question',
  deleteSubject: 'Suppression de mon compte',
  delete: 'Supprimer mon compte',
  pressSubject: 'Presse',
  press: 'Presse',
  deleteNote: "Pour une suppression de compte, écrivez depuis l'adresse du compte : tout est effacé sous 7 jours.",
  soon: "L'adresse de contact sera publiée à l'ouverture.",
  faq: 'Questions fréquentes',
}, {
  kicker: 'Contact',
  title: 'Write to us',
  askText: 'A question about the app, an idea, a problem.',
  deleteText: 'From your account email address: everything is erased within 7 days.',
  pressText: 'Journalists and creators: press kit and interview requests.',
  faqText: 'The answer may already be there.',
  reply: 'Every message is read by a real person.',
  subtitle: 'A question, an idea, a problem with your account: write to us. We answer every message ourselves.',
  address: 'Our address:',
  askSubject: 'Question about Arcora',
  ask: 'Ask a question',
  deleteSubject: 'Delete my account',
  delete: 'Delete my account',
  pressSubject: 'Press',
  press: 'Press',
  deleteNote: 'To delete your account, write from your account email address. Everything is erased within 7 days.',
  soon: 'Our contact address will be published at launch.',
  faq: 'Frequently asked questions',
});

/** Contact par e-mail : un formulaire sans serveur d'envoi perdrait les messages. */
export default function ContactPage() {
  const t = useStrings(S);
  const mail = (subject: string) => `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
  const cards = [
    { href: mail(t.askSubject), icon: MessageCircle, title: t.ask, text: t.askText },
    { href: mail(t.deleteSubject), icon: UserX, title: t.delete, text: t.deleteText },
    { href: mail(t.pressSubject), icon: Newspaper, title: t.press, text: t.pressText },
  ];
  return (
    <InfoPage kicker={t.kicker} title={t.title} lead={t.subtitle}>
      {CONTACT_EMAIL ? (
        <>
          <div className={s.cards}>
            {cards.map(({ href, icon: Icon, title, text }) => (
              <a key={title} href={href} className={s.card}>
                <span className={s.icon} aria-hidden="true"><Icon size={20} strokeWidth={1.6} /></span>
                <strong>{title}</strong>
                <span>{text}</span>
                <ArrowUpRight size={18} strokeWidth={1.8} className={s.arrow} aria-hidden="true" />
              </a>
            ))}
            <Link to="/faq" className={s.card}>
              <span className={s.icon} aria-hidden="true"><HelpCircle size={20} strokeWidth={1.6} /></span>
              <strong>{t.faq}</strong>
              <span>{t.faqText}</span>
              <ArrowUpRight size={18} strokeWidth={1.8} className={s.arrow} aria-hidden="true" />
            </Link>
          </div>
          <p className={s.address}>
            <Mail size={16} strokeWidth={1.8} aria-hidden="true" />
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            <span>{t.reply}</span>
          </p>
        </>
      ) : (
        <Notice>{t.soon}</Notice>
      )}
    </InfoPage>
  );
}
