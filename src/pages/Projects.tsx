import { useNavigate } from 'react-router-dom';
import { DataTable, type DataTableColumn } from '../components/common/DataTable';
import { EmptyState } from '../components/common/EmptyState';
import { SectionCard } from '../components/common/SectionCard';
import { StatusBadge, getProjectTone } from '../components/common/StatusBadge';
import { PageHeader } from '../components/layout/PageHeader';
import type { Project } from '../core/entities';
import { useCollectionQuery } from '../hooks/useCollectionQuery';
import { getProjectConnections } from '../services/firestore/projectConnections';
import { getProjects } from '../services/firestore/projects';

export function ProjectsPage() {
  const navigate = useNavigate();
  const {
    data: projects,
    loading: projectsLoading,
    error: projectsError,
    refetch: refetchProjects
  } = useCollectionQuery(
    getProjects,
    'Erro ao carregar projetos.'
  );
  const {
    data: projectConnections,
    loading: connectionsLoading,
    error: connectionsError,
    refetch: refetchConnections
  } = useCollectionQuery(getProjectConnections, 'Erro ao carregar conexões de projeto.');
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
      cell: (project) => project.name || 'Projeto sem nome'
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
        <div className="table-actions">
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

  return (
    <section className="page-section">
      <PageHeader
        eyebrow="Orquestração multi-projeto"
        title="Projetos"
        description="Projetos agora funcionam como unidades orquestradas do core, prontas para receber conexões externas com outros sistemas."
        actions={
          <button
            type="button"
            onClick={() => {
              void refetchProjects();
              void refetchConnections();
            }}
          >
            Atualizar projetos
          </button>
        }
      />

      {loading && <p className="state">Carregando projetos...</p>}

      {!loading && error && <p className="state error">Erro ao carregar dados: {error}</p>}

      {!loading && !error && (
        <SectionCard
          title="Projects registry"
          description="Inventário atual do orquestrador com visibilidade da quantidade de integrações externas por projeto."
        >
          {projects.length === 0 ? (
            <EmptyState
              title="Nenhum projeto encontrado"
              description="Os projetos aparecerão aqui conforme o core for sendo configurado."
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
