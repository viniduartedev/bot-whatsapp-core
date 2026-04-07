import type { CoreChannel, ServiceRequestType } from '../core/constants/domain';

export interface Service {
  id: string;
  projectId: string;
  tenantId: string;
  tenantSlug: string;
  key: string;
  label: string;
  description: string;
  channel: CoreChannel;
  type: ServiceRequestType;
  active: boolean;
  requiresScheduling: boolean;
  durationMinutes: number;
  order: number;
  createdAt: unknown;
  updatedAt?: unknown;
}
