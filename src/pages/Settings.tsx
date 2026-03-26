import { SectionCard } from '../components/common/SectionCard';
import { PageHeader } from '../components/layout/PageHeader';

export function SettingsPage() {
  return (
    <section className="page-section">
      <PageHeader
        eyebrow="Control plane"
        title="Settings"
        description="Área reservada para autenticação, perfis, políticas por tenant e endurecimento do isolamento multi-tenant nas próximas etapas."
      />

      <SectionCard
        title="Próxima etapa"
        description="O painel agora já opera por `Project` e ficou melhor preparado para receber login/autorização sem reabrir o modelo principal."
      >
        <div className="empty-state">
          <h3>Espaço preparado para auth</h3>
          <p>
            Nesta fase o foco foi consolidar `Project` como raiz multi-tenant e tornar o Core um
            orquestrador observável. Auth entra em seguida para reforçar o isolamento.
          </p>
        </div>
      </SectionCard>
    </section>
  );
}
