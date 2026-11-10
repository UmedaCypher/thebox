import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { getFoundersOffer } from '../../lib/api';
import type { FoundersOffer as Offer } from '../../lib/api';
import { canPurchase, FOUNDERS_OFFER, PREMIUM_MONTH_EUR, PREMIUM_YEAR_EUR } from '../../lib/features';
import { formatEuros } from '../../lib/format';
import { defineStrings, useStrings } from '../../i18n';
import s from './FoundersOffer.module.css';

/** 1 € plutôt que 1,00 € ; 9,99 € garde ses centimes */
export const eur = (n: number) => formatEuros(n, !Number.isInteger(n));

const S = defineStrings({
  kicker: 'Offre membres fondateurs',
  title: (m: string, y: string) => `${m} par mois ou ${y} par an`,
  text: (m: string, y: string) => `La première année, au lieu de ${m} par mois ou ${y} par an. Ensuite, le tarif normal ; résiliable à tout moment.`,
  seats: (n: number, total: number) => `Plus que ${n} place${n > 1 ? 's' : ''} sur ${total}`,
}, {
  kicker: 'Founding member offer',
  title: (m: string, y: string) => `${m} a month or ${y} a year`,
  text: (m: string, y: string) => `For the first year, instead of ${m} a month or ${y} a year. Then the regular price; cancel anytime.`,
  seats: (n: number, total: number) => `Only ${n} seat${n > 1 ? 's' : ''} left out of ${total}`,
});

/** L'offre fondateurs est-elle disponible pour ce visiteur ? (chargée une fois, partagée) */
let cache: Promise<Offer | null> | null = null;
export function useFoundersOffer() {
  const [offer, setOffer] = useState<Offer | null>(null);
  useEffect(() => {
    if (!canPurchase()) return;
    cache ??= getFoundersOffer();
    let alive = true;
    cache.then(o => { if (alive) setOffer(o); });
    return () => { alive = false; };
  }, []);
  return offer && offer.open && !offer.claimed ? offer : null;
}

/** Bandeau de l'offre fondateurs, avec le compteur de places. N'affiche rien si l'offre n'est pas disponible. */
export default function FoundersOffer({ compact = false }: { compact?: boolean }) {
  const t = useStrings(S);
  const offer = useFoundersOffer();
  if (!offer) return null;
  const pct = Math.min(100, Math.round((offer.taken / offer.limit) * 100));
  return (
    <section className={s.offer} data-compact={compact} aria-label={t.kicker}>
      <p className={s.kicker}><Sparkles size={14} strokeWidth={2} aria-hidden="true" />{t.kicker}</p>
      <p className={s.title}>{t.title(eur(FOUNDERS_OFFER.month), eur(FOUNDERS_OFFER.year))}</p>
      {!compact && <p className={s.text}>{t.text(eur(PREMIUM_MONTH_EUR), eur(PREMIUM_YEAR_EUR))}</p>}
      <div className={s.seats}>
        <span className={s.bar} aria-hidden="true"><i style={{ width: `${Math.max(pct, 4)}%` }} /></span>
        <span>{t.seats(offer.remaining, offer.limit)}</span>
      </div>
    </section>
  );
}
