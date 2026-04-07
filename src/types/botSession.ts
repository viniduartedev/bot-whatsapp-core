import type { CoreChannel } from '../core/constants/domain';

export interface BotSession {
  id: string;
  projectId: string;
  tenantSlug: string;
  channel: CoreChannel;
  phone: string;
  status: 'active' | 'completed' | 'expired';
  currentStep: string;
  selectedServiceKey?: string;
  lastInboundText?: string;
  createdAt: unknown;
  updatedAt: unknown;
}
