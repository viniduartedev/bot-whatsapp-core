interface NavigationItem {
  to: string;
  label: string;
  code: string;
  description: string;
}

interface PageMeta {
  title: string;
  subtitle: string;
  kicker: string;
}

export const opsNavigation: NavigationItem[] = [
  { to: '/dashboard', label: 'Dashboard', code: 'DB', description: 'Visão operacional central' },
  {
    to: '/events',
    label: 'Inbound Events',
    code: 'EV',
    description: 'Sinais recebidos por projeto'
  },
  {
    to: '/service-requests',
    label: 'Service Requests',
    code: 'SR',
    description: 'Entrada principal do core'
  },
  {
    to: '/integrations',
    label: 'Integrations',
    code: 'IG',
    description: 'Eventos e logs outbound'
  },
  { to: '/contacts', label: 'Contacts', code: 'CT', description: 'Relacionamento operacional' },
  { to: '/projects', label: 'Projects', code: 'PR', description: 'Projetos e escopo do core' },
  {
    to: '/bot-settings',
    label: 'Bot Settings',
    code: 'BT',
    description: 'Perfil conversacional por projeto'
  },
  {
    to: '/project-connections',
    label: 'Connections',
    code: 'PC',
    description: 'Integrações subordinadas ao projeto'
  },
  {
    to: '/appointments',
    label: 'Mirrors',
    code: 'AM',
    description: 'Espelhos locais opcionais'
  },
  { to: '/settings', label: 'Settings', code: 'ST', description: 'Infra e autenticação futura' }
];

const pageMetaMap: Record<string, PageMeta> = {
  '/dashboard': {
    title: 'Dashboard',
    subtitle: 'Centro operacional do projeto ativo com saúde, funil e integração outbound observável.',
    kicker: 'Ops overview'
  },
  '/events': {
    title: 'Inbound Events',
    subtitle: 'Leitura técnica dos eventos de entrada recebidos pelo Core dentro do projeto ativo.',
    kicker: 'Inbound stream'
  },
  '/service-requests': {
    title: 'Service Requests',
    subtitle: 'Fila operacional do projeto ativo com confirmação e integração outbound oficial.',
    kicker: 'Operational queue'
  },
  '/integrations': {
    title: 'Integrations',
    subtitle: 'Observabilidade outbound com integration events, logs e conexões do projeto ativo.',
    kicker: 'Outbound orchestration'
  },
  '/appointments': {
    title: 'Appointment Mirrors',
    subtitle: 'Espelhos operacionais locais, sem substituir a fonte de verdade do sistema externo.',
    kicker: 'Local mirror'
  },
  '/contacts': {
    title: 'Contacts',
    subtitle: 'Base operacional de contatos pertencentes ao projeto ativo.',
    kicker: 'Relationship layer'
  },
  '/projects': {
    title: 'Projects',
    subtitle: 'Projects como raiz do contexto multi-tenant e ponto de partida para conexões.',
    kicker: 'Core scope'
  },
  '/bot-settings': {
    title: 'Bot Settings',
    subtitle: 'Configuração principal do bot por projeto com identidade, mensagens, menu e preview pronto para operação.',
    kicker: 'Conversational config'
  },
  '/project-connections': {
    title: 'Project Connections',
    subtitle: 'Conexões outbound subordinadas ao projeto ativo, prontas para integrar sistemas externos.',
    kicker: 'External orchestration'
  },
  '/settings': {
    title: 'Settings',
    subtitle: 'Área reservada para autenticação, perfis e políticas de autorização por tenant.',
    kicker: 'Control plane'
  },
  '/legacy-requests': {
    title: 'Legacy Requests',
    subtitle: 'Acesso temporário ao fluxo legado enquanto a migração do core continua.',
    kicker: 'Legacy bridge'
  }
};

export function getPageMeta(pathname: string): PageMeta {
  return pageMetaMap[pathname] ?? pageMetaMap['/dashboard'];
}
