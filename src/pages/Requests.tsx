import { RequestList } from '../components/RequestList';
import { useRequests } from '../hooks/useRequests';

export function Requests() {
  const { requests, loading, error, refetch } = useRequests();

  return (
    <section className="page-section">
      <header className="page-header">
        <div>
          <p className="eyebrow">Fila operacional</p>
          <h1>Appointment Requests</h1>
          <p>
            Esta tela acompanha a coleção <code>appointmentRequests</code> em{' '}
            <code>agendamento-ai</code>, onde o Core registra solicitações pendentes de
            validação do admin.
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
