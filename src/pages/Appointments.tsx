import { useCallback } from 'react';
import { DataTable, type DataTableColumn } from '../components/common/DataTable';
import { EmptyState } from '../components/common/EmptyState';
import { SectionCard } from '../components/common/SectionCard';
import { StatusBadge, getAppointmentTone } from '../components/common/StatusBadge';
import { PageHeader } from '../components/layout/PageHeader';
import { formatUnknownDateTime } from '../core/mappers/display';
import type { Appointment } from '../core/entities';
import { useProjectContext } from '../context/ProjectContext';
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
    id: 'sourceOfTruth',
    header: 'Fonte de verdade',
    cell: (appointment) => appointment.sourceOfTruth || 'agendamentos-ai'
  },
  {
    id: 'externalReference',
    header: 'Ref. externa',
    cell: (appointment) => appointment.externalReference || '-'
  },
  {
    id: 'lastSyncedAt',
    header: 'Último sync',
    cell: (appointment) => formatUnknownDateTime(appointment.lastSyncedAt)
  },
  {
    id: 'createdAt',
    header: 'Criado em',
    cell: (appointment) => formatUnknownDateTime(appointment.createdAt)
  }
];

export function AppointmentsPage() {
  const { activeProject, activeProjectId } = useProjectContext();
  const { data: appointments, loading, error, refetch } = useCollectionQuery(
    useCallback(
      () => (activeProjectId ? getAppointments(activeProjectId) : Promise.resolve([])),
      [activeProjectId]
    ),
    'Erro ao carregar agendamentos.'
  );

  return (
    <section className="page-section">
      <PageHeader
        eyebrow="Espelho local"
        title="Appointment Mirrors"
        description={
          activeProject
            ? `Espelhos locais do projeto ${activeProject.slug}. O Core pode exibir reflexos operacionais, mas a fonte de verdade continua no sistema externo.`
            : 'Selecione um projeto para visualizar espelhos locais de agendamento.'
        }
        actions={
          <button type="button" onClick={() => void refetch()}>
            Atualizar espelhos
          </button>
        }
      />

      {loading && <p className="state">Carregando espelhos...</p>}

      {!loading && error && <p className="state error">Erro ao carregar dados: {error}</p>}

      {!loading && !error && !activeProject && (
        <SectionCard
          title="Projeto obrigatório"
          description="Os espelhos locais também ficam subordinados ao projeto ativo."
        >
          <EmptyState
            title="Selecione um projeto"
            description="Use o seletor do topo para visualizar os mirrors operacionais do tenant atual."
          />
        </SectionCard>
      )}

      {!loading && !error && activeProject && (
        <SectionCard
          title="Appointment mirrors"
          description="Leitura dos registros locais opcionais. Eles não substituem a confirmação final do sistema externo."
        >
          {appointments.length === 0 ? (
            <EmptyState
              title="Nenhum mirror encontrado"
              description="Os espelhos locais aparecerão aqui apenas quando o Core decidir materializá-los como apoio operacional."
            />
          ) : (
            <DataTable
              items={appointments}
              columns={columns}
              getRowKey={(appointment) => appointment.id}
              caption="Lista de appointment mirrors"
            />
          )}
        </SectionCard>
      )}
    </section>
  );
}
