import { collection, getDocs } from 'firebase/firestore';
import { PROJECT_STATUSES } from '../../core/constants/domain';
import { FIRESTORE_COLLECTIONS } from '../../core/constants/firestoreCollections';
import { mapQuerySnapshot, readEnumValue, readString, readUnknown } from '../../core/mappers/firestore';
import type { Project } from '../../core/entities';
import { db } from '../../firebase/config';

export async function getProjects(): Promise<Project[]> {
  const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.projects));

  return mapQuerySnapshot(snapshot, ({ id, data }) => ({
    id,
    name: readString(data, 'name'),
    slug: readString(data, 'slug'),
    status: readEnumValue(data, 'status', PROJECT_STATUSES, 'inactive'),
    createdAt: readUnknown(data, 'createdAt')
  })).sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'));
}
