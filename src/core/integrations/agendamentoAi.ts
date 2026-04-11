import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { FIRESTORE_COLLECTIONS } from '../constants/firestoreCollections';
import { buildAppointmentIdFromRequestId } from '../constants/identifiers';
import type { Contact, ProjectConnection, ServiceRequest } from '../entities';
import {
  APPOINTMENTS_TARGET_FIREBASE_PROJECT_ID,
  CONVERSATION_FIREBASE_PROJECT_ID,
  agendaDb
} from '../../firebase/config';

interface MirrorAppointmentToAgendamentoAiInput {
  serviceRequest: ServiceRequest;
  contact: Contact;
  connection: ProjectConnection;
  integrationEventId: string;
}

function normalizeAppointmentDate(value: string): string {
  const rawDate = value.trim();
  const isoMatch = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const shortPtBrMatch = rawDate.match(/^(\d{1,2})\/(\d{1,2})$/);

  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return assertValidDateParts(Number(year), Number(month), Number(day), rawDate);
  }

  if (shortPtBrMatch) {
    const [, day, month] = shortPtBrMatch;
    const currentYear = new Date().getFullYear();
    return assertValidDateParts(Number(currentYear), Number(month), Number(day), rawDate);
  }

  throw new Error(`requestedDate invalido para mirror: "${rawDate}".`);
}

