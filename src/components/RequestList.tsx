import type { AppointmentRequest } from '../types/appointmentRequest';

interface RequestListProps {
  requests: AppointmentRequest[];
}

export function RequestList({ requests }: RequestListProps) {
  return (
    <ul className="request-list" aria-label="Lista de solicitações">
      {requests.map((request) => (
        <li key={request.id} className="request-card">
          <h3>{request.customerName || 'Cliente não identificado'}</h3>
          <p>
            <strong>Service Request:</strong> {request.serviceRequestId || '-'}
          </p>
          <p>
            <strong>Telefone:</strong> {request.phone || '-'}
          </p>
          <p>
            <strong>Data:</strong> {request.requestedDate || '-'}
          </p>
          <p>
            <strong>Horário:</strong> {request.requestedTime || '-'}
          </p>
          <p>
            <strong>Status:</strong> {request.status || '-'}
          </p>
          <p>
            <strong>Serviço:</strong>{' '}
            {request.service ? `${request.service.label} (${request.service.key})` : '-'}
          </p>
          <p>
            <strong>Tenant:</strong> {request.tenantSlug || '-'}
          </p>
          <p>
            <strong>Canal:</strong> {request.channel || '-'}
          </p>
          <p>
            <strong>Origem:</strong> {request.source || '-'}
          </p>
        </li>
      ))}
    </ul>
  );
}
