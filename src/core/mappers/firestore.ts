import type { DocumentData, QuerySnapshot } from 'firebase/firestore';

interface FirestoreDocumentContext {
  id: string;
  data: DocumentData;
}

export function mapQuerySnapshot<T>(
  snapshot: QuerySnapshot<DocumentData>,
  mapper: (document: FirestoreDocumentContext) => T
): T[] {
  return snapshot.docs.map((doc) => mapper({ id: doc.id, data: doc.data() }));
}

export function readString(data: DocumentData, field: string, fallback = ''): string {
  const value = data[field];
  return typeof value === 'string' ? value : fallback;
}

export function readUnknown(data: DocumentData, field: string, fallback: unknown = null): unknown {
  return data[field] ?? fallback;
}

export function readOptionalUnknown(data: DocumentData, field: string): unknown | undefined {
  return data[field] === undefined ? undefined : data[field];
}

export function readStringArray(data: DocumentData, field: string): string[] | undefined {
  const value = data[field];

  if (!Array.isArray(value)) {
    return undefined;
  }

  const items = value.filter((item): item is string => typeof item === 'string');
  return items.length === 0 ? undefined : items;
}

function isAllowedValue<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === 'string' && allowed.includes(value as T);
}

export function readEnumValue<T extends string>(
  data: DocumentData,
  field: string,
  allowed: readonly T[],
  fallback: T
): T {
  const value = data[field];
  return isAllowedValue(value, allowed) ? value : fallback;
}
