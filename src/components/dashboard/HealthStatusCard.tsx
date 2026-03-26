import { formatUnknownDateTime } from '../../core/mappers/display';
import { SectionCard } from '../common/SectionCard';
import { StatusBadge, getHealthTone } from '../common/StatusBadge';

interface HealthStatusCardProps {
  botStatus: 'online' | 'attention';
  coreStatus: 'operational' | 'attention';
  lastEventAt: unknown | null;
  lastEventType: string | null;
  message: string;
}

export function HealthStatusCard({
  botStatus,
  coreStatus,
  lastEventAt,
  lastEventType,
  message
}: HealthStatusCardProps) {
  return (
    <SectionCard
      title="Health / Status"
      description="Leitura operacional simples para bot, integrador e fluxo do core."
    >
      <div className="health-list">
        <div className="health-item">
          <span>Bot / Integrador</span>
          <StatusBadge label={botStatus} tone={getHealthTone(botStatus)} />
        </div>
        <div className="health-item">
          <span>Core</span>
          <StatusBadge label={coreStatus} tone={getHealthTone(coreStatus)} />
        </div>
        <div className="health-item">
          <span>Último evento</span>
          <strong>{formatUnknownDateTime(lastEventAt)}</strong>
        </div>
        <div className="health-item">
          <span>Tipo</span>
          <strong>{lastEventType || '-'}</strong>
        </div>
      </div>
      <p className="section-card__message">{message}</p>
    </SectionCard>
  );
}
