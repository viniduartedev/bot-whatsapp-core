import { collection, getDocs, query, where, type DocumentData } from 'firebase/firestore';
import { APPOINTMENT_REQUEST_STATUSES, CORE_CHANNELS } from '../../core/constants/domain';
import { FIRESTORE_COLLECTIONS } from '../../core/constants/firestoreCollections';
import {
  mapQuerySnapshot,
  readEnumValue,
  readOptionalUnknown,
  readString,
  readUnknown
} from '../../core/mappers/firestore';
import type { AppointmentRequest } from '../../types/appointmentRequest';
import { APPOINTMENT_REQUESTS_TARGET_FIREBASE_PROJECT_ID, agendaDb } from '../../firebase/config';
import type { AppointmentService } from '../../types/appointment';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readAppointmentRequestService(data: DocumentData): AppointmentService | null {
  const rawService = data.service;
  const key = isRecord(rawService)
    ? typeof rawService.key === 'string'
      ? rawService.key.trim()
      : ''
    : readString(data, 'serviceId').trim();
  const label = isRecord(rawService)
    ? typeof rawService.label === 'string'
      ? rawService.label.trim()
      : ''
    : readString(data, 'serviceNameSnapshot').trim();

  if (!key || !label) {
    return null;
  }

  return {
    key,
    label
  };
}

function readMirroredFrom(
  data: DocumentData
): AppointmentRequest['mirroredFrom'] | undefined {
  const rawMirroredFrom = data.mirroredFrom;

  if (!isRecord(rawMirroredFrom)) {
    return undefined;
  }

  const firebaseProjectId =
    typeof rawMirroredFrom.firebaseProjectId === 'string'
      ? rawMirroredFrom.firebaseProjectId.trim()
      : '';
  const collection =
    typeof rawMirroredFrom.collection === 'string' ? rawMirroredFrom.collection.trim() : '';
  const documentId =
    typeof rawMirroredFrom.documentId === 'string' ? rawMirroredFrom.documentId.trim() : '';

  if (!firebaseProjectId || !collection || !documentId) {
    return undefined;
  }

  return {
    firebaseProjectId,
    collection,
    documentId
  };
}

function mapAppointmentRequestDocument(id: string, data: DocumentData): AppointmentRequest {
  const tenantId = readString(data, 'tenantId').trim();
  const sessionId = readString(data, 'sessionId').trim();
  const serviceRequestId =
    readString(data, 'serviceRequestId').trim() || readString(data, 'requestId').trim();
  const serviceId = readString(data, 'serviceId').trim();
  const serviceNameSnapshot = readString(data, 'serviceNameSnapshot').trim();
  const integrationEventId = readString(data, 'integrationEventId').trim();
  const externalReference = readString(data, 'externalReference').trim();
  const updatedAt = readOptionalUnknown(data, 'updatedAt');

  return {
    id,
    projectId: readString(data, 'projectId'),
    ...(tenantId ? { tenantId } : {}),
    tenantSlug: readString(data, 'tenantSlug').trim() || tenantId,
    serviceRequestId,
    contactId: readString(data, 'contactId'),
    ...(sessionId ? { sessionId } : {}),
    phone: readString(data, 'phone').trim() || readString(data, 'customerPhone').trim(),
    customerName: readString(data, 'customerName'),
    requestedDate: readString(data, 'requestedDate'),
    requestedTime: readString(data, 'requestedTime'),
    ...(serviceId ? { serviceId } : {}),
    ...(serviceNameSnapshot ? { serviceNameSnapshot } : {}),
    service: readAppointmentRequestService(data),
    status: readEnumValue(data, 'status', APPOINTMENT_REQUEST_STATUSES, 'pending'),
    channel: readEnumValue(data, 'channel', CORE_CHANNELS, 'whatsapp'),
    source: readString(data, 'source', 'bot'),
    ...(integrationEventId ? { integrationEventId } : {}),
    ...(externalReference ? { externalReference } : {}),
    ...(readMirroredFrom(data) ? { mirroredFrom: readMirroredFrom(data) } : {}),
    createdAt: readUnknown(data, 'createdAt'),
    ...(updatedAt !== undefined ? { updatedAt } : {})
  };
}

export async function getAppointmentRequests(input?: {
  projectId?: string;
  tenantSlug?: string;
}): Promise<AppointmentRequest[]> {
  const baseCollection = collection(agendaDb, FIRESTORE_COLLECTIONS.appointmentRequests);
  const tenantSlug = input?.tenantSlug?.trim();
  const projectId = input?.projectId?.trim();
  const filters = [];

  if (tenantSlug) {
    filters.push(where('tenantSlug', '==', tenantSlug));
  } else if (projectId) {
    filters.push(where('projectId', '==', projectId));
  }

  const snapshot = filters.length
    ? await getDocs(query(baseCollection, ...filters))
    : await getDocs(baseCollection);

  console.info(
    `[agenda][appointmentRequests] appointmentRequestsTarget=${APPOINTMENT_REQUESTS_TARGET_FIREBASE_PROJECT_ID} tenant=${tenantSlug ?? '-'} project=${projectId ?? '-'} requestsLoaded=${snapshot.size}`
  );

  return mapQuerySnapshot(snapshot, ({ id, data }) => mapAppointmentRequestDocument(id, data)).sort(
    (left, right) => {
      const leftKey = `${left.requestedDate} ${left.requestedTime}`;
      const rightKey = `${right.requestedDate} ${right.requestedTime}`;
      return leftKey.localeCompare(rightKey, 'pt-BR');
    }
  );
}
