import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
  updateDoc,
  type DocumentData
} from 'firebase/firestore';
import {
  PROJECT_CONNECTION_DIRECTIONS,
  PROJECT_CONNECTION_ENVIRONMENTS,
  PROJECT_CONNECTION_PROVIDERS,
  PROJECT_CONNECTION_STATUSES,
  PROJECT_CONNECTION_TYPES,
  type ProjectConnectionDirection,
  type ProjectConnectionEnvironment,
  type ProjectConnectionProvider,
  type ProjectConnectionStatus,
  type ProjectConnectionType,
  type ServiceRequestType
} from '../../core/constants/domain';
import { FIRESTORE_COLLECTIONS } from '../../core/constants/firestoreCollections';
import {
  mapQuerySnapshot,
  readEnumValue,
  readOptionalUnknown,
  readString,
  readStringArray,
  readUnknown
} from '../../core/mappers/firestore';
import type { ProjectConnection } from '../../core/entities';
import { botDb } from '../../firebase/config';

export interface CreateProjectConnectionInput {
  projectId: string;
  connectionType: ProjectConnectionType;
  provider: ProjectConnectionProvider;
  status: ProjectConnectionStatus;
  targetProjectId: string;
  environment: ProjectConnectionEnvironment;
  endpointUrl: string;
  authToken: string;
  targetTenantId?: string;
  direction: ProjectConnectionDirection;
  acceptedEventTypes?: ServiceRequestType[];
  retryPolicy?: ProjectConnection['retryPolicy'];
}

export interface UpdateProjectConnectionInput
  extends Partial<CreateProjectConnectionInput> {}

function mapProjectConnectionDocument(
  id: string,
  data: DocumentData
): ProjectConnection {
  return {
    id,
    projectId: readString(data, 'projectId'),
    connectionType: readEnumValue(
      data,
      'connectionType',
      PROJECT_CONNECTION_TYPES,
      'scheduling'
    ),
    provider: readEnumValue(data, 'provider', PROJECT_CONNECTION_PROVIDERS, 'http'),
    status: readEnumValue(data, 'status', PROJECT_CONNECTION_STATUSES, 'inactive'),
    targetProjectId: readString(data, 'targetProjectId'),
    targetTenantId: readString(data, 'targetTenantId').trim() || undefined,
    environment: readEnumValue(
      data,
      'environment',
      PROJECT_CONNECTION_ENVIRONMENTS,
      'dev'
    ),
    endpointUrl: readString(data, 'endpointUrl'),
    authToken: readString(data, 'authToken'),
    direction: readEnumValue(data, 'direction', PROJECT_CONNECTION_DIRECTIONS, 'outbound'),
    acceptedEventTypes: readStringArray(data, 'acceptedEventTypes') as
      | ServiceRequestType[]
      | undefined,
    retryPolicy: readOptionalUnknown(data, 'retryPolicy') as
      | ProjectConnection['retryPolicy']
      | undefined,
    createdAt: readUnknown(data, 'createdAt')
  };
}

// `projectConnections` representa a camada de integrações externas do core.
// É por aqui que o orquestrador vai conectar projetos a sistemas como
// agendamento-ai e outros módulos futuros sem acoplar o domínio principal.
export async function getProjectConnections(projectId?: string): Promise<ProjectConnection[]> {
  const baseCollection = collection(botDb, FIRESTORE_COLLECTIONS.projectConnections);
  const snapshot = projectId
    ? await getDocs(query(baseCollection, where('projectId', '==', projectId)))
    : await getDocs(baseCollection);

  return mapQuerySnapshot(snapshot, ({ id, data }) => mapProjectConnectionDocument(id, data)).sort(
    (left, right) => {
      const leftKey = `${left.projectId} ${left.connectionType} ${left.environment}`;
      const rightKey = `${right.projectId} ${right.connectionType} ${right.environment}`;
      return leftKey.localeCompare(rightKey, 'pt-BR');
    }
  );
}

export async function getConnectionsByProject(
  projectId: string
): Promise<ProjectConnection[]> {
  return getProjectConnections(projectId);
}

export async function getPreferredProjectConnection(
  projectId: string,
  environmentPreference: ProjectConnectionEnvironment,
  connectionType: ProjectConnectionType = 'scheduling',
  acceptedEventType?: ServiceRequestType
): Promise<ProjectConnection | null> {
  const connections = await getConnectionsByProject(projectId);
  const activeConnections = connections.filter(
    (connection) =>
      connection.status === 'active' &&
      connection.direction === 'outbound' &&
      connection.connectionType === connectionType &&
      (!acceptedEventType ||
        !connection.acceptedEventTypes ||
        connection.acceptedEventTypes.length === 0 ||
        connection.acceptedEventTypes.includes(acceptedEventType))
  );

  const preferredConnection = activeConnections.find(
    (connection) => connection.environment === environmentPreference
  );

  return preferredConnection ?? activeConnections[0] ?? null;
}

export async function createProjectConnection(
  data: CreateProjectConnectionInput
): Promise<string> {
  const documentRef = await addDoc(collection(botDb, FIRESTORE_COLLECTIONS.projectConnections), {
    ...data,
    endpointUrl: data.endpointUrl.trim(),
    authToken: data.authToken.trim(),
    targetProjectId: data.targetProjectId.trim(),
    ...(data.targetTenantId ? { targetTenantId: data.targetTenantId.trim() } : {}),
    createdAt: serverTimestamp()
  });

  return documentRef.id;
}

export async function updateProjectConnection(
  id: string,
  data: UpdateProjectConnectionInput
): Promise<void> {
  await updateDoc(doc(botDb, FIRESTORE_COLLECTIONS.projectConnections, id), data);
}
