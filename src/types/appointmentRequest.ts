import type { AppointmentRequestStatus, CoreChannel } from '../core/constants/domain';
import type { AppointmentService } from './appointment';

export interface AppointmentRequest {
  id: string;
  projectId: string;
  tenantId?: string;
  tenantSlug: string;
  serviceRequestId: string;
  contactId: string;
  sessionId?: string;
  phone: string;
  customerName: string;
  requestedDate: string;
  requestedTime: string;
  serviceId?: string;
  serviceNameSnapshot?: string;
  service: AppointmentService | null;
  status: AppointmentRequestStatus;
  channel: CoreChannel;
  source: string;
  integrationEventId?: string;
  externalReference?: string;
  mirroredFrom?: {
    firebaseProjectId: string;
    collection: string;
    documentId: string;
  };
  createdAt: unknown;
  updatedAt?: unknown;
}
