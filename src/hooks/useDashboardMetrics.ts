import { useCallback, useEffect, useState } from 'react';
import { getAppointments } from '../services/firestore/appointments';
import { getContacts } from '../services/firestore/contacts';
import { getProjects } from '../services/firestore/projects';
import { getServiceRequests } from '../services/firestore/serviceRequests';

interface DashboardMetrics {
  projects: number;
  contacts: number;
  serviceRequests: number;
  appointments: number;
}

interface UseDashboardMetricsResult {
  metrics: DashboardMetrics;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const INITIAL_METRICS: DashboardMetrics = {
  projects: 0,
  contacts: 0,
  serviceRequests: 0,
  appointments: 0
};

export function useDashboardMetrics(): UseDashboardMetricsResult {
  const [metrics, setMetrics] = useState<DashboardMetrics>(INITIAL_METRICS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [projects, contacts, serviceRequests, appointments] = await Promise.all([
        getProjects(),
        getContacts(),
        getServiceRequests(),
        getAppointments()
      ]);

      setMetrics({
        projects: projects.length,
        contacts: contacts.length,
        serviceRequests: serviceRequests.length,
        appointments: appointments.length
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar indicadores.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { metrics, loading, error, refetch };
}
