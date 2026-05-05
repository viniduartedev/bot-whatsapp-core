import fs from 'node:fs';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const FIRESTORE_COLLECTIONS = {
  contacts: 'contacts',
  projectConnections: 'projectConnections',
  serviceRequests: 'serviceRequests',
  integrationEvents: 'integrationEvents',
  integrationLogs: 'integrationLogs',
  appointments: 'appointments'
};

const SERVICE_REQUEST_STATUSES = [
  'novo',
  'em_analise',
  'confirmado',
  'integrado',
  'cancelado',
  'erro_integracao'
];
const CONFIRMABLE_SERVICE_REQUEST_STATUSES = ['novo', 'em_analise', 'erro_integracao'];
const CORE_CHANNELS = ['whatsapp'];
const SERVICE_REQUEST_TYPES = ['appointment'];
const PROJECT_CONNECTION_TYPES = ['scheduling'];
const PROJECT_CONNECTION_PROVIDERS = ['http', 'firebase'];
const PROJECT_CONNECTION_ENVIRONMENTS = ['dev', 'prod'];
const PROJECT_CONNECTION_DIRECTIONS = ['outbound'];
const PROJECT_CONNECTION_STATUSES = ['active', 'inactive'];

const BOT_FIREBASE_PROJECT_ID = readEnv('BOT_FIREBASE_PROJECT_ID', 'bot-whatsapp-ai-d10ef');
const AGENDA_FIREBASE_PROJECT_ID = readEnv(
  ['AGENDA_FIREBASE_PROJECT_ID', 'AGENDAMENTO_FIREBASE_PROJECT_ID'],
  'agendamento-ai-9fbfb'
);
const CONVERSATION_FIREBASE_PROJECT_ID = BOT_FIREBASE_PROJECT_ID;
const SERVICES_SOURCE_FIREBASE_PROJECT_ID = AGENDA_FIREBASE_PROJECT_ID;
const APPOINTMENTS_TARGET_FIREBASE_PROJECT_ID = AGENDA_FIREBASE_PROJECT_ID;

class ConfirmServiceRequestError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ConfirmServiceRequestError';
    this.code = code;
  }
}

class AlreadyIntegratedResult extends Error {
  constructor(serviceRequest) {
    super('Service request already integrated.');
    this.name = 'AlreadyIntegratedResult';
    this.serviceRequest = serviceRequest;
  }
}

function readEnv(keys, defaultValue = '') {
  const candidates = Array.isArray(keys) ? keys : [keys];

  for (const key of candidates) {
    const value = process.env[key];

    if (value !== undefined && value !== '') {
      return value;
    }
  }

  return defaultValue;
}

function readServiceAccount(prefixes) {
  const normalizedPrefixes = Array.isArray(prefixes) ? prefixes : [prefixes];
  const keyEnvNames = normalizedPrefixes.flatMap((prefix) => [
    `${prefix}_FIREBASE_SERVICE_ACCOUNT_KEY`,
    `${prefix}_FIREBASE_SERVICE_ACCOUNT_JSON`
  ]);
  const pathEnvNames = normalizedPrefixes.map((prefix) => `${prefix}_FIREBASE_SERVICE_ACCOUNT_PATH`);
  const rawKey = readEnv(keyEnvNames);
  const keyPath = readEnv(pathEnvNames);

  if (rawKey) {
    return parseServiceAccount(rawKey);
  }

  if (keyPath) {
    return parseServiceAccount(fs.readFileSync(keyPath, 'utf8'));
  }

  return null;
}

function parseServiceAccount(rawValue) {
  const trimmedValue = rawValue.trim();
  const jsonValue = trimmedValue.startsWith('{')
    ? trimmedValue
    : Buffer.from(trimmedValue, 'base64').toString('utf8');
  const parsed = JSON.parse(jsonValue);

  if (typeof parsed.private_key === 'string') {
    parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
  }

  return parsed;
}

function initializeAdminApp(name, projectId, serviceAccount) {
  const existingApp = getApps().find((app) => app.name === name);

  if (existingApp) {
    return existingApp;
  }

  return initializeApp(
    {
      projectId,
      ...(serviceAccount ? { credential: cert(serviceAccount) } : {})
    },
    name
  );
}

