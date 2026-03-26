import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  type DocumentData,
  type DocumentSnapshot
} from 'firebase/firestore';
import { CORE_CHANNELS, SERVICE_REQUEST_STATUSES, SERVICE_REQUEST_TYPES } from '../../core/constants/domain';
import { FIRESTORE_COLLECTIONS } from '../../core/constants/firestoreCollections';
import {
  mapQuerySnapshot,
  readEnumValue,
  readOptionalUnknown,
  readString,
  readUnknown
} from '../../core/mappers/firestore';
import type { ServiceRequest } from '../../core/entities';
import { db } from '../../firebase/config';

const serviceRequestStatusWeight: Record<ServiceRequest['status'], number> = {
  novo: 0,
  em_analise: 1,
  confirmado: 2,
  erro_integracao: 3,
  integrado: 4,
  cancelado: 5
};

function mapServiceRequestDocument(id: string, data: DocumentData): ServiceRequest {
  const confirmedAt = readOptionalUnknown(data, 'confirmedAt');
  const integratedAt = readOptionalUnknown(data, 'integratedAt');
  const lastIntegrationEventId = readString(data, 'lastIntegrationEventId');
  const lastIntegrationError = readString(data, 'lastIntegrationError');

  return {
    id,
    projectId: readString(data, 'projectId'),
    contactId: readString(data, 'contactId'),
    type: readEnumValue(data, 'type', SERVICE_REQUEST_TYPES, 'appointment'),
    channel: readEnumValue(data, 'channel', CORE_CHANNELS, 'whatsapp'),
    source: readString(data, 'source'),
    requestedDate: readString(data, 'requestedDate'),
    requestedTime: readString(data, 'requestedTime'),
    status: readEnumValue(data, 'status', SERVICE_REQUEST_STATUSES, 'novo'),
    ...(confirmedAt !== undefined ? { confirmedAt } : {}),
    ...(integratedAt !== undefined ? { integratedAt } : {}),
    ...(lastIntegrationEventId ? { lastIntegrationEventId } : {}),
    ...(lastIntegrationError ? { lastIntegrationError } : {}),
    createdAt: readUnknown(data, 'createdAt')
  };
}

export function mapServiceRequestSnapshot(
  snapshot: DocumentSnapshot<DocumentData>
): ServiceRequest | null {
  if (!snapshot.exists()) {
    return null;
  }

  return mapServiceRequestDocument(snapshot.id, snapshot.data());
}

export function getServiceRequestDocumentRef(requestId: string) {
  return doc(db, FIRESTORE_COLLECTIONS.serviceRequests, requestId);
}

export async function getServiceRequests(projectId?: string): Promise<ServiceRequest[]> {
  const baseCollection = collection(db, FIRESTORE_COLLECTIONS.serviceRequests);
  const snapshot = projectId
    ? await getDocs(query(baseCollection, where('projectId', '==', projectId)))
    : await getDocs(baseCollection);

  return mapQuerySnapshot(snapshot, ({ id, data }) => mapServiceRequestDocument(id, data)).sort(
    (left, right) => {
      const statusDifference =
        serviceRequestStatusWeight[left.status] - serviceRequestStatusWeight[right.status];

      if (statusDifference !== 0) {
        return statusDifference;
      }

      const leftKey = `${left.requestedDate} ${left.requestedTime}`;
      const rightKey = `${right.requestedDate} ${right.requestedTime}`;
      return leftKey.localeCompare(rightKey, 'pt-BR');
    }
  );
}

export async function getServiceRequestById(requestId: string): Promise<ServiceRequest | null> {
  const snapshot = await getDoc(getServiceRequestDocumentRef(requestId));
  return mapServiceRequestSnapshot(snapshot);
}
