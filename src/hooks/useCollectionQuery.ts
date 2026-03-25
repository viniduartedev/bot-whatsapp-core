import { useCallback, useEffect, useState } from 'react';

interface UseCollectionQueryResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCollectionQuery<T>(
  loader: () => Promise<T[]>,
  fallbackErrorMessage = 'Erro ao carregar dados.'
): UseCollectionQueryResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await loader();
      setData(items);
    } catch (err) {
      const message = err instanceof Error ? err.message : fallbackErrorMessage;
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [fallbackErrorMessage, loader]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
