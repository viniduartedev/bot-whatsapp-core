import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { FIRESTORE_COLLECTIONS } from '../src/core/constants/firestoreCollections';
import { buildAppointmentIdFromRequestId } from '../src/core/constants/identifiers';
import { buildDefaultBotProfileDraft } from '../src/types/botProfile';

type FirestoreSeedPrimitive = string | number | boolean | null;
type FirestoreSeedValue = FirestoreSeedPrimitive | FirestoreSeedPayload | FirestoreSeedValue[];
type FirestoreSeedPayload = Record<string, FirestoreSeedValue>;

interface SeedDocument {
  collection: string;
  id: string;
  data: FirestoreSeedPayload;
}

const projectId = process.env.VITE_FIREBASE_PROJECT_ID;

if (!projectId) {
  throw new Error('Defina VITE_FIREBASE_PROJECT_ID antes de executar o seed do core.');
}

const now = new Date().toISOString();
const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
const fortyMinutesAgo = new Date(Date.now() - 40 * 60 * 1000).toISOString();
const demoProjectId = 'core-project-clinica-demo';
const secondaryProjectId = 'core-project-estudio-demo';

const demoContacts = [
  {
    id: 'core-contact-ana-lima',
    projectId: demoProjectId,
    channel: 'whatsapp',
    phone: '+5511999990001',
    name: 'Ana Lima',
    createdAt: now,
    lastInteractionAt: '2026-03-24T14:20:00.000Z'
  },
  {
    id: 'core-contact-bruno-silva',
    projectId: demoProjectId,
    channel: 'whatsapp',
    phone: '+5511999990002',
    name: 'Bruno Silva',
    createdAt: now,
    lastInteractionAt: '2026-03-25T09:10:00.000Z'
  },
  {
    id: 'core-contact-carla-rocha',
    projectId: demoProjectId,
    channel: 'whatsapp',
    phone: '+5511999990003',
    name: 'Carla Rocha',
    createdAt: now,
    lastInteractionAt: '2026-03-25T13:40:00.000Z'
  },
  {
    id: 'core-contact-diego-souza',
    projectId: demoProjectId,
    channel: 'whatsapp',
    phone: '+5511999990004',
    name: 'Diego Souza',
    createdAt: now,
    lastInteractionAt: '2026-03-25T15:10:00.000Z'
  }
] as const;

const demoServiceRequests = [
  {
    id: 'core-service-request-ana',
    projectId: demoProjectId,
    contactId: demoContacts[0].id,
    type: 'appointment',
    channel: 'whatsapp',
    source: 'painel_seed',
    requestedDate: '2026-04-02',
    requestedTime: '09:00',
    status: 'novo',
    createdAt: now
  },
  {
    id: 'core-service-request-bruno',
    projectId: demoProjectId,
    contactId: demoContacts[1].id,
    type: 'appointment',
    channel: 'whatsapp',
    source: 'painel_seed',
    requestedDate: '2026-04-03',
    requestedTime: '11:30',
    status: 'em_analise',
    createdAt: now
  },
  {
    id: 'core-service-request-carla',
    projectId: demoProjectId,
    contactId: demoContacts[2].id,
    type: 'appointment',
    channel: 'whatsapp',
    source: 'painel_seed',
    requestedDate: '2026-04-04',
    requestedTime: '15:00',
    status: 'integrado',
    confirmedAt: oneHourAgo,
    integratedAt: fortyMinutesAgo,
    lastIntegrationEventId: 'core-integration-event-carla',
    lastIntegrationError: '',
    createdAt: now
  },
  {
    id: 'core-service-request-diego',
    projectId: demoProjectId,
    contactId: demoContacts[3].id,
    type: 'appointment',
    channel: 'whatsapp',
    source: 'painel_seed',
    requestedDate: '2026-04-05',
    requestedTime: '16:15',
    status: 'erro_integracao',
    confirmedAt: '2026-03-25T15:20:00.000Z',
    lastIntegrationEventId: 'core-integration-event-diego',
    lastIntegrationError: 'Falha ao integrar com o sistema externo: HTTP 504.',
    createdAt: now
  }
] as const;

