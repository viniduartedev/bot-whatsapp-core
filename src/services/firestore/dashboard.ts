import { toDateFromUnknown } from '../../core/mappers/display';
import type { InboundEvent, IntegrationEvent, IntegrationLog } from '../../core/entities';
import { getInboundEvents } from './inboundEvents';
import { getIntegrationEvents } from './integrationEvents';
import { getIntegrationLogs } from './integrationLogs';
import { getProjectConnections } from './projectConnections';
import { getServiceRequests } from './serviceRequests';

export interface DashboardMetrics {
  inboundEvents: number;
  serviceRequests: number;
  pendingRequests: number;
  integratedRequests: number;
  integrationEvents: number;
  integrationErrors: number;
  activeConnections: number;
}

export interface DashboardHealthStatus {
  botStatus: 'online' | 'attention';
  integrationStatus: 'operational' | 'attention';
  coreStatus: 'operational' | 'attention';
  lastInboundEventAt: unknown | null;
  lastInboundEventType: string | null;
  lastIntegrationAt: unknown | null;
  message: string;
}

export interface DashboardSnapshot {
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
}

function isRecentEnough(value: unknown, maxHours = 12): boolean {
  const date = toDateFromUnknown(value);

  if (!date) {
    return false;
  }

  const elapsedMs = Date.now() - date.getTime();
  return elapsedMs <= maxHours * 60 * 60 * 1000;
}

function buildEmptyDashboardSnapshot(): DashboardSnapshot {
  return {
    metrics: {
      inboundEvents: 0,
      serviceRequests: 0,
      pendingRequests: 0,
      integratedRequests: 0,
      integrationEvents: 0,
      integrationErrors: 0,
      activeConnections: 0
    },
    funnel: {
      inboundEvents: 0,
      serviceRequests: 0,
      integrationEvents: 0,
      integratedRequests: 0
    },
    health: {
      botStatus: 'attention',
      integrationStatus: 'attention',
      coreStatus: 'attention',
      lastInboundEventAt: null,
      lastInboundEventType: null,
      lastIntegrationAt: null,
      message: 'Selecione um projeto para ver o contexto operacional do Core.'
    },
    recentEvents: [],
    recentIntegrationEvents: [],
    recentIntegrationErrors: []
  };
}

export async function getDashboardSnapshot(projectId?: string): Promise<DashboardSnapshot> {
  if (!projectId) {
    return buildEmptyDashboardSnapshot();
  }

  const [projectConnections, inboundEvents, serviceRequests, integrationEvents, integrationLogs] =
    await Promise.all([
      getProjectConnections(projectId),
      getInboundEvents(projectId),
      getServiceRequests(projectId),
      getIntegrationEvents(projectId),
      getIntegrationLogs(projectId)
    ]);

  const recentEvents = inboundEvents.slice(0, 8);
  const recentIntegrationEvents = integrationEvents.slice(0, 6);
  const recentIntegrationErrors = integrationLogs.filter((log) => log.status === 'error').slice(0, 5);
  const activeConnections = projectConnections.filter(
    (connection) => connection.status === 'active'
  ).length;
  const lastInboundEvent = recentEvents[0];
  const lastIntegrationEvent = recentIntegrationEvents[0];
  const hasRecentTraffic = lastInboundEvent ? isRecentEnough(lastInboundEvent.createdAt) : false;
  const pendingRequests = serviceRequests.filter(
    (request) => request.status === 'novo' || request.status === 'em_analise'
  ).length;
  const integratedRequests = serviceRequests.filter(
    (request) => request.status === 'integrado'
  ).length;
  const integrationErrors = integrationLogs.filter((log) => log.status === 'error').length;
  const hasIntegrationErrors = integrationErrors > 0;
  const hasActiveConnection = activeConnections > 0;

  return {
    metrics: {
      inboundEvents: inboundEvents.length,
      serviceRequests: serviceRequests.length,
      pendingRequests,
      integratedRequests,
      integrationEvents: integrationEvents.length,
      integrationErrors,
      activeConnections
    },
    funnel: {
      inboundEvents: inboundEvents.length,
      serviceRequests: serviceRequests.length,
      integrationEvents: integrationEvents.length,
      integratedRequests
    },
    health: {
      botStatus: hasRecentTraffic ? 'online' : 'attention',
      integrationStatus:
        hasActiveConnection && !hasIntegrationErrors ? 'operational' : 'attention',
      coreStatus:
        hasActiveConnection && !hasIntegrationErrors ? 'operational' : 'attention',
      lastInboundEventAt: lastInboundEvent?.createdAt ?? null,
      lastInboundEventType: lastInboundEvent?.eventType ?? null,
      lastIntegrationAt: lastIntegrationEvent?.completedAt ?? lastIntegrationEvent?.createdAt ?? null,
      message: !hasActiveConnection
        ? 'Este projeto ainda não possui projectConnection outbound ativa. O Core consegue operar inbound, mas não fecha a orquestração.'
        : hasIntegrationErrors
          ? 'Existem falhas recentes nas integrações outbound. Vale revisar logs e conexão ativa deste projeto.'
          : 'Projeto operando com contexto multi-tenant definido, fila de solicitações e integração outbound observável.'
    },
    recentEvents,
    recentIntegrationEvents,
    recentIntegrationErrors
  };
}
