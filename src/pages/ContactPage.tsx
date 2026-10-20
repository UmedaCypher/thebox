import { CONTACT_EMAIL } from '../lib/features';
import { LinkButton, Notice, PageHeader } from '../components/ui';
import styles from './StaticPage.module.css';

/** Contact par e-mail : un formulaire sans serveur d'envoi perdrait les messages. */
export default function ContactPage() {
  const mail = (subject: string) => `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
  return (
    <div className="page page--narrow">
      <PageHeader title="Contact" subtitle="Une question, une idée, un souci avec votre compte : écrivez-nous, nous répondons nous-mêmes." />
      {CONTACT_EMAIL ? (
        <div className={styles.staticPageSection}>
          <p>Notre adresse : <a className={styles.inlineLink} href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
            <a className={styles.downloadButton} href={mail('Question sur The Box')}>Poser une question</a>
            <a className={styles.downloadButton} href={mail('Suppression de mon compte')}>Supprimer mon compte</a>
            <a className={styles.downloadButton} href={mail('Presse')}>Presse</a>
          </div>
          <p>Pour une suppression de compte, écrivez depuis l'adresse du compte : tout est effacé sous 7 jours.</p>
        </div>
      ) : (
        <Notice>L'adresse de contact sera publiée à l'ouverture.</Notice>
      )}
      <div style={{ marginTop: 'var(--sp-6)' }}><LinkButton to="/faq" variant="secondary">Questions fréquentes</LinkButton></div>
    </div>
  );
}
