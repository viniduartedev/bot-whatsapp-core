import { NavLink } from 'react-router-dom';
import { opsNavigation } from './navigation';

export function Sidebar() {
  return (
    <aside className="ops-sidebar">
      <div className="ops-sidebar__brand">
        <p className="eyebrow">Core Ops Center</p>
        <h1>Projeto 2</h1>
        <p>
          Painel técnico para observabilidade, operação e crescimento futuro para múltiplos bots e
          projetos.
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
          <strong>Core observability</strong>
          <small>Estrutura pronta para autenticação na próxima etapa.</small>
        </div>
      </div>
    </aside>
  );
}
