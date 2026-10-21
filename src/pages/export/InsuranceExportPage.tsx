import { Printer } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLoad } from '../../hooks/useLoad';
import { listWatches, mainPhoto, photoUrl } from '../../lib/api';
import { formatDate, formatEuros, formatMm } from '../../lib/format';
import { Button, Loading, Notice, PageHeader } from '../../components/ui';
import PremiumGate from '../../components/PremiumGate/PremiumGate';
import s from './InsuranceExportPage.module.css';

/**
 * Inventaire pour l'assurance. « Enregistrer en PDF » passe par l'impression du navigateur :
 * pas de dépendance lourde, et un rendu net sur toutes les plateformes.
 */
function ExportContent() {
  const { user, profile } = useAuth();
  const q = useLoad(() => listWatches(user!.id), [user]);

  if (q.loading) return <div className="page"><Loading /></div>;
  if (q.error) return <div className="page"><Notice tone="error">{q.error}</Notice></div>;
  const watches = q.data ?? [];
  const total = watches.reduce((a, w) => a + (Number(w.current_estimated_value) || 0), 0);

  return (
    <div className="page">
      <div className={s.noPrint}>
        <PageHeader title="Inventaire pour l'assurance" back={{ to: '/profil', label: 'Profil' }}
          subtitle="Un document avec photo, référence et valeur déclarée de chaque montre. Choisissez « Enregistrer en PDF » dans la fenêtre d'impression."
          action={<Button onClick={() => window.print()}><Printer size={16} aria-hidden="true" />Imprimer ou PDF</Button>} />
      </div>

      <article className={s.doc}>
        <header className={s.docHead}>
          <div>
            <h1>Inventaire de collection</h1>
            <p>{profile?.full_name || profile?.username || user?.email}, établi le {formatDate(new Date().toISOString())}</p>
          </div>
          <div className={s.total}>
            <span>Valeur totale déclarée</span>
            <strong className="num">{formatEuros(total)}</strong>
            <span>{watches.length} montre{watches.length > 1 ? 's' : ''}</span>
          </div>
        </header>

        {watches.map((w, i) => (
          <section key={w.id} className={s.row}>
            <div className={s.photo}>{photoUrl(mainPhoto(w.photos)?.storage_path) && <img src={photoUrl(mainPhoto(w.photos)?.storage_path)!} alt="" />}</div>
            <div className={s.info}>
              <h2><span className="num">{i + 1}.</span> {w.brand} {w.model}</h2>
              <dl>
                {([
                  ['Référence', w.reference_number], ['Année', w.year_of_production], ['Mouvement', w.movement],
                  ['Diamètre', formatMm(w.case_diameter_mm)], ['Boîtier', w.case_material], ['État', w.condition],
                  ['Boîte et papiers', w.box_papers_status], ["Date d'achat", w.purchase_date ? formatDate(w.purchase_date) : null],
                  ["Prix d'achat", w.purchase_price !== null ? formatEuros(Number(w.purchase_price)) : null],
                  ['Dernière révision', w.last_service_date ? formatDate(w.last_service_date) : null],
                ] as [string, string | number | null][]).filter(([, v]) => v !== null && v !== '').map(([k, v]) => (
                  <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
                ))}
              </dl>
            </div>
            <div className={s.value}>
              <span>Valeur déclarée</span>
              <strong className="num">{formatEuros(w.current_estimated_value !== null ? Number(w.current_estimated_value) : null)}</strong>
            </div>
          </section>
        ))}
        <footer className={s.docFoot}>Valeurs déclarées par le propriétaire. Document généré avec The Box.</footer>
      </article>
    </div>
  );
}

export default function InsuranceExportPage() {
  return (
    <PremiumGate title="Inventaire pour l'assurance" pitch="Générez un inventaire PDF de votre collection avec photos, références et valeurs déclarées, prêt à envoyer à votre assureur.">
      <ExportContent />
    </PremiumGate>
  );
}
