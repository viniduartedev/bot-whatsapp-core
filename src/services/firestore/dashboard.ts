import { toDateFromUnknown } from '../../core/mappers/display';
import type { InboundEvent } from '../../core/entities';
import { getAppointments } from './appointments';
import { getInboundEvents } from './inboundEvents';
import { getProjectConnections } from './projectConnections';
import { getProjects } from './projects';
import { getServiceRequests } from './serviceRequests';

export interface DashboardMetrics {
  projects: number;
  inboundEvents: number;
  inboundEventsToday: number;
  serviceRequests: number;
  appointments: number;
  errors: number;
  activeConnections: number;
}

export interface DashboardHealthStatus {
  botStatus: 'online' | 'attention';
  coreStatus: 'operational' | 'attention';
  lastEventAt: unknown | null;
  lastEventType: string | null;
  message: string;
}

export interface DashboardSnapshot {
  metrics: DashboardMetrics;
  funnel: {
    inboundEvents: number;
    serviceRequests: number;
    appointments: number;
  };
  health: DashboardHealthStatus;
  recentEvents: InboundEvent[];
  recentErrors: InboundEvent[];
}

function isToday(value: unknown): boolean {
  const date = toDateFromUnknown(value);

  if (!date) {
    return false;
  }

  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function isRecentEnough(value: unknown, maxHours = 12): boolean {
  const date = toDateFromUnknown(value);

  if (!date) {
    return false;
  }

  const elapsedMs = Date.now() - date.getTime();
  return elapsedMs <= maxHours * 60 * 60 * 1000;
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const [projects, projectConnections, inboundEvents, serviceRequests, appointments] =
    await Promise.all([
      getProjects(),
      getProjectConnections(),
    getInboundEvents(),
    getServiceRequests(),
    getAppointments()
    ]);

  const recentEvents = inboundEvents.slice(0, 8);
  const recentErrors = inboundEvents.filter((event) => event.status === 'error').slice(0, 5);
  const totalErrors = inboundEvents.filter((event) => event.status === 'error').length;
  const activeConnections = projectConnections.filter(
    (connection) => connection.status === 'active'
  ).length;
  const lastEvent = recentEvents[0];
  const hasRecentTraffic = lastEvent ? isRecentEnough(lastEvent.createdAt) : false;
  const hasErrors = totalErrors > 0;

  return {
    metrics: {
      projects: projects.length,
      inboundEvents: inboundEvents.length,
      inboundEventsToday: inboundEvents.filter((event) => isToday(event.createdAt)).length,
      serviceRequests: serviceRequests.length,
      appointments: appointments.length,
      errors: totalErrors,
      activeConnections
    },
    funnel: {
      inboundEvents: inboundEvents.length,
      serviceRequests: serviceRequests.length,
      appointments: appointments.length
    },
    health: {
      botStatus: hasRecentTraffic ? 'online' : 'attention',
      coreStatus: hasErrors ? 'attention' : 'operational',
      lastEventAt: lastEvent?.createdAt ?? null,
      lastEventType: lastEvent?.eventType ?? null,
      message: hasRecentTraffic
        ? 'Fluxo operacional recebendo eventos e pronto para crescer para múltiplos bots.'
        : 'Sem eventos recentes. Vale verificar integrador, webhook ou ambiente de desenvolvimento.'
    },
    recentEvents,
    recentErrors
  };
}
