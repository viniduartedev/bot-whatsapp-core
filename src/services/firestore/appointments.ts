import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  type DocumentData,
  type DocumentSnapshot,
  where
} from 'firebase/firestore';
import { APPOINTMENT_STATUSES } from '../../core/constants/domain';
import { FIRESTORE_COLLECTIONS } from '../../core/constants/firestoreCollections';
import {
  mapQuerySnapshot,
  readEnumValue,
  readOptionalUnknown,
  readString,
  readUnknown
} from '../../core/mappers/firestore';
import type { Appointment, AppointmentService } from '../../core/entities';
import { AGENDAMENTO_FIREBASE_PROJECT_ID, agendaDb } from '../../firebase/config';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readAppointmentTenantSlug(id: string, data: DocumentData): string {
  const tenantSlug = readString(data, 'tenantSlug').trim() || readString(data, 'tenantId').trim();

  if (!tenantSlug) {
    console.error(`[core] tenantMissing appointmentId=${id}`);
    return '';
  }

  console.log(`[core] tenantReceived=${tenantSlug}`);
  console.log(`[core] tenantPersisted=${tenantSlug}`);
  return tenantSlug;
}

function readAppointmentService(id: string, data: DocumentData): AppointmentService | null {
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
    if (rawService !== undefined || data.serviceId !== undefined || data.serviceNameSnapshot !== undefined) {
      console.error(`[core] serviceInvalid appointmentId=${id}`);
    }

    return null;
  }

  console.log(`[core] servicePersisted=${key}`);

  return {
    key,
    label
  };
}

function mapAppointmentDocument(id: string, data: DocumentData): Appointment {
  const sourceOfTruth = readString(data, 'sourceOfTruth');
  const integrationEventId = readString(data, 'integrationEventId');
  const externalReference = readString(data, 'externalReference');
  const lastSyncedAt = readOptionalUnknown(data, 'lastSyncedAt');
  const tenantSlug = readAppointmentTenantSlug(id, data);
  const service = readAppointmentService(id, data);

  return {
    id,
    projectId: readString(data, 'projectId'),
    requestId: readString(data, 'requestId'),
    contactId: readString(data, 'contactId'),
    tenantSlug,
    date: readString(data, 'date'),
    time: readString(data, 'time'),
    service,
    status: readEnumValue(data, 'status', APPOINTMENT_STATUSES, 'confirmado'),
    ...(sourceOfTruth ? { sourceOfTruth } : {}),
    ...(integrationEventId ? { integrationEventId } : {}),
    ...(externalReference ? { externalReference } : {}),
    ...(lastSyncedAt !== undefined ? { lastSyncedAt } : {}),
    createdAt: readUnknown(data, 'createdAt')
  };
}

export function mapAppointmentSnapshot(
  snapshot: DocumentSnapshot<DocumentData>
): Appointment | null {
  if (!snapshot.exists()) {
    return null;
  }

  return mapAppointmentDocument(snapshot.id, snapshot.data());
}

export function getAppointmentDocumentRef(appointmentId: string) {
  return doc(agendaDb, FIRESTORE_COLLECTIONS.appointments, appointmentId);
}

export async function getAppointments(input?: {
  projectId?: string;
  tenantSlug?: string;
}): Promise<Appointment[]> {
  const baseCollection = collection(agendaDb, FIRESTORE_COLLECTIONS.appointments);
  const filters = [];
  const tenantSlug = input?.tenantSlug?.trim();
  const projectId = input?.projectId?.trim();

  if (tenantSlug) {
    filters.push(where('tenantSlug', '==', tenantSlug));
  } else if (projectId) {
    filters.push(where('projectId', '==', projectId));
  }

  const snapshot = filters.length
    ? await getDocs(query(baseCollection, ...filters))
    : await getDocs(baseCollection);

  console.info(
    `[agenda][appointments] firebaseProject=${AGENDAMENTO_FIREBASE_PROJECT_ID} tenant=${tenantSlug ?? '-'} project=${projectId ?? '-'} appointmentsLoaded=${snapshot.size}`
  );

  return mapQuerySnapshot(snapshot, ({ id, data }) => mapAppointmentDocument(id, data)).sort(
    (left, right) => {
      const leftKey = `${left.date} ${left.time}`;
      const rightKey = `${right.date} ${right.time}`;
      return leftKey.localeCompare(rightKey, 'pt-BR');
    }
  );
}

export async function getAppointmentByRequestId(requestId: string): Promise<Appointment | null> {
  const appointmentsQuery = query(
    collection(agendaDb, FIRESTORE_COLLECTIONS.appointments),
    where('requestId', '==', requestId),
    limit(1)
  );
  const snapshot = await getDocs(appointmentsQuery);
  const appointmentSnapshot = snapshot.docs[0];

  if (!appointmentSnapshot) {
    return null;
  }

  return mapAppointmentDocument(appointmentSnapshot.id, appointmentSnapshot.data());
}

export async function getAppointmentById(appointmentId: string): Promise<Appointment | null> {
  const snapshot = await getDoc(getAppointmentDocumentRef(appointmentId));
  return mapAppointmentSnapshot(snapshot);
}
