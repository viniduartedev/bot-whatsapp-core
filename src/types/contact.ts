import type { CoreChannel } from '../core/constants/domain';

export interface Contact {
  id: string;
  projectId: string;
  channel: CoreChannel;
  phone: string;
  name: string;
  createdAt: unknown;
  lastInteractionAt?: unknown;
}
