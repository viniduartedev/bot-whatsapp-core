import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  doc,
  type DocumentData
} from 'firebase/firestore';
import {
  PROJECT_CONNECTION_ENVIRONMENTS,
  PROJECT_CONNECTION_PROVIDERS,
  PROJECT_CONNECTION_TYPES,
  PROJECT_STATUSES,
  type ProjectConnectionEnvironment,
  type ProjectConnectionProvider,
  type ProjectConnectionType,
  type ProjectStatus
} from '../../core/constants/domain';
import { FIRESTORE_COLLECTIONS } from '../../core/constants/firestoreCollections';
import { mapQuerySnapshot, readEnumValue, readString, readUnknown } from '../../core/mappers/firestore';
import type { ProjectConnection } from '../../core/entities';
import { db } from '../../firebase/config';

export interface CreateProjectConnectionInput {
  projectId: string;
  connectionType: ProjectConnectionType;
  provider: ProjectConnectionProvider;
  status: ProjectStatus;
  targetProjectId: string;
  environment: ProjectConnectionEnvironment;
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
    provider: readEnumValue(data, 'provider', PROJECT_CONNECTION_PROVIDERS, 'firebase'),
    status: readEnumValue(data, 'status', PROJECT_STATUSES, 'inactive'),
    targetProjectId: readString(data, 'targetProjectId'),
    environment: readEnumValue(
      data,
      'environment',
      PROJECT_CONNECTION_ENVIRONMENTS,
      'dev'
    ),
    createdAt: readUnknown(data, 'createdAt')
  };
}

// `projectConnections` representa a camada de integrações externas do core.
// É por aqui que o orquestrador vai conectar projetos a sistemas como
// agendamentos-ai e outros módulos futuros sem acoplar o domínio principal.
export async function getProjectConnections(): Promise<ProjectConnection[]> {
  const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.projectConnections));

  return mapQuerySnapshot(snapshot, ({ id, data }) => mapProjectConnectionDocument(id, data)).sort(
    (left, right) => left.projectId.localeCompare(right.projectId, 'pt-BR')
  );
}

export async function getConnectionsByProject(
  projectId: string
): Promise<ProjectConnection[]> {
  const connectionsQuery = query(
    collection(db, FIRESTORE_COLLECTIONS.projectConnections),
    where('projectId', '==', projectId)
  );
  const snapshot = await getDocs(connectionsQuery);

  return mapQuerySnapshot(snapshot, ({ id, data }) => mapProjectConnectionDocument(id, data));
}

export async function createProjectConnection(
  data: CreateProjectConnectionInput
): Promise<void> {
  await addDoc(collection(db, FIRESTORE_COLLECTIONS.projectConnections), {
    ...data,
    createdAt: serverTimestamp()
  });
}

export async function updateProjectConnection(
  id: string,
  data: UpdateProjectConnectionInput
): Promise<void> {
  await updateDoc(doc(db, FIRESTORE_COLLECTIONS.projectConnections, id), data);
}
