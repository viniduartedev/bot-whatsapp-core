import { RequestList } from '../components/RequestList';
import { useRequests } from '../hooks/useRequests';

export function Requests() {
  const { requests, loading, error, refetch } = useRequests();

  // `appointmentRequests` segue disponível apenas para manter a migração segura.
  // A nova porta de entrada do core passa a ser `serviceRequests`.

  return (
    <section className="page-section">
      <header className="page-header">
        <div>
          <p className="eyebrow">Legado temporário</p>
          <h1>Solicitações antigas</h1>
          <p>
            Esta tela preserva a leitura da coleção <code>appointmentRequests</code> enquanto
            o core novo é estruturado em paralelo.
          </p>
        </div>
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
    </section>
  );
}
