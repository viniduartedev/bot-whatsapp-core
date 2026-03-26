import type {
  ProjectConnectionEnvironment,
  ProjectConnectionProvider,
  ProjectConnectionType,
  ProjectStatus
} from '../core/constants/domain';

export interface ProjectConnection {
  id: string;
  projectId: string;
  connectionType: ProjectConnectionType;
  provider: ProjectConnectionProvider;
  status: ProjectStatus;
  targetProjectId: string;
  environment: ProjectConnectionEnvironment;
  createdAt: unknown;
}
