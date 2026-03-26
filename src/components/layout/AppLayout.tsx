import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppLayout() {
  // O painel evolui aqui para um Ops Center do core, pensado para operar
  // múltiplos bots e projetos no futuro. Login e autenticação entram na
  // próxima fase; por agora priorizamos observabilidade e operação.
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
