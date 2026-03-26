import type { CoreChannel, ServiceRequestStatus, ServiceRequestType } from '../core/constants/domain';

export interface ServiceRequest {
  id: string;
  projectId: string;
  contactId: string;
  type: ServiceRequestType;
  channel: CoreChannel;
  source: string;
  requestedDate: string;
  requestedTime: string;
  status: ServiceRequestStatus;
  confirmedAt?: unknown;
  integratedAt?: unknown;
  lastIntegrationEventId?: string;
  lastIntegrationError?: string;
  createdAt: unknown;
}
