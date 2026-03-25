import { useState } from 'react';
import { DataTable, type DataTableColumn } from '../components/DataTable';
import { canConfirmServiceRequestStatus } from '../core/constants/domain';
import { formatUnknownDateTime } from '../core/mappers/display';
import type { ServiceRequest } from '../core/entities';
import { confirmServiceRequest } from '../core/use-cases/confirmServiceRequest';
import { useCollectionQuery } from '../hooks/useCollectionQuery';
import { getServiceRequests } from '../services/firestore/serviceRequests';

interface ActionFeedback {
  tone: 'success' | 'error';
  message: string;
}

export function ServiceRequestsPage() {
  const { data: requests, loading, error, refetch } = useCollectionQuery(
    getServiceRequests,
    'Erro ao carregar solicitações.'
  );
  const [submittingRequestId, setSubmittingRequestId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<ActionFeedback | null>(null);

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
      cell: (request) => request.status
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
      <header className="page-header">
        <div>
          <p className="eyebrow">Entrada principal</p>
          <h1>Solicitações de serviço</h1>
          <p>
            <code>serviceRequests</code> inicia a modelagem da porta de entrada principal do core
            para futuras integrações com bot, painel e fluxo de agendamento.
          </p>
        </div>
        <button type="button" onClick={() => void refetch()}>
          Atualizar
        </button>
      </header>

      {feedback && (
        <p className={feedback.tone === 'success' ? 'state success' : 'state error'}>
          {feedback.message}
        </p>
      )}

      {loading && <p className="state">Carregando solicitações...</p>}

      {!loading && error && <p className="state error">Erro ao carregar dados: {error}</p>}

      {!loading && !error && requests.length === 0 && (
        <p className="state">Nenhuma solicitação encontrada.</p>
      )}

      {!loading && !error && requests.length > 0 && (
        <DataTable
          items={requests}
          columns={columns}
          getRowKey={(request) => request.id}
          caption="Lista de solicitações de serviço"
        />
      )}
    </section>
  );
}
