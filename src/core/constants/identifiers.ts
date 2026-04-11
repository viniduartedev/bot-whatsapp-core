// As solicitações e espelhos gerados a partir do core recebem IDs
// determinísticos para reduzir risco de duplicidade sem backend customizado.
export function buildAppointmentRequestIdFromRequestId(requestId: string): string {
  return `appointment-request-from-${requestId}`;
}

export function buildAppointmentIdFromRequestId(requestId: string): string {
  return `appointment-from-${requestId}`;
}
