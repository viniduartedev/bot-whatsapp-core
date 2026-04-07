import type { IntegrationLogStatus } from '../core/constants/domain';

export interface IntegrationLog {
  id: string;
  projectId: string;
  tenantSlug?: string;
  integrationEventId: string;
  serviceRequestId: string;
  connectionId?: string;
  status: IntegrationLogStatus;
  attemptNumber: number;
  message: string;
  httpStatus?: number;
  payloadSummary?: unknown;
  responseSummary?: unknown;
  createdAt: unknown;
}