function assertValidDateParts(year: number, month: number, day: number, source: string): string {
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  const isValid =
    utcDate.getUTCFullYear() === year &&
    utcDate.getUTCMonth() === month - 1 &&
    utcDate.getUTCDate() === day;

  if (!isValid) {
    throw new Error(`requestedDate invalido para mirror: "${source}".`);
  }

  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day
    .toString()
    .padStart(2, '0')}`;
}

function normalizeAppointmentTime(value: string): string {
  const rawTime = value.trim();

  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(rawTime)) {
    throw new Error(`requestedTime invalido para mirror: "${rawTime}".`);
  }

  return rawTime;
}

function normalizeCustomerPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  const withoutBrazilCountryCode =
    digits.startsWith('55') && (digits.length === 12 || digits.length === 13)
      ? digits.slice(2)
      : digits;

  if (!/^\d{10,15}$/.test(withoutBrazilCountryCode)) {
    throw new Error(`contact.phone invalido para mirror: "${value}".`);
  }

  return withoutBrazilCountryCode;
}

function assertMirrorableServiceRequest(
  serviceRequest: ServiceRequest,
  connection: ProjectConnection
) {
  if (!serviceRequest.tenantSlug.trim()) {
    throw new Error(`serviceRequest ${serviceRequest.id} não possui tenantSlug para mirror.`);
  }

  if (!connection.targetTenantId?.trim()) {
    throw new Error(
      `projectConnection ${connection.id} não possui targetTenantId para criar appointment operacional.`
    );
  }

  if (!serviceRequest.service?.key || !serviceRequest.service.label) {
    throw new Error(`serviceRequest ${serviceRequest.id} não possui service.key/service.label.`);
  }
}

function buildAppointmentWritePayload(input: MirrorAppointmentToAgendamentoAiInput) {
  const { serviceRequest, contact, connection, integrationEventId } = input;
  const serviceKey = serviceRequest.service!.key.trim();
  const serviceLabel = serviceRequest.service!.label.trim();
  const appointmentId = buildAppointmentIdFromRequestId(serviceRequest.id);
  const customerName = contact.name.trim() || 'Cliente WhatsApp';
  const customerPhone = normalizeCustomerPhone(contact.phone);
  const date = normalizeAppointmentDate(serviceRequest.requestedDate);
  const time = normalizeAppointmentTime(serviceRequest.requestedTime);
  const targetTenantId = connection.targetTenantId!.trim();
  const timestamp = serverTimestamp();

  return {
    appointmentId,
    payload: {
      projectId: serviceRequest.projectId,
      tenantId: targetTenantId,
      tenantSlug: serviceRequest.tenantSlug,
      requestId: serviceRequest.id,
      contactId: serviceRequest.contactId,
      firebaseProjectId: CONVERSATION_FIREBASE_PROJECT_ID,
      date,
      time,
      serviceId: serviceKey,
      serviceNameSnapshot: serviceLabel,
      service: {
        key: serviceKey,
        label: serviceLabel
      },
      customerName,
      customerPhone,
      notes: '',
      status: 'pending',
      sourceOfTruth: 'agendamento-ai',
      integrationEventId,
      externalReference: appointmentId,
      contact: {
        id: contact.id,
        name: customerName,
        phone: customerPhone
      },
      mirroredFrom: {
        firebaseProjectId: CONVERSATION_FIREBASE_PROJECT_ID,
        collection: FIRESTORE_COLLECTIONS.serviceRequests,
        documentId: serviceRequest.id
      },
      lastSyncedAt: timestamp,
      updatedAt: timestamp,
      createdAt: timestamp
    }
  };
}

export async function mirrorAppointmentToAgendamentoAi(
  input: MirrorAppointmentToAgendamentoAiInput
): Promise<string> {
  const { serviceRequest, connection } = input;
  assertMirrorableServiceRequest(serviceRequest, connection);

  console.info(
    `[core][mirror] appointmentStart serviceRequestId=${serviceRequest.id} sessionId=${serviceRequest.sessionId ?? '-'} tenantSlug=${serviceRequest.tenantSlug} targetTenantId=${connection.targetTenantId ?? '-'} service.key=${serviceRequest.service!.key} service.label=${serviceRequest.service!.label} status=${serviceRequest.status} appointmentsTarget=${APPOINTMENTS_TARGET_FIREBASE_PROJECT_ID}`
  );

  const { appointmentId, payload } = buildAppointmentWritePayload(input);
  const appointmentRef = doc(agendaDb, FIRESTORE_COLLECTIONS.appointments, appointmentId);

  console.info(
    `[core][mirror] appointmentPayloadBuilt serviceRequestId=${serviceRequest.id} sessionId=${serviceRequest.sessionId ?? '-'} appointmentId=${appointmentId} tenantSlug=${payload.tenantSlug} tenantId=${payload.tenantId} service.key=${payload.service.key} service.label=${payload.service.label} serviceId=${payload.serviceId} date=${payload.date} time=${payload.time} status=${payload.status} customerPhone=${payload.customerPhone}`
  );

  try {
    await setDoc(appointmentRef, payload, { merge: true });

    console.info(
      `[core][mirror] appointmentWriteSuccess serviceRequestId=${serviceRequest.id} sessionId=${serviceRequest.sessionId ?? '-'} appointmentId=${appointmentId} appointmentsTarget=${APPOINTMENTS_TARGET_FIREBASE_PROJECT_ID} tenantSlug=${serviceRequest.tenantSlug} tenantId=${payload.tenantId} service.key=${payload.service.key} service.label=${payload.service.label}`
    );
    console.info(
      `[core][agenda-sync] appointmentMirrored appointmentsTarget=${APPOINTMENTS_TARGET_FIREBASE_PROJECT_ID} conversationSource=${CONVERSATION_FIREBASE_PROJECT_ID} tenant=${serviceRequest.tenantSlug} service=${serviceRequest.service!.key} appointmentId=${appointmentId}`
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    console.error(
      `[core][mirror] appointmentWriteError serviceRequestId=${serviceRequest.id} sessionId=${serviceRequest.sessionId ?? '-'} appointmentId=${appointmentId} appointmentsTarget=${APPOINTMENTS_TARGET_FIREBASE_PROJECT_ID} tenantSlug=${serviceRequest.tenantSlug} tenantId=${payload.tenantId} service.key=${payload.service.key} service.label=${payload.service.label} error=${message}`
    );

    throw err;
  }

  return appointmentId;
}
