import { SectionCard } from '../common/SectionCard';

interface FunnelCardProps {
  inboundEvents: number;
  serviceRequests: number;
  appointments: number;
}

const stages = [
  { key: 'inboundEvents', label: 'Inbound Events' },
  { key: 'serviceRequests', label: 'Service Requests' },
  { key: 'appointments', label: 'Appointments' }
] as const;

export function FunnelCard({
  inboundEvents,
  serviceRequests,
  appointments
}: FunnelCardProps) {
  const values = {
    inboundEvents,
    serviceRequests,
    appointments
  };

  return (
    <SectionCard
      title="Funil Operacional"
      description="Fluxo principal do core do evento bruto até o agendamento convertido."
    >
      <div className="funnel-stages">
        {stages.map((stage, index) => (
          <div key={stage.key} className="funnel-stage">
            <span className="funnel-stage__label">{stage.label}</span>
            <strong className="funnel-stage__value">{values[stage.key]}</strong>
            {index < stages.length - 1 && <span className="funnel-stage__divider">→</span>}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
