import type { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { EmptyState, LinkButton, PageHeader } from '../ui';
import { defineStrings, useStrings } from '../../i18n';
import { COMMON } from '../../i18n/common';

const S = defineStrings({ title: 'Réservé à Premium', discover: 'Découvrir Premium' }, { title: 'Premium only', discover: 'Discover Premium' });

/** Affiche le contenu si le compte est Premium, sinon une invitation. Les données restent protégées par la base. */
export default function PremiumGate({ title, pitch, children }: { title: string; pitch: string; children: ReactNode }) {
  const t = useStrings(S);
  const c = useStrings(COMMON);
  const { isPremium, profile } = useAuth();
  if (isPremium) return <>{children}</>;
  return (
    <div className="page page--narrow">
      <PageHeader title={title} />
      <EmptyState title={t.title} action={<LinkButton to="/premium">{t.discover}</LinkButton>}>
        {profile ? pitch : c.loading}
      </EmptyState>
    </div>
  );
}
