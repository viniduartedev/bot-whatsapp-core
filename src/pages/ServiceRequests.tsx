import { useState } from 'react';
import { DataTable, type DataTableColumn } from '../components/common/DataTable';
import { EmptyState } from '../components/common/EmptyState';
import { SectionCard } from '../components/common/SectionCard';
import {
  StatusBadge,
  getServiceRequestTone
} from '../components/common/StatusBadge';
import { PageHeader } from '../components/layout/PageHeader';
import {
  SERVICE_REQUEST_STATUSES,
  canConfirmServiceRequestStatus
} from '../core/constants/domain';
import { formatUnknownDateTime } from '../core/mappers/display';
import type { ServiceRequest } from '../core/entities';
import { confirmServiceRequest } from '../core/use-cases/confirmServiceRequest';
import { useCollectionQuery } from '../hooks/useCollectionQuery';
import { getServiceRequests } from '../services/firestore/serviceRequests';

interface ActionFeedback {
  tone: 'success' | 'error';
  message: string;
}

type ServiceRequestFilter = 'all' | ServiceRequest['status'];

export function ServiceRequestsPage() {
  const { data: requests, loading, error, refetch } = useCollectionQuery(
    getServiceRequests,
    'Erro ao carregar solicitações.'
  );
  const [submittingRequestId, setSubmittingRequestId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<ActionFeedback | null>(null);
  const [activeFilter, setActiveFilter] = useState<ServiceRequestFilter>('all');

  const filteredRequests =
    activeFilter === 'all'
      ? requests
      : requests.filter((request) => request.status === activeFilter);

  async function handleConfirm(request: ServiceRequest) {
    setSubmittingRequestId(request.id);
    setFeedback(null);

    try {
      await confirmServiceRequest(request.id);
      await refetch();
      setFeedback({
        tone: 'success',
        message:
          'Solicitação confirmada com sucesso. O agendamento correspondente foi criado no core.'
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Não foi possível confirmar a solicitação.';
      setFeedback({
        tone: 'error',
        message
      });
    } finally {
      setSubmittingRequestId(null);
    }
  }

  const columns: DataTableColumn<ServiceRequest>[] = [
    {
      id: 'type',
      header: 'Tipo',
      cell: (request) => request.type
    },
    {
      id: 'status',
      header: 'Status',
      cell: (request) => (
        <StatusBadge label={request.status} tone={getServiceRequestTone(request.status)} />
      )
    },
    {
      id: 'requestedDate',
      header: 'Data',
      cell: (request) => request.requestedDate || '-'
    },
    {
      id: 'requestedTime',
      header: 'Horário',
      cell: (request) => request.requestedTime || '-'
    },
    {
      id: 'projectId',
      header: 'Projeto',
      cell: (request) => request.projectId
    },
    {
      id: 'contactId',
      header: 'Contato',
      cell: (request) => request.contactId
    },
    {
      id: 'source',
      header: 'Origem',
      cell: (request) => request.source || '-'
    },
    {
      id: 'createdAt',
      header: 'Criado em',
      cell: (request) => formatUnknownDateTime(request.createdAt)
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: (request) => {
        const isConfirmable = canConfirmServiceRequestStatus(request.status);
        const isSubmitting = submittingRequestId === request.id;

        if (!isConfirmable) {
          return (
            <span className="table-note">
              {request.status === 'confirmado' ? 'Agendamento gerado' : 'Sem ação disponível'}
            </span>
          );
        }

        return (
          <div className="table-actions">
            <button
              type="button"
              className="button-inline"
              disabled={submittingRequestId !== null}
              onClick={() => void handleConfirm(request)}
            >
              {isSubmitting ? 'Confirmando...' : 'Confirmar'}
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <section className="page-section">
      <PageHeader
        eyebrow="Operational queue"
        title="Service Requests"
        description="Fila operacional principal do core, já com ação real de confirmação e pronta para crescer com filtros, bots e múltiplos projetos."
        actions={
          <button type="button" onClick={() => void refetch()}>
            Atualizar fila
          </button>
        }
      />

      {feedback && (
        <p className={feedback.tone === 'success' ? 'state success' : 'state error'}>
          {feedback.message}
        </p>
      )}

      {loading && <p className="state">Carregando solicitações...</p>}

      {!loading && error && <p className="state error">Erro ao carregar dados: {error}</p>}

      {!loading && !error && (
        <SectionCard
          title="Requests queue"
          description="A entidade de entrada principal do core com foco em triagem, confirmação e observabilidade."
          aside={
            <div className="filter-bar" aria-label="Filtros por status">
              <button
                type="button"
                className={activeFilter === 'all' ? 'filter-chip active' : 'filter-chip'}
                onClick={() => setActiveFilter('all')}
              >
                Todos
              </button>
              {SERVICE_REQUEST_STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  className={activeFilter === status ? 'filter-chip active' : 'filter-chip'}
                  onClick={() => setActiveFilter(status)}
                >
                  {status}
                </button>
              ))}
            </div>
          }
        >
          {filteredRequests.length === 0 ? (
            <EmptyState
              title="Nenhuma solicitação nesse recorte"
              description="Ajuste o filtro ou aguarde novas entradas do fluxo operacional."
            />
          ) : (
            <DataTable
              items={filteredRequests}
              columns={columns}
              getRowKey={(request) => request.id}
              caption="Lista de solicitações de serviço"
            />
          )}
        </SectionCard>
      )}
    </section>
  );
}
