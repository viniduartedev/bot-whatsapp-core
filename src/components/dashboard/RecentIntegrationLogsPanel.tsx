import { formatUnknownDateTime, summarizeUnknownValue } from '../../core/mappers/display';
import type { IntegrationLog } from '../../core/entities';
import { EmptyState } from '../common/EmptyState';
import { SectionCard } from '../common/SectionCard';
import { StatusBadge, getIntegrationLogTone } from '../common/StatusBadge';

interface RecentIntegrationLogsPanelProps {
  logs: IntegrationLog[];
}

export function RecentIntegrationLogsPanel({ logs }: RecentIntegrationLogsPanelProps) {
  return (
    <SectionCard
      title="Falhas de Integração"
      description="Erros recentes do outbound por projeto, com contexto suficiente para troubleshooting."
    >
      {logs.length === 0 ? (
        <EmptyState
          title="Nenhuma falha recente"
          description="As integrações outbound deste projeto estão limpas no momento."
        />
      ) : (
        <div className="event-stack">
          {logs.map((log) => (
            <article key={log.id} className="event-stack__item">
              <div className="event-stack__header">
                <strong>{log.message || 'Falha de integração'}</strong>
                <StatusBadge label={log.status} tone={getIntegrationLogTone(log.status)} />
              </div>
              <p>{summarizeUnknownValue(log.responseSummary ?? log.payloadSummary)}</p>
              <span>
                tentativa {log.attemptNumber} • HTTP {log.httpStatus ?? '-'} •{' '}
                {formatUnknownDateTime(log.createdAt)}
              </span>
            </article>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
