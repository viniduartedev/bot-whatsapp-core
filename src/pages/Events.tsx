import { DataTable, type DataTableColumn } from '../components/common/DataTable';
import { EmptyState } from '../components/common/EmptyState';
import { SectionCard } from '../components/common/SectionCard';
import {
  StatusBadge,
  getInboundEventTone
} from '../components/common/StatusBadge';
import { MetricCard } from '../components/dashboard/MetricCard';
import { PageHeader } from '../components/layout/PageHeader';
import { formatUnknownDateTime, summarizeUnknownValue } from '../core/mappers/display';
import type { InboundEvent } from '../core/entities';
import { useCollectionQuery } from '../hooks/useCollectionQuery';
import { getInboundEvents } from '../services/firestore/inboundEvents';

export function EventsPage() {
  const { data: events, loading, error, refetch } = useCollectionQuery(
    getInboundEvents,
    'Erro ao carregar eventos.'
  );

  const processedEvents = events.filter((event) => event.status === 'processed').length;
  const errorEvents = events.filter((event) => event.status === 'error').length;
  const lastEvent = events[0];

  const columns: DataTableColumn<InboundEvent>[] = [
    {
      id: 'createdAt',
      header: 'Timestamp',
      cell: (event) => formatUnknownDateTime(event.createdAt)
    },
    {
      id: 'eventType',
      header: 'Event Type',
      cell: (event) => event.eventType || '-'
    },
    {
      id: 'status',
      header: 'Status',
      cell: (event) => (
        <StatusBadge label={event.status} tone={getInboundEventTone(event.status)} />
      )
    },
    {
      id: 'phone',
      header: 'Phone',
      cell: (event) => event.phone || '-'
    },
    {
      id: 'projectId',
      header: 'Project',
      cell: (event) => event.projectId || '-'
    },
    {
      id: 'metadata',
      header: 'Metadata',
      cell: (event) => (
        <span className="table-note">{summarizeUnknownValue(event.metadata)}</span>
      )
    }
  ];

  return (
    <section className="page-section">
      <PageHeader
        eyebrow="Observabilidade"
        title="Stream de eventos"
        description="Visão técnica do tráfego recebido do bot e do integrador, pronta para crescer como um painel de observabilidade."
        actions={
          <button type="button" onClick={() => void refetch()}>
            Atualizar stream
          </button>
        }
      />

      {loading && <p className="state">Carregando inbound events...</p>}

      {!loading && error && <p className="state error">Erro ao carregar dados: {error}</p>}

      {!loading && !error && (
        <>
          <div className="metric-grid metric-grid--compact">
            <MetricCard
              label="Total events"
              value={events.length}
              description="Volume total carregado para leitura operacional."
              tone="info"
            />
            <MetricCard
              label="Processed"
              value={processedEvents}
              description="Eventos concluídos sem erro."
              tone="success"
            />
            <MetricCard
              label="Errors"
              value={errorEvents}
              description="Eventos que exigem atenção."
              tone="danger"
            />
            <MetricCard
              label="Last event"
              value={lastEvent ? 1 : 0}
              description={lastEvent ? formatUnknownDateTime(lastEvent.createdAt) : 'Sem tráfego recente'}
              tone="neutral"
            />
          </div>

          <SectionCard
            title="Inbound Events"
            description="Eventos recentes do ecossistema com foco em leitura rápida e troubleshooting."
          >
            {events.length === 0 ? (
              <EmptyState
                title="Nenhum evento encontrado"
                description="Os inbound events aparecerão aqui assim que o fluxo operacional começar a receber tráfego."
              />
            ) : (
              <DataTable
                items={events}
                columns={columns}
                getRowKey={(event) => event.id}
                caption="Tabela de inbound events"
              />
            )}
          </SectionCard>
        </>
      )}
    </section>
  );
}
