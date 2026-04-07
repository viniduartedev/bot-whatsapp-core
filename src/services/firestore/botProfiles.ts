import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData
} from 'firebase/firestore';
import { BOT_PROFILE_TONES } from '../../core/constants/domain';
import { FIRESTORE_COLLECTIONS } from '../../core/constants/firestoreCollections';
import {
  mapQuerySnapshot,
  readBoolean,
  readEnumValue,
  readString,
  readUnknown
} from '../../core/mappers/firestore';
import type { BotProfile } from '../../core/entities';
import { botDb } from '../../firebase/config';
import {
  BOT_MENU_OPTION_KEYS,
  cloneDefaultBotMenuOptions,
  type BotMenuOption,
  type BotMenuOptionKey
} from '../../types/botMenuOption';
import type { BotProfileDraft } from '../../types/botProfile';

export interface CreateBotProfileInput extends BotProfileDraft {
  projectId: string;
}

export type UpdateBotProfileInput = Partial<BotProfileDraft>;

function normalizeProjectId(projectId: string): string {
  return projectId.trim();
}

function isBotMenuOptionKey(value: string): value is BotMenuOptionKey {
  return BOT_MENU_OPTION_KEYS.includes(value as BotMenuOptionKey);
}

function normalizeMenuOptions(rawValue: unknown): BotMenuOption[] {
  const defaults = new Map(
    cloneDefaultBotMenuOptions().map((option) => [option.key, option] as const)
  );

  if (!Array.isArray(rawValue)) {
    return BOT_MENU_OPTION_KEYS.map((key) => ({ ...defaults.get(key)! }));
  }

  rawValue.forEach((item) => {
    if (!item || typeof item !== 'object') {
      return;
    }

    const rawKey = readString(item as DocumentData, 'key');

    if (!isBotMenuOptionKey(rawKey)) {
      return;
    }

    const defaultOption = defaults.get(rawKey)!;
    const label = readString(item as DocumentData, 'label', defaultOption.label).trim();

    defaults.set(rawKey, {
      key: rawKey,
      label: label || defaultOption.label,
      enabled: readBoolean(item as DocumentData, 'enabled', defaultOption.enabled)
    });
  });

  return BOT_MENU_OPTION_KEYS.map((key) => ({ ...defaults.get(key)! }));
}

function mapBotProfileDocument(id: string, data: DocumentData): BotProfile {
  return {
    id,
    projectId: readString(data, 'projectId', id),
    assistantName: readString(data, 'assistantName', 'Clara'),
    businessName: readString(data, 'businessName'),
    welcomeMessage: readString(data, 'welcomeMessage'),
    closingMessage: readString(data, 'closingMessage'),
    tone: readEnumValue(data, 'tone', BOT_PROFILE_TONES, 'professional'),
    active: readBoolean(data, 'active', true),
    menuOptions: normalizeMenuOptions(readUnknown(data, 'menuOptions', [])),
    createdAt: readUnknown(data, 'createdAt'),
    updatedAt: readUnknown(data, 'updatedAt')
  };
}

function validateBotProfileDraft(data: BotProfileDraft): void {
  if (
    !data.assistantName.trim() ||
    !data.businessName.trim() ||
    !data.welcomeMessage.trim() ||
    !data.closingMessage.trim()
  ) {
    throw new Error(
      'Preencha assistantName, businessName, welcomeMessage e closingMessage antes de salvar.'
    );
  }
}

function serializeBotProfileDraft(data: BotProfileDraft) {
  validateBotProfileDraft(data);

  return {
    assistantName: data.assistantName.trim(),
    businessName: data.businessName.trim(),
    welcomeMessage: data.welcomeMessage.trim(),
    closingMessage: data.closingMessage.trim(),
    tone: data.tone,
    active: Boolean(data.active),
    menuOptions: normalizeMenuOptions(data.menuOptions)
  };
}

