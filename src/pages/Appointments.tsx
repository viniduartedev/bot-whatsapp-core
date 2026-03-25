import { DataTable, type DataTableColumn } from '../components/DataTable';
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
    cell: (appointment) => appointment.status
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
      <header className="page-header">
        <div>
          <p className="eyebrow">Entidade derivada</p>
          <h1>Agendamentos</h1>
          <p>
            Os agendamentos representam a conversão operacional de uma{' '}
            <code>serviceRequest</code> em compromisso confirmado.
          </p>
        </div>
        <button type="button" onClick={() => void refetch()}>
          Atualizar
        </button>
      </header>

      {loading && <p className="state">Carregando agendamentos...</p>}

      {!loading && error && <p className="state error">Erro ao carregar dados: {error}</p>}

      {!loading && !error && appointments.length === 0 && (
        <p className="state">Nenhum agendamento encontrado.</p>
      )}

      {!loading && !error && appointments.length > 0 && (
        <DataTable
          items={appointments}
          columns={columns}
          getRowKey={(appointment) => appointment.id}
          caption="Lista de agendamentos"
        />
      )}
    </section>
  );
}
