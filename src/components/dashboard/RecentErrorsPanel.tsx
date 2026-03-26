import { formatUnknownDateTime, summarizeUnknownValue } from '../../core/mappers/display';
import type { InboundEvent } from '../../core/entities';
import { EmptyState } from '../common/EmptyState';
import { SectionCard } from '../common/SectionCard';
import { StatusBadge, getInboundEventTone } from '../common/StatusBadge';

interface RecentErrorsPanelProps {
  events: InboundEvent[];
}

export function RecentErrorsPanel({ events }: RecentErrorsPanelProps) {
  return (
    <SectionCard
      title="Erros Recentes"
      description="Eventos em erro para leitura rápida de risco operacional."
    >
      {events.length === 0 ? (
        <EmptyState
          title="Nenhum erro recente"
          description="O fluxo está limpo no momento. Isso deve mudar automaticamente quando novos erros entrarem."
        />
      ) : (
        <div className="event-stack">
          {events.map((event) => (
            <article key={event.id} className="event-stack__item">
              <div className="event-stack__header">
                <strong>{event.eventType}</strong>
                <StatusBadge
                  label={event.status}
                  tone={getInboundEventTone(event.status)}
                />
              </div>
              <p>{summarizeUnknownValue(event.metadata)}</p>
              <span>
                {event.phone || '-'} • {formatUnknownDateTime(event.createdAt)}
              </span>
            </article>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
