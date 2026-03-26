import type {
  IntegrationEventDirection,
  IntegrationEventStatus,
  IntegrationEventType,
  ProjectConnectionProvider
} from '../core/constants/domain';

export interface IntegrationEvent {
  id: string;
  projectId: string;
  serviceRequestId: string;
  connectionId?: string;
  contactId?: string;
  eventType: IntegrationEventType;
  direction: IntegrationEventDirection;
  provider: ProjectConnectionProvider;
  targetProjectId: string;
  endpointUrl: string;
  status: IntegrationEventStatus;
  requestSummary?: unknown;
  responseSummary?: unknown;
  lastError?: string;
  dispatchedAt?: unknown;
  completedAt?: unknown;
  createdAt: unknown;
}
