import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DataTable, type DataTableColumn } from '../components/common/DataTable';
import { EmptyState } from '../components/common/EmptyState';
import { SectionCard } from '../components/common/SectionCard';
import {
  StatusBadge,
  getProjectConnectionTone
} from '../components/common/StatusBadge';
import { PageHeader } from '../components/layout/PageHeader';
import { formatUnknownDateTime } from '../core/mappers/display';
import type { ProjectConnection } from '../core/entities';
import { useProjectContext } from '../context/ProjectContext';
import { useCollectionQuery } from '../hooks/useCollectionQuery';
import {
  createProjectConnection,
  getConnectionsByProject,
  type CreateProjectConnectionInput
} from '../services/firestore/projectConnections';

interface ActionFeedback {
  tone: 'success' | 'error';
  message: string;
}

type ProjectConnectionFormState = CreateProjectConnectionInput;

const DEFAULT_FORM_STATE: ProjectConnectionFormState = {
  projectId: '',
  connectionType: 'scheduling',
  provider: 'http',
  status: 'active',
  targetProjectId: '',
  environment: 'dev',
  endpointUrl: '',
  authToken: '',
  direction: 'outbound',
  acceptedEventTypes: ['appointment']
};

function getEnvironmentTone(environment: ProjectConnection['environment']) {
  return environment === 'prod' ? 'warning' : 'info';
}

