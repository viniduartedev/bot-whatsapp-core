import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  type FieldValue
} from 'firebase/firestore';
import { canConfirmServiceRequestStatus } from '../constants/domain';
import { FIRESTORE_COLLECTIONS } from '../constants/firestoreCollections';
import { mirrorAppointmentToAgendamentoAi } from '../integrations/agendamentoAi';
import type { IntegrationEvent, IntegrationLog, ServiceRequest } from '../entities';
import {
  APPOINTMENTS_TARGET_FIREBASE_PROJECT_ID,
  CONVERSATION_FIREBASE_PROJECT_ID,
  SERVICES_SOURCE_FIREBASE_PROJECT_ID,
  botDb
} from '../../firebase/config';
import { getContactById } from '../../services/firestore/contacts';
import { getPreferredProjectConnection } from '../../services/firestore/projectConnections';
import {
  getServiceRequestDocumentRef,
  getServiceRequestById,
  mapServiceRequestSnapshot
} from '../../services/firestore/serviceRequests';

export type ConfirmServiceRequestErrorCode =
  | 'invalid-request-id'
  | 'request-not-found'
  | 'invalid-status'
  | 'contact-not-found'
  | 'project-connection-not-found'
  | 'project-connection-invalid'
  | 'integration-dispatch-failed';

export class ConfirmServiceRequestError extends Error {
  constructor(
    public readonly code: ConfirmServiceRequestErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'ConfirmServiceRequestError';
  }
}

interface IntegrationEventWritePayload
  extends Omit<IntegrationEvent, 'id' | 'createdAt' | 'dispatchedAt' | 'completedAt'> {
  createdAt: FieldValue;
}

interface IntegrationLogWritePayload extends Omit<IntegrationLog, 'id' | 'createdAt'> {
  createdAt: FieldValue;
}

interface IntegrationResponseSummary {
  status: number | null;
  body: unknown;
}

function buildIntegrationRequestSummary(serviceRequest: ServiceRequest, contact: {
  id: string;
  name: string;
  phone: string;
}) {
  return {
    serviceRequestId: serviceRequest.id,
    projectId: serviceRequest.projectId,
    ...(serviceRequest.tenantId ? { tenantId: serviceRequest.tenantId } : {}),
    ...(serviceRequest.sessionId ? { sessionId: serviceRequest.sessionId } : {}),
    type: serviceRequest.type,
    channel: serviceRequest.channel,
    requestedDate: serviceRequest.requestedDate,
    requestedTime: serviceRequest.requestedTime,
    tenantSlug: serviceRequest.tenantSlug,
    service: serviceRequest.service,
    source: serviceRequest.source,
    contact: {
      id: contact.id,
      name: contact.name,
      phone: contact.phone
    }
  };
}

function buildIntegrationEventWritePayload(input: {
  serviceRequest: ServiceRequest;
  contactId: string;
  connection: Awaited<ReturnType<typeof getPreferredProjectConnection>>;
  requestSummary: ReturnType<typeof buildIntegrationRequestSummary>;
}): IntegrationEventWritePayload {
  const { serviceRequest, contactId, connection, requestSummary } = input;

  return {
    projectId: serviceRequest.projectId,
    tenantSlug: serviceRequest.tenantSlug,
    serviceRequestId: serviceRequest.id,
    ...(connection ? { connectionId: connection.id } : {}),
    contactId,
    eventType: 'service_request_confirmation',
    direction: 'outbound',
    provider: connection?.provider ?? 'http',
    targetProjectId: connection?.targetProjectId ?? '',
    endpointUrl: connection?.endpointUrl ?? '',
    status: 'pending',
    requestSummary,
    createdAt: serverTimestamp()
  };
}

function buildIntegrationLogWritePayload(input: {
  projectId: string;
  integrationEventId: string;
  serviceRequestId: string;
  connectionId?: string;
  tenantSlug?: string;
  status: IntegrationLog['status'];
  message: string;
  httpStatus?: number;
  payloadSummary?: unknown;
  responseSummary?: unknown;
}): IntegrationLogWritePayload {
  return {
    projectId: input.projectId,
    ...(input.tenantSlug ? { tenantSlug: input.tenantSlug } : {}),
    integrationEventId: input.integrationEventId,
    serviceRequestId: input.serviceRequestId,
    ...(input.connectionId ? { connectionId: input.connectionId } : {}),
    status: input.status,
    attemptNumber: 1,
    message: input.message,
    ...(input.httpStatus !== undefined ? { httpStatus: input.httpStatus } : {}),
    ...(input.payloadSummary !== undefined ? { payloadSummary: input.payloadSummary } : {}),
    ...(input.responseSummary !== undefined ? { responseSummary: input.responseSummary } : {}),
    createdAt: serverTimestamp()
  };
}

