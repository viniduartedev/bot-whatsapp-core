import { EmptyState } from '../components/common/EmptyState';
import { SectionCard } from '../components/common/SectionCard';
import { FunnelCard } from '../components/dashboard/FunnelCard';
import { HealthStatusCard } from '../components/dashboard/HealthStatusCard';
import { MetricCard } from '../components/dashboard/MetricCard';
import { RecentIntegrationLogsPanel } from '../components/dashboard/RecentIntegrationLogsPanel';
import { RecentEventsTable } from '../components/dashboard/RecentEventsTable';
import { PageHeader } from '../components/layout/PageHeader';
import { useProjectContext } from '../context/ProjectContext';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';

export function Dashboard() {
  const { activeProject, activeProjectId, loading: projectLoading } = useProjectContext();
  const { metrics, funnel, health, recentEvents, recentIntegrationErrors, loading, error, refetch } =
    useDashboardMetrics(activeProjectId || undefined);

  return (
    <section className="page-section">
      <PageHeader
        eyebrow="Ops Center"
        title={activeProject ? `Dashboard de ${activeProject.name}` : 'Central operacional do Core'}
        description={
          activeProject
            ? `Visão operacional do projeto ${activeProject.slug}, com foco em fila, integrações outbound e observabilidade por tenant.`
            : 'Selecione ou crie um projeto para operar o Core por contexto multi-tenant.'
        }
        actions={
          <button type="button" onClick={() => void refetch()}>
            Atualizar dashboard
          </button>
        }
      />

      {loading && <p className="state">Carregando indicadores...</p>}

      {!loading && error && <p className="state error">Erro ao carregar indicadores: {error}</p>}

      {!projectLoading && !activeProject && (
        <SectionCard
          title="Nenhum projeto ativo"
          description="O dashboard do Core sempre opera por contexto de projeto."
        >
          <EmptyState
            title="Selecione um projeto"
            description="Use o seletor no topo ou crie um novo projeto na tela Projects para começar."
          />
        </SectionCard>
      )}

      {!loading && !error && activeProject && (
        <>
          <div className="metric-grid">
            <MetricCard
              label="Inbound Events"
              value={metrics.inboundEvents}
              description="Sinais recebidos pelo projeto ativo."
              tone="info"
            />
            <MetricCard
              label="Service Requests"
              value={metrics.serviceRequests}
              description="Fila operacional total do projeto."
              tone="warning"
            />
            <MetricCard
              label="Em análise"
              value={metrics.pendingRequests}
              description="Solicitações ainda aguardando triagem ou decisão."
              tone="neutral"
            />
            <MetricCard
              label="Integradas"
              value={metrics.integratedRequests}
              description="Solicitações já aceitas pelo sistema externo."
              tone="success"
            />
            <MetricCard
              label="Integration Events"
              value={metrics.integrationEvents}
              description="Eventos outbound registrados pelo Core."
              tone="info"
            />
            <MetricCard
              label="Erros outbound"
              value={metrics.integrationErrors}
              description="Falhas recentes nas integrações do projeto."
              tone="danger"
            />
            <MetricCard
              label="Conexões ativas"
              value={metrics.activeConnections}
              description="ProjectConnections prontas para despacho outbound."
              tone="warning"
            />
          </div>

          <div className="dashboard-grid dashboard-grid--balanced">
            <HealthStatusCard
              botStatus={health.botStatus}
              integrationStatus={health.integrationStatus}
              coreStatus={health.coreStatus}
              lastInboundEventAt={health.lastInboundEventAt}
              lastInboundEventType={health.lastInboundEventType}
              lastIntegrationAt={health.lastIntegrationAt}
              message={health.message}
            />
            <FunnelCard
              inboundEvents={funnel.inboundEvents}
              serviceRequests={funnel.serviceRequests}
              integrationEvents={funnel.integrationEvents}
              integratedRequests={funnel.integratedRequests}
            />
          </div>

          <div className="dashboard-grid">
            <RecentEventsTable events={recentEvents} />
            <RecentIntegrationLogsPanel logs={recentIntegrationErrors} />
          </div>
        </>
      )}
    </section>
  );
}