const demoInboundEvents = [
  {
    id: 'core-inbound-event-1',
    projectId: demoProjectId,
    eventType: 'message.received',
    status: 'processed',
    phone: demoContacts[0].phone,
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    metadata: {
      provider: 'twilio-sandbox',
      direction: 'inbound',
      channel: 'whatsapp'
    }
  },
  {
    id: 'core-inbound-event-2',
    projectId: demoProjectId,
    eventType: 'message.received',
    status: 'processed',
    phone: demoContacts[1].phone,
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    metadata: {
      provider: 'twilio-sandbox',
      direction: 'inbound',
      channel: 'whatsapp'
    }
  },
  {
    id: 'core-inbound-event-3',
    projectId: demoProjectId,
    eventType: 'request.created',
    status: 'processed',
    phone: demoContacts[1].phone,
    createdAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    metadata: {
      requestId: demoServiceRequests[1].id,
      source: 'painel_seed'
    }
  },
  {
    id: 'core-inbound-event-4',
    projectId: demoProjectId,
    eventType: 'webhook.delivery',
    status: 'error',
    phone: demoContacts[2].phone,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    metadata: {
      provider: 'twilio-sandbox',
      code: 'DELIVERY_TIMEOUT',
      retryable: true
    }
  }
] as const;

const demoProjectConnections = [
  {
    id: 'core-project-connection-scheduling-dev',
    projectId: demoProjectId,
    connectionType: 'scheduling',
    provider: 'http',
    status: 'active',
    targetProjectId: 'agendamentos-ai-dev',
    environment: 'dev',
    endpointUrl: 'https://agendamentos-ai.example.com/api/core/service-requests',
    authToken: 'dev-token-placeholder',
    direction: 'outbound',
    acceptedEventTypes: ['appointment'],
    retryPolicy: {
      maxAttempts: 3,
      backoffSeconds: 30
    },
    createdAt: now
  },
  {
    id: 'core-project-connection-scheduling-prod',
    projectId: demoProjectId,
    connectionType: 'scheduling',
    provider: 'http',
    status: 'inactive',
    targetProjectId: 'agendamentos-ai-prod',
    environment: 'prod',
    endpointUrl: 'https://agendamentos-ai.example.com/api/core/service-requests',
    authToken: 'prod-token-placeholder',
    direction: 'outbound',
    acceptedEventTypes: ['appointment'],
    retryPolicy: {
      maxAttempts: 3,
      backoffSeconds: 60
    },
    createdAt: now
  }
] as const;

const demoBotProfiles = [
  {
    id: demoProjectId,
    data: {
      projectId: demoProjectId,
      ...buildDefaultBotProfileDraft('Clinica Demo'),
      closingMessage: 'Recebemos sua solicitação e nossa equipe vai confirmar os próximos passos.',
      updatedAt: now,
      createdAt: now
    }
  },
  {
    id: secondaryProjectId,
    data: {
      projectId: secondaryProjectId,
      ...buildDefaultBotProfileDraft('Estudio Demo', 'Lia'),
      tone: 'friendly',
      active: false,
      welcomeMessage: 'Olá! Aqui é a Lia, assistente virtual do Estudio Demo. Como posso ajudar você hoje?',
      closingMessage: 'Assim que este perfil for ativado, o menu principal estará pronto para uso.',
      updatedAt: now,
      createdAt: now
    }
  }
] as const;

const demoIntegrationEvents = [
  {
    id: 'core-integration-event-carla',
    projectId: demoProjectId,
    serviceRequestId: demoServiceRequests[2].id,
    connectionId: demoProjectConnections[0].id,
    contactId: demoContacts[2].id,
    eventType: 'service_request_confirmation',
    direction: 'outbound',
    provider: 'http',
    targetProjectId: demoProjectConnections[0].targetProjectId,
    endpointUrl: demoProjectConnections[0].endpointUrl,
    status: 'success',
    requestSummary: {
      serviceRequestId: demoServiceRequests[2].id,
      requestedDate: demoServiceRequests[2].requestedDate,
      requestedTime: demoServiceRequests[2].requestedTime
    },
    responseSummary: {
      status: 202,
      body: {
        accepted: true,
        externalReference: 'aga-apt-0001'
      }
    },
    dispatchedAt: oneHourAgo,
    completedAt: fortyMinutesAgo,
    createdAt: oneHourAgo
  },
  {
    id: 'core-integration-event-diego',
    projectId: demoProjectId,
    serviceRequestId: demoServiceRequests[3].id,
    connectionId: demoProjectConnections[0].id,
    contactId: demoContacts[3].id,
    eventType: 'service_request_confirmation',
    direction: 'outbound',
    provider: 'http',
    targetProjectId: demoProjectConnections[0].targetProjectId,
    endpointUrl: demoProjectConnections[0].endpointUrl,
    status: 'error',
    requestSummary: {
      serviceRequestId: demoServiceRequests[3].id,
      requestedDate: demoServiceRequests[3].requestedDate,
      requestedTime: demoServiceRequests[3].requestedTime
    },
    responseSummary: {
      status: 504,
      body: {
        accepted: false,
        code: 'UPSTREAM_TIMEOUT'
      }
    },
    lastError: 'Falha ao integrar com o sistema externo: HTTP 504.',
    dispatchedAt: '2026-03-25T15:20:00.000Z',
    completedAt: '2026-03-25T15:21:00.000Z',
    createdAt: '2026-03-25T15:20:00.000Z'
  }
] as const;

