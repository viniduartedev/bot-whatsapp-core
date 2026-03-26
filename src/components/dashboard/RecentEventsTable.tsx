import { formatUnknownDateTime, summarizeUnknownValue } from '../../core/mappers/display';
import type { InboundEvent } from '../../core/entities';
import { DataTable, type DataTableColumn } from '../common/DataTable';
import { EmptyState } from '../common/EmptyState';
import { SectionCard } from '../common/SectionCard';
import { StatusBadge, getInboundEventTone } from '../common/StatusBadge';

interface RecentEventsTableProps {
  events: InboundEvent[];
}

export function RecentEventsTable({ events }: RecentEventsTableProps) {
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
      id: 'metadata',
      header: 'Metadata',
      cell: (event) => (
        <span className="table-note">{summarizeUnknownValue(event.metadata)}</span>
      )
    }
  ];

  return (
    <SectionCard
      title="Eventos Recentes"
      description="Stream operacional dos últimos sinais recebidos do bot e do integrador."
    >
      {events.length === 0 ? (
        <EmptyState
          title="Sem eventos recentes"
          description="Quando novos inbound events chegarem, eles aparecerão aqui para leitura técnica."
        />
      ) : (
        <DataTable
          items={events}
          columns={columns}
          getRowKey={(event) => event.id}
          caption="Tabela de eventos recentes"
        />
      )}
    </SectionCard>
  );
}
