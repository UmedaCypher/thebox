import { CONTACT_EMAIL } from '../lib/features';
import { LinkButton, Notice, PageHeader } from '../components/ui';
import { defineStrings, useStrings } from '../i18n';
import styles from './StaticPage.module.css';

const S = defineStrings({
  title: 'Contact',
  subtitle: 'Une question, une idée, un souci avec votre compte : écrivez-nous, nous répondons nous-mêmes.',
  address: 'Notre adresse :',
  askSubject: 'Question sur The Box',
  ask: 'Poser une question',
  deleteSubject: 'Suppression de mon compte',
  delete: 'Supprimer mon compte',
  pressSubject: 'Presse',
  press: 'Presse',
  deleteNote: "Pour une suppression de compte, écrivez depuis l'adresse du compte : tout est effacé sous 7 jours.",
  soon: "L'adresse de contact sera publiée à l'ouverture.",
  faq: 'Questions fréquentes',
}, {
  title: 'Contact',
  subtitle: 'A question, an idea, a problem with your account: write to us. We answer every message ourselves.',
  address: 'Our address:',
  askSubject: 'Question about The Box',
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
  return (
    <div className="page page--narrow">
      <PageHeader title={t.title} subtitle={t.subtitle} />
      {CONTACT_EMAIL ? (
        <div className={styles.staticPageSection}>
          <p>{t.address} <a className={styles.inlineLink} href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
            <a className={styles.downloadButton} href={mail(t.askSubject)}>{t.ask}</a>
            <a className={styles.downloadButton} href={mail(t.deleteSubject)}>{t.delete}</a>
            <a className={styles.downloadButton} href={mail(t.pressSubject)}>{t.press}</a>
          </div>
          <p>{t.deleteNote}</p>
        </div>
      ) : (
        <Notice>{t.soon}</Notice>
      )}
      <div style={{ marginTop: 'var(--sp-6)' }}><LinkButton to="/faq" variant="secondary">{t.faq}</LinkButton></div>
    </div>
  );
}