const botApp = initializeAdminApp(
  'bot-whatsapp-ai-admin',
  BOT_FIREBASE_PROJECT_ID,
  readServiceAccount('BOT')
);
const agendaApp = initializeAdminApp(
  'agendamento-ai-admin',
  AGENDA_FIREBASE_PROJECT_ID,
  readServiceAccount(['AGENDA', 'AGENDAMENTO'])
);
const botDb = getFirestore(botApp);
const agendaDb = getFirestore(agendaApp);

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(data, key) {
  const value = data?.[key];
  return typeof value === 'string' ? value : '';
}

function readStringArray(data, key) {
  const value = data?.[key];
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : undefined;
}

function readEnumValue(data, key, allowedValues, fallback) {
  const value = readString(data, key);
  return allowedValues.includes(value) ? value : fallback;
}

function canConfirmServiceRequestStatus(status) {
  return CONFIRMABLE_SERVICE_REQUEST_STATUSES.includes(status);
}

function mapServiceRequestDocument(id, data) {
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
  const tenantSlug = readString(data, 'tenantSlug').trim() || readString(data, 'tenantId').trim();
  const externalAppointmentId = readString(data, 'externalAppointmentId');
  const externalAppointmentRequestId = readString(data, 'externalAppointmentRequestId');

  return {
    id,
    projectId: readString(data, 'projectId'),
    tenantId: readString(data, 'tenantId').trim() || undefined,
    tenantSlug,
    contactId: readString(data, 'contactId'),
    sessionId: readString(data, 'sessionId').trim() || undefined,
    type: readEnumValue(data, 'type', SERVICE_REQUEST_TYPES, 'appointment'),
    channel: readEnumValue(data, 'channel', CORE_CHANNELS, 'whatsapp'),
    source: readString(data, 'source'),
    service: key && label ? { key, label } : null,
    requestedDate: readString(data, 'requestedDate'),
    requestedTime: readString(data, 'requestedTime'),
    status: readEnumValue(data, 'status', SERVICE_REQUEST_STATUSES, 'novo'),
    ...(data.confirmedAt !== undefined ? { confirmedAt: data.confirmedAt } : {}),
    ...(data.integratedAt !== undefined ? { integratedAt: data.integratedAt } : {}),
    ...(readString(data, 'lastIntegrationEventId')
      ? { lastIntegrationEventId: readString(data, 'lastIntegrationEventId') }
      : {}),
    ...(readString(data, 'lastIntegrationError')
      ? { lastIntegrationError: readString(data, 'lastIntegrationError') }
      : {}),
    ...(externalAppointmentRequestId ? { externalAppointmentRequestId } : {}),
    ...(externalAppointmentId ? { externalAppointmentId } : {}),
    createdAt: data.createdAt
  };
}

function mapContactDocument(id, data) {
  return {
    id,
    projectId: readString(data, 'projectId'),
    channel: readEnumValue(data, 'channel', CORE_CHANNELS, 'whatsapp'),
    phone: readString(data, 'phone'),
    name: readString(data, 'name'),
    createdAt: data.createdAt,
    ...(data.lastInteractionAt !== undefined ? { lastInteractionAt: data.lastInteractionAt } : {})
  };
}

function mapProjectConnectionDocument(id, data) {
  return {
    id,
    projectId: readString(data, 'projectId'),
    connectionType: readEnumValue(data, 'connectionType', PROJECT_CONNECTION_TYPES, 'scheduling'),
    provider: readEnumValue(data, 'provider', PROJECT_CONNECTION_PROVIDERS, 'http'),
    status: readEnumValue(data, 'status', PROJECT_CONNECTION_STATUSES, 'inactive'),
    targetProjectId: readString(data, 'targetProjectId'),
    targetTenantId: readString(data, 'targetTenantId').trim() || undefined,
    environment: readEnumValue(data, 'environment', PROJECT_CONNECTION_ENVIRONMENTS, 'dev'),
    endpointUrl: readString(data, 'endpointUrl'),
    authToken: readString(data, 'authToken'),
    direction: readEnumValue(data, 'direction', PROJECT_CONNECTION_DIRECTIONS, 'outbound'),
    acceptedEventTypes: readStringArray(data, 'acceptedEventTypes'),
    retryPolicy: data.retryPolicy,
    createdAt: data.createdAt
  };
}

