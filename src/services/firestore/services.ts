import { collection, getDocs, query, where, type DocumentData } from 'firebase/firestore';
import {
  CORE_CHANNELS,
  SERVICE_REQUEST_TYPES
} from '../../core/constants/domain';
import { FIRESTORE_COLLECTIONS } from '../../core/constants/firestoreCollections';
import {
  mapQuerySnapshot,
  readBoolean,
  readEnumValue,
  readOptionalUnknown,
  readString,
  readUnknown
} from '../../core/mappers/firestore';
import type { Service } from '../../core/entities';
import { BOT_FIREBASE_PROJECT_ID, botDb } from '../../firebase/config';

function readNumber(data: DocumentData, field: string, fallback = 0): number {
  const value = data[field];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function mapServiceDocument(id: string, data: DocumentData): Service {
  const updatedAt = readOptionalUnknown(data, 'updatedAt');

  return {
    id,
    projectId: readString(data, 'projectId'),
    tenantId: readString(data, 'tenantId'),
    tenantSlug: readString(data, 'tenantSlug'),
    key: readString(data, 'key'),
    label: readString(data, 'label'),
    description: readString(data, 'description'),
    channel: readEnumValue(data, 'channel', CORE_CHANNELS, 'whatsapp'),
    type: readEnumValue(data, 'type', SERVICE_REQUEST_TYPES, 'appointment'),
    active: readBoolean(data, 'active', false),
    requiresScheduling: readBoolean(data, 'requiresScheduling', true),
    durationMinutes: readNumber(data, 'durationMinutes'),
    order: readNumber(data, 'order'),
    createdAt: readUnknown(data, 'createdAt'),
    ...(updatedAt !== undefined ? { updatedAt } : {})
  };
}

export async function getActiveServicesByTenant(input: {
  tenantSlug: string;
  projectId?: string;
}): Promise<Service[]> {
  const tenantSlug = input.tenantSlug.trim();
  const projectId = input.projectId?.trim();

  if (!tenantSlug) {
    throw new Error('Informe tenantSlug para carregar serviços do bot.');
  }

  const filters = [
    where('tenantSlug', '==', tenantSlug),
    where('active', '==', true)
  ];

  if (projectId) {
    filters.push(where('projectId', '==', projectId));
  }

  const snapshot = await getDocs(query(collection(botDb, FIRESTORE_COLLECTIONS.services), ...filters));
  const services = mapQuerySnapshot(snapshot, ({ id, data }) => mapServiceDocument(id, data)).sort(
    (left, right) => left.order - right.order || left.label.localeCompare(right.label, 'pt-BR')
  );

  console.info(
    `[bot][services] firebaseProject=${BOT_FIREBASE_PROJECT_ID} tenant=${tenantSlug} project=${projectId ?? '*'} servicesLoaded=${services.length}`
  );

  return services;
}
