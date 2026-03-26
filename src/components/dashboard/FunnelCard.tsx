import { SectionCard } from '../common/SectionCard';

interface FunnelCardProps {
  inboundEvents: number;
  serviceRequests: number;
  integrationEvents: number;
  integratedRequests: number;
}

const stages = [
  { key: 'inboundEvents', label: 'Inbound Events' },
  { key: 'serviceRequests', label: 'Service Requests' },
  { key: 'integrationEvents', label: 'Integration Events' },
  { key: 'integratedRequests', label: 'Integrated Requests' }
] as const;

export function FunnelCard({
  inboundEvents,
  serviceRequests,
  integrationEvents,
  integratedRequests
}: FunnelCardProps) {
  const values = {
    inboundEvents,
    serviceRequests,
    integrationEvents,
    integratedRequests
  };

  return (
    <SectionCard
      title="Funil Operacional"
      description="Fluxo principal do Core do evento inbound até a integração outbound concluída."
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
