/**
 * O Core é o orquestrador operacional do ecossistema.
 * `Project` é a raiz do contexto multi-tenant e todas as demais entidades
 * devem ser lidas e operadas a partir desse escopo.
 *
 * Nesta fase ainda não temos autenticação forte no painel, então o isolamento
 * é reforçado por modelagem, queries por `projectId` e convenções explícitas.
 * Auth + autorização por tenant entram na etapa seguinte.
 */
export const PROJECT_STATUSES = ['active', 'inactive'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_CONNECTION_TYPES = ['scheduling'] as const;
export type ProjectConnectionType = (typeof PROJECT_CONNECTION_TYPES)[number];

export const PROJECT_CONNECTION_PROVIDERS = ['http', 'firebase'] as const;
export type ProjectConnectionProvider = (typeof PROJECT_CONNECTION_PROVIDERS)[number];

export const PROJECT_CONNECTION_ENVIRONMENTS = ['dev', 'prod'] as const;
export type ProjectConnectionEnvironment = (typeof PROJECT_CONNECTION_ENVIRONMENTS)[number];

export const PROJECT_CONNECTION_DIRECTIONS = ['outbound'] as const;
export type ProjectConnectionDirection = (typeof PROJECT_CONNECTION_DIRECTIONS)[number];

export const PROJECT_CONNECTION_STATUSES = ['active', 'inactive'] as const;
export type ProjectConnectionStatus = (typeof PROJECT_CONNECTION_STATUSES)[number];

export const CORE_CHANNELS = ['whatsapp'] as const;
export type CoreChannel = (typeof CORE_CHANNELS)[number];

export const INBOUND_EVENT_STATUSES = ['processed', 'error'] as const;
export type InboundEventStatus = (typeof INBOUND_EVENT_STATUSES)[number];

export const SERVICE_REQUEST_TYPES = ['appointment'] as const;
export type ServiceRequestType = (typeof SERVICE_REQUEST_TYPES)[number];

// `serviceRequests` será a principal entidade de entrada operacional do core.
export const SERVICE_REQUEST_STATUSES = [
  'novo',
  'em_analise',
  'confirmado',
  'integrado',
  'cancelado',
  'erro_integracao'
] as const;
export type ServiceRequestStatus = (typeof SERVICE_REQUEST_STATUSES)[number];

export const CONFIRMABLE_SERVICE_REQUEST_STATUSES = [
  'novo',
  'em_analise',
  'erro_integracao'
] as const;

export function canConfirmServiceRequestStatus(status: ServiceRequestStatus): boolean {
  return CONFIRMABLE_SERVICE_REQUEST_STATUSES.includes(
    status as (typeof CONFIRMABLE_SERVICE_REQUEST_STATUSES)[number]
  );
}

export const INTEGRATION_EVENT_TYPES = ['service_request_confirmation'] as const;
export type IntegrationEventType = (typeof INTEGRATION_EVENT_TYPES)[number];

export const INTEGRATION_EVENT_DIRECTIONS = ['outbound'] as const;
export type IntegrationEventDirection = (typeof INTEGRATION_EVENT_DIRECTIONS)[number];

export const INTEGRATION_EVENT_STATUSES = ['pending', 'dispatched', 'success', 'error'] as const;
export type IntegrationEventStatus = (typeof INTEGRATION_EVENT_STATUSES)[number];

export const INTEGRATION_LOG_STATUSES = ['attempt', 'success', 'error'] as const;
export type IntegrationLogStatus = (typeof INTEGRATION_LOG_STATUSES)[number];

export const APPOINTMENT_STATUSES = [
  'confirmado',
  'reagendado',
  'cancelado',
  'concluido',
  'faltou'
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];
