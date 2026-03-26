import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { FIRESTORE_COLLECTIONS } from '../src/core/constants/firestoreCollections';
import { buildAppointmentIdFromRequestId } from '../src/core/constants/identifiers';

type FirestoreSeedValue = string | number | boolean | null | FirestoreSeedPayload;
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
    createdAt: now
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
    status: 'confirmado',
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
    provider: 'firebase',
    status: 'active',
    targetProjectId: 'agendamentos-ai-dev',
    environment: 'dev',
    createdAt: now
  },
  {
    id: 'core-project-connection-scheduling-prod',
    projectId: demoProjectId,
    connectionType: 'scheduling',
    provider: 'firebase',
    status: 'inactive',
    targetProjectId: 'agendamentos-ai-prod',
    environment: 'prod',
    createdAt: now
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
  {
    collection: FIRESTORE_COLLECTIONS.appointments,
    id: 'core-appointment-carla',
    data: {
      projectId: demoProjectId,
      requestId: demoServiceRequests[2].id,
      contactId: demoContacts[2].id,
      date: '2026-04-04',
      time: '15:00',
      status: 'confirmado',
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
    return { integerValue: value.toString() };
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

  // Quando uma solicitação de teste é confirmada pelo painel, um appointment é
  // gerado automaticamente. Ao reexecutar o seed nós limpamos esses derivados
  // para restaurar o cenário inicial de validação do core.
  const pendingRequestIds = demoServiceRequests
    .filter((request) => request.status !== 'confirmado')
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
      FIRESTORE_COLLECTIONS.contacts,
      FIRESTORE_COLLECTIONS.inboundEvents,
      FIRESTORE_COLLECTIONS.projectConnections,
      FIRESTORE_COLLECTIONS.serviceRequests,
      FIRESTORE_COLLECTIONS.appointments
    ].join(', ')}.`
  );
}

await main();
