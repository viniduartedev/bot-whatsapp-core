import type {
  AppointmentStatus,
  InboundEventStatus,
  IntegrationEventStatus,
  IntegrationLogStatus,
  ProjectConnectionStatus,
  ProjectStatus,
  ServiceRequestStatus
} from '../../core/constants/domain';

export type StatusBadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

interface StatusBadgeProps {
  label: string;
  tone?: StatusBadgeTone;
}

export function StatusBadge({ label, tone = 'neutral' }: StatusBadgeProps) {
  return <span className={`status-badge status-badge--${tone}`}>{label}</span>;
}

export function getInboundEventTone(status: InboundEventStatus): StatusBadgeTone {
  return status === 'error' ? 'danger' : 'success';
}

export function getServiceRequestTone(status: ServiceRequestStatus): StatusBadgeTone {
  switch (status) {
    case 'novo':
      return 'info';
    case 'em_analise':
      return 'warning';
    case 'confirmado':
      return 'warning';
    case 'integrado':
      return 'success';
    case 'cancelado':
      return 'danger';
    case 'erro_integracao':
      return 'danger';
  }
}

export function getAppointmentTone(status: AppointmentStatus): StatusBadgeTone {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'confirmed':
      return 'success';
    case 'cancelled':
      return 'danger';
    case 'confirmado':
      return 'success';
    case 'reagendado':
      return 'warning';
    case 'cancelado':
      return 'danger';
    case 'concluido':
      return 'info';
    case 'faltou':
      return 'danger';
  }
}

export function getProjectTone(status: ProjectStatus): StatusBadgeTone {
  return status === 'active' ? 'success' : 'neutral';
}

export function getProjectConnectionTone(status: ProjectConnectionStatus): StatusBadgeTone {
  return status === 'active' ? 'success' : 'neutral';
}

export function getIntegrationEventTone(status: IntegrationEventStatus): StatusBadgeTone {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'dispatched':
      return 'info';
    case 'success':
      return 'success';
    case 'error':
      return 'danger';
  }
}

export function getIntegrationLogTone(status: IntegrationLogStatus): StatusBadgeTone {
  switch (status) {
    case 'attempt':
      return 'info';
    case 'success':
      return 'success';
    case 'error':
      return 'danger';
  }
}

export function getHealthTone(
  status: 'online' | 'attention' | 'operational'
): StatusBadgeTone {
  if (status === 'attention') {
    return 'warning';
  }

  return 'success';
}
