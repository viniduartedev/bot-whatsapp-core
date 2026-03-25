import { DataTable, type DataTableColumn } from '../components/DataTable';
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
      <header className="page-header">
        <div>
          <p className="eyebrow">Relacionamento</p>
          <h1>Contatos</h1>
          <p>
            A base de contatos prepara o core para métricas de uso, histórico de interação e
            futuras integrações com o bot.
          </p>
        </div>
        <button type="button" onClick={() => void refetch()}>
          Atualizar
        </button>
      </header>

      {loading && <p className="state">Carregando contatos...</p>}

      {!loading && error && <p className="state error">Erro ao carregar dados: {error}</p>}

      {!loading && !error && contacts.length === 0 && (
        <p className="state">Nenhum contato encontrado.</p>
      )}

      {!loading && !error && contacts.length > 0 && (
        <DataTable
          items={contacts}
          columns={columns}
          getRowKey={(contact) => contact.id}
          caption="Lista de contatos"
        />
      )}
    </section>
  );
}
