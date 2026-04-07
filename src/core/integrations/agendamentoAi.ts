import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { FIRESTORE_COLLECTIONS } from '../constants/firestoreCollections';
import { buildAppointmentIdFromRequestId } from '../constants/identifiers';
import type { Contact, ServiceRequest } from '../entities';
import {
  AGENDAMENTO_FIREBASE_PROJECT_ID,
  BOT_FIREBASE_PROJECT_ID,
  agendaDb
} from '../../firebase/config';

interface MirrorAppointmentToAgendamentoAiInput {
  serviceRequest: ServiceRequest;
  contact: Contact;
  integrationEventId: string;
}

function assertMirrorableServiceRequest(serviceRequest: ServiceRequest) {
  if (!serviceRequest.tenantSlug.trim()) {
    throw new Error(`serviceRequest ${serviceRequest.id} não possui tenantSlug para mirror.`);
  }

  if (!serviceRequest.service?.key || !serviceRequest.service.label) {
    throw new Error(`serviceRequest ${serviceRequest.id} não possui service.key/service.label.`);
  }
}

export async function mirrorAppointmentToAgendamentoAi(
  input: MirrorAppointmentToAgendamentoAiInput
): Promise<string> {
  const { serviceRequest, contact, integrationEventId } = input;
  assertMirrorableServiceRequest(serviceRequest);

  const appointmentId = buildAppointmentIdFromRequestId(serviceRequest.id);
  const appointmentRef = doc(agendaDb, FIRESTORE_COLLECTIONS.appointments, appointmentId);

  await setDoc(
    appointmentRef,
    {
      projectId: serviceRequest.projectId,
      tenantSlug: serviceRequest.tenantSlug,
      requestId: serviceRequest.id,
      contactId: serviceRequest.contactId,
      date: serviceRequest.requestedDate,
      time: serviceRequest.requestedTime,
      service: {
        key: serviceRequest.service!.key,
        label: serviceRequest.service!.label
      },
      status: 'confirmado',
      sourceOfTruth: 'agendamento-ai',
      integrationEventId,
      externalReference: appointmentId,
      contact: {
        id: contact.id,
        name: contact.name,
        phone: contact.phone
      },
      mirroredFrom: {
        firebaseProjectId: BOT_FIREBASE_PROJECT_ID,
        collection: FIRESTORE_COLLECTIONS.serviceRequests,
        documentId: serviceRequest.id
      },
      lastSyncedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    },
    { merge: true }
  );

  console.info(
    `[core][agenda-sync] appointmentMirrored agendaProject=${AGENDAMENTO_FIREBASE_PROJECT_ID} botProject=${BOT_FIREBASE_PROJECT_ID} tenant=${serviceRequest.tenantSlug} service=${serviceRequest.service!.key} appointmentId=${appointmentId}`
  );

  return appointmentId;
}
