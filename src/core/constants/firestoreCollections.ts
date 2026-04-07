/**
 * O core novo usa coleções próprias por entidade. A coleção `appointmentRequests`
 * permanece como legado temporário até que a migração completa para
 * `serviceRequests` seja concluída com segurança.
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
  legacyAppointmentRequests: 'appointmentRequests'
} as const;
