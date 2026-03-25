import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  type DocumentData,
  type DocumentSnapshot,
  where
} from 'firebase/firestore';
import { APPOINTMENT_STATUSES } from '../../core/constants/domain';
import { FIRESTORE_COLLECTIONS } from '../../core/constants/firestoreCollections';
import { mapQuerySnapshot, readEnumValue, readString, readUnknown } from '../../core/mappers/firestore';
import { buildAppointmentIdFromRequestId } from '../../core/constants/identifiers';
import type { Appointment } from '../../core/entities';
import { db } from '../../firebase/config';

function mapAppointmentDocument(id: string, data: DocumentData): Appointment {
  return {
    id,
    projectId: readString(data, 'projectId'),
    requestId: readString(data, 'requestId'),
    contactId: readString(data, 'contactId'),
    date: readString(data, 'date'),
    time: readString(data, 'time'),
    status: readEnumValue(data, 'status', APPOINTMENT_STATUSES, 'confirmado'),
    createdAt: readUnknown(data, 'createdAt')
  };
}

export function mapAppointmentSnapshot(
  snapshot: DocumentSnapshot<DocumentData>
): Appointment | null {
  if (!snapshot.exists()) {
    return null;
  }

  return mapAppointmentDocument(snapshot.id, snapshot.data());
}

export function getAppointmentDocumentRef(appointmentId: string) {
  return doc(db, FIRESTORE_COLLECTIONS.appointments, appointmentId);
}

export function getGeneratedAppointmentDocumentRef(requestId: string) {
  return getAppointmentDocumentRef(buildAppointmentIdFromRequestId(requestId));
}

export async function getAppointments(): Promise<Appointment[]> {
  const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.appointments));

  return mapQuerySnapshot(snapshot, ({ id, data }) => mapAppointmentDocument(id, data)).sort(
    (left, right) => {
      const leftKey = `${left.date} ${left.time}`;
      const rightKey = `${right.date} ${right.time}`;
      return leftKey.localeCompare(rightKey, 'pt-BR');
    }
  );
}

export async function getAppointmentByRequestId(requestId: string): Promise<Appointment | null> {
  const appointmentsQuery = query(
    collection(db, FIRESTORE_COLLECTIONS.appointments),
    where('requestId', '==', requestId),
    limit(1)
  );
  const snapshot = await getDocs(appointmentsQuery);
  const appointmentSnapshot = snapshot.docs[0];

  if (!appointmentSnapshot) {
    return null;
  }

  return mapAppointmentDocument(appointmentSnapshot.id, appointmentSnapshot.data());
}
