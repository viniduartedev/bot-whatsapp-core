import { doc, getDoc, serverTimestamp, setDoc, updateDoc, type DocumentData } from 'firebase/firestore';
import { CORE_CHANNELS } from '../../core/constants/domain';
import { FIRESTORE_COLLECTIONS } from '../../core/constants/firestoreCollections';
import {
  readEnumValue,
  readOptionalUnknown,
  readString,
  readUnknown
} from '../../core/mappers/firestore';
import type { BotSession } from '../../core/entities';
import { BOT_FIREBASE_PROJECT_ID, botDb } from '../../firebase/config';

export interface UpsertBotSessionInput {
  id: string;
  projectId: string;
  tenantSlug: string;
  phone: string;
  currentStep: string;
  selectedServiceKey?: string;
  lastInboundText?: string;
}

function mapBotSessionDocument(id: string, data: DocumentData): BotSession {
  const selectedServiceKey = readString(data, 'selectedServiceKey');
  const lastInboundText = readString(data, 'lastInboundText');

  return {
    id,
    projectId: readString(data, 'projectId'),
    tenantSlug: readString(data, 'tenantSlug'),
    channel: readEnumValue(data, 'channel', CORE_CHANNELS, 'whatsapp'),
    phone: readString(data, 'phone'),
    status: readString(data, 'status', 'active') as BotSession['status'],
    currentStep: readString(data, 'currentStep'),
    ...(selectedServiceKey ? { selectedServiceKey } : {}),
    ...(lastInboundText ? { lastInboundText } : {}),
    createdAt: readOptionalUnknown(data, 'createdAt') ?? null,
    updatedAt: readUnknown(data, 'updatedAt')
  };
}

export function getBotSessionDocumentRef(sessionId: string) {
  return doc(botDb, FIRESTORE_COLLECTIONS.sessions, sessionId);
}

export async function getBotSessionById(sessionId: string): Promise<BotSession | null> {
  const normalizedSessionId = sessionId.trim();

  if (!normalizedSessionId) {
    return null;
  }

  const snapshot = await getDoc(getBotSessionDocumentRef(normalizedSessionId));

  if (!snapshot.exists()) {
    return null;
  }

  return mapBotSessionDocument(snapshot.id, snapshot.data());
}

export async function upsertBotSession(input: UpsertBotSessionInput): Promise<string> {
  const sessionId = input.id.trim();
  const projectId = input.projectId.trim();
  const tenantSlug = input.tenantSlug.trim();

  if (!sessionId || !projectId || !tenantSlug) {
    throw new Error('Informe sessionId, projectId e tenantSlug para persistir a sessão do bot.');
  }

  const documentRef = getBotSessionDocumentRef(sessionId);
  const snapshot = await getDoc(documentRef);
  const payload = {
    projectId,
    tenantSlug,
    channel: 'whatsapp',
    phone: input.phone.trim(),
    status: 'active',
    currentStep: input.currentStep.trim(),
    ...(input.selectedServiceKey ? { selectedServiceKey: input.selectedServiceKey.trim() } : {}),
    ...(input.lastInboundText ? { lastInboundText: input.lastInboundText.trim() } : {}),
    updatedAt: serverTimestamp()
  };

  if (snapshot.exists()) {
    await updateDoc(documentRef, payload);
  } else {
    await setDoc(documentRef, {
      ...payload,
      createdAt: serverTimestamp()
    });
  }

  console.info(
    `[bot][session] firebaseProject=${BOT_FIREBASE_PROJECT_ID} tenant=${tenantSlug} project=${projectId} session=${sessionId} step=${payload.currentStep}`
  );

  return sessionId;
}
