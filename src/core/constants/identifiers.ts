// Os agendamentos gerados a partir do core recebem IDs determinísticos para
// reduzir risco de duplicidade durante esta fase sem backend customizado.
export function buildAppointmentIdFromRequestId(requestId: string): string {
  return `appointment-from-${requestId}`;
}
