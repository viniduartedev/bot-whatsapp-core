import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, type DataTableColumn } from '../components/common/DataTable';
import { EmptyState } from '../components/common/EmptyState';
import { SectionCard } from '../components/common/SectionCard';
import { StatusBadge, getProjectTone } from '../components/common/StatusBadge';
import { PageHeader } from '../components/layout/PageHeader';
import type { Project } from '../core/entities';
import { useProjectContext } from '../context/ProjectContext';
import { useCollectionQuery } from '../hooks/useCollectionQuery';
import { getProjectConnections } from '../services/firestore/projectConnections';
import { createProject } from '../services/firestore/projects';

interface ActionFeedback {
  tone: 'success' | 'error';
  message: string;
}

interface ProjectFormState {
  name: string;
  slug: string;
  status: Project['status'];
}

const DEFAULT_FORM_STATE: ProjectFormState = {
  name: '',
  slug: '',
  status: 'active'
};

function toProjectSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function ProjectsPage() {
  const navigate = useNavigate();
  const {
    projects,
    activeProjectId,
    loading: projectsLoading,
    error: projectsError,
    refetchProjects,
    setActiveProjectId
  } = useProjectContext();
  const {
    data: projectConnections,
    loading: connectionsLoading,
    error: connectionsError,
    refetch: refetchConnections
  } = useCollectionQuery(getProjectConnections, 'Erro ao carregar conexões de projeto.');
  const [formState, setFormState] = useState<ProjectFormState>(DEFAULT_FORM_STATE);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<ActionFeedback | null>(null);
  const loading = projectsLoading || connectionsLoading;
  const error = projectsError ?? connectionsError;

  const connectionCountByProject = projectConnections.reduce<Map<string, number>>((acc, connection) => {
    acc.set(connection.projectId, (acc.get(connection.projectId) ?? 0) + 1);
    return acc;
  }, new Map());

  const columns: DataTableColumn<Project>[] = [
    {
      id: 'name',
      header: 'Nome',
      cell: (project) => (
        <div>
          <strong>{project.name || 'Projeto sem nome'}</strong>
          {project.id === activeProjectId && <p className="table-note">Projeto ativo no painel</p>}
        </div>
      )
    },
    {
      id: 'slug',
      header: 'Slug',
      cell: (project) => project.slug || '-'
    },
    {
      id: 'status',
      header: 'Status',
      cell: (project) => (
        <StatusBadge label={project.status} tone={getProjectTone(project.status)} />
      )
    },
    {
      id: 'connections',
      header: 'Conexões',
      cell: (project) => connectionCountByProject.get(project.id) ?? 0
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: (project) => (
        <div className="table-actions table-actions--stacked">
          {project.id !== activeProjectId && (
            <button
              type="button"
              className="button-inline"
              onClick={() => setActiveProjectId(project.id)}
            >
              Ativar contexto
            </button>
          )}
          <button
            type="button"
            className="button-inline"
            onClick={() => navigate(`/bot-settings?projectId=${project.id}`)}
          >
            Configurar Bot
          </button>
          <button
            type="button"
            className="button-inline"
            onClick={() => navigate(`/project-connections?projectId=${project.id}`)}
          >
            Ver conexões
          </button>
        </div>
      )
    }
  ];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const name = formState.name.trim();
    const slug = toProjectSlug(formState.slug);

    if (!name || !slug) {
      setFeedback({
        tone: 'error',
        message: 'Informe nome e slug válidos para criar o projeto.'
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const projectId = await createProject({
        name,
        slug,
        status: formState.status
      });
      await refetchProjects();
      setActiveProjectId(projectId);
      setFeedback({
        tone: 'success',
        message: 'Projeto criado com sucesso. Ele agora pode receber contacts, serviceRequests e projectConnections.'
      });
      setFormState(DEFAULT_FORM_STATE);
      setIsFormOpen(false);
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : 'Não foi possível criar o projeto.';
      setFeedback({
        tone: 'error',
        message
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="page-section">
      <PageHeader
        eyebrow="Raiz multi-tenant"
        title="Projetos"
        description="`Project` agora é a entidade raiz do Core. Primeiro criamos o tenant operacional; depois configuramos as conexões e operamos tudo por `projectId`."
        actions={
          <div className="page-header__actions">
            <button type="button" onClick={() => setIsFormOpen((current) => !current)}>
              {isFormOpen ? 'Fechar formulário' : 'Novo Projeto'}
            </button>
            <button
              type="button"
              onClick={() => {
                void refetchProjects();
                void refetchConnections();
              }}
            >
              Atualizar projetos
            </button>
          </div>
        }
      />

      {feedback && (
        <p className={feedback.tone === 'success' ? 'state success' : 'state error'}>
          {feedback.message}
        </p>
      )}

      {loading && <p className="state">Carregando projetos...</p>}

      {!loading && error && <p className="state error">Erro ao carregar dados: {error}</p>}

      {!loading && !error && isFormOpen && (
        <SectionCard
          title="Novo projeto"
          description="Cada projeto representa um tenant/contexto operacional do Core. Todas as leituras e integrações futuras ficam subordinadas a ele."
        >
          <form className="form-grid" onSubmit={handleSubmit}>
            <label className="form-field">
              <span>Nome</span>
              <input
                value={formState.name}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    name: event.target.value,
                    slug: current.slug ? current.slug : toProjectSlug(event.target.value)
                  }))
                }
                placeholder="Clínica Central"
              />
            </label>

            <label className="form-field">
              <span>Slug</span>
              <input
                value={formState.slug}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    slug: toProjectSlug(event.target.value)
                  }))
                }
                placeholder="clinica-central"
              />
            </label>

            <label className="form-field">
              <span>Status</span>
              <select
                value={formState.status}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    status: event.target.value as Project['status']
                  }))
                }
              >
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
            </label>

            <div className="form-actions">
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar projeto'}
              </button>
            </div>
          </form>
        </SectionCard>
      )}

      {!loading && !error && (
        <SectionCard
          title="Projects registry"
          description="Inventário multi-tenant do Core com visibilidade da quantidade de integrações externas por projeto."
        >
          {projects.length === 0 ? (
            <EmptyState
              title="Nenhum projeto encontrado"
              description="Crie o primeiro projeto para definir a raiz do contexto operacional do Core."
            />
          ) : (
            <DataTable
              items={projects}
              columns={columns}
              getRowKey={(project) => project.id}
              caption="Lista de projetos"
            />
          )}
        </SectionCard>
      )}
    </section>
  );
}
