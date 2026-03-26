import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import { PROJECT_STATUSES } from '../../core/constants/domain';
import { FIRESTORE_COLLECTIONS } from '../../core/constants/firestoreCollections';
import { mapQuerySnapshot, readEnumValue, readString, readUnknown } from '../../core/mappers/firestore';
import type { Project } from '../../core/entities';
import { db } from '../../firebase/config';

export interface CreateProjectInput {
  name: string;
  slug: string;
  status: Project['status'];
}

function normalizeProjectSlug(slug: string): string {
  return slug.trim().toLowerCase();
}

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

export async function createProject(input: CreateProjectInput): Promise<string> {
  const name = input.name.trim();
  const slug = normalizeProjectSlug(input.slug);

  if (!name || !slug) {
    throw new Error('Informe nome e slug válidos para criar o projeto.');
  }

  const duplicateQuery = query(
    collection(db, FIRESTORE_COLLECTIONS.projects),
    where('slug', '==', slug)
  );
  const duplicateSnapshot = await getDocs(duplicateQuery);

  if (!duplicateSnapshot.empty) {
    throw new Error('Já existe um projeto com este slug.');
  }

  const documentRef = await addDoc(collection(db, FIRESTORE_COLLECTIONS.projects), {
    name,
    slug,
    status: input.status,
    createdAt: serverTimestamp()
  });

  return documentRef.id;
}
