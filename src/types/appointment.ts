export interface AppointmentRequest {
  id: string;
  phone: string;
  customerName: string;
  requestedDate: string;
  requestedTime: string;
  status: string;
  channel: string;
  source: string;
  createdAt: any; // V1: manter simples; V2+ podemos tipar com Timestamp do Firestore
}