async function getServiceRequestById(requestId) {
  const snapshot = await botDb
    .collection(FIRESTORE_COLLECTIONS.serviceRequests)
    .doc(requestId)
    .get();

  return snapshot.exists ? mapServiceRequestDocument(snapshot.id, snapshot.data() ?? {}) : null;
}

async function getContactById(contactId) {
  const snapshot = await botDb.collection(FIRESTORE_COLLECTIONS.contacts).doc(contactId).get();

  return snapshot.exists ? mapContactDocument(snapshot.id, snapshot.data() ?? {}) : null;
}

async function getPreferredProjectConnection(
  projectId,
  environmentPreference,
  connectionType = 'scheduling',
  acceptedEventType
) {
  const snapshot = await botDb
    .collection(FIRESTORE_COLLECTIONS.projectConnections)
    .where('projectId', '==', projectId)
    .get();
  const connections = snapshot.docs.map((doc) =>
    mapProjectConnectionDocument(doc.id, doc.data() ?? {})
  );
  const activeConnections = connections.filter(
    (connection) =>
      connection.status === 'active' &&
      connection.direction === 'outbound' &&
      connection.connectionType === connectionType &&
      (!acceptedEventType ||
        !connection.acceptedEventTypes ||
        connection.acceptedEventTypes.length === 0 ||
        connection.acceptedEventTypes.includes(acceptedEventType))
  );
  const preferredConnection = activeConnections.find(
    (connection) => connection.environment === environmentPreference
  );

  return preferredConnection ?? activeConnections[0] ?? null;
}

function buildAppointmentIdFromRequestId(requestId) {
  return `appointment-from-${requestId}`;
}

