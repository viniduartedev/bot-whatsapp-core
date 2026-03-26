import { formatUnknownDateTime } from '../../core/mappers/display';
import { SectionCard } from '../common/SectionCard';
import { StatusBadge, getHealthTone } from '../common/StatusBadge';

interface HealthStatusCardProps {
  botStatus: 'online' | 'attention';
  integrationStatus: 'operational' | 'attention';
  coreStatus: 'operational' | 'attention';
  lastInboundEventAt: unknown | null;
  lastInboundEventType: string | null;
  lastIntegrationAt: unknown | null;
  message: string;
}

export function HealthStatusCard({
  botStatus,
  integrationStatus,
  coreStatus,
  lastInboundEventAt,
  lastInboundEventType,
  lastIntegrationAt,
  message
}: HealthStatusCardProps) {
  return (
    <SectionCard
      title="Health / Status"
      description="Leitura operacional do projeto ativo para bot, integração outbound e camada orquestradora."
    >
      <div className="health-list">
        <div className="health-item">
          <span>Bot / Entrada</span>
          <StatusBadge label={botStatus} tone={getHealthTone(botStatus)} />
        </div>
        <div className="health-item">
          <span>Integração outbound</span>
          <StatusBadge label={integrationStatus} tone={getHealthTone(integrationStatus)} />
        </div>
        <div className="health-item">
          <span>Core</span>
          <StatusBadge label={coreStatus} tone={getHealthTone(coreStatus)} />
        </div>
        <div className="health-item">
          <span>Último inbound</span>
          <strong>{formatUnknownDateTime(lastInboundEventAt)}</strong>
        </div>
        <div className="health-item">
          <span>Tipo inbound</span>
          <strong>{lastInboundEventType || '-'}</strong>
        </div>
        <div className="health-item">
          <span>Última integração</span>
          <strong>{formatUnknownDateTime(lastIntegrationAt)}</strong>
        </div>
      </div>
      <p className="section-card__message">{message}</p>
    </SectionCard>
  );
}