async function parseIntegrationResponse(response: Response): Promise<IntegrationResponseSummary> {
  const text = await response.text();

  if (!text) {
    return {
      status: response.status,
      body: null
    };
  }

  try {
    return {
      status: response.status,
      body: JSON.parse(text) as unknown
    };
  } catch {
    return {
      status: response.status,
      body: text
    };
  }
}

async function writeIntegrationLog(payload: IntegrationLogWritePayload): Promise<void> {
  const logRef = doc(collection(botDb, FIRESTORE_COLLECTIONS.integrationLogs));
  await setDoc(logRef, payload);
}

export async function confirmServiceRequest(requestId: string): Promise<void> {
  const normalizedRequestId = requestId.trim();

  if (!normalizedRequestId) {
    throw new ConfirmServiceRequestError(
      'invalid-request-id',
      'Identificador da solicitação inválido.'
    );
  }

  const serviceRequest = await getServiceRequestById(normalizedRequestId);

  if (!serviceRequest) {
    throw new ConfirmServiceRequestError(
      'request-not-found',
      'Solicitação de serviço não encontrada.'
    );
  }

  if (!canConfirmServiceRequestStatus(serviceRequest.status)) {
    throw new ConfirmServiceRequestError(
      'invalid-status',
      'A solicitação só pode ser confirmada quando estiver como nova, em análise ou após erro de integração.'
    );
  }

  const contact = await getContactById(serviceRequest.contactId);

  if (!contact) {
    throw new ConfirmServiceRequestError(
      'contact-not-found',
      'O contato vinculado à solicitação não foi encontrado.'
    );
  }

  const environmentPreference = (import.meta as unknown as { env?: { PROD?: boolean } }).env?.PROD
    ? 'prod'
    : 'dev';

  console.info(
    `[core][confirm] start serviceRequestId=${serviceRequest.id} sessionId=${serviceRequest.sessionId ?? '-'} tenantSlug=${serviceRequest.tenantSlug || '-'} service.key=${serviceRequest.service?.key ?? '-'} service.label=${serviceRequest.service?.label ?? '-'} status=${serviceRequest.status} stage=load`
  );

  const connection = await getPreferredProjectConnection(
    serviceRequest.projectId,
    environmentPreference,
    'scheduling',
    serviceRequest.type
  );
  const requestSummary = buildIntegrationRequestSummary(serviceRequest, contact);
  const serviceRequestRef = getServiceRequestDocumentRef(normalizedRequestId);
  const integrationEventRef = doc(collection(botDb, FIRESTORE_COLLECTIONS.integrationEvents));
  const integrationEventPayload = buildIntegrationEventWritePayload({
    serviceRequest,
    contactId: contact.id,
    connection,
    requestSummary
  });

  await runTransaction(botDb, async (transaction) => {
    const serviceRequestSnapshot = await transaction.get(serviceRequestRef);
    const currentServiceRequest = mapServiceRequestSnapshot(serviceRequestSnapshot);

    if (!currentServiceRequest) {
      throw new ConfirmServiceRequestError(
        'request-not-found',
        'Solicitação de serviço não encontrada.'
      );
    }

    if (!canConfirmServiceRequestStatus(currentServiceRequest.status)) {
      throw new ConfirmServiceRequestError(
        'invalid-status',
        'A solicitação só pode ser confirmada quando estiver como nova, em análise ou após erro de integração.'
      );
    }

    transaction.update(serviceRequestRef, {
      status: 'confirmado',
      confirmedAt: currentServiceRequest.confirmedAt ?? serverTimestamp(),
      lastIntegrationEventId: integrationEventRef.id,
      lastIntegrationError: ''
    });
    transaction.set(integrationEventRef, integrationEventPayload);
  });

  if (!connection) {
    const message =
      'Nenhuma projectConnection outbound ativa foi encontrada para este projeto no ambiente atual.';

    await writeIntegrationLog(
      buildIntegrationLogWritePayload({
        projectId: serviceRequest.projectId,
        tenantSlug: serviceRequest.tenantSlug,
        integrationEventId: integrationEventRef.id,
        serviceRequestId: serviceRequest.id,
        status: 'error',
        message,
        payloadSummary: requestSummary
      })
    );
    await updateDoc(integrationEventRef, {
      status: 'error',
      lastError: message,
      completedAt: serverTimestamp(),
      responseSummary: {
        error: 'missing_connection'
      }
    });
    await updateDoc(serviceRequestRef, {
      status: 'erro_integracao',
      lastIntegrationError: message
    });

    throw new ConfirmServiceRequestError('project-connection-not-found', message);
  }

  const usesFirebaseAgendaMirror =
    connection.provider === 'firebase' &&
    connection.targetProjectId === APPOINTMENTS_TARGET_FIREBASE_PROJECT_ID;

  console.info(
    `[core][confirm] preconditions serviceRequestId=${serviceRequest.id} sessionId=${serviceRequest.sessionId ?? '-'} tenantSlug=${serviceRequest.tenantSlug || '-'} service.key=${serviceRequest.service?.key ?? '-'} service.label=${serviceRequest.service?.label ?? '-'} status=${serviceRequest.status} contactId=${contact.id} contactPhone=${contact.phone || '-'} provider=${connection.provider} connectionId=${connection.id} targetProject=${connection.targetProjectId} targetTenantId=${connection.targetTenantId ?? '-'} usesFirebaseAgendaMirror=${usesFirebaseAgendaMirror}`
  );

  if (!usesFirebaseAgendaMirror && !connection.endpointUrl.trim()) {
    const message = 'A projectConnection ativa não possui endpointUrl configurada.';

    await writeIntegrationLog(
      buildIntegrationLogWritePayload({
        projectId: serviceRequest.projectId,
        tenantSlug: serviceRequest.tenantSlug,
        integrationEventId: integrationEventRef.id,
        serviceRequestId: serviceRequest.id,
        connectionId: connection.id,
        status: 'error',
        message,
        payloadSummary: requestSummary
      })
    );
    await updateDoc(integrationEventRef, {
      status: 'error',
      lastError: message,
      completedAt: serverTimestamp(),
      responseSummary: {
        error: 'missing_endpoint'
      }
    });
    await updateDoc(serviceRequestRef, {
      status: 'erro_integracao',
      lastIntegrationError: message
    });

    throw new ConfirmServiceRequestError('project-connection-invalid', message);
  }

  // Nesta etapa o Core despacha outbound direto do painel para consolidar o
  // fluxo do orquestrador. Quando auth + backend entrarem, este envio deve
  // migrar para um executor server-side para esconder tokens e reforçar o
  // isolamento por tenant.
  const outboundPayload = {
    project: {
      id: serviceRequest.projectId,
      targetProjectId: connection.targetProjectId,
      targetTenantId: connection.targetTenantId ?? null,
      environment: connection.environment
    },
    serviceRequest: requestSummary,
    integration: {
      integrationEventId: integrationEventRef.id,
      connectionId: connection.id,
      connectionType: connection.connectionType,
      provider: connection.provider,
      direction: connection.direction
    }
  };

  console.info(
    `[core][confirm] conversationSource=${CONVERSATION_FIREBASE_PROJECT_ID} servicesSource=${SERVICES_SOURCE_FIREBASE_PROJECT_ID} appointmentsTarget=${APPOINTMENTS_TARGET_FIREBASE_PROJECT_ID} tenant=${serviceRequest.tenantSlug || '-'} service=${serviceRequest.service?.key ?? '-'} provider=${connection.provider} targetProject=${connection.targetProjectId}`
  );

  await writeIntegrationLog(
    buildIntegrationLogWritePayload({
      projectId: serviceRequest.projectId,
      tenantSlug: serviceRequest.tenantSlug,
      integrationEventId: integrationEventRef.id,
      serviceRequestId: serviceRequest.id,
      connectionId: connection.id,
      status: 'attempt',
      message: 'Despacho outbound iniciado pelo Core.',
      payloadSummary: outboundPayload
    })
  );
  await updateDoc(integrationEventRef, {
    status: 'dispatched',
    dispatchedAt: serverTimestamp()
  });

  if (usesFirebaseAgendaMirror) {
    try {
      const appointmentId = await mirrorAppointmentToAgendamentoAi({
        serviceRequest,
        contact,
        connection,
        integrationEventId: integrationEventRef.id
      });
      const responseSummary: IntegrationResponseSummary = {
        status: 200,
        body: {
          mirrored: true,
          appointmentId,
          targetProjectId: APPOINTMENTS_TARGET_FIREBASE_PROJECT_ID
        }
      };

      await writeIntegrationLog(
        buildIntegrationLogWritePayload({
          projectId: serviceRequest.projectId,
          tenantSlug: serviceRequest.tenantSlug,
          integrationEventId: integrationEventRef.id,
          serviceRequestId: serviceRequest.id,
          connectionId: connection.id,
          status: 'success',
          message: 'Appointment espelhado no Firestore operacional agendamento-ai.',
          httpStatus: 200,
          payloadSummary: outboundPayload,
          responseSummary
        })
      );
      await updateDoc(integrationEventRef, {
        status: 'success',
        responseSummary,
        lastError: '',
        completedAt: serverTimestamp()
      });
      await updateDoc(serviceRequestRef, {
        status: 'integrado',
        integratedAt: serverTimestamp(),
        lastIntegrationError: '',
        externalAppointmentId: appointmentId
      });

      return;
    } catch (err) {
      const message =
        err instanceof Error
          ? `Falha ao espelhar appointment para agendamento-ai: ${err.message}`
          : 'Falha desconhecida ao espelhar appointment para agendamento-ai.';

      await writeIntegrationLog(
        buildIntegrationLogWritePayload({
          projectId: serviceRequest.projectId,
          tenantSlug: serviceRequest.tenantSlug,
          integrationEventId: integrationEventRef.id,
          serviceRequestId: serviceRequest.id,
          connectionId: connection.id,
          status: 'error',
          message,
          payloadSummary: outboundPayload,
          responseSummary: {
            error: 'agenda_mirror_failed',
            targetProjectId: APPOINTMENTS_TARGET_FIREBASE_PROJECT_ID
          }
        })
      );
      await updateDoc(integrationEventRef, {
        status: 'error',
        lastError: message,
        completedAt: serverTimestamp(),
        responseSummary: {
          error: 'agenda_mirror_failed',
          targetProjectId: APPOINTMENTS_TARGET_FIREBASE_PROJECT_ID
        }
      });
      await updateDoc(serviceRequestRef, {
        status: 'erro_integracao',
        lastIntegrationError: message
      });

      throw new ConfirmServiceRequestError('integration-dispatch-failed', message);
    }
  }

  try {
    const response = await fetch(connection.endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Core-Project-Id': serviceRequest.projectId,
        'X-Core-Service-Request-Id': serviceRequest.id,
        ...(connection.authToken
          ? {
              Authorization: `Bearer ${connection.authToken}`
            }
          : {})
      },
      body: JSON.stringify(outboundPayload)
    });
    const responseSummary = await parseIntegrationResponse(response);

    if (!response.ok) {
      const failureMessage = `Falha ao integrar com o sistema externo: HTTP ${response.status}.`;

      await writeIntegrationLog(
        buildIntegrationLogWritePayload({
          projectId: serviceRequest.projectId,
          tenantSlug: serviceRequest.tenantSlug,
          integrationEventId: integrationEventRef.id,
          serviceRequestId: serviceRequest.id,
          connectionId: connection.id,
          status: 'error',
          message: failureMessage,
          httpStatus: response.status,
          payloadSummary: outboundPayload,
          responseSummary
        })
      );
      await updateDoc(integrationEventRef, {
        status: 'error',
        lastError: failureMessage,
        responseSummary,
        completedAt: serverTimestamp()
      });
      await updateDoc(serviceRequestRef, {
        status: 'erro_integracao',
        lastIntegrationError: failureMessage
      });

      throw new ConfirmServiceRequestError('integration-dispatch-failed', failureMessage);
    }

    await writeIntegrationLog(
      buildIntegrationLogWritePayload({
        projectId: serviceRequest.projectId,
        tenantSlug: serviceRequest.tenantSlug,
        integrationEventId: integrationEventRef.id,
        serviceRequestId: serviceRequest.id,
        connectionId: connection.id,
        status: 'success',
        message: 'Integração outbound aceita pelo sistema externo.',
        httpStatus: response.status,
        payloadSummary: outboundPayload,
        responseSummary
      })
    );
    await updateDoc(integrationEventRef, {
      status: 'success',
      responseSummary,
      lastError: '',
      completedAt: serverTimestamp()
    });
    await updateDoc(serviceRequestRef, {
      status: 'integrado',
      integratedAt: serverTimestamp(),
      lastIntegrationError: ''
    });
  } catch (err) {
    if (err instanceof ConfirmServiceRequestError) {
      throw err;
    }

    const message =
      err instanceof Error
        ? `Falha ao despachar integração outbound: ${err.message}`
        : 'Falha desconhecida ao despachar integração outbound.';

    await writeIntegrationLog(
      buildIntegrationLogWritePayload({
        projectId: serviceRequest.projectId,
        tenantSlug: serviceRequest.tenantSlug,
        integrationEventId: integrationEventRef.id,
        serviceRequestId: serviceRequest.id,
        connectionId: connection.id,
        status: 'error',
        message,
        payloadSummary: outboundPayload,
        responseSummary: {
          error: 'network_or_runtime_failure'
        }
      })
    );
    await updateDoc(integrationEventRef, {
      status: 'error',
      lastError: message,
      completedAt: serverTimestamp(),
      responseSummary: {
        error: 'network_or_runtime_failure'
      }
    });
    await updateDoc(serviceRequestRef, {
      status: 'erro_integracao',
      lastIntegrationError: message
    });

    throw new ConfirmServiceRequestError('integration-dispatch-failed', message);
  }
}
