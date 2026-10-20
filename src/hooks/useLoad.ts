import { useCallback, useEffect, useState } from 'react';
import type { DependencyList } from 'react';

/** Charge des données asynchrones avec états de chargement et d'erreur, et une fonction pour recharger. */
export function useLoad<T>(loader: () => Promise<T>, deps: DependencyList, enabled = true) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(loader, deps);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await run());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  }, [run]);

  useEffect(() => {
    if (enabled) reload();
  }, [enabled, reload]);

  return { data, setData, loading, error, reload };
}
