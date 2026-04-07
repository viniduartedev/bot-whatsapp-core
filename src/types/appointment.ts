import type { AppointmentStatus } from '../core/constants/domain';

export interface AppointmentService {
  key: string;
  label: string;
}

/**
 * `appointments` não é a verdade autoritativa do agendamento no Core.
 * Quando existir, esta coleção representa apenas um espelho operacional local
 * do que foi aceito ou sincronizado com o sistema externo.
 */
export interface Appointment {
  id: string;
  projectId: string;
  tenantId?: string;
  requestId: string;
  contactId: string;
  tenantSlug: string;
  date: string;
  time: string;
  serviceId?: string;
  serviceNameSnapshot?: string;
  service: AppointmentService | null;
  customerName?: string;
  customerPhone?: string;
  status: AppointmentStatus;
  sourceOfTruth?: string;
  integrationEventId?: string;
  externalReference?: string;
  lastSyncedAt?: unknown;
  createdAt: unknown;
}
