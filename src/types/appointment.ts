import type { AppointmentStatus } from '../core/constants/domain';

export interface Appointment {
  id: string;
  projectId: string;
  requestId: string;
  contactId: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  createdAt: unknown;
}