function serializePartialBotProfileDraft(data: UpdateBotProfileInput) {
  const payload: Record<string, unknown> = {};

  if (data.assistantName !== undefined) {
    const assistantName = data.assistantName.trim();
    if (!assistantName) {
      throw new Error('assistantName não pode ficar vazio.');
    }
    payload.assistantName = assistantName;
  }

  if (data.businessName !== undefined) {
    const businessName = data.businessName.trim();
    if (!businessName) {
      throw new Error('businessName não pode ficar vazio.');
    }
    payload.businessName = businessName;
  }

  if (data.welcomeMessage !== undefined) {
    const welcomeMessage = data.welcomeMessage.trim();
    if (!welcomeMessage) {
      throw new Error('welcomeMessage não pode ficar vazio.');
    }
    payload.welcomeMessage = welcomeMessage;
  }

  if (data.closingMessage !== undefined) {
    const closingMessage = data.closingMessage.trim();
    if (!closingMessage) {
      throw new Error('closingMessage não pode ficar vazio.');
    }
    payload.closingMessage = closingMessage;
  }

  if (data.tone !== undefined) {
    payload.tone = data.tone;
  }

  if (data.active !== undefined) {
    payload.active = Boolean(data.active);
  }

  if (data.menuOptions !== undefined) {
    payload.menuOptions = normalizeMenuOptions(data.menuOptions);
  }

  return payload;
}

export async function getBotProfiles(): Promise<BotProfile[]> {
  const snapshot = await getDocs(collection(botDb, FIRESTORE_COLLECTIONS.botProfiles));

  return mapQuerySnapshot(snapshot, ({ id, data }) => mapBotProfileDocument(id, data)).sort(
    (left, right) =>
      `${left.businessName} ${left.projectId}`.localeCompare(
        `${right.businessName} ${right.projectId}`,
        'pt-BR'
      )
  );
}

// Nesta fase usamos o `projectId` como ID do documento em `botProfiles`.
// Isso evita duplicidade por projeto e mantém o upsert simples para o painel.
export async function getBotProfileByProject(projectId: string): Promise<BotProfile | null> {
  const normalizedProjectId = normalizeProjectId(projectId);

  if (!normalizedProjectId) {
    return null;
  }

  const snapshot = await getDoc(doc(botDb, FIRESTORE_COLLECTIONS.botProfiles, normalizedProjectId));

  if (!snapshot.exists()) {
    return null;
  }

  return mapBotProfileDocument(snapshot.id, snapshot.data());
}

export async function createBotProfile(input: CreateBotProfileInput): Promise<string> {
  const normalizedProjectId = normalizeProjectId(input.projectId);

  if (!normalizedProjectId) {
    throw new Error('Informe um projectId válido para criar o BotProfile.');
  }

  const documentRef = doc(botDb, FIRESTORE_COLLECTIONS.botProfiles, normalizedProjectId);
  const existingProfile = await getDoc(documentRef);

  if (existingProfile.exists()) {
    throw new Error('Já existe um BotProfile para este projeto.');
  }

  await setDoc(documentRef, {
    projectId: normalizedProjectId,
    ...serializeBotProfileDraft(input),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return normalizedProjectId;
}

export async function updateBotProfile(
  id: string,
  data: UpdateBotProfileInput
): Promise<void> {
  const normalizedId = normalizeProjectId(id);

  if (!normalizedId) {
    throw new Error('Informe um BotProfile válido para atualizar.');
  }

  await updateDoc(doc(botDb, FIRESTORE_COLLECTIONS.botProfiles, normalizedId), {
    ...serializePartialBotProfileDraft(data),
    updatedAt: serverTimestamp()
  });
}

export async function upsertBotProfileByProject(
  projectId: string,
  data: BotProfileDraft
): Promise<string> {
  const normalizedProjectId = normalizeProjectId(projectId);

  if (!normalizedProjectId) {
    throw new Error('Informe um projectId válido para salvar o BotProfile.');
  }

  const existingProfile = await getBotProfileByProject(normalizedProjectId);

  if (existingProfile) {
    await updateBotProfile(existingProfile.id, data);
    return existingProfile.id;
  }

  return createBotProfile({
    projectId: normalizedProjectId,
    ...data
  });
}
