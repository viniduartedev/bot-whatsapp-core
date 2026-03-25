import { collection, getDocs } from 'firebase/firestore';
import { FIRESTORE_COLLECTIONS } from '../../core/constants/firestoreCollections';
import { mapQuerySnapshot, readString, readUnknown } from '../../core/mappers/firestore';
import type { AppointmentRequest } from '../../types/appointmentRequest';
import { db } from '../../firebase/config';

// Coleção legada mantida temporariamente até a migração total para `serviceRequests`.
export async function getAppointmentRequests(): Promise<AppointmentRequest[]> {
  const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.legacyAppointmentRequests));

  return mapQuerySnapshot(snapshot, ({ id, data }) => ({
    id,
    phone: readString(data, 'phone'),
    customerName: readString(data, 'customerName'),
    requestedDate: readString(data, 'requestedDate'),
    requestedTime: readString(data, 'requestedTime'),
    status: readString(data, 'status', 'pending'),
    channel: readString(data, 'channel', 'whatsapp'),
    source: readString(data, 'source', 'bot'),
    createdAt: readUnknown(data, 'createdAt')
  }));
}
