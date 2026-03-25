import { MetricCard } from '../components/MetricCard';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';

export function Dashboard() {
  const { metrics, loading, error, refetch } = useDashboardMetrics();

  return (
    <section className="page-section">
      <header className="page-header">
        <div>
          <p className="eyebrow">Dashboard inicial</p>
          <h1>Visão geral do core</h1>
          <p>
            Esta etapa prepara a base do sistema para crescer com segurança em torno do domínio
            principal, sem antecipar autenticação, multi-tenant completo ou backend customizado.
          </p>
        </div>
        <button type="button" onClick={() => void refetch()}>
          Atualizar
        </button>
      </header>

      {loading && <p className="state">Carregando indicadores...</p>}

      {!loading && error && <p className="state error">Erro ao carregar indicadores: {error}</p>}

      {!loading && !error && (
        <>
          <div className="metrics-grid">
            <MetricCard
              label="Projetos"
              value={metrics.projects}
              description="Base inicial de unidades ou clientes que agrupam o domínio."
            />
            <MetricCard
              label="Contatos"
              value={metrics.contacts}
              description="Pessoas atendidas pelos fluxos atuais e futuros do sistema."
            />
            <MetricCard
              label="Solicitações"
              value={metrics.serviceRequests}
              description="Entrada operacional principal do core em evolução."
            />
            <MetricCard
              label="Agendamentos"
              value={metrics.appointments}
              description="Conversões já materializadas a partir das solicitações."
            />
          </div>

          <div className="insight-grid">
            <article className="content-card">
              <h3>Direção desta fase</h3>
              <ul className="content-list">
                <li>Estruturar o domínio central do Projeto 2 sem finalizar o produto.</li>
                <li>Deixar o painel preparado para novas telas, métricas e serviços.</li>
                <li>Manter compatibilidade com o que já existe durante a transição.</li>
              </ul>
            </article>

            <article className="content-card">
              <h3>Próximos encaixes naturais</h3>
              <ul className="content-list">
                <li>Integrar o bot ao fluxo de entrada baseado em <code>serviceRequests</code>.</li>
                <li>Migrar gradualmente a coleção legada <code>appointmentRequests</code>.</li>
                <li>Adicionar novas telas sem reabrir a organização central do domínio.</li>
              </ul>
            </article>
          </div>
        </>
      )}
    </section>
  );
}
