import { DataTable, type DataTableColumn } from '../components/DataTable';
import { formatUnknownDateTime } from '../core/mappers/display';
import type { Project } from '../core/entities';
import { useCollectionQuery } from '../hooks/useCollectionQuery';
import { getProjects } from '../services/firestore/projects';

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
    cell: (project) => project.status
  },
  {
    id: 'createdAt',
    header: 'Criado em',
    cell: (project) => formatUnknownDateTime(project.createdAt)
  }
];

export function ProjectsPage() {
  const { data: projects, loading, error, refetch } = useCollectionQuery(
    getProjects,
    'Erro ao carregar projetos.'
  );

  return (
    <section className="page-section">
      <header className="page-header">
        <div>
          <p className="eyebrow">Domínio base</p>
          <h1>Projetos</h1>
          <p>
            A entidade de projeto é a âncora atual do core e abre espaço para evolução futura de
            métricas, bot e agendamento.
          </p>
        </div>
        <button type="button" onClick={() => void refetch()}>
          Atualizar
        </button>
      </header>

      {loading && <p className="state">Carregando projetos...</p>}

      {!loading && error && <p className="state error">Erro ao carregar dados: {error}</p>}

      {!loading && !error && projects.length === 0 && (
        <p className="state">Nenhum projeto encontrado.</p>
      )}

      {!loading && !error && projects.length > 0 && (
        <DataTable
          items={projects}
          columns={columns}
          getRowKey={(project) => project.id}
          caption="Lista de projetos"
        />
      )}
    </section>
  );
}
