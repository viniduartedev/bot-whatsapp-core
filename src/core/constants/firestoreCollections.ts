/**
 * O core novo usa coleções próprias por entidade.
 * `serviceRequests` permanece na origem conversacional do bot e
 * `appointmentRequests` representa o handoff pendente para a agenda.
 */
export const FIRESTORE_COLLECTIONS = {
  tenants: 'tenants',
  projects: 'projects',
  services: 'services',
  botProfiles: 'botProfiles',
  contacts: 'contacts',
  sessions: 'sessions',
  inboundEvents: 'inboundEvents',
  outboundEvents: 'outboundEvents',
  projectConnections: 'projectConnections',
  serviceRequests: 'serviceRequests',
  integrationEvents: 'integrationEvents',
  integrationLogs: 'integrationLogs',
  appointments: 'appointments',
  appointmentRequests: 'appointmentRequests',
  legacyAppointmentRequests: 'appointmentRequests'
} as const;
