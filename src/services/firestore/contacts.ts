import { collection, getDocs } from 'firebase/firestore';
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

export async function getContacts(): Promise<Contact[]> {
  const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.contacts));

  return mapQuerySnapshot(snapshot, ({ id, data }) => {
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
  }).sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'));
}