const demoIntegrationLogs = [
  {
    id: 'core-integration-log-carla-attempt',
    projectId: demoProjectId,
    integrationEventId: demoIntegrationEvents[0].id,
    serviceRequestId: demoServiceRequests[2].id,
    connectionId: demoProjectConnections[0].id,
    status: 'attempt',
    attemptNumber: 1,
    message: 'Despacho outbound iniciado pelo Core.',
    payloadSummary: {
      targetProjectId: demoProjectConnections[0].targetProjectId,
      serviceRequestId: demoServiceRequests[2].id
    },
    createdAt: oneHourAgo
  },
  {
    id: 'core-integration-log-carla-success',
    projectId: demoProjectId,
    integrationEventId: demoIntegrationEvents[0].id,
    serviceRequestId: demoServiceRequests[2].id,
    connectionId: demoProjectConnections[0].id,
    status: 'success',
    attemptNumber: 1,
    message: 'Integração outbound aceita pelo sistema externo.',
    httpStatus: 202,
    responseSummary: {
      accepted: true,
      externalReference: 'aga-apt-0001'
    },
    createdAt: fortyMinutesAgo
  },
  {
    id: 'core-integration-log-diego-attempt',
    projectId: demoProjectId,
    integrationEventId: demoIntegrationEvents[1].id,
    serviceRequestId: demoServiceRequests[3].id,
    connectionId: demoProjectConnections[0].id,
    status: 'attempt',
    attemptNumber: 1,
    message: 'Despacho outbound iniciado pelo Core.',
    payloadSummary: {
      targetProjectId: demoProjectConnections[0].targetProjectId,
      serviceRequestId: demoServiceRequests[3].id
    },
    createdAt: '2026-03-25T15:20:00.000Z'
  },
  {
    id: 'core-integration-log-diego-error',
    projectId: demoProjectId,
    integrationEventId: demoIntegrationEvents[1].id,
    serviceRequestId: demoServiceRequests[3].id,
    connectionId: demoProjectConnections[0].id,
    status: 'error',
    attemptNumber: 1,
    message: 'Falha ao integrar com o sistema externo: HTTP 504.',
    httpStatus: 504,
    responseSummary: {
      code: 'UPSTREAM_TIMEOUT'
    },
    createdAt: '2026-03-25T15:21:00.000Z'
  }
] as const;

const seedDocuments: SeedDocument[] = [
  {
    collection: FIRESTORE_COLLECTIONS.projects,
    id: demoProjectId,
    data: {
      name: 'Clinica Demo',
      slug: 'clinica-demo',
      status: 'active',
      createdAt: now
    }
  },
  {
    collection: FIRESTORE_COLLECTIONS.projects,
    id: secondaryProjectId,
    data: {
      name: 'Estudio Demo',
      slug: 'estudio-demo',
      status: 'inactive',
      createdAt: now
    }
  },
  ...demoBotProfiles.map((profile) => ({
    collection: FIRESTORE_COLLECTIONS.botProfiles,
    id: profile.id,
    data: { ...profile.data }
  })),
  ...demoContacts.map((contact) => ({
    collection: FIRESTORE_COLLECTIONS.contacts,
    id: contact.id,
    data: { ...contact }
  })),
  ...demoServiceRequests.map((request) => ({
    collection: FIRESTORE_COLLECTIONS.serviceRequests,
    id: request.id,
    data: { ...request }
  })),
  ...demoInboundEvents.map((event) => ({
    collection: FIRESTORE_COLLECTIONS.inboundEvents,
    id: event.id,
    data: { ...event }
  })),
  ...demoProjectConnections.map((connection) => ({
    collection: FIRESTORE_COLLECTIONS.projectConnections,
    id: connection.id,
    data: { ...connection }
  })),
  ...demoIntegrationEvents.map((event) => ({
    collection: FIRESTORE_COLLECTIONS.integrationEvents,
    id: event.id,
    data: { ...event }
  })),
  ...demoIntegrationLogs.map((log) => ({
    collection: FIRESTORE_COLLECTIONS.integrationLogs,
    id: log.id,
    data: { ...log }
  })),
  {
    collection: FIRESTORE_COLLECTIONS.appointments,
    id: 'core-appointment-carla',
    data: {
      projectId: demoProjectId,
      requestId: demoServiceRequests[2].id,
      contactId: demoContacts[2].id,
      tenantSlug: 'clinica-devtec',
      date: '2026-04-04',
      time: '15:00',
      service: {
        key: 'corte',
        label: 'Corte'
      },
      status: 'confirmado',
      sourceOfTruth: 'agendamentos-ai',
      integrationEventId: demoIntegrationEvents[0].id,
      externalReference: 'aga-apt-0001',
      lastSyncedAt: fortyMinutesAgo,
      createdAt: now
    }
  }
];

