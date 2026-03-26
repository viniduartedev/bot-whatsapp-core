import { DataTable, type DataTableColumn } from '../components/common/DataTable';
import { EmptyState } from '../components/common/EmptyState';
import { SectionCard } from '../components/common/SectionCard';
import { PageHeader } from '../components/layout/PageHeader';
import { formatUnknownDateTime } from '../core/mappers/display';
import type { Contact } from '../core/entities';
import { useCollectionQuery } from '../hooks/useCollectionQuery';
import { getContacts } from '../services/firestore/contacts';

const columns: DataTableColumn<Contact>[] = [
  {
    id: 'name',
    header: 'Nome',
    cell: (contact) => contact.name || 'Contato sem nome'
  },
  {
    id: 'phone',
    header: 'Telefone',
    cell: (contact) => contact.phone || '-'
  },
  {
    id: 'projectId',
    header: 'Projeto',
    cell: (contact) => contact.projectId
  },
  {
    id: 'channel',
    header: 'Canal',
    cell: (contact) => contact.channel
  },
  {
    id: 'lastInteractionAt',
    header: 'Última interação',
    cell: (contact) => formatUnknownDateTime(contact.lastInteractionAt)
  },
  {
    id: 'createdAt',
    header: 'Criado em',
    cell: (contact) => formatUnknownDateTime(contact.createdAt)
  }
];

export function ContactsPage() {
  const { data: contacts, loading, error, refetch } = useCollectionQuery(
    getContacts,
    'Erro ao carregar contatos.'
  );

  return (
    <section className="page-section">
      <PageHeader
        eyebrow="Relacionamento operacional"
        title="Contatos"
        description="Base limpa para leitura rápida de pessoas, canal e última interação dentro do core."
        actions={
          <button type="button" onClick={() => void refetch()}>
            Atualizar contatos
          </button>
        }
      />

      {loading && <p className="state">Carregando contatos...</p>}

      {!loading && error && <p className="state error">Erro ao carregar dados: {error}</p>}

      {!loading && !error && (
        <SectionCard
          title="Contacts registry"
          description="Visão operacional de contatos para atendimento, bots e integração futura."
        >
          {contacts.length === 0 ? (
            <EmptyState
              title="Nenhum contato encontrado"
              description="Os contatos aparecerão aqui quando o core receber tráfego e relacionamento."
            />
          ) : (
            <DataTable
              items={contacts}
              columns={columns}
              getRowKey={(contact) => contact.id}
              caption="Lista de contatos"
            />
          )}
        </SectionCard>
      )}
    </section>
  );
}
