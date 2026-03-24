import { useCallback, useEffect, useState } from 'react';
import { getAppointmentRequests } from '../services/firestore';
import type { AppointmentRequest } from '../types/appointment';

interface UseRequestsResult {
  requests: AppointmentRequest[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useRequests(): UseRequestsResult {
  const [requests, setRequests] = useState<AppointmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await getAppointmentRequests();
      setRequests(items);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar solicitações.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { requests, loading, error, refetch };
}
