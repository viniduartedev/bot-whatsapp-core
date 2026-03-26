import { useLocation } from 'react-router-dom';
import { StatusBadge } from '../common/StatusBadge';
import { getPageMeta } from './navigation';

export function Topbar() {
  const location = useLocation();
  const pageMeta = getPageMeta(location.pathname);
  const environmentLabel = import.meta.env.MODE?.toUpperCase() ?? 'DEV';

  return (
    <header className="ops-topbar">
      <div className="ops-topbar__context">
        <span className="ops-topbar__kicker">{pageMeta.kicker}</span>
        <h1>{pageMeta.title}</h1>
        <p>{pageMeta.subtitle}</p>
      </div>

      <div className="ops-topbar__actions">
        <StatusBadge label={environmentLabel} tone="info" />
        <div className="ops-topbar__profile">
          <strong>Auth pending</strong>
          <small>Espaço preparado para login/perfil</small>
        </div>
      </div>
    </header>
  );
}
