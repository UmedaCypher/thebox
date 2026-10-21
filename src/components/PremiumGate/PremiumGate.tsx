import type { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { EmptyState, LinkButton, PageHeader } from '../ui';

/** Affiche le contenu si le compte est Premium, sinon une invitation. Les données restent protégées par la base. */
export default function PremiumGate({ title, pitch, children }: { title: string; pitch: string; children: ReactNode }) {
  const { isPremium, profile } = useAuth();
  if (isPremium) return <>{children}</>;
  return (
    <div className="page page--narrow">
      <PageHeader title={title} />
      <EmptyState title="Réservé à Premium" action={<LinkButton to="/premium">Découvrir Premium</LinkButton>}>
        {profile ? pitch : 'Chargement…'}
      </EmptyState>
    </div>
  );
}
