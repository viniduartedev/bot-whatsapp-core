import { collection, doc, getDocs, query, where, type DocumentData } from 'firebase/firestore';
import { INTEGRATION_LOG_STATUSES } from '../../core/constants/domain';
import { FIRESTORE_COLLECTIONS } from '../../core/constants/firestoreCollections';
import { toDateFromUnknown } from '../../core/mappers/display';
import {
  mapQuerySnapshot,
  readEnumValue,
  readOptionalUnknown,
  readString,
  readUnknown
} from '../../core/mappers/firestore';
import type { IntegrationLog } from '../../core/entities';
import { botDb } from '../../firebase/config';

function mapIntegrationLogDocument(id: string, data: DocumentData): IntegrationLog {
  const connectionId = readString(data, 'connectionId');
  const payloadSummary = readOptionalUnknown(data, 'payloadSummary');
  const responseSummary = readOptionalUnknown(data, 'responseSummary');
  const httpStatusValue = data.httpStatus;
  const httpStatus = typeof httpStatusValue === 'number' ? httpStatusValue : undefined;
  const attemptNumberValue = data.attemptNumber;
  const attemptNumber =
    typeof attemptNumberValue === 'number' && Number.isFinite(attemptNumberValue)
      ? attemptNumberValue
      : 1;

  return {
    id,
    projectId: readString(data, 'projectId'),
    tenantSlug: readString(data, 'tenantSlug'),
    integrationEventId: readString(data, 'integrationEventId'),
    serviceRequestId: readString(data, 'serviceRequestId'),
    ...(connectionId ? { connectionId } : {}),
    status: readEnumValue(data, 'status', INTEGRATION_LOG_STATUSES, 'attempt'),
    attemptNumber,
    message: readString(data, 'message'),
    ...(httpStatus !== undefined ? { httpStatus } : {}),
    ...(payloadSummary !== undefined ? { payloadSummary } : {}),
    ...(responseSummary !== undefined ? { responseSummary } : {}),
    createdAt: readUnknown(data, 'createdAt')
  };
}

function sortByCreatedAtDescending<T extends { createdAt: unknown }>(items: T[]): T[] {
  return [...items].sort((left, right) => {
    const leftDate = toDateFromUnknown(left.createdAt)?.getTime() ?? 0;
    const rightDate = toDateFromUnknown(right.createdAt)?.getTime() ?? 0;
    return rightDate - leftDate;
  });
}

export function getIntegrationLogDocumentRef(logId: string) {
  return doc(botDb, FIRESTORE_COLLECTIONS.integrationLogs, logId);
}

export async function getIntegrationLogs(projectId?: string): Promise<IntegrationLog[]> {
  const baseCollection = collection(botDb, FIRESTORE_COLLECTIONS.integrationLogs);
  const snapshot = projectId
    ? await getDocs(query(baseCollection, where('projectId', '==', projectId)))
    : await getDocs(baseCollection);
  const items = mapQuerySnapshot(snapshot, ({ id, data }) => mapIntegrationLogDocument(id, data));

  return sortByCreatedAtDescending(items);
}

export async function getRecentIntegrationErrors(
  projectId?: string,
  limitCount = 5
): Promise<IntegrationLog[]> {
  const logs = await getIntegrationLogs(projectId);
  return logs.filter((log) => log.status === 'error').slice(0, limitCount);
}
