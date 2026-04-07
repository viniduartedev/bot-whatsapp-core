import { collection, doc, getDocs, query, where, type DocumentData } from 'firebase/firestore';
import {
  INTEGRATION_EVENT_DIRECTIONS,
  INTEGRATION_EVENT_STATUSES,
  INTEGRATION_EVENT_TYPES,
  PROJECT_CONNECTION_PROVIDERS
} from '../../core/constants/domain';
import { FIRESTORE_COLLECTIONS } from '../../core/constants/firestoreCollections';
import { toDateFromUnknown } from '../../core/mappers/display';
import {
  mapQuerySnapshot,
  readEnumValue,
  readOptionalUnknown,
  readString,
  readUnknown
} from '../../core/mappers/firestore';
import type { IntegrationEvent } from '../../core/entities';
import { botDb } from '../../firebase/config';

function mapIntegrationEventDocument(id: string, data: DocumentData): IntegrationEvent {
  const connectionId = readString(data, 'connectionId');
  const contactId = readString(data, 'contactId');
  const lastError = readString(data, 'lastError');
  const requestSummary = readOptionalUnknown(data, 'requestSummary');
  const responseSummary = readOptionalUnknown(data, 'responseSummary');
  const dispatchedAt = readOptionalUnknown(data, 'dispatchedAt');
  const completedAt = readOptionalUnknown(data, 'completedAt');

  return {
    id,
    projectId: readString(data, 'projectId'),
    tenantSlug: readString(data, 'tenantSlug'),
    serviceRequestId: readString(data, 'serviceRequestId'),
    ...(connectionId ? { connectionId } : {}),
    ...(contactId ? { contactId } : {}),
    eventType: readEnumValue(
      data,
      'eventType',
      INTEGRATION_EVENT_TYPES,
      'service_request_confirmation'
    ),
    direction: readEnumValue(data, 'direction', INTEGRATION_EVENT_DIRECTIONS, 'outbound'),
    provider: readEnumValue(data, 'provider', PROJECT_CONNECTION_PROVIDERS, 'http'),
    targetProjectId: readString(data, 'targetProjectId'),
    endpointUrl: readString(data, 'endpointUrl'),
    status: readEnumValue(data, 'status', INTEGRATION_EVENT_STATUSES, 'pending'),
    ...(requestSummary !== undefined ? { requestSummary } : {}),
    ...(responseSummary !== undefined ? { responseSummary } : {}),
    ...(lastError ? { lastError } : {}),
    ...(dispatchedAt !== undefined ? { dispatchedAt } : {}),
    ...(completedAt !== undefined ? { completedAt } : {}),
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

export function getIntegrationEventDocumentRef(eventId: string) {
  return doc(botDb, FIRESTORE_COLLECTIONS.integrationEvents, eventId);
}

export async function getIntegrationEvents(projectId?: string): Promise<IntegrationEvent[]> {
  const baseCollection = collection(botDb, FIRESTORE_COLLECTIONS.integrationEvents);
  const snapshot = projectId
    ? await getDocs(query(baseCollection, where('projectId', '==', projectId)))
    : await getDocs(baseCollection);
  const items = mapQuerySnapshot(snapshot, ({ id, data }) => mapIntegrationEventDocument(id, data));

  return sortByCreatedAtDescending(items);
}

export async function getRecentIntegrationEvents(
  projectId?: string,
  limitCount = 8
): Promise<IntegrationEvent[]> {
  const events = await getIntegrationEvents(projectId);
  return events.slice(0, limitCount);
}
