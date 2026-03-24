import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { AppointmentRequest } from '../types/appointment';

const COLLECTION_NAME = 'appointmentRequests';

export async function getAppointmentRequests(): Promise<AppointmentRequest[]> {
  const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));

  return querySnapshot.docs.map((doc) => {
    const data = doc.data();

    return {
      id: doc.id,
      phone: data.phone ?? '',
      customerName: data.customerName ?? '',
      requestedDate: data.requestedDate ?? '',
      requestedTime: data.requestedTime ?? '',
      status: data.status ?? 'pending',
      channel: data.channel ?? 'whatsapp',
      source: data.source ?? 'bot',
      createdAt: data.createdAt ?? null
    };
  });
}
