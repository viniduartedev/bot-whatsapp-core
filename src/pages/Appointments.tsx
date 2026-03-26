import { DataTable, type DataTableColumn } from '../components/common/DataTable';
import { EmptyState } from '../components/common/EmptyState';
import { SectionCard } from '../components/common/SectionCard';
import { StatusBadge, getAppointmentTone } from '../components/common/StatusBadge';
import { PageHeader } from '../components/layout/PageHeader';
import { formatUnknownDateTime } from '../core/mappers/display';
import type { Appointment } from '../core/entities';
import { useCollectionQuery } from '../hooks/useCollectionQuery';
import { getAppointments } from '../services/firestore/appointments';

const columns: DataTableColumn<Appointment>[] = [
  {
    id: 'date',
    header: 'Data',
    cell: (appointment) => appointment.date || '-'
  },
  {
    id: 'time',
    header: 'Horário',
    cell: (appointment) => appointment.time || '-'
  },
  {
    id: 'status',
    header: 'Status',
    cell: (appointment) => (
      <StatusBadge label={appointment.status} tone={getAppointmentTone(appointment.status)} />
    )
  },
  {
    id: 'projectId',
    header: 'Projeto',
    cell: (appointment) => appointment.projectId
  },
  {
    id: 'contactId',
    header: 'Contato',
    cell: (appointment) => appointment.contactId
  },
  {
    id: 'requestId',
    header: 'Solicitação',
    cell: (appointment) => appointment.requestId
  },
  {
    id: 'createdAt',
    header: 'Criado em',
    cell: (appointment) => formatUnknownDateTime(appointment.createdAt)
  }
];

export function AppointmentsPage() {
  const { data: appointments, loading, error, refetch } = useCollectionQuery(
    getAppointments,
    'Erro ao carregar agendamentos.'
  );

  return (
    <section className="page-section">
      <PageHeader
        eyebrow="Conversão operacional"
        title="Agendamentos"
        description="Tabela técnica dos appointments gerados a partir das solicitações confirmadas no core."
        actions={
          <button type="button" onClick={() => void refetch()}>
            Atualizar appointments
          </button>
        }
      />

      {loading && <p className="state">Carregando agendamentos...</p>}

      {!loading && error && <p className="state error">Erro ao carregar dados: {error}</p>}

      {!loading && !error && (
        <SectionCard
          title="Appointments table"
          description="Leitura unificada dos agendamentos já materializados pelo core."
        >
          {appointments.length === 0 ? (
            <EmptyState
              title="Nenhum agendamento encontrado"
              description="Os appointments confirmados aparecerão aqui automaticamente."
            />
          ) : (
            <DataTable
              items={appointments}
              columns={columns}
              getRowKey={(appointment) => appointment.id}
              caption="Lista de agendamentos"
            />
          )}
        </SectionCard>
      )}
    </section>
  );
}
