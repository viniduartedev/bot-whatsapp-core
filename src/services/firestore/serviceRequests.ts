import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
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
import { CONVERSATION_FIREBASE_PROJECT_ID, botDb } from '../../firebase/config';
import type { AppointmentService } from '../../types/appointment';

export interface CreateBotServiceRequestInput {
  id?: string;
  projectId: string;
  tenantSlug: string;
  contactId: string;
  sessionId?: string;
  service: AppointmentService;
  requestedDate: string;
  requestedTime: string;
  source?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readServiceRequestService(data: DocumentData): ServiceRequest['service'] {
  const rawService = data.service;

  const key = isRecord(rawService)
    ? typeof rawService.key === 'string'
      ? rawService.key.trim()
      : ''
    : readString(data, 'serviceKey').trim();
  const label = isRecord(rawService)
    ? typeof rawService.label === 'string'
      ? rawService.label.trim()
      : ''
    : readString(data, 'serviceLabel').trim();

  if (!key || !label) {
    return null;
  }

  return {
    key,
    label
  };
}

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
  const externalAppointmentRequestId = readString(data, 'externalAppointmentRequestId');
  const externalAppointmentId = readString(data, 'externalAppointmentId');

  return {
    id,
    projectId: readString(data, 'projectId'),
    tenantId: readString(data, 'tenantId').trim() || undefined,
    tenantSlug: readString(data, 'tenantSlug').trim() || readString(data, 'tenantId').trim(),
    contactId: readString(data, 'contactId'),
    sessionId: readString(data, 'sessionId').trim() || undefined,
    type: readEnumValue(data, 'type', SERVICE_REQUEST_TYPES, 'appointment'),
    channel: readEnumValue(data, 'channel', CORE_CHANNELS, 'whatsapp'),
    source: readString(data, 'source'),
    service: readServiceRequestService(data),
    requestedDate: readString(data, 'requestedDate'),
    requestedTime: readString(data, 'requestedTime'),
    status: readEnumValue(data, 'status', SERVICE_REQUEST_STATUSES, 'novo'),
    ...(confirmedAt !== undefined ? { confirmedAt } : {}),
    ...(integratedAt !== undefined ? { integratedAt } : {}),
    ...(lastIntegrationEventId ? { lastIntegrationEventId } : {}),
    ...(lastIntegrationError ? { lastIntegrationError } : {}),
    ...(externalAppointmentRequestId ? { externalAppointmentRequestId } : {}),
    ...(externalAppointmentId ? { externalAppointmentId } : {}),
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
  return doc(botDb, FIRESTORE_COLLECTIONS.serviceRequests, requestId);
}

export async function getServiceRequests(projectId?: string): Promise<ServiceRequest[]> {
  const baseCollection = collection(botDb, FIRESTORE_COLLECTIONS.serviceRequests);
  const snapshot = projectId
    ? await getDocs(query(baseCollection, where('projectId', '==', projectId)))
    : await getDocs(baseCollection);
  console.info(
    `[core][serviceRequests] conversationSource=${CONVERSATION_FIREBASE_PROJECT_ID} project=${projectId ?? '*'} requestsLoaded=${snapshot.size}`
  );

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

export async function createServiceRequestFromBot(
  input: CreateBotServiceRequestInput
): Promise<string> {
  const projectId = input.projectId.trim();
  const tenantSlug = input.tenantSlug.trim();
  const contactId = input.contactId.trim();
  const serviceKey = input.service.key.trim();
  const serviceLabel = input.service.label.trim();

  if (!projectId || !tenantSlug || !contactId || !serviceKey || !serviceLabel) {
    throw new Error(
      'Informe projectId, tenantSlug, contactId e service.key/service.label para criar serviceRequest.'
    );
  }

  const payload = {
    projectId,
    tenantSlug,
    contactId,
    ...(input.sessionId ? { sessionId: input.sessionId.trim() } : {}),
    type: 'appointment',
    channel: 'whatsapp',
    source: input.source?.trim() || 'bot_whatsapp',
    service: {
      key: serviceKey,
      label: serviceLabel
    },
    requestedDate: input.requestedDate.trim(),
    requestedTime: input.requestedTime.trim(),
    status: 'novo',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const documentId = input.id?.trim();
  const documentRef = documentId
    ? doc(botDb, FIRESTORE_COLLECTIONS.serviceRequests, documentId)
    : await addDoc(collection(botDb, FIRESTORE_COLLECTIONS.serviceRequests), payload);

  if (documentId) {
    await setDoc(documentRef, payload, { merge: true });
  }

  console.info(
    `[core][serviceRequest:create] conversationSource=${CONVERSATION_FIREBASE_PROJECT_ID} tenant=${tenantSlug} project=${projectId} service=${serviceKey} requestId=${documentRef.id}`
  );

  return documentRef.id;
}
