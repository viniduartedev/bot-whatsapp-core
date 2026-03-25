// Entidade legada preservada durante a migração gradual para `serviceRequests`.
export interface AppointmentRequest {
  id: string;
  phone: string;
  customerName: string;
  requestedDate: string;
  requestedTime: string;
  status: string;
  channel: string;
  source: string;
  createdAt: unknown;
}
