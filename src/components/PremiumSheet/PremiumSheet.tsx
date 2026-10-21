import { LinkButton, Sheet } from '../ui';
import { PREMIUM_FEATURES } from '../../lib/premium';
import s from './PremiumSheet.module.css';

export default function PremiumSheet({ open, onClose, reason }: { open: boolean; onClose: () => void; reason?: string }) {
  return (
    <Sheet open={open} onClose={onClose} title="The Box Premium">
      {reason && <p className={s.reason}>{reason}</p>}
      <ul className={s.list}>
        {PREMIUM_FEATURES.map(f => (
          <li key={f.title}><strong>{f.title}</strong><span>{f.text}</span></li>
        ))}
      </ul>
      <LinkButton to="/premium" block onClick={onClose}>Découvrir Premium</LinkButton>
    </Sheet>
  );
}
