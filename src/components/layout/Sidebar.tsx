import { NavLink } from 'react-router-dom';
import { opsNavigation } from './navigation';

export function Sidebar() {
  return (
    <aside className="ops-sidebar">
      <div className="ops-sidebar__brand">
        <p className="eyebrow">Core Ops Center</p>
        <h1>Core</h1>
        <p>
          Orquestrador multi-tenant para eventos inbound, service requests e integrações outbound.
        </p>
      </div>

      <nav className="ops-sidebar__nav" aria-label="Navegação principal">
        {opsNavigation.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive ? 'ops-sidebar__link ops-sidebar__link--active' : 'ops-sidebar__link'
            }
          >
            <span className="ops-sidebar__code">{item.code}</span>
            <span className="ops-sidebar__label">
              <strong>{item.label}</strong>
              <small>{item.description}</small>
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="ops-sidebar__footer">
        <span className="status-dot status-dot--success" />
        <div>
          <strong>Project-scoped ops</strong>
          <small>Estrutura pronta para autenticação e isolamento forte na próxima etapa.</small>
        </div>
      </div>
    </aside>
  );
}