function normalizeAppointmentDate(value) {
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

function assertValidDateParts(year, month, day, source) {
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

function normalizeAppointmentTime(value) {
  const rawTime = value.trim();

  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(rawTime)) {
    throw new Error(`requestedTime invalido para mirror: "${rawTime}".`);
  }

  return rawTime;
}

function normalizeCustomerPhone(value) {
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

function assertMirrorableServiceRequest(serviceRequest, connection) {
  if (!serviceRequest.tenantSlug.trim()) {
    throw new Error(`serviceRequest ${serviceRequest.id} nao possui tenantSlug para mirror.`);
  }

  if (!connection.targetTenantId?.trim()) {
    throw new Error(
      `projectConnection ${connection.id} nao possui targetTenantId para criar appointment operacional.`
    );
  }

  if (!serviceRequest.service?.key || !serviceRequest.service.label) {
    throw new Error(`serviceRequest ${serviceRequest.id} nao possui service.key/service.label.`);
  }
}

function buildAppointmentWritePayload(input) {
  const { serviceRequest, contact, connection, integrationEventId } = input;
  const serviceKey = serviceRequest.service.key.trim();
  const serviceLabel = serviceRequest.service.label.trim();
  const appointmentId = buildAppointmentIdFromRequestId(serviceRequest.id);
  const customerName = contact.name.trim() || 'Cliente WhatsApp';
  const customerPhone = normalizeCustomerPhone(contact.phone);
  const date = normalizeAppointmentDate(serviceRequest.requestedDate);
  const time = normalizeAppointmentTime(serviceRequest.requestedTime);
  const targetTenantId = connection.targetTenantId.trim();
  const timestamp = FieldValue.serverTimestamp();

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

async function mirrorAppointmentToAgendamentoAi(input) {
  const { serviceRequest, connection } = input;
  assertMirrorableServiceRequest(serviceRequest, connection);

  console.info(
    `[core][mirror] appointmentStart serviceRequestId=${serviceRequest.id} sessionId=${serviceRequest.sessionId ?? '-'} tenantSlug=${serviceRequest.tenantSlug} targetTenantId=${connection.targetTenantId ?? '-'} service.key=${serviceRequest.service.key} service.label=${serviceRequest.service.label} status=${serviceRequest.status} appointmentsTarget=${APPOINTMENTS_TARGET_FIREBASE_PROJECT_ID}`
  );

  const { appointmentId, payload } = buildAppointmentWritePayload(input);
  const appointmentRef = agendaDb.collection(FIRESTORE_COLLECTIONS.appointments).doc(appointmentId);

  console.info(
    `[core][mirror] appointmentPayloadBuilt serviceRequestId=${serviceRequest.id} sessionId=${serviceRequest.sessionId ?? '-'} appointmentId=${appointmentId} tenantSlug=${payload.tenantSlug} tenantId=${payload.tenantId} service.key=${payload.service.key} service.label=${payload.service.label} serviceId=${payload.serviceId} date=${payload.date} time=${payload.time} status=${payload.status} customerPhone=${payload.customerPhone}`
  );

  try {
    await appointmentRef.set(payload, { merge: true });

    console.info(
      `[core][mirror] appointmentWriteSuccess appointmentId=${appointmentId} serviceRequestId=${serviceRequest.id} sessionId=${serviceRequest.sessionId ?? '-'} appointmentsTarget=${APPOINTMENTS_TARGET_FIREBASE_PROJECT_ID} tenantSlug=${serviceRequest.tenantSlug} tenantId=${payload.tenantId} service.key=${payload.service.key} service.label=${payload.service.label}`
    );
    console.info(
      `[core][agenda-sync] appointmentMirrored appointmentsTarget=${APPOINTMENTS_TARGET_FIREBASE_PROJECT_ID} conversationSource=${CONVERSATION_FIREBASE_PROJECT_ID} tenant=${serviceRequest.tenantSlug} service=${serviceRequest.service.key} appointmentId=${appointmentId}`
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

function buildIntegrationRequestSummary(serviceRequest, contact) {
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

function buildIntegrationEventWritePayload({ serviceRequest, contactId, connection, requestSummary }) {
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
    createdAt: FieldValue.serverTimestamp()
  };
}

function buildIntegrationLogWritePayload(input) {
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
    createdAt: FieldValue.serverTimestamp()
  };
}

async function parseIntegrationResponse(response) {
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
      body: JSON.parse(text)
    };
  } catch {
    return {
      status: response.status,
      body: text
    };
  }
}

async function writeIntegrationLog(payload) {
  await botDb.collection(FIRESTORE_COLLECTIONS.integrationLogs).add(payload);
}

async function markDispatchError(input) {
  await writeIntegrationLog(
    buildIntegrationLogWritePayload({
      projectId: input.serviceRequest.projectId,
      tenantSlug: input.serviceRequest.tenantSlug,
      integrationEventId: input.integrationEventRef.id,
      serviceRequestId: input.serviceRequest.id,
      ...(input.connection ? { connectionId: input.connection.id } : {}),
      status: 'error',
      message: input.message,
      payloadSummary: input.payloadSummary,
      responseSummary: input.responseSummary
    })
  );
  await input.integrationEventRef.update({
    status: 'error',
    lastError: input.message,
    completedAt: FieldValue.serverTimestamp(),
    ...(input.responseSummary ? { responseSummary: input.responseSummary } : {})
  });
  await input.serviceRequestRef.update({
    status: 'erro_integracao',
    lastIntegrationError: input.message
  });
}

async function confirmServiceRequest(requestId) {
  const normalizedRequestId = requestId.trim();

  if (!normalizedRequestId) {
    throw new ConfirmServiceRequestError(
      'invalid-request-id',
      'Identificador da solicitacao invalido.'
    );
  }

  const serviceRequest = await getServiceRequestById(normalizedRequestId);

  if (!serviceRequest) {
    throw new ConfirmServiceRequestError(
      'request-not-found',
      'Solicitacao de servico nao encontrada.'
    );
  }

  if (serviceRequest.status === 'integrado') {
    return {
      serviceRequest,
      alreadyIntegrated: true,
      externalAppointmentId:
        serviceRequest.externalAppointmentId ?? buildAppointmentIdFromRequestId(serviceRequest.id)
    };
  }

  if (!canConfirmServiceRequestStatus(serviceRequest.status)) {
    throw new ConfirmServiceRequestError(
      'invalid-status',
      'A solicitacao so pode ser confirmada quando estiver como nova, em analise ou apos erro de integracao.'
    );
  }

  const contact = await getContactById(serviceRequest.contactId);

  if (!contact) {
    throw new ConfirmServiceRequestError(
      'contact-not-found',
      'O contato vinculado a solicitacao nao foi encontrado.'
    );
  }

  const environmentPreference = process.env.VERCEL_ENV === 'production' ? 'prod' : 'dev';

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
  const serviceRequestRef = botDb
    .collection(FIRESTORE_COLLECTIONS.serviceRequests)
    .doc(normalizedRequestId);
  const integrationEventRef = botDb.collection(FIRESTORE_COLLECTIONS.integrationEvents).doc();
  const integrationEventPayload = buildIntegrationEventWritePayload({
    serviceRequest,
    contactId: contact.id,
    connection,
    requestSummary
  });

  await botDb.runTransaction(async (transaction) => {
    const serviceRequestSnapshot = await transaction.get(serviceRequestRef);

    if (!serviceRequestSnapshot.exists) {
      throw new ConfirmServiceRequestError(
        'request-not-found',
        'Solicitacao de servico nao encontrada.'
      );
    }

    const currentServiceRequest = mapServiceRequestDocument(
      serviceRequestSnapshot.id,
      serviceRequestSnapshot.data() ?? {}
    );

    if (currentServiceRequest.status === 'integrado') {
      throw new AlreadyIntegratedResult(currentServiceRequest);
    }

    if (!canConfirmServiceRequestStatus(currentServiceRequest.status)) {
      throw new ConfirmServiceRequestError(
        'invalid-status',
        'A solicitacao so pode ser confirmada quando estiver como nova, em analise ou apos erro de integracao.'
      );
    }

    transaction.update(serviceRequestRef, {
      status: 'confirmado',
      confirmedAt: currentServiceRequest.confirmedAt ?? FieldValue.serverTimestamp(),
      lastIntegrationEventId: integrationEventRef.id,
      lastIntegrationError: ''
    });
    transaction.set(integrationEventRef, integrationEventPayload);
  });

  if (!connection) {
    const message =
      'Nenhuma projectConnection outbound ativa foi encontrada para este projeto no ambiente atual.';

    await markDispatchError({
      serviceRequest,
      serviceRequestRef,
      integrationEventRef,
      message,
      payloadSummary: requestSummary,
      responseSummary: { error: 'missing_connection' }
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
    const message = 'A projectConnection ativa nao possui endpointUrl configurada.';

    await markDispatchError({
      serviceRequest,
      serviceRequestRef,
      integrationEventRef,
      connection,
      message,
      payloadSummary: requestSummary,
      responseSummary: { error: 'missing_endpoint' }
    });

    throw new ConfirmServiceRequestError('project-connection-invalid', message);
  }

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
  await integrationEventRef.update({
    status: 'dispatched',
    dispatchedAt: FieldValue.serverTimestamp()
  });

  if (usesFirebaseAgendaMirror) {
    try {
      const appointmentId = await mirrorAppointmentToAgendamentoAi({
        serviceRequest,
        contact,
        connection,
        integrationEventId: integrationEventRef.id
      });
      const responseSummary = {
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
      await integrationEventRef.update({
        status: 'success',
        responseSummary,
        lastError: '',
        completedAt: FieldValue.serverTimestamp()
      });
      await serviceRequestRef.update({
        status: 'integrado',
        integratedAt: FieldValue.serverTimestamp(),
        lastIntegrationError: '',
        externalAppointmentRequestId: '',
        externalAppointmentId: appointmentId
      });

      console.info(`[core][confirm] serviceRequestIntegrated serviceRequestId=${serviceRequest.id}`);

      return {
        serviceRequest,
        alreadyIntegrated: false,
        externalAppointmentId: appointmentId
      };
    } catch (err) {
      const message =
        err instanceof Error
          ? `Falha ao espelhar appointment para agendamento-ai: ${err.message}`
          : 'Falha desconhecida ao espelhar appointment para agendamento-ai.';

      await markDispatchError({
        serviceRequest,
        serviceRequestRef,
        integrationEventRef,
        connection,
        message,
        payloadSummary: outboundPayload,
        responseSummary: {
          error: 'appointment_mirror_failed',
          targetProjectId: APPOINTMENTS_TARGET_FIREBASE_PROJECT_ID
        }
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
        ...(connection.authToken ? { Authorization: `Bearer ${connection.authToken}` } : {})
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
      await integrationEventRef.update({
        status: 'error',
        lastError: failureMessage,
        responseSummary,
        completedAt: FieldValue.serverTimestamp()
      });
      await serviceRequestRef.update({
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
        message: 'Integracao outbound aceita pelo sistema externo.',
        httpStatus: response.status,
        payloadSummary: outboundPayload,
        responseSummary
      })
    );
    await integrationEventRef.update({
      status: 'success',
      responseSummary,
      lastError: '',
      completedAt: FieldValue.serverTimestamp()
    });
    await serviceRequestRef.update({
      status: 'integrado',
      integratedAt: FieldValue.serverTimestamp(),
      lastIntegrationError: ''
    });

    console.info(`[core][confirm] serviceRequestIntegrated serviceRequestId=${serviceRequest.id}`);

    return {
      serviceRequest,
      alreadyIntegrated: false,
      externalAppointmentId: undefined
    };
  } catch (err) {
    if (err instanceof ConfirmServiceRequestError) {
      throw err;
    }

    const message =
      err instanceof Error
        ? `Falha ao despachar integracao outbound: ${err.message}`
        : 'Falha desconhecida ao despachar integracao outbound.';

    await markDispatchError({
      serviceRequest,
      serviceRequestRef,
      integrationEventRef,
      connection,
      message,
      payloadSummary: outboundPayload,
      responseSummary: { error: 'network_or_runtime_failure' }
    });

    throw new ConfirmServiceRequestError('integration-dispatch-failed', message);
  }
}

function getBearerToken(req) {
  const authorizationHeader = req.headers.authorization ?? req.headers.Authorization ?? '';
  const [scheme, token] = authorizationHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return '';
  }

  return token;
}

function sendJson(res, statusCode, body) {
  res.status(statusCode).json(body);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { ok: false, error: 'method_not_allowed' });
  }

  const serviceRequestId =
    typeof req.body?.serviceRequestId === 'string' ? req.body.serviceRequestId.trim() : '';

  console.info(`[core][api] confirm received serviceRequestId=${serviceRequestId || '-'}`);

  const expectedToken = readEnv('CORE_INTERNAL_TOKEN');
  const receivedToken = getBearerToken(req);
  const tokenValidated = Boolean(expectedToken && receivedToken && receivedToken === expectedToken);

  console.info(`[core][api] tokenValidated=${tokenValidated}`);

  if (!tokenValidated) {
    return sendJson(res, 401, {
      ok: false,
      serviceRequestId,
      error: 'unauthorized'
    });
  }

  if (!serviceRequestId) {
    return sendJson(res, 400, {
      ok: false,
      serviceRequestId,
      error: 'serviceRequestId is required'
    });
  }

  try {
    const result = await confirmServiceRequest(serviceRequestId);

    if (result.alreadyIntegrated) {
      console.info(`[core][api] confirm success serviceRequestId=${serviceRequestId}`);

      return sendJson(res, 200, {
        ok: true,
        alreadyIntegrated: true,
        serviceRequestId,
        externalAppointmentId: result.externalAppointmentId
      });
    }

    console.info(`[core][api] confirm success serviceRequestId=${serviceRequestId}`);

    return sendJson(res, 200, {
      ok: true,
      serviceRequestId,
      status: 'integrado',
      externalAppointmentId: result.externalAppointmentId
    });
  } catch (err) {
    if (err instanceof AlreadyIntegratedResult) {
      const externalAppointmentId =
        err.serviceRequest.externalAppointmentId ??
        buildAppointmentIdFromRequestId(err.serviceRequest.id);

      console.info(`[core][api] confirm success serviceRequestId=${serviceRequestId}`);

      return sendJson(res, 200, {
        ok: true,
        alreadyIntegrated: true,
        serviceRequestId,
        externalAppointmentId
      });
    }

    const message = err instanceof Error ? err.message : String(err);
    const statusCode =
      err instanceof ConfirmServiceRequestError && err.code === 'request-not-found'
        ? 404
        : err instanceof ConfirmServiceRequestError && err.code === 'invalid-request-id'
          ? 400
          : err instanceof ConfirmServiceRequestError && err.code === 'invalid-status'
            ? 409
            : 500;

    console.error(`[core][api] confirm error serviceRequestId=${serviceRequestId} error=${message}`);

    return sendJson(res, statusCode, {
      ok: false,
      serviceRequestId,
      error: message
    });
  }
}
