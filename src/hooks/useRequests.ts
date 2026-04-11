import { getAppointmentRequests } from '../services/firestore';
import type { AppointmentRequest } from '../types/appointmentRequest';
import { useCollectionQuery } from './useCollectionQuery';

interface UseRequestsResult {
  requests: AppointmentRequest[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useRequests(): UseRequestsResult {
  const { data, loading, error, refetch } = useCollectionQuery<AppointmentRequest>(
    getAppointmentRequests,
    'Erro ao carregar solicitações de agendamento.'
  );

  const requests = data;
  return { requests, loading, error, refetch };
}
