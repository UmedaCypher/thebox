import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ShieldCheck, Watch as WatchIcon } from 'lucide-react';
import { checkStolenSerial, listStolenWatches, thumbSrc } from '../lib/api';
import type { StolenWatch } from '../lib/api';
import { Button, Img, Notice, PageHeader, TextField } from '../components/ui';
import CommunityNav from '../components/CommunityNav/CommunityNav';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../lib/format';
import { defineStrings, useStrings } from '../i18n';
import s from './StolenPage.module.css';

const S = defineStrings({
  title: 'Montres volées',
  subtitle: 'Avant d’acheter une montre d’occasion, vérifiez son numéro de série. Les membres d’Arcora y déclarent leurs montres volées.',
  check: 'Vérifier un numéro de série',
  serial: 'Numéro de série',
  serialPh: 'Gravé au dos, entre les cornes ou sur les papiers',
  verify: 'Vérifier',
  checking: 'Vérification…',
  clear: 'Aucun vol déclaré sur Arcora pour ce numéro.',
  clearHint: 'Ce n’est pas une garantie : seuls les vols déclarés par nos membres sont connus. Demandez toujours la facture et les papiers.',
  alert: 'Ce numéro correspond à une montre déclarée volée',
  alertDetail: (w: string, d: string, c: string | null) => `${w}, volée le ${d}${c ? ` à ${c}` : ''}.`,
  alertWhat: 'N’achetez pas cette montre. Si vous savez où elle se trouve, contactez la police',
  alertContact: ' ou écrivez à son propriétaire',
  invalid: 'Saisissez au moins 4 caractères.',
  recent: 'Vols déclarés récemment',
  none: 'Aucun vol déclaré pour le moment.',
  stolenOn: (d: string) => `Volée le ${d}`,
  owner: 'Écrire au propriétaire',
  declare: 'Votre montre a été volée ? Déclarez-la depuis sa fiche, dans votre collection.',
  declareLink: 'Aller à ma collection',
}, {
  title: 'Stolen watches',
  subtitle: 'Before buying a pre-owned watch, check its serial number. Arcora members report their stolen watches here.',
  check: 'Check a serial number',
  serial: 'Serial number',
  serialPh: 'Engraved on the back, between the lugs or on the papers',
  verify: 'Check',
  checking: 'Checking…',
  clear: 'No theft reported on Arcora for this number.',
  clearHint: 'This is not a guarantee: we only know thefts reported by our members. Always ask for the invoice and papers.',
  alert: 'This number matches a watch reported stolen',
  alertDetail: (w: string, d: string, c: string | null) => `${w}, stolen on ${d}${c ? ` in ${c}` : ''}.`,
  alertWhat: 'Do not buy this watch. If you know where it is, contact the police',
  alertContact: ' or write to its owner',
  invalid: 'Enter at least 4 characters.',
  recent: 'Recently reported thefts',
  none: 'No theft reported yet.',
  stolenOn: (d: string) => `Stolen on ${d}`,
  owner: 'Write to the owner',
  declare: 'Has your watch been stolen? Report it from its page in your collection.',
  declareLink: 'Go to my collection',
});

type Result = Awaited<ReturnType<typeof checkStolenSerial>>;

export default function StolenPage() {
  const { user } = useAuth();
  const t = useStrings(S);
  const [serial, setSerial] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [list, setList] = useState<StolenWatch[] | null>(null);
  useEffect(() => { listStolenWatches().then(setList); }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError(null); setResult(null);
    if (serial.replace(/[\s.\-/]/g, '').length < 4) { setError(t.invalid); return; }
    setBusy(true);
    try { setResult(await checkStolenSerial(serial)); } catch (err) { setError(err instanceof Error ? err.message : String(err)); }
    setBusy(false);
  };

  return (
    <div className="page">
      {user && <CommunityNav />}
      <PageHeader title={t.title} subtitle={t.subtitle} hideTitleOnMobile={Boolean(user)} />
      <form className={`panel ${s.check}`} data-tone="plain" onSubmit={submit}>
        <h2 className={s.h}>{t.check}</h2>
        <div className={s.row}>
          <TextField label={t.serial} value={serial} onChange={e => setSerial(e.target.value)} placeholder={t.serialPh} autoCapitalize="characters" autoComplete="off" />
          <Button type="submit" disabled={busy}>{busy ? t.checking : t.verify}</Button>
        </div>
        {error && <Notice tone="error">{error}</Notice>}
        {result && !result.stolen && !result.invalid && (
          <div className={s.clear}><ShieldCheck size={20} aria-hidden="true" /><div><strong>{t.clear}</strong><p>{t.clearHint}</p></div></div>
        )}
        {result?.stolen && (
          <div className={s.alert} role="alert">
            <ShieldAlert size={20} aria-hidden="true" />
            <div>
              <strong>{t.alert}</strong>
              <p>{t.alertDetail(`${result.brand} ${result.model}${result.reference_number ? ` (${result.reference_number})` : ''}`, formatDate(result.stolen_on!), result.city ?? null)}</p>
              <p>{t.alertWhat}{result.owner_username && <>{t.alertContact} (<Link to={`/profil/${result.owner_username}`}>@{result.owner_username}</Link>)</>}.</p>
            </div>
          </div>
        )}
      </form>

      <h2 className={s.h}>{t.recent}</h2>
      {list && list.length === 0 && <p className={s.muted}>{t.none}</p>}
      <ul className={s.list}>
        {(list ?? []).map(w => {
          const th = thumbSrc(w.photo_path);
          return (
            <li key={w.id} className={`panel ${s.item}`} data-tone="plain">
              <span className={s.thumb}>{th.src ? <Img src={th.src} fallback={th.fallback} alt="" /> : <WatchIcon size={22} strokeWidth={1.3} aria-hidden="true" />}</span>
              <div className={s.info}>
                <strong>{w.brand} {w.model}</strong>
                <span>{[w.reference_number, t.stolenOn(formatDate(w.stolen_on)), w.city].filter(Boolean).join(' · ')}</span>
                {w.description && <p>{w.description}</p>}
                {w.owner_username && <Link to={`/profil/${w.owner_username}`}>{t.owner}</Link>}
              </div>
            </li>
          );
        })}
      </ul>
      <p className={s.muted}>{t.declare} <Link to="/collection">{t.declareLink}</Link></p>
    </div>
  );
}
