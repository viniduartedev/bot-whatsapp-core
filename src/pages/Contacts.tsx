import { useCallback } from 'react';
import { DataTable, type DataTableColumn } from '../components/common/DataTable';
import { EmptyState } from '../components/common/EmptyState';
import { SectionCard } from '../components/common/SectionCard';
import { PageHeader } from '../components/layout/PageHeader';
import { formatUnknownDateTime } from '../core/mappers/display';
import type { Contact } from '../core/entities';
import { useProjectContext } from '../context/ProjectContext';
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
  const { activeProject, activeProjectId } = useProjectContext();
  const { data: contacts, loading, error, refetch } = useCollectionQuery(
    useCallback(
      () => (activeProjectId ? getContacts(activeProjectId) : Promise.resolve([])),
      [activeProjectId]
    ),
    'Erro ao carregar contatos.'
  );

  return (
    <section className="page-section">
      <PageHeader
        eyebrow="Relacionamento operacional"
        title="Contatos"
        description={
          activeProject
            ? `Contatos pertencentes ao projeto ${activeProject.slug}, prontos para relacionamento operacional e integração futura.`
            : 'Selecione um projeto para ver os contatos do tenant ativo.'
        }
        actions={
          <button type="button" onClick={() => void refetch()}>
            Atualizar contatos
          </button>
        }
      />

      {loading && <p className="state">Carregando contatos...</p>}

      {!loading && error && <p className="state error">Erro ao carregar dados: {error}</p>}

      {!loading && !error && !activeProject && (
        <SectionCard
          title="Projeto obrigatório"
          description="Contacts sempre pertencem a um Project."
        >
          <EmptyState
            title="Selecione um projeto"
            description="Use o seletor do topo para operar os contatos dentro do contexto correto."
          />
        </SectionCard>
      )}

      {!loading && !error && activeProject && (
        <SectionCard
          title="Contacts registry"
          description="Visão operacional dos contatos vinculados ao projeto ativo."
        >
          {contacts.length === 0 ? (
            <EmptyState
              title="Nenhum contato encontrado"
              description="Os contatos aparecerão aqui quando o Core receber tráfego e relacionamento."
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
