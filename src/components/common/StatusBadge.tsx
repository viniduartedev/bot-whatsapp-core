import type {
  AppointmentStatus,
  InboundEventStatus,
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
      return 'success';
    case 'cancelado':
      return 'danger';
    case 'convertido':
      return 'neutral';
  }
}

export function getAppointmentTone(status: AppointmentStatus): StatusBadgeTone {
  switch (status) {
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

export function getHealthTone(
  status: 'online' | 'attention' | 'operational'
): StatusBadgeTone {
  if (status === 'attention') {
    return 'warning';
  }

  return 'success';
}
