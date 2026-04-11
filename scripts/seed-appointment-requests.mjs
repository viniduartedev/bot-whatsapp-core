import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const projectId = process.env.VITE_FIREBASE_PROJECT_ID;

if (!projectId) {
  throw new Error('Defina VITE_FIREBASE_PROJECT_ID antes de executar o seed.');
}

const sampleRequests = [
  {
    id: 'seed-luiza-souza',
    projectId: 'core-project-clinica-demo',
    tenantId: 'demo-tenant',
    tenantSlug: 'clinica-devtec',
    serviceRequestId: 'core-service-request-luiza',
    contactId: 'core-contact-luiza',
    sessionId: 'core-session-luiza',
    phone: '+5511999990000',
    customerName: 'Luiza Souza',
    requestedDate: '2026-04-15',
    requestedTime: '09:30',
    serviceId: 'consulta_avaliacao',
    serviceNameSnapshot: 'Consulta de avaliação',
    service: {
      key: 'consulta_avaliacao',
      label: 'Consulta de avaliação'
    },
    status: 'pending',
    channel: 'whatsapp',
    source: 'twilio-sandbox',
    createdAt: '2026-03-25T11:00:00.000Z'
  },
  {
    id: 'seed-carlos-andrade',
    projectId: 'core-project-clinica-demo',
    tenantId: 'demo-tenant',
    tenantSlug: 'clinica-devtec',
    serviceRequestId: 'core-service-request-carlos',
    contactId: 'core-contact-carlos',
    sessionId: 'core-session-carlos',
    phone: '+5511988881111',
    customerName: 'Carlos Andrade',
    requestedDate: '2026-04-16',
    requestedTime: '14:00',
    serviceId: 'retorno',
    serviceNameSnapshot: 'Retorno',
    service: {
      key: 'retorno',
      label: 'Retorno'
    },
    status: 'approved',
    channel: 'whatsapp',
    source: 'twilio-sandbox',
    createdAt: '2026-03-25T11:05:00.000Z'
  },
  {
    id: 'seed-mariana-lima',
    projectId: 'core-project-clinica-demo',
    tenantId: 'demo-tenant',
    tenantSlug: 'clinica-devtec',
    serviceRequestId: 'core-service-request-mariana',
    contactId: 'core-contact-mariana',
    sessionId: 'core-session-mariana',
    phone: '+5511977772222',
    customerName: 'Mariana Lima',
    requestedDate: '2026-04-17',
    requestedTime: '16:30',
    serviceId: 'procedimento',
    serviceNameSnapshot: 'Procedimento',
    service: {
      key: 'procedimento',
      label: 'Procedimento'
    },
    status: 'pending',
    channel: 'whatsapp',
    source: 'twilio-sandbox',
    createdAt: '2026-03-25T11:10:00.000Z'
  }
];

function getAccessToken() {
  const configPath = join(homedir(), '.config', 'configstore', 'firebase-tools.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  const accessToken = config.tokens?.access_token;
  const expiresAt = config.tokens?.expires_at;

  if (!accessToken) {
    throw new Error('Nao foi possivel encontrar um access token do Firebase CLI.');
  }

  if (typeof expiresAt === 'number' && expiresAt <= Date.now()) {
    throw new Error('O token do Firebase CLI expirou. Rode um comando do firebase para renovar o login e tente novamente.');
  }

  return accessToken;
}

function toFirestoreFields(request) {
  return {
    projectId: { stringValue: request.projectId },
    tenantId: { stringValue: request.tenantId },
    tenantSlug: { stringValue: request.tenantSlug },
    serviceRequestId: { stringValue: request.serviceRequestId },
    contactId: { stringValue: request.contactId },
    sessionId: { stringValue: request.sessionId },
    phone: { stringValue: request.phone },
    customerName: { stringValue: request.customerName },
    requestedDate: { stringValue: request.requestedDate },
    requestedTime: { stringValue: request.requestedTime },
    serviceId: { stringValue: request.serviceId },
    serviceNameSnapshot: { stringValue: request.serviceNameSnapshot },
    service: {
      mapValue: {
        fields: {
          key: { stringValue: request.service.key },
          label: { stringValue: request.service.label }
        }
      }
    },
    status: { stringValue: request.status },
    channel: { stringValue: request.channel },
    source: { stringValue: request.source },
    createdAt: { stringValue: request.createdAt }
  };
}

async function upsertRequest(accessToken, request) {
  const documentUrl =
    `https://firestore.googleapis.com/v1/projects/${projectId}` +
    `/databases/(default)/documents/appointmentRequests/${request.id}`;

  const response = await fetch(documentUrl, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fields: toFirestoreFields(request)
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Falha ao gravar ${request.id}: ${response.status} ${body}`);
  }
}

async function main() {
  const accessToken = getAccessToken();

  await Promise.all(sampleRequests.map((request) => upsertRequest(accessToken, request)));

  console.log(`Seed concluido com ${sampleRequests.length} solicitacoes em appointmentRequests.`);
}

await main();
