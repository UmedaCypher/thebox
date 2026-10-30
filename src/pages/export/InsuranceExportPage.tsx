import { Printer } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLoad } from '../../hooks/useLoad';
import { listWatches, mainPhoto, photoUrl } from '../../lib/api';
import { formatDate, formatEuros, formatMm } from '../../lib/format';
import { Button, Notice, PageHeader } from '../../components/ui';
import PremiumGate from '../../components/PremiumGate/PremiumGate';
import { defineStrings, useLang, useStrings } from '../../i18n';
import { COMMON, movementLabel } from '../../i18n/common';
import s from './InsuranceExportPage.module.css';
import { SkeletonHeader, SkeletonList } from '../../components/Skeleton/Skeleton';

const S = defineStrings({
  title: 'Inventaire pour l\'assurance',
  subtitle: 'Un document avec photo, référence et valeur déclarée de chaque montre. Choisissez « Enregistrer en PDF » dans la fenêtre d\'impression.',
  pitch: 'Générez un inventaire PDF de votre collection avec photos, références et valeurs déclarées, prêt à envoyer à votre assureur.',
  print: 'Imprimer ou PDF',
  docTitle: 'Inventaire de collection',
  issued: (name: string, date: string) => `${name}, établi le ${date}`,
  totalValue: 'Valeur totale déclarée',
  watches: (n: number) => `${n} montre${n > 1 ? 's' : ''}`,
  specs: {
    reference: 'Référence', year: 'Année', movement: 'Mouvement', diameter: 'Diamètre', case: 'Boîtier', condition: 'État',
    boxPapers: 'Boîte et papiers', purchaseDate: 'Date d\'achat', purchasePrice: 'Prix d\'achat', lastService: 'Dernière révision',
  },
  declaredValue: 'Valeur déclarée',
  footer: 'Valeurs déclarées par le propriétaire. Document généré avec Arcora.',
}, {
  title: 'Insurance inventory',
  subtitle: 'A document with a photo, the reference and the declared value of each watch. Choose “Save as PDF” in the print window.',
  pitch: 'Generate a PDF inventory of your collection with photos, references and declared values, ready to send to your insurer.',
  print: 'Print or PDF',
  docTitle: 'Collection inventory',
  issued: (name, date) => `${name}, issued on ${date}`,
  totalValue: 'Total declared value',
  watches: n => `${n} ${n === 1 ? 'watch' : 'watches'}`,
  specs: {
    reference: 'Reference', year: 'Year', movement: 'Movement', diameter: 'Diameter', case: 'Case', condition: 'Condition',
    boxPapers: 'Box & papers', purchaseDate: 'Purchase date', purchasePrice: 'Purchase price', lastService: 'Last service',
  },
  declaredValue: 'Declared value',
  footer: 'Values declared by the owner. Document generated with Arcora.',
});

/**
 * Inventaire pour l'assurance. « Enregistrer en PDF » passe par l'impression du navigateur :
 * pas de dépendance lourde, et un rendu net sur toutes les plateformes.
 */
function ExportContent() {
  const t = useStrings(S);
  const c = useStrings(COMMON);
  const { lang } = useLang();
  const { user, profile } = useAuth();
  const q = useLoad(() => listWatches(user!.id), [user]);

  if (q.loading) return <div className="page"><SkeletonHeader /><SkeletonList rows={4} thumb={72} /></div>;
  if (q.error) return <div className="page"><Notice tone="error">{q.error}</Notice></div>;
  const watches = q.data ?? [];
  const total = watches.reduce((a, w) => a + (Number(w.current_estimated_value) || 0), 0);

  return (
    <div className="page">
      <div className={s.noPrint}>
        <PageHeader title={t.title} back={{ to: '/profil', label: c.tabs.profile }}
          subtitle={t.subtitle}
          action={<Button onClick={() => window.print()}><Printer size={16} aria-hidden="true" />{t.print}</Button>} />
      </div>

      <article className={s.doc}>
        <header className={s.docHead}>
          <div>
            <h1>{t.docTitle}</h1>
            <p>{t.issued(profile?.full_name || profile?.username || user?.email || '', formatDate(new Date().toISOString()))}</p>
          </div>
          <div className={s.total}>
            <span>{t.totalValue}</span>
            <strong className="num">{formatEuros(total)}</strong>
            <span>{t.watches(watches.length)}</span>
          </div>
        </header>

        {watches.map((w, i) => (
          <section key={w.id} className={s.row}>
            <div className={s.photo}>{photoUrl(mainPhoto(w.photos)?.storage_path) && <img src={photoUrl(mainPhoto(w.photos)?.storage_path)!} alt="" />}</div>
            <div className={s.info}>
              <h2><span className="num">{i + 1}.</span> {w.brand} {w.model}</h2>
              <dl>
                {([
                  [t.specs.reference, w.reference_number], [t.specs.year, w.year_of_production], [t.specs.movement, movementLabel(w.movement, lang)],
                  [t.specs.diameter, formatMm(w.case_diameter_mm)], [t.specs.case, w.case_material], [t.specs.condition, w.condition],
                  [t.specs.boxPapers, w.box_papers_status], [t.specs.purchaseDate, w.purchase_date ? formatDate(w.purchase_date) : null],
                  [t.specs.purchasePrice, w.purchase_price !== null ? formatEuros(Number(w.purchase_price)) : null],
                  [t.specs.lastService, w.last_service_date ? formatDate(w.last_service_date) : null],
                ] as [string, string | number | null][]).filter(([, v]) => v !== null && v !== '').map(([k, v]) => (
                  <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
                ))}
              </dl>
            </div>
            <div className={s.value}>
              <span>{t.declaredValue}</span>
              <strong className="num">{formatEuros(w.current_estimated_value !== null ? Number(w.current_estimated_value) : null)}</strong>
            </div>
          </section>
        ))}
        <footer className={s.docFoot}>{t.footer}</footer>
      </article>
    </div>
  );
}

export default function InsuranceExportPage() {
  const t = useStrings(S);
  return (
    <PremiumGate title={t.title} pitch={t.pitch}>
      <ExportContent />
    </PremiumGate>
  );
}
