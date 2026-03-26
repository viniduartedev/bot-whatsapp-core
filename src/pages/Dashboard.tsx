import { FunnelCard } from '../components/dashboard/FunnelCard';
import { HealthStatusCard } from '../components/dashboard/HealthStatusCard';
import { MetricCard } from '../components/dashboard/MetricCard';
import { RecentErrorsPanel } from '../components/dashboard/RecentErrorsPanel';
import { RecentEventsTable } from '../components/dashboard/RecentEventsTable';
import { PageHeader } from '../components/layout/PageHeader';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';

export function Dashboard() {
  const { metrics, funnel, health, recentEvents, recentErrors, loading, error, refetch } =
    useDashboardMetrics();

  return (
    <section className="page-section">
      <PageHeader
        eyebrow="Ops Center"
        title="Central operacional do core"
        description="Painel DevOps / Ops Center preparado para observabilidade, múltiplos bots e múltiplos projetos nas próximas fases."
        actions={
          <button type="button" onClick={() => void refetch()}>
            Atualizar dashboard
          </button>
        }
      />

      {loading && <p className="state">Carregando indicadores...</p>}

      {!loading && error && <p className="state error">Erro ao carregar indicadores: {error}</p>}

      {!loading && !error && (
        <>
          <div className="metric-grid">
            <MetricCard
              label="Projects"
              value={metrics.projects}
              description="Projetos cadastrados no orquestrador."
              tone="neutral"
            />
            <MetricCard
              label="Inbound Events"
              value={metrics.inboundEvents}
              description="Sinais recebidos pelo ecossistema do bot."
              tone="info"
            />
            <MetricCard
              label="Inbound hoje"
              value={metrics.inboundEventsToday}
              description="Volume observado no dia corrente."
              tone="neutral"
            />
            <MetricCard
              label="Service Requests"
              value={metrics.serviceRequests}
              description="Fila operacional principal do core."
              tone="warning"
            />
            <MetricCard
              label="Appointments"
              value={metrics.appointments}
              description="Conversões confirmadas em agenda."
              tone="success"
            />
            <MetricCard
              label="Erros"
              value={metrics.errors}
              description="Eventos em falha com prioridade operacional."
              tone="danger"
            />
            <MetricCard
              label="Conexões ativas"
              value={metrics.activeConnections}
              description="Integrações externas habilitadas por projeto."
              tone="warning"
            />
          </div>

          <div className="dashboard-grid dashboard-grid--balanced">
            <HealthStatusCard
              botStatus={health.botStatus}
              coreStatus={health.coreStatus}
              lastEventAt={health.lastEventAt}
              lastEventType={health.lastEventType}
              message={health.message}
            />
            <FunnelCard
              inboundEvents={funnel.inboundEvents}
              serviceRequests={funnel.serviceRequests}
              appointments={funnel.appointments}
            />
          </div>

          <div className="dashboard-grid">
            <RecentEventsTable events={recentEvents} />
            <RecentErrorsPanel events={recentErrors} />
          </div>
        </>
      )}
    </section>
  );
}
