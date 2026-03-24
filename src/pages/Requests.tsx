import { RequestList } from '../components/RequestList';
import { useRequests } from '../hooks/useRequests';

export function Requests() {
  const { requests, loading, error, refetch } = useRequests();

  // Roadmap de evolução incremental:
  // V2: atualizar status da solicitação na própria lista
  // V3: transformar solicitação em agendamento efetivo
  // V4: autenticação e autorização por perfil
  // V5: multi-tenant para suportar múltiplos clientes (SaaS)

  return (
    <main className="container">
      <header className="header">
        <h1>Solicitações de Agendamento</h1>
        <button type="button" onClick={() => void refetch()}>
          Atualizar
        </button>
      </header>

      {loading && <p className="state">Carregando solicitações...</p>}

      {!loading && error && (
        <p className="state error">Erro ao carregar dados: {error}</p>
      )}

      {!loading && !error && requests.length === 0 && (
        <p className="state">Nenhuma solicitação encontrada.</p>
      )}

      {!loading && !error && requests.length > 0 && <RequestList requests={requests} />}
    </main>
  );
}
