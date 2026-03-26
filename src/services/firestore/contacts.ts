import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { CORE_CHANNELS } from '../../core/constants/domain';
import { FIRESTORE_COLLECTIONS } from '../../core/constants/firestoreCollections';
import {
  mapQuerySnapshot,
  readEnumValue,
  readOptionalUnknown,
  readString,
  readUnknown
} from '../../core/mappers/firestore';
import type { Contact } from '../../core/entities';
import { db } from '../../firebase/config';

function mapContactDocument(id: string, data: Record<string, unknown>): Contact {
  const lastInteractionAt = readOptionalUnknown(data, 'lastInteractionAt');

  return {
    id,
    projectId: readString(data, 'projectId'),
    channel: readEnumValue(data, 'channel', CORE_CHANNELS, 'whatsapp'),
    phone: readString(data, 'phone'),
    name: readString(data, 'name'),
    createdAt: readUnknown(data, 'createdAt'),
    ...(lastInteractionAt !== undefined ? { lastInteractionAt } : {})
  };
}

export async function getContacts(projectId?: string): Promise<Contact[]> {
  const baseCollection = collection(db, FIRESTORE_COLLECTIONS.contacts);
  const snapshot = projectId
    ? await getDocs(query(baseCollection, where('projectId', '==', projectId)))
    : await getDocs(baseCollection);

  return mapQuerySnapshot(snapshot, ({ id, data }) => mapContactDocument(id, data)).sort((left, right) =>
    left.name.localeCompare(right.name, 'pt-BR')
  );
}

export async function getContactById(contactId: string): Promise<Contact | null> {
  const snapshot = await getDoc(doc(db, FIRESTORE_COLLECTIONS.contacts, contactId));

  if (!snapshot.exists()) {
    return null;
  }

  return mapContactDocument(snapshot.id, snapshot.data());
}