function getAccessToken() {
  const configPath = join(homedir(), '.config', 'configstore', 'firebase-tools.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8')) as {
    tokens?: {
      access_token?: string;
      expires_at?: number;
    };
  };
  const accessToken = config.tokens?.access_token;
  const expiresAt = config.tokens?.expires_at;

  if (!accessToken) {
    throw new Error('Nao foi possivel encontrar um access token do Firebase CLI.');
  }

  if (typeof expiresAt === 'number' && expiresAt <= Date.now()) {
    throw new Error(
      'O token do Firebase CLI expirou. Rode um comando do firebase para renovar o login e tente novamente.'
    );
  }

  return accessToken;
}

function toFirestoreField(value: FirestoreSeedValue) {
  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map((item) => toFirestoreField(item))
      }
    };
  }

  if (typeof value === 'object' && value !== null) {
    return {
      mapValue: {
        fields: toFirestoreFields(value)
      }
    };
  }

  if (value === null) {
    return { nullValue: null };
  }

  if (typeof value === 'boolean') {
    return { booleanValue: value };
  }

  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? { integerValue: value.toString() }
      : { doubleValue: value };
  }

  return { stringValue: value };
}

function toFirestoreFields(data: FirestoreSeedPayload) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, toFirestoreField(value)])
  );
}

async function upsertDocument(accessToken: string, document: SeedDocument) {
  const documentUrl =
    `https://firestore.googleapis.com/v1/projects/${projectId}` +
    `/databases/(default)/documents/${document.collection}/${document.id}`;

  const response = await fetch(documentUrl, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fields: toFirestoreFields(document.data)
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Falha ao gravar ${document.collection}/${document.id}: ${response.status} ${body}`
    );
  }
}

async function deleteDocument(accessToken: string, collection: string, documentId: string) {
  const documentUrl =
    `https://firestore.googleapis.com/v1/projects/${projectId}` +
    `/databases/(default)/documents/${collection}/${documentId}`;

  const response = await fetch(documentUrl, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (response.status === 404) {
    return;
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Falha ao remover ${collection}/${documentId}: ${response.status} ${body}`);
  }
}

async function main() {
  // Seed exclusivo para desenvolvimento. IDs fixos deixam a operação idempotente,
  // então podemos reexecutar o script sem criar duplicações desnecessárias.
  const accessToken = getAccessToken();

  // O fluxo novo do Core não usa mais `appointments` como verdade autoritativa.
  // Ainda removemos documentos derivados antigos para limpar cenários de teste de
  // fases anteriores da base.
  const pendingRequestIds = demoServiceRequests
    .filter((request) => request.status !== 'integrado')
    .map((request) => request.id);

  await Promise.all(
    pendingRequestIds.map((requestId) =>
      deleteDocument(
        accessToken,
        FIRESTORE_COLLECTIONS.appointments,
        buildAppointmentIdFromRequestId(requestId)
      )
    )
  );

  await Promise.all(seedDocuments.map((document) => upsertDocument(accessToken, document)));

  console.log(
    `Seed do core concluido: ${seedDocuments.length} documentos atualizados em ${[
      FIRESTORE_COLLECTIONS.projects,
      FIRESTORE_COLLECTIONS.botProfiles,
      FIRESTORE_COLLECTIONS.contacts,
      FIRESTORE_COLLECTIONS.inboundEvents,
      FIRESTORE_COLLECTIONS.projectConnections,
      FIRESTORE_COLLECTIONS.serviceRequests,
      FIRESTORE_COLLECTIONS.integrationEvents,
      FIRESTORE_COLLECTIONS.integrationLogs,
      FIRESTORE_COLLECTIONS.appointments
    ].join(', ')}.`
  );
}

await main();
