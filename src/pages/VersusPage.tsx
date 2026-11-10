import { Link } from 'react-router-dom';
import { Check, Minus } from 'lucide-react';
import InfoPage from '../components/InfoPage/InfoPage';
import { LinkButton } from '../components/ui';
import { FREE_WATCH_LIMIT } from '../lib/features';
import { defineStrings, useStrings } from '../i18n';
import s from './VersusPage.module.css';

/*
 * Arcora face aux autres façons de suivre une collection.
 * Faits vérifiés le 10/11/2026 sur les fiches App Store / Google Play et les sites des éditeurs (sources en bas de page).
 * Règle : ce qui n'a pas pu être vérifié est indiqué comme tel, jamais « non ». À revérifier avant chaque mise à jour.
 */
type Cell = 'yes' | 'no' | 'unknown' | string;
type Col = { name: string; note?: string };

const COLS: Col[] = [
  { name: 'Arcora' },
  { name: 'Chrono24' },
  { name: 'WatchCharts' },
  { name: 'Klokker', note: 'retrait annoncé fin 2026' },
  { name: 'WristTrack' },
  { name: 'Tableur' },
];

const S = defineStrings({
  kicker: 'Comparatif',
  title: 'Arcora ou une autre app ? Le comparatif honnête',
  lead: 'Comment suivre une collection de montres : Arcora, Chrono24, WatchCharts, Klokker, WristTrack ou un simple tableur. Ce que chacun fait, et pour qui.',
  verified: 'Informations vérifiées le 10 novembre 2026 sur les fiches des stores et les sites des éditeurs. « Non vérifié » signifie que nous n’avons pas trouvé l’information, pas que la fonction n’existe pas. Une erreur ? Écrivez-nous, nous corrigeons.',
  tableTitle: 'En un coup d’œil',
  feature: 'Fonction',
  yes: 'Oui', no: 'Non', unknown: 'Non vérifié',
  rows: [
    ['Plateformes', ['Web, Android', 'iOS, Android, web', 'iOS, Android, web', 'iOS, Mac', 'iPhone, Mac', 'Partout']],
    ['Prix', [`Gratuit jusqu’à ${FREE_WATCH_LIMIT} montres, puis 2,99 €/mois`, 'Gratuit', 'Gratuit, offres payantes dès 29 $/mois', 'Gratuit', 'Gratuit (dons)', 'Gratuit ou Microsoft 365']],
    ['Fiche par montre (photos, papiers, référence)', ['yes', 'yes', 'yes', 'yes', 'yes', 'Manuel']],
    ['Journal de ce que vous portez', ['yes', 'unknown', 'unknown', 'yes', 'yes', 'Manuel']],
    ['Série de portage, badges', ['yes', 'unknown', 'unknown', 'unknown', 'unknown', 'no']],
    ['Coût par port', ['yes', 'unknown', 'unknown', 'unknown', 'yes', 'Formules']],
    ['Carnet d’entretien et rappels', ['yes', 'unknown', 'unknown', 'yes', 'no', 'Manuel']],
    ['Cote de marché automatique', ['no', 'yes', 'yes', 'yes', 'no', 'no']],
    ['Inventaire PDF pour l’assurance', ['yes', 'unknown', 'unknown', 'Fiches PDF', 'unknown', 'Manuel']],
    ['Photos au poignet notées selon le tour de poignet', ['yes', 'unknown', 'unknown', 'no', 'no', 'no']],
    ['Vente entre collectionneurs', ['yes', 'yes', 'yes', 'no', 'no', 'no']],
    ['Commission sur la vente', ['0 %', 'Frais vendeur', 'Voir conditions', '—', '—', '—']],
    ['En français', ['yes', 'yes', 'no', 'yes', 'Annoncé', 'yes']],
  ] as [string, Cell[]][],
  whoTitle: 'Pour qui ?',
  who: [
    ['Arcora', 'Pour le collectionneur qui porte ses montres et veut savoir lesquelles il porte vraiment, garder chaque pièce documentée (entretien, papiers, assurance), comparer au poignet avec la communauté, et vendre ou échanger sans commission.'],
    ['Chrono24', 'La plus grande place de marché de montres. Idéale pour acheter et suivre la valeur de marché d’une collection ; la vente passe par ses conditions et ses frais.'],
    ['WatchCharts', 'Pour qui raisonne en cote et en historique de prix : c’est le cœur du service. En anglais.'],
    ['Klokker', 'Une app iOS soignée (rotation, entretien, précision), dont l’éditeur a annoncé le retrait de l’App Store au 31 décembre 2026 ; les données restent exportables.'],
    ['WristTrack', 'Une app iPhone simple pour noter ses ports et son coût par port.'],
    ['Un tableur', 'Tout est possible, mais tout est à faire à la main : pas de photos structurées, pas de rappels, pas de communauté.'],
  ],
  diffTitle: 'Ce qu’Arcora fait différemment',
  diff: [
    'Le Wrist Check quotidien : un geste, une photo, et votre vraie rotation apparaît.',
    'La Galerie au poignet : voir une montre sur un poignet comme le vôtre, et dire si elle va (petite, parfaite, grande).',
    'Le Marché pair à pair, 0 % de commission, avec messagerie intégrée.',
    'Le dossier complet de chaque montre : calibre, révisions, papiers, inventaire pour l’assurance.',
    'Données hébergées dans l’Union européenne, collection privée par défaut.',
  ],
  honestTitle: 'Ce qu’Arcora ne fait pas (encore)',
  honest: 'Pas de cote de marché automatique : la valeur est celle que vous déclarez. Pas d’app iPhone native : Arcora s’utilise sur iPhone depuis le navigateur, et s’installe sur l’écran d’accueil.',
  cta: 'Créer mon écrin gratuitement',
  sources: 'Sources',
  migrate: 'Vous venez de Klokker ou d’un tableur ? Ajoutez vos montres une à une : la marque, le modèle et le calibre se complètent en quelques lettres.',
}, {
  kicker: 'Comparison',
  title: 'Arcora or another app? An honest comparison',
  lead: 'How to track a watch collection: Arcora, Chrono24, WatchCharts, Klokker, WristTrack or a plain spreadsheet. What each does, and who it suits.',
  verified: 'Checked on 10 November 2026 on the store listings and publishers’ websites. “Not verified” means we couldn’t find the information, not that the feature is missing. Spotted a mistake? Write to us and we’ll fix it.',
  tableTitle: 'At a glance',
  feature: 'Feature',
  yes: 'Yes', no: 'No', unknown: 'Not verified',
  rows: [
    ['Platforms', ['Web, Android', 'iOS, Android, web', 'iOS, Android, web', 'iOS, Mac', 'iPhone, Mac', 'Anywhere']],
    ['Price', [`Free up to ${FREE_WATCH_LIMIT} watches, then €2.99/month`, 'Free', 'Free, paid plans from $29/month', 'Free', 'Free (donations)', 'Free or Microsoft 365']],
    ['A page per watch (photos, papers, reference)', ['yes', 'yes', 'yes', 'yes', 'yes', 'Manual']],
    ['Log of what you wear', ['yes', 'unknown', 'unknown', 'yes', 'yes', 'Manual']],
    ['Wear streaks, badges', ['yes', 'unknown', 'unknown', 'unknown', 'unknown', 'no']],
    ['Cost per wear', ['yes', 'unknown', 'unknown', 'unknown', 'yes', 'Formulas']],
    ['Service log and reminders', ['yes', 'unknown', 'unknown', 'yes', 'no', 'Manual']],
    ['Automatic market value', ['no', 'yes', 'yes', 'yes', 'no', 'no']],
    ['Insurance PDF inventory', ['yes', 'unknown', 'unknown', 'PDF sheets', 'unknown', 'Manual']],
    ['Wrist shots rated by wrist size', ['yes', 'unknown', 'unknown', 'no', 'no', 'no']],
    ['Selling between collectors', ['yes', 'yes', 'yes', 'no', 'no', 'no']],
    ['Commission on sales', ['0%', 'Seller fees', 'See terms', '—', '—', '—']],
    ['In French', ['yes', 'yes', 'no', 'yes', 'Announced', 'yes']],
  ] as [string, Cell[]][],
  whoTitle: 'Who is it for?',
  who: [
    ['Arcora', 'For collectors who wear their watches and want to know which ones they really wear, keep every piece documented (service, papers, insurance), compare on the wrist with the community, and sell or trade with no commission.'],
    ['Chrono24', 'The largest watch marketplace. Great to buy and follow a collection’s market value; selling goes through its terms and fees.'],
    ['WatchCharts', 'For those who think in market prices and price history: that’s the core of the service. English only.'],
    ['Klokker', 'A polished iOS app (rotation, service, accuracy) whose developer announced its removal from the App Store on 31 December 2026; data remains exportable.'],
    ['WristTrack', 'A simple iPhone app to log wears and cost per wear.'],
    ['A spreadsheet', 'Anything is possible, but everything is manual: no structured photos, no reminders, no community.'],
  ],
  diffTitle: 'What Arcora does differently',
  diff: [
    'The daily Wrist Check: one tap, one photo, and your real rotation appears.',
    'The on-wrist Gallery: see a watch on a wrist like yours, and say whether it fits (small, perfect, large).',
    'A peer-to-peer Market, 0% commission, with built-in messaging.',
    'Each watch’s complete file: calibre, services, papers, insurance inventory.',
    'Data hosted in the European Union, collection private by default.',
  ],
  honestTitle: 'What Arcora doesn’t do (yet)',
  honest: 'No automatic market value: the value is the one you declare. No native iPhone app: Arcora works on iPhone in the browser and can be added to the home screen.',
  cta: 'Create my collection for free',
  sources: 'Sources',
  migrate: 'Coming from Klokker or a spreadsheet? Add your watches one by one: brand, model and calibre autocomplete after a few letters.',
});

