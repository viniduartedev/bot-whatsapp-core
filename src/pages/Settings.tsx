import { SectionCard } from '../components/common/SectionCard';
import { PageHeader } from '../components/layout/PageHeader';

export function SettingsPage() {
  return (
    <section className="page-section">
      <PageHeader
        eyebrow="Control plane"
        title="Settings"
        description="Área reservada para autenticação, perfis, ambiente e controles administrativos das próximas etapas."
      />

      <SectionCard
        title="Próxima etapa"
        description="O painel já está organizado para receber login/autenticação sem reabrir a base visual."
      >
        <div className="empty-state">
          <h3>Espaço preparado para auth</h3>
          <p>
            Nesta fase o foco foi observabilidade e operação. A autenticação entra em seguida sem
            necessidade de quebrar o layout.
          </p>
        </div>
      </SectionCard>
    </section>
  );
}
