import type { FieldValue } from 'firebase/firestore';
import { runTransaction, serverTimestamp } from 'firebase/firestore';
import { canConfirmServiceRequestStatus } from '../constants/domain';
import { buildAppointmentIdFromRequestId } from '../constants/identifiers';
import type { Appointment, ServiceRequest } from '../entities';
import { db } from '../../firebase/config';
import {
  getAppointmentByRequestId,
  getAppointmentDocumentRef
} from '../../services/firestore/appointments';
import {
  getServiceRequestDocumentRef,
  mapServiceRequestSnapshot
} from '../../services/firestore/serviceRequests';

export type ConfirmServiceRequestErrorCode =
  | 'invalid-request-id'
  | 'request-not-found'
  | 'invalid-status'
  | 'appointment-already-exists';

export class ConfirmServiceRequestError extends Error {
  constructor(
    public readonly code: ConfirmServiceRequestErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'ConfirmServiceRequestError';
  }
}

interface AppointmentWritePayload extends Omit<Appointment, 'id' | 'createdAt'> {
  createdAt: FieldValue;
}

function buildAppointmentWritePayload(serviceRequest: ServiceRequest): AppointmentWritePayload {
  // Primeira regra de negócio real do core:
  // `serviceRequests` é a entrada principal e `appointments` representa a
  // conversão da solicitação em um agendamento real. O bot deve escrever aqui
  // futuramente, mas nesta etapa o painel já passa a executar essa regra.
  return {
    projectId: serviceRequest.projectId,
    requestId: serviceRequest.id,
    contactId: serviceRequest.contactId,
    date: serviceRequest.requestedDate,
    time: serviceRequest.requestedTime,
    status: 'confirmado',
    createdAt: serverTimestamp()
  };
}

export async function confirmServiceRequest(requestId: string): Promise<void> {
  const normalizedRequestId = requestId.trim();

  if (!normalizedRequestId) {
    throw new ConfirmServiceRequestError(
      'invalid-request-id',
      'Identificador da solicitação inválido.'
    );
  }

  const existingAppointment = await getAppointmentByRequestId(normalizedRequestId);

  if (existingAppointment) {
    throw new ConfirmServiceRequestError(
      'appointment-already-exists',
      'Esta solicitação já possui um agendamento criado.'
    );
  }

  const serviceRequestRef = getServiceRequestDocumentRef(normalizedRequestId);
  const appointmentRef = getAppointmentDocumentRef(
    buildAppointmentIdFromRequestId(normalizedRequestId)
  );

  await runTransaction(db, async (transaction) => {
    const serviceRequestSnapshot = await transaction.get(serviceRequestRef);
    const serviceRequest = mapServiceRequestSnapshot(serviceRequestSnapshot);

    if (!serviceRequest) {
      throw new ConfirmServiceRequestError(
        'request-not-found',
        'Solicitação de serviço não encontrada.'
      );
    }

    if (!canConfirmServiceRequestStatus(serviceRequest.status)) {
      throw new ConfirmServiceRequestError(
        'invalid-status',
        'A solicitação só pode ser confirmada quando estiver como novo ou em análise.'
      );
    }

    const appointmentSnapshot = await transaction.get(appointmentRef);

    if (appointmentSnapshot.exists()) {
      throw new ConfirmServiceRequestError(
        'appointment-already-exists',
        'Esta solicitação já possui um agendamento criado.'
      );
    }

    transaction.update(serviceRequestRef, {
      status: 'confirmado'
    });
    transaction.set(appointmentRef, buildAppointmentWritePayload(serviceRequest));
  });
}
