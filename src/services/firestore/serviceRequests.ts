import {
  collection,
  doc,
  getDoc,
  getDocs,
  type DocumentData,
  type DocumentSnapshot
} from 'firebase/firestore';
import { CORE_CHANNELS, SERVICE_REQUEST_STATUSES, SERVICE_REQUEST_TYPES } from '../../core/constants/domain';
import { FIRESTORE_COLLECTIONS } from '../../core/constants/firestoreCollections';
import { mapQuerySnapshot, readEnumValue, readString, readUnknown } from '../../core/mappers/firestore';
import type { ServiceRequest } from '../../core/entities';
import { db } from '../../firebase/config';

function mapServiceRequestDocument(id: string, data: DocumentData): ServiceRequest {
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

export async function getServiceRequests(): Promise<ServiceRequest[]> {
  const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.serviceRequests));

  return mapQuerySnapshot(snapshot, ({ id, data }) => mapServiceRequestDocument(id, data)).sort(
    (left, right) => {
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
