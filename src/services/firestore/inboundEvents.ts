import { collection, getDocs, query, where } from 'firebase/firestore';
import { INBOUND_EVENT_STATUSES } from '../../core/constants/domain';
import { FIRESTORE_COLLECTIONS } from '../../core/constants/firestoreCollections';
import { toDateFromUnknown } from '../../core/mappers/display';
import { mapQuerySnapshot, readEnumValue, readOptionalUnknown, readString, readUnknown } from '../../core/mappers/firestore';
import type { InboundEvent } from '../../core/entities';
import { db } from '../../firebase/config';

function mapInboundEventDocument(id: string, data: Record<string, unknown>): InboundEvent {
  const metadata = readOptionalUnknown(data, 'metadata');

  return {
    id,
    projectId: readString(data, 'projectId'),
    eventType: readString(data, 'eventType'),
    status: readEnumValue(data, 'status', INBOUND_EVENT_STATUSES, 'processed'),
    phone: readString(data, 'phone'),
    createdAt: readUnknown(data, 'createdAt'),
    ...(metadata !== undefined ? { metadata } : {})
  };
}

function sortByCreatedAtDescending<T extends { createdAt: unknown }>(items: T[]): T[] {
  return [...items].sort((left, right) => {
    const leftDate = toDateFromUnknown(left.createdAt)?.getTime() ?? 0;
    const rightDate = toDateFromUnknown(right.createdAt)?.getTime() ?? 0;
    return rightDate - leftDate;
  });
}

export async function getInboundEvents(projectId?: string): Promise<InboundEvent[]> {
  const baseCollection = collection(db, FIRESTORE_COLLECTIONS.inboundEvents);
  const snapshot = projectId
    ? await getDocs(query(baseCollection, where('projectId', '==', projectId)))
    : await getDocs(baseCollection);
  const items = mapQuerySnapshot(snapshot, ({ id, data }) => mapInboundEventDocument(id, data));

  return sortByCreatedAtDescending(items);
}

export async function getRecentInboundEvents(
  projectId?: string,
  limitCount = 8
): Promise<InboundEvent[]> {
  const events = await getInboundEvents(projectId);
  return events.slice(0, limitCount);
}

export async function getInboundErrors(projectId?: string, limitCount = 5): Promise<InboundEvent[]> {
  const events = await getInboundEvents(projectId);
  return events.filter((event) => event.status === 'error').slice(0, limitCount);
}
