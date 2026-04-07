import type { CoreChannel, ServiceRequestStatus, ServiceRequestType } from '../core/constants/domain';
import type { AppointmentService } from './appointment';

export interface ServiceRequest {
  id: string;
  projectId: string;
  tenantId?: string;
  tenantSlug: string;
  contactId: string;
  sessionId?: string;
  type: ServiceRequestType;
  channel: CoreChannel;
  source: string;
  service: AppointmentService | null;
  requestedDate: string;
  requestedTime: string;
  status: ServiceRequestStatus;
  confirmedAt?: unknown;
  integratedAt?: unknown;
  lastIntegrationEventId?: string;
  lastIntegrationError?: string;
  externalAppointmentId?: string;
  createdAt: unknown;
}