export function ProjectConnectionsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    projects,
    activeProjectId,
    loading: projectsLoading,
    error: projectsError,
    setActiveProjectId
  } = useProjectContext();
  const selectedProjectId = searchParams.get('projectId') ?? activeProjectId;
  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );
  const {
    data: connections,
    loading: connectionsLoading,
    error: connectionsError,
    refetch: refetchConnections
  } = useCollectionQuery(
    useCallback(
      () => (selectedProjectId ? getConnectionsByProject(selectedProjectId) : Promise.resolve([])),
      [selectedProjectId]
    ),
    'Erro ao carregar conexões.'
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<ActionFeedback | null>(null);
  const [formState, setFormState] = useState<ProjectConnectionFormState>({
    ...DEFAULT_FORM_STATE,
    projectId: selectedProjectId
  });

  const loading = projectsLoading || connectionsLoading;
  const error = projectsError ?? connectionsError;

  useEffect(() => {
    if (!selectedProjectId) {
      return;
    }

    if (selectedProjectId !== activeProjectId) {
      setActiveProjectId(selectedProjectId);
    }

    setFormState((current) => ({
      ...current,
      projectId: selectedProjectId
    }));
  }, [activeProjectId, selectedProjectId, setActiveProjectId]);

  const columns: DataTableColumn<ProjectConnection>[] = [
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
      id: 'direction',
      header: 'Direção',
      cell: (connection) => connection.direction
    },
    {
      id: 'targetProjectId',
      header: 'Target project',
      cell: (connection) => connection.targetProjectId
    },
    {
      id: 'endpointUrl',
      header: 'Endpoint',
      cell: (connection) => connection.endpointUrl || '-'
    },
    {
      id: 'authToken',
      header: 'Token',
      cell: (connection) =>
        connection.authToken ? (
          <StatusBadge label="configured" tone="warning" />
        ) : (
          <span className="table-note">not set</span>
        )
    },
    {
      id: 'environment',
      header: 'Environment',
      cell: (connection) => (
        <StatusBadge
          label={connection.environment}
          tone={getEnvironmentTone(connection.environment)}
        />
      )
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
      id: 'createdAt',
      header: 'Criado em',
      cell: (connection) => formatUnknownDateTime(connection.createdAt)
    }
  ];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    if (!selectedProjectId || !formState.targetProjectId.trim() || !formState.endpointUrl.trim()) {
      setFeedback({
        tone: 'error',
        message: 'Informe targetProjectId e endpointUrl para registrar a conexão.'
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await createProjectConnection({
        ...formState,
        projectId: selectedProjectId,
        targetProjectId: formState.targetProjectId.trim(),
        endpointUrl: formState.endpointUrl.trim(),
        authToken: formState.authToken.trim()
      });
      await refetchConnections();
      setFeedback({
        tone: 'success',
        message: 'ProjectConnection criada com sucesso. O projeto agora possui uma instalação outbound oficial.'
      });
      setIsFormOpen(false);
      setFormState({
        ...DEFAULT_FORM_STATE,
        projectId: selectedProjectId
      });
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : 'Não foi possível criar a conexão.';
      setFeedback({
        tone: 'error',
        message
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField<Key extends keyof ProjectConnectionFormState>(
    key: Key,
    value: ProjectConnectionFormState[Key]
  ) {
    setFormState((current) => ({
      ...current,
      [key]: value
    }));
  }

  return (
    <section className="page-section">
      <PageHeader
        eyebrow="Integrações externas"
        title="Project Connections"
        description={
          selectedProject
            ? `As conexões abaixo pertencem ao projeto ${selectedProject.name}. ` +
              '`ProjectConnection` sempre nasce subordinada a um `Project`.'
            : 'Primeiro escolha um projeto. Depois o Core permite configurar as conexões outbound desse tenant.'
        }
        actions={
          <div className="page-header__actions">
            <button type="button" className="button-inline" onClick={() => navigate('/projects')}>
              Ver projetos
            </button>
            <button type="button" onClick={() => setIsFormOpen((current) => !current)}>
              {isFormOpen ? 'Fechar formulário' : 'Nova conexão'}
            </button>
          </div>
        }
      />

      {feedback && (
        <p className={feedback.tone === 'success' ? 'state success' : 'state error'}>
          {feedback.message}
        </p>
      )}

      {loading && <p className="state">Carregando conexões...</p>}

      {!loading && error && <p className="state error">Erro ao carregar dados: {error}</p>}

      {!loading && !error && !selectedProject && (
        <SectionCard
          title="Projeto obrigatório"
          description="Sem `Project`, não existe escopo seguro para `ProjectConnection`."
        >
          <EmptyState
            title="Selecione um projeto"
            description="Use o seletor do topo ou abra a tela Projects para criar/ativar o projeto antes de cadastrar conexões."
          />
        </SectionCard>
      )}

      {!loading && !error && selectedProject && (
        <SectionCard
          title="Projeto raiz"
          description="Este projeto é o tenant operacional que receberá contacts, serviceRequests, inboundEvents e integrações outbound."
          aside={
            <button
              type="button"
              className="button-inline"
              onClick={() => {
                setActiveProjectId(selectedProject.id);
                setSearchParams({ projectId: selectedProject.id });
              }}
            >
              Fixar como ativo
            </button>
          }
        >
          <div className="scope-summary">
            <strong>{selectedProject.name}</strong>
            <span>{selectedProject.slug}</span>
          </div>
        </SectionCard>
      )}

      {!loading && !error && isFormOpen && selectedProject && (
        <SectionCard
          title="Nova conexão"
          description="Aqui o Core registra a instalação outbound do projeto. O sistema externo continua sendo a fonte de verdade do domínio integrado."
        >
          <form className="form-grid" onSubmit={handleSubmit}>
            <label className="form-field">
              <span>Projeto</span>
              <input value={`${selectedProject.name} (${selectedProject.slug})`} disabled />
            </label>

            <label className="form-field">
              <span>Tipo de conexão</span>
              <select
                value={formState.connectionType}
                onChange={(event) =>
                  updateField(
                    'connectionType',
                    event.target.value as CreateProjectConnectionInput['connectionType']
                  )
                }
              >
                <option value="scheduling">scheduling</option>
              </select>
            </label>

            <label className="form-field">
              <span>Provider</span>
              <select
                value={formState.provider}
                onChange={(event) =>
                  updateField('provider', event.target.value as CreateProjectConnectionInput['provider'])
                }
              >
                <option value="http">http</option>
                <option value="firebase">firebase</option>
              </select>
            </label>

            <label className="form-field">
              <span>Target project id</span>
              <input
                value={formState.targetProjectId}
                onChange={(event) => updateField('targetProjectId', event.target.value)}
                placeholder="agendamentos-ai-dev"
              />
            </label>

            <label className="form-field">
              <span>Environment</span>
              <select
                value={formState.environment}
                onChange={(event) =>
                  updateField(
                    'environment',
                    event.target.value as CreateProjectConnectionInput['environment']
                  )
                }
              >
                <option value="dev">dev</option>
                <option value="prod">prod</option>
              </select>
            </label>

            <label className="form-field">
              <span>Endpoint URL</span>
              <input
                value={formState.endpointUrl}
                onChange={(event) => updateField('endpointUrl', event.target.value)}
                placeholder="https://agendamentos-ai.example.com/integrations/requests"
              />
            </label>

            <label className="form-field">
              <span>Auth token</span>
              <input
                type="password"
                value={formState.authToken}
                onChange={(event) => updateField('authToken', event.target.value)}
                placeholder="Bearer token usado no outbound"
              />
            </label>

            <label className="form-field">
              <span>Status</span>
              <select
                value={formState.status}
                onChange={(event) =>
                  updateField('status', event.target.value as CreateProjectConnectionInput['status'])
                }
              >
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
            </label>

            <label className="form-field">
              <span>Direção</span>
              <input value={formState.direction} disabled />
            </label>

            <div className="form-actions">
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar conexão'}
              </button>
            </div>
          </form>
        </SectionCard>
      )}

      {!loading && !error && selectedProject && (
        <SectionCard
          title="Connections registry"
          description={`Conexões outbound subordinadas ao projeto ${selectedProject.name}.`}
          aside={
            <button type="button" className="button-inline" onClick={() => void refetchConnections()}>
              Atualizar conexões
            </button>
          }
        >
          {connections.length === 0 ? (
            <EmptyState
              title="Nenhuma conexão cadastrada"
              description="Crie a primeira projectConnection outbound para permitir que este projeto despache integrações."
            />
          ) : (
            <DataTable
              items={connections}
              columns={columns}
              getRowKey={(connection) => connection.id}
              caption="Lista de conexões de projeto"
            />
          )}
        </SectionCard>
      )}
    </section>
  );
}
