import { useCallback, useEffect, useState } from 'react';
import type { InboundEvent } from '../core/entities';
import {
  getDashboardSnapshot,
  type DashboardHealthStatus,
  type DashboardMetrics
} from '../services/firestore/dashboard';

interface UseDashboardMetricsResult {
  metrics: DashboardMetrics;
  funnel: {
    inboundEvents: number;
    serviceRequests: number;
    appointments: number;
  };
  health: DashboardHealthStatus;
  recentEvents: InboundEvent[];
  recentErrors: InboundEvent[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const INITIAL_METRICS: DashboardMetrics = {
  projects: 0,
  inboundEvents: 0,
  inboundEventsToday: 0,
  serviceRequests: 0,
  appointments: 0,
  errors: 0,
  activeConnections: 0
};

const INITIAL_FUNNEL = {
  inboundEvents: 0,
  serviceRequests: 0,
  appointments: 0
};

const INITIAL_HEALTH: DashboardHealthStatus = {
  botStatus: 'attention',
  coreStatus: 'attention',
  lastEventAt: null,
  lastEventType: null,
  message: 'Coletando sinais operacionais do core.'
};

export function useDashboardMetrics(): UseDashboardMetricsResult {
  const [metrics, setMetrics] = useState<DashboardMetrics>(INITIAL_METRICS);
  const [funnel, setFunnel] = useState(INITIAL_FUNNEL);
  const [health, setHealth] = useState<DashboardHealthStatus>(INITIAL_HEALTH);
  const [recentEvents, setRecentEvents] = useState<InboundEvent[]>([]);
  const [recentErrors, setRecentErrors] = useState<InboundEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const snapshot = await getDashboardSnapshot();

      setMetrics(snapshot.metrics);
      setFunnel(snapshot.funnel);
      setHealth(snapshot.health);
      setRecentEvents(snapshot.recentEvents);
      setRecentErrors(snapshot.recentErrors);
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

  return { metrics, funnel, health, recentEvents, recentErrors, loading, error, refetch };
}
