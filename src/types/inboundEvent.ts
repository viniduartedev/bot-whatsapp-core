import type { InboundEventStatus } from '../core/constants/domain';

export interface InboundEvent {
  id: string;
  projectId: string;
  eventType: string;
  status: InboundEventStatus;
  phone: string;
  createdAt: unknown;
  metadata?: unknown;
}