const SOURCES = [
  ['Chrono24 (App Store)', 'https://apps.apple.com/fr/app/chrono24/id472912032'],
  ['WatchCharts (offres)', 'https://watchcharts.com/subscribe'],
  ['WatchCharts (App Store)', 'https://apps.apple.com/app/id1539580724'],
  ['Klokker (App Store)', 'https://apps.apple.com/us/app/klokker-watch-collection/id6745749177'],
  ['WristTrack (App Store)', 'https://apps.apple.com/us/app/wristcheck/id1642718252'],
  ['Microsoft 365 (prix)', 'https://www.microsoft.com/fr-fr/microsoft-365/compare-all-microsoft-365-products-b'],
];

export default function VersusPage() {
  const t = useStrings(S);
  const cell = (v: Cell) =>
    v === 'yes' ? <span className={s.yes}><Check size={16} strokeWidth={2.4} aria-hidden="true" /><span className="visually-hidden">{t.yes}</span></span>
      : v === 'no' ? <span className={s.no}><Minus size={16} strokeWidth={2} aria-hidden="true" /><span className="visually-hidden">{t.no}</span></span>
        : v === 'unknown' ? <span className={s.unknown}>{t.unknown}</span>
          : <span>{v}</span>;
  return (
    <InfoPage kicker={t.kicker} title={t.title} lead={t.lead}>
      <p className={s.verified}>{t.verified}</p>

      <h2>{t.tableTitle}</h2>
      <div className={s.scroll} tabIndex={0}>
        <table className={s.table}>
          <thead>
            <tr>
              <th scope="col">{t.feature}</th>
              {COLS.map(c => <th scope="col" key={c.name} data-us={c.name === 'Arcora'}>{c.name}{c.note && <small>{c.note}</small>}</th>)}
            </tr>
          </thead>
          <tbody>
            {t.rows.map(([label, cells]) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                {cells.map((v, i) => <td key={COLS[i].name} data-us={i === 0}>{cell(v)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>{t.diffTitle}</h2>
      <ul>{t.diff.map(d => <li key={d}>{d}</li>)}</ul>

      <h2>{t.whoTitle}</h2>
      <dl className={s.who}>
        {t.who.map(([name, text]) => <div key={name}><dt>{name}</dt><dd>{text}</dd></div>)}
      </dl>

      <h2>{t.honestTitle}</h2>
      <p>{t.honest}</p>
      <p>{t.migrate}</p>
      <p><LinkButton to="/signup">{t.cta}</LinkButton></p>

      <h2>{t.sources}</h2>
      <ul className={s.sources}>
        {SOURCES.map(([label, url]) => <li key={url}><a href={url} target="_blank" rel="noopener noreferrer">{label}</a></li>)}
        <li><Link to="/contact">Contact</Link></li>
      </ul>
    </InfoPage>
  );
}
