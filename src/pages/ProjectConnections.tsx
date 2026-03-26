import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DataTable, type DataTableColumn } from '../components/common/DataTable';
import { EmptyState } from '../components/common/EmptyState';
import { SectionCard } from '../components/common/SectionCard';
import { StatusBadge, getProjectTone } from '../components/common/StatusBadge';
import { PageHeader } from '../components/layout/PageHeader';
import { formatUnknownDateTime } from '../core/mappers/display';
import type { Project, ProjectConnection } from '../core/entities';
import { useCollectionQuery } from '../hooks/useCollectionQuery';
import {
  createProjectConnection,
  getProjectConnections,
  type CreateProjectConnectionInput
} from '../services/firestore/projectConnections';
import { getProjects } from '../services/firestore/projects';

interface ActionFeedback {
  tone: 'success' | 'error';
  message: string;
}

type ProjectConnectionFormState = CreateProjectConnectionInput;

const DEFAULT_FORM_STATE: ProjectConnectionFormState = {
  projectId: '',
  connectionType: 'scheduling',
  provider: 'firebase',
  status: 'active',
  targetProjectId: '',
  environment: 'dev'
};

function getEnvironmentTone(environment: ProjectConnection['environment']) {
  return environment === 'prod' ? 'warning' : 'info';
}

export function ProjectConnectionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedProjectId = searchParams.get('projectId') ?? '';
  const {
    data: projects,
    loading: projectsLoading,
    error: projectsError,
    refetch: refetchProjects
  } = useCollectionQuery(getProjects, 'Erro ao carregar projetos para conexões.');
  const {
    data: connections,
    loading: connectionsLoading,
    error: connectionsError,
    refetch: refetchConnections
  } = useCollectionQuery(getProjectConnections, 'Erro ao carregar conexões.');
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

    setFormState((current) => ({
      ...current,
      projectId: selectedProjectId
    }));
  }, [selectedProjectId]);

  const projectLookup = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects]
  );

  const filteredConnections = selectedProjectId
    ? connections.filter((connection) => connection.projectId === selectedProjectId)
    : connections;

  const selectedProject = selectedProjectId ? projectLookup.get(selectedProjectId) : null;

  const columns: DataTableColumn<ProjectConnection>[] = [
    {
      id: 'projectId',
      header: 'Projeto',
      cell: (connection) => {
        const project = projectLookup.get(connection.projectId);
        return project ? `${project.name} (${project.slug})` : connection.projectId;
      }
    },
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
      id: 'targetProjectId',
      header: 'Target project',
      cell: (connection) => connection.targetProjectId
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
        <StatusBadge label={connection.status} tone={getProjectTone(connection.status)} />
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

    if (!formState.projectId || !formState.targetProjectId.trim()) {
      setFeedback({
        tone: 'error',
        message: 'Selecione um projeto e informe o targetProjectId da conexão.'
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await createProjectConnection({
        ...formState,
        targetProjectId: formState.targetProjectId.trim()
      });
      await refetchConnections();
      setFeedback({
        tone: 'success',
        message: 'Conexão criada com sucesso. O core já reconhece essa integração externa.'
      });
      setIsFormOpen(false);
      setFormState({
        ...DEFAULT_FORM_STATE,
        projectId: selectedProjectId
      });
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : 'Não foi possível criar a conexão.';
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
        description="`projectConnections` é a camada que prepara o core para orquestrar integrações com agendamentos-ai e outros sistemas futuros."
        actions={
          <div className="page-header__actions">
            {selectedProjectId && (
              <button
                type="button"
                className="button-inline"
                onClick={() => {
                  setSearchParams({});
                  setFormState((current) => ({
                    ...current,
                    projectId: ''
                  }));
                }}
              >
                Limpar filtro
              </button>
            )}
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

      {!loading && !error && isFormOpen && (
        <SectionCard
          title="Nova conexão"
          description="O core está evoluindo para um orquestrador. Aqui cadastramos conexões externas por projeto, sem ativar a integração real ainda."
        >
          <form className="form-grid" onSubmit={handleSubmit}>
            <label className="form-field">
              <span>Projeto</span>
              <select
                value={formState.projectId}
                onChange={(event) => updateField('projectId', event.target.value)}
              >
                <option value="">Selecione um projeto</option>
                {projects.map((project: Project) => (
                  <option key={project.id} value={project.id}>
                    {project.name} ({project.slug})
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>Tipo de conexão</span>
              <select
                value={formState.connectionType}
                onChange={(event) =>
                  updateField('connectionType', event.target.value as CreateProjectConnectionInput['connectionType'])
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

            <div className="form-actions">
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar conexão'}
              </button>
            </div>
          </form>
        </SectionCard>
      )}

      {!loading && !error && (
        <SectionCard
          title="Connections registry"
          description={
            selectedProject
              ? `Conexões externas do projeto ${selectedProject.name}.`
              : 'Registro técnico das integrações externas cadastradas por projeto.'
          }
          aside={
            <button
              type="button"
              className="button-inline"
              onClick={() => {
                void refetchProjects();
                void refetchConnections();
              }}
            >
              Atualizar conexões
            </button>
          }
        >
          {filteredConnections.length === 0 ? (
            <EmptyState
              title="Nenhuma conexão cadastrada"
              description="Use o formulário para cadastrar a primeira integração externa do core."
            />
          ) : (
            <DataTable
              items={filteredConnections}
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
