import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppLayout() {
  // O painel agora opera explicitamente por contexto de projeto. `Project` é a
  // raiz do tenant operacional do Core e a UI inteira reflete esse escopo,
  // mesmo antes da entrada de auth + autorização forte.
  return (
    <div className="ops-shell">
      <Sidebar />
      <div className="ops-main">
        <Topbar />
        <main className="ops-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
