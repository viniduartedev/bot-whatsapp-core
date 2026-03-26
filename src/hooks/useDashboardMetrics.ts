import { useCallback, useEffect, useState } from 'react';
import type { InboundEvent, IntegrationEvent, IntegrationLog } from '../core/entities';
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
    integrationEvents: number;
    integratedRequests: number;
  };
  health: DashboardHealthStatus;
  recentEvents: InboundEvent[];
  recentIntegrationEvents: IntegrationEvent[];
  recentIntegrationErrors: IntegrationLog[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const INITIAL_METRICS: DashboardMetrics = {
  inboundEvents: 0,
  serviceRequests: 0,
  pendingRequests: 0,
  integratedRequests: 0,
  integrationEvents: 0,
  integrationErrors: 0,
  activeConnections: 0
};

const INITIAL_FUNNEL = {
  inboundEvents: 0,
  serviceRequests: 0,
  integrationEvents: 0,
  integratedRequests: 0
};

const INITIAL_HEALTH: DashboardHealthStatus = {
  botStatus: 'attention',
  integrationStatus: 'attention',
  coreStatus: 'attention',
  lastInboundEventAt: null,
  lastInboundEventType: null,
  lastIntegrationAt: null,
  message: 'Coletando sinais operacionais do projeto.'
};

export function useDashboardMetrics(projectId?: string): UseDashboardMetricsResult {
  const [metrics, setMetrics] = useState<DashboardMetrics>(INITIAL_METRICS);
  const [funnel, setFunnel] = useState(INITIAL_FUNNEL);
  const [health, setHealth] = useState<DashboardHealthStatus>(INITIAL_HEALTH);
  const [recentEvents, setRecentEvents] = useState<InboundEvent[]>([]);
  const [recentIntegrationEvents, setRecentIntegrationEvents] = useState<IntegrationEvent[]>([]);
  const [recentIntegrationErrors, setRecentIntegrationErrors] = useState<IntegrationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const snapshot = await getDashboardSnapshot(projectId);

      setMetrics(snapshot.metrics);
      setFunnel(snapshot.funnel);
      setHealth(snapshot.health);
      setRecentEvents(snapshot.recentEvents);
      setRecentIntegrationEvents(snapshot.recentIntegrationEvents);
      setRecentIntegrationErrors(snapshot.recentIntegrationErrors);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar indicadores.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return {
    metrics,
    funnel,
    health,
    recentEvents,
    recentIntegrationEvents,
    recentIntegrationErrors,
    loading,
    error,
    refetch
  };
}
