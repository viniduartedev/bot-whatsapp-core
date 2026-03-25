import type { ProjectStatus } from '../core/constants/domain';

export interface Project {
  id: string;
  name: string;
  slug: string;
  status: ProjectStatus;
  createdAt: unknown;
}
