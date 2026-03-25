import { NavLink, Outlet } from 'react-router-dom';

const navigationItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/projects', label: 'Projetos' },
  { to: '/contacts', label: 'Contatos' },
  { to: '/service-requests', label: 'Solicitações' },
  { to: '/appointments', label: 'Agendamentos' },
  { to: '/legacy-requests', label: 'Legado' }
];

export function AppShell() {
  // O shell principal expõe o novo core e mantém acesso à rota legada para
  // apoiarmos a migração sem interromper o que já funciona no Projeto 2.
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <p className="eyebrow">Projeto 2</p>
          <h1>Core do Sistema</h1>
          <p>
            Painel React + Firebase evoluindo por etapas para centralizar domínio, métricas e
            futuras integrações.
          </p>
        </div>

        <nav className="sidebar-nav" aria-label="Navegação principal">
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <p className="eyebrow">Arquitetura incremental</p>
          <h2>Nova camada de core convivendo com a base legada</h2>
        </header>

        <Outlet />
      </div>
    </div>
  );
}
