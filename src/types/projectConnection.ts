import type {
  ProjectConnectionDirection,
  ProjectConnectionEnvironment,
  ProjectConnectionProvider,
  ProjectConnectionStatus,
  ProjectConnectionType,
  ServiceRequestType
} from '../core/constants/domain';

export interface ProjectConnectionRetryPolicy {
  maxAttempts: number;
  backoffSeconds: number;
}

// `ProjectConnection` representa uma instalação de integração subordinada a um
// `Project`. O Core usa esta entidade para orquestrar outbound sem assumir a
// verdade final do domínio externo.
export interface ProjectConnection {
  id: string;
  projectId: string;
  connectionType: ProjectConnectionType;
  provider: ProjectConnectionProvider;
  status: ProjectConnectionStatus;
  targetProjectId: string;
  targetTenantId?: string;
  environment: ProjectConnectionEnvironment;
  endpointUrl: string;
  authToken: string;
  direction: ProjectConnectionDirection;
  acceptedEventTypes?: ServiceRequestType[];
  retryPolicy?: ProjectConnectionRetryPolicy;
  createdAt: unknown;
}
