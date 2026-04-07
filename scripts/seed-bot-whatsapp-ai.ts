import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { FIRESTORE_COLLECTIONS } from '../src/core/constants/firestoreCollections';
import { buildDefaultBotProfileDraft } from '../src/types/botProfile';

type FirestoreSeedPrimitive = string | number | boolean | null;
type FirestoreSeedValue = FirestoreSeedPrimitive | FirestoreSeedPayload | FirestoreSeedValue[];
type FirestoreSeedPayload = Record<string, FirestoreSeedValue>;

interface SeedDocument {
  collection: string;
  id: string;
  data: FirestoreSeedPayload;
}

const expectedFirebaseProjectId = 'bot-whatsapp-ai-d10ef';
const expectedAgendaFirebaseProjectId = 'agendamento-ai-9fbfb';
const firebaseProjectId =
  process.env.BOT_FIREBASE_PROJECT_ID ??
  process.env.VITE_BOT_FIREBASE_PROJECT_ID ??
  expectedFirebaseProjectId;
const agendaFirebaseProjectId =
  process.env.AGENDAMENTO_FIREBASE_PROJECT_ID ?? expectedAgendaFirebaseProjectId;

if (firebaseProjectId !== expectedFirebaseProjectId) {
  throw new Error(
    `Seed bloqueado: BOT_FIREBASE_PROJECT_ID deve ser ${expectedFirebaseProjectId}, recebido ${firebaseProjectId}.`
  );
}

if (agendaFirebaseProjectId !== expectedAgendaFirebaseProjectId) {
  throw new Error(
    `Seed bloqueado: AGENDAMENTO_FIREBASE_PROJECT_ID deve ser ${expectedAgendaFirebaseProjectId}, recebido ${agendaFirebaseProjectId}.`
  );
}

const now = new Date().toISOString();
const tenantId = 'clinica-devtec';
const tenantSlug = 'clinica-devtec';
const agendaTenantId = 'demo-tenant';
const coreProjectId = 'core-project-clinica-devtec';

const agendaServices = [
  {
    key: 'consulta_avaliacao',
    label: 'Consulta de avaliação'
  },
  {
    key: 'retorno',
    label: 'Retorno'
  },
  {
    key: 'procedimento',
    label: 'Procedimento'
  }
] as const;

const botProfileDraft = buildDefaultBotProfileDraft('Clinica DevTec', 'Clara');
const pilotContactId = 'clinica-devtec-contact-whatsapp-dev';
const pilotServiceRequestId = 'clinica-devtec-service-request-whatsapp-dev';
const pilotSessionId = 'clinica-devtec-session-whatsapp-dev';

const seedDocuments: SeedDocument[] = [
  {
    collection: FIRESTORE_COLLECTIONS.tenants,
    id: tenantId,
    data: {
      name: 'Clinica DevTec',
      slug: tenantSlug,
      status: 'active',
      defaultProjectId: coreProjectId,
      firebaseProjectId,
      conversationSource: firebaseProjectId,
      servicesSource: agendaFirebaseProjectId,
      appointmentsTarget: agendaFirebaseProjectId,
      createdAt: now,
      updatedAt: now
    }
  },
  {
    collection: FIRESTORE_COLLECTIONS.projects,
    id: coreProjectId,
    data: {
      name: 'Clinica DevTec',
      slug: tenantSlug,
      tenantId,
      tenantSlug,
      status: 'active',
      channel: 'whatsapp',
      domain: 'bot-core',
      conversationSource: firebaseProjectId,
      servicesSource: agendaFirebaseProjectId,
      appointmentsTarget: agendaFirebaseProjectId,
      createdAt: now,
      updatedAt: now
    }
  },
  {
    collection: FIRESTORE_COLLECTIONS.botProfiles,
    id: coreProjectId,
    data: {
      projectId: coreProjectId,
      tenantId,
      tenantSlug,
      ...botProfileDraft,
      welcomeMessage:
        'Olá! Aqui é a Clara, assistente virtual da Clinica DevTec. Posso te ajudar com agendamento, horários ou retorno da equipe.',
      closingMessage: 'Recebemos sua solicitação. A equipe da Clinica DevTec vai confirmar os próximos passos.',
      createdAt: now,
      updatedAt: now
    }
  },
  {
    collection: FIRESTORE_COLLECTIONS.projectConnections,
    id: 'project-connection-clinica-devtec-agendamento-dev',
    data: {
      projectId: coreProjectId,
      tenantId,
      tenantSlug,
      connectionType: 'scheduling',
      provider: 'firebase',
      status: 'active',
      targetSystem: 'agendamento-ai',
      targetProjectId: agendaFirebaseProjectId,
      targetTenantId: agendaTenantId,
      environment: 'dev',
      endpointUrl: `firestore://${agendaFirebaseProjectId}/appointments`,
      authTokenEnv: '',
      direction: 'outbound',
      acceptedEventTypes: ['appointment'],
      retryPolicy: {
        maxAttempts: 3,
        backoffSeconds: 30
      },
      createdAt: now,
      updatedAt: now
    }
  },
  {
    collection: FIRESTORE_COLLECTIONS.contacts,
    id: pilotContactId,
    data: {
      projectId: coreProjectId,
      tenantId,
      tenantSlug,
      channel: 'whatsapp',
      phone: '+5511999990000',
      name: 'Contato Dev WhatsApp',
      createdAt: now,
      lastInteractionAt: now
    }
  },
  {
    collection: FIRESTORE_COLLECTIONS.sessions,
    id: pilotSessionId,
    data: {
      projectId: coreProjectId,
      tenantId,
      tenantSlug,
      channel: 'whatsapp',
      phone: '+5511999990000',
      status: 'active',
      currentStep: 'service_selected',
      selectedServiceKey: agendaServices[0].key,
      lastInboundText: '/dev clinica-devtec',
      createdAt: now,
      updatedAt: now
    }
  },
  {
    collection: FIRESTORE_COLLECTIONS.serviceRequests,
    id: pilotServiceRequestId,
    data: {
      projectId: coreProjectId,
      tenantId,
      tenantSlug,
      contactId: pilotContactId,
      sessionId: pilotSessionId,
      type: 'appointment',
      channel: 'whatsapp',
      source: 'whatsapp_dev_command',
      service: {
        key: agendaServices[0].key,
        label: agendaServices[0].label
      },
      requestedDate: '2026-04-08',
      requestedTime: '09:00',
      status: 'novo',
      createdAt: now,
      updatedAt: now
    }
  },
  {
    collection: FIRESTORE_COLLECTIONS.integrationLogs,
    id: 'bootstrap-clinica-devtec',
    data: {
      projectId: coreProjectId,
      tenantId,
      tenantSlug,
      status: 'success',
      source: 'seed-bot-whatsapp-ai',
      message:
        'Seed inicial aplicado para preparar tenant, projeto, perfil do bot e contrato conversacional. Serviços reais permanecem em agendamento-ai.',
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
      arrayValue: value.length
        ? {
            values: value.map((item) => toFirestoreField(item))
          }
        : {}
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
    `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}` +
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

async function main() {
  const accessToken = getAccessToken();

  await Promise.all(seedDocuments.map((document) => upsertDocument(accessToken, document)));

  console.log(
    `Seed bot-whatsapp-ai concluido: ${seedDocuments.length} documentos atualizados para ${tenantSlug} em ${firebaseProjectId}.`
  );
  console.log(
    `Servicos reais para consulta do bot devem vir de ${agendaFirebaseProjectId}: ${agendaServices.map((service) => service.key).join(', ')}.`
  );
}

await main();
