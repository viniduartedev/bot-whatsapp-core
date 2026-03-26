/**
 * Projeto 2: esta camada organiza o início do core compartilhado do sistema.
 * O painel, o bot e as integrações futuras devem convergir gradualmente para
 * estas convenções de domínio.
 */
export const PROJECT_STATUSES = ['active', 'inactive'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_CONNECTION_TYPES = ['scheduling'] as const;
export type ProjectConnectionType = (typeof PROJECT_CONNECTION_TYPES)[number];

export const PROJECT_CONNECTION_PROVIDERS = ['firebase'] as const;
export type ProjectConnectionProvider = (typeof PROJECT_CONNECTION_PROVIDERS)[number];

export const PROJECT_CONNECTION_ENVIRONMENTS = ['dev', 'prod'] as const;
export type ProjectConnectionEnvironment = (typeof PROJECT_CONNECTION_ENVIRONMENTS)[number];

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
  'cancelado',
  'convertido'
] as const;
export type ServiceRequestStatus = (typeof SERVICE_REQUEST_STATUSES)[number];

export const CONFIRMABLE_SERVICE_REQUEST_STATUSES = ['novo', 'em_analise'] as const;

export function canConfirmServiceRequestStatus(status: ServiceRequestStatus): boolean {
  return CONFIRMABLE_SERVICE_REQUEST_STATUSES.includes(
    status as (typeof CONFIRMABLE_SERVICE_REQUEST_STATUSES)[number]
  );
}

export const APPOINTMENT_STATUSES = [
  'confirmado',
  'reagendado',
  'cancelado',
  'concluido',
  'faltou'
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];
