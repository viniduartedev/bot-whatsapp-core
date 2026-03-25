/**
 * O core novo usa coleções próprias por entidade. A coleção `appointmentRequests`
 * permanece como legado temporário até que a migração completa para
 * `serviceRequests` seja concluída com segurança.
 */
export const FIRESTORE_COLLECTIONS = {
  projects: 'projects',
  contacts: 'contacts',
  serviceRequests: 'serviceRequests',
  appointments: 'appointments',
  legacyAppointmentRequests: 'appointmentRequests'
} as const;
