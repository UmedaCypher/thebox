import { LinkButton, Sheet } from '../ui';
import { allPremiumFeatures } from '../../lib/premium';
import { defineStrings, useStrings } from '../../i18n';
import s from './PremiumSheet.module.css';

const S = defineStrings({ discover: 'Découvrir Premium' }, { discover: 'Discover Premium' });

export default function PremiumSheet({ open, onClose, reason }: { open: boolean; onClose: () => void; reason?: string }) {
  const t = useStrings(S);
  return (
    <Sheet open={open} onClose={onClose} title="Arcora Premium">
      {reason && <p className={s.reason}>{reason}</p>}
      <ul className={s.list}>
        {allPremiumFeatures().map(f => (
          <li key={f.title}><strong>{f.title}</strong><span>{f.text}</span></li>
        ))}
      </ul>
      <LinkButton to="/premium" block onClick={onClose}>{t.discover}</LinkButton>
    </Sheet>
  );
}
