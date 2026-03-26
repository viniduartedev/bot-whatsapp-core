import { useLocation } from 'react-router-dom';
import { useProjectContext } from '../../context/ProjectContext';
import { StatusBadge } from '../common/StatusBadge';
import { getPageMeta } from './navigation';

export function Topbar() {
  const location = useLocation();
  const pageMeta = getPageMeta(location.pathname);
  const environmentLabel = import.meta.env.MODE?.toUpperCase() ?? 'DEV';
  const { projects, activeProject, activeProjectId, loading, setActiveProjectId } =
    useProjectContext();

  return (
    <header className="ops-topbar">
      <div className="ops-topbar__context">
        <span className="ops-topbar__kicker">{pageMeta.kicker}</span>
        <h1>{pageMeta.title}</h1>
        <p>{pageMeta.subtitle}</p>
      </div>

      <div className="ops-topbar__actions">
        <label className="ops-topbar__project">
          <span>Projeto ativo</span>
          <select
            value={activeProjectId}
            onChange={(event) => setActiveProjectId(event.target.value)}
            disabled={loading || projects.length === 0}
          >
            {projects.length === 0 ? (
              <option value="">Sem projetos</option>
            ) : (
              projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} ({project.slug})
                </option>
              ))
            )}
          </select>
          <small>
            {activeProject
              ? `${activeProject.slug} • raiz multi-tenant do contexto atual`
              : 'Crie um projeto para iniciar a operação do Core.'}
          </small>
        </label>
        <StatusBadge label={environmentLabel} tone="info" />
        <div className="ops-topbar__profile">
          <strong>Auth pending</strong>
          <small>Pronto para login, perfis e autorização por tenant.</small>
        </div>
      </div>
    </header>
  );
}
