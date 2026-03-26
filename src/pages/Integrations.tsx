import { useCallback } from 'react';
import { DataTable, type DataTableColumn } from '../components/common/DataTable';
import { EmptyState } from '../components/common/EmptyState';
import { SectionCard } from '../components/common/SectionCard';
import {
  StatusBadge,
  getIntegrationEventTone,
  getIntegrationLogTone,
  getProjectConnectionTone
} from '../components/common/StatusBadge';
import { MetricCard } from '../components/dashboard/MetricCard';
import { PageHeader } from '../components/layout/PageHeader';
import { formatUnknownDateTime, summarizeUnknownValue } from '../core/mappers/display';
import type { IntegrationEvent, IntegrationLog, ProjectConnection } from '../core/entities';
import { useProjectContext } from '../context/ProjectContext';
import { useCollectionQuery } from '../hooks/useCollectionQuery';
import { getIntegrationEvents } from '../services/firestore/integrationEvents';
import { getIntegrationLogs } from '../services/firestore/integrationLogs';
import { getConnectionsByProject } from '../services/firestore/projectConnections';

export function IntegrationsPage() {
  const { activeProject, activeProjectId } = useProjectContext();
  const eventsQuery = useCollectionQuery(
    useCallback(
      () => (activeProjectId ? getIntegrationEvents(activeProjectId) : Promise.resolve([])),
      [activeProjectId]
    ),
    'Erro ao carregar integration events.'
  );
  const logsQuery = useCollectionQuery(
    useCallback(
      () => (activeProjectId ? getIntegrationLogs(activeProjectId) : Promise.resolve([])),
      [activeProjectId]
    ),
    'Erro ao carregar integration logs.'
  );
  const connectionsQuery = useCollectionQuery(
    useCallback(
      () => (activeProjectId ? getConnectionsByProject(activeProjectId) : Promise.resolve([])),
      [activeProjectId]
    ),
    'Erro ao carregar project connections.'
  );

  const loading = eventsQuery.loading || logsQuery.loading || connectionsQuery.loading;
  const error = eventsQuery.error ?? logsQuery.error ?? connectionsQuery.error;
  const integrationEvents = eventsQuery.data;
  const integrationLogs = logsQuery.data;
  const connections = connectionsQuery.data;
  const successEvents = integrationEvents.filter((event) => event.status === 'success').length;
  const errorLogs = integrationLogs.filter((log) => log.status === 'error').length;
  const activeConnections = connections.filter((connection) => connection.status === 'active').length;

  const eventColumns: DataTableColumn<IntegrationEvent>[] = [
    {
      id: 'createdAt',
      header: 'Criado em',
      cell: (event) => formatUnknownDateTime(event.createdAt)
    },
    {
      id: 'eventType',
      header: 'Tipo',
      cell: (event) => event.eventType
    },
    {
      id: 'status',
      header: 'Status',
      cell: (event) => (
        <StatusBadge label={event.status} tone={getIntegrationEventTone(event.status)} />
      )
    },
    {
      id: 'targetProjectId',
      header: 'Target',
      cell: (event) => event.targetProjectId || '-'
    },
    {
      id: 'serviceRequestId',
      header: 'Service Request',
      cell: (event) => event.serviceRequestId
    },
    {
      id: 'endpointUrl',
      header: 'Endpoint',
      cell: (event) => event.endpointUrl || '-'
    },
    {
      id: 'lastError',
      header: 'Erro',
      cell: (event) => event.lastError || '-'
    }
  ];

  const logColumns: DataTableColumn<IntegrationLog>[] = [
    {
      id: 'createdAt',
      header: 'Criado em',
      cell: (log) => formatUnknownDateTime(log.createdAt)
    },
    {
      id: 'status',
      header: 'Status',
      cell: (log) => <StatusBadge label={log.status} tone={getIntegrationLogTone(log.status)} />
    },
    {
      id: 'attemptNumber',
      header: 'Tentativa',
      cell: (log) => log.attemptNumber
    },
    {
      id: 'message',
      header: 'Mensagem',
      cell: (log) => log.message || '-'
    },
    {
      id: 'httpStatus',
      header: 'HTTP',
      cell: (log) => log.httpStatus ?? '-'
    },
    {
      id: 'serviceRequestId',
      header: 'Service Request',
      cell: (log) => log.serviceRequestId
    },
    {
      id: 'responseSummary',
      header: 'Resumo',
      cell: (log) => (
        <span className="table-note">
          {summarizeUnknownValue(log.responseSummary ?? log.payloadSummary)}
        </span>
      )
    }
  ];

  const connectionColumns: DataTableColumn<ProjectConnection>[] = [
    {
      id: 'connectionType',
      header: 'Tipo',
      cell: (connection) => connection.connectionType
    },
    {
      id: 'provider',
      header: 'Provider',
      cell: (connection) => connection.provider
    },
    {
      id: 'status',
      header: 'Status',
      cell: (connection) => (
        <StatusBadge
          label={connection.status}
          tone={getProjectConnectionTone(connection.status)}
        />
      )
    },
    {
      id: 'environment',
      header: 'Ambiente',
      cell: (connection) => connection.environment
    },
    {
      id: 'targetProjectId',
      header: 'Target',
      cell: (connection) => connection.targetProjectId
    },
    {
      id: 'endpointUrl',
      header: 'Endpoint',
      cell: (connection) => connection.endpointUrl || '-'
    }
  ];

  return (
    <section className="page-section">
      <PageHeader
        eyebrow="Outbound orchestration"
        title="Integrations"
        description={
          activeProject
            ? `Observabilidade outbound do projeto ${activeProject.slug}. Aqui o Core mostra conexões, integrationEvents e logs sem assumir a verdade final do domínio externo.`
            : 'Selecione um projeto para acompanhar o runtime de integrações outbound.'
        }
        actions={
          <button
            type="button"
            onClick={() => {
              void eventsQuery.refetch();
              void logsQuery.refetch();
              void connectionsQuery.refetch();
            }}
          >
            Atualizar integrações
          </button>
        }
      />

      {loading && <p className="state">Carregando integrações...</p>}

      {!loading && error && <p className="state error">Erro ao carregar dados: {error}</p>}

      {!loading && !error && !activeProject && (
        <SectionCard
          title="Projeto obrigatório"
          description="Integration events e logs sempre devem ser vistos dentro do tenant correto."
        >
          <EmptyState
            title="Selecione um projeto"
            description="Use o seletor do topo para abrir a observabilidade outbound do projeto ativo."
          />
        </SectionCard>
      )}

      {!loading && !error && activeProject && (
        <>
          <div className="metric-grid metric-grid--compact">
            <MetricCard
              label="Connections"
              value={connections.length}
              description="ProjectConnections registradas para este projeto."
              tone="neutral"
            />
            <MetricCard
              label="Ativas"
              value={activeConnections}
              description="Conexões prontas para despacho outbound."
              tone="success"
            />
            <MetricCard
              label="Events"
              value={integrationEvents.length}
              description="Integration events emitidos pelo Core."
              tone="info"
            />
            <MetricCard
              label="Success"
              value={successEvents}
              description="Eventos outbound já aceitos pelo sistema externo."
              tone="success"
            />
            <MetricCard
              label="Errors"
              value={errorLogs}
              description="Falhas registradas em logs de integração."
              tone="danger"
            />
          </div>

          <SectionCard
            title="Connections"
            description="Instalações outbound subordinadas ao projeto ativo."
          >
            {connections.length === 0 ? (
              <EmptyState
                title="Nenhuma conexão encontrada"
                description="Crie uma projectConnection para habilitar o fluxo outbound deste projeto."
              />
            ) : (
              <DataTable
                items={connections}
                columns={connectionColumns}
                getRowKey={(connection) => connection.id}
                caption="Lista de project connections"
              />
            )}
          </SectionCard>

          <SectionCard
            title="Integration Events"
            description="Eventos outbound emitidos oficialmente pelo Core para sistemas externos."
          >
            {integrationEvents.length === 0 ? (
              <EmptyState
                title="Nenhum integration event"
                description="Quando uma service request for confirmada, o Core começará a registrar eventos outbound aqui."
              />
            ) : (
              <DataTable
                items={integrationEvents}
                columns={eventColumns}
                getRowKey={(event) => event.id}
                caption="Lista de integration events"
              />
            )}
          </SectionCard>

          <SectionCard
            title="Integration Logs"
            description="Trilha operacional das tentativas, sucessos e erros de integração outbound."
          >
            {integrationLogs.length === 0 ? (
              <EmptyState
                title="Nenhum integration log"
                description="Os logs de tentativa e resultado aparecerão aqui conforme o Core despachar integrações."
              />
            ) : (
              <DataTable
                items={integrationLogs}
                columns={logColumns}
                getRowKey={(log) => log.id}
                caption="Lista de integration logs"
              />
            )}
          </SectionCard>
        </>
      )}
    </section>
  );
}
