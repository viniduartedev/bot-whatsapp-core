import type { ProjectStatus } from '../core/constants/domain';

// `Project` é a raiz real do contexto multi-tenant do Core.
export interface Project {
  id: string;
  name: string;
  slug: string;
  status: ProjectStatus;
  createdAt: unknown;
}
