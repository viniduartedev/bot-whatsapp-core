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
  { to: '/events', label: 'Events', code: 'EV', description: 'Stream técnico do bot' },
  {
    to: '/service-requests',
    label: 'Service Requests',
    code: 'SR',
    description: 'Entrada principal do core'
  },
  {
    to: '/appointments',
    label: 'Appointments',
    code: 'AP',
    description: 'Conversões e agendamentos'
  },
  { to: '/contacts', label: 'Contacts', code: 'CT', description: 'Relacionamento operacional' },
  { to: '/projects', label: 'Projects', code: 'PR', description: 'Projetos e escopo do core' },
  { to: '/settings', label: 'Settings', code: 'ST', description: 'Infra e autenticação futura' }
];

const pageMetaMap: Record<string, PageMeta> = {
  '/dashboard': {
    title: 'Dashboard',
    subtitle: 'Centro operacional do core com saúde, funil e sinais recentes do sistema.',
    kicker: 'Ops overview'
  },
  '/events': {
    title: 'Events',
    subtitle: 'Leitura técnica dos inbound events para observabilidade do fluxo do bot.',
    kicker: 'Event stream'
  },
  '/service-requests': {
    title: 'Service Requests',
    subtitle: 'Fila operacional principal para triagem, confirmação e evolução do atendimento.',
    kicker: 'Operational queue'
  },
  '/appointments': {
    title: 'Appointments',
    subtitle: 'Agenda gerada pelo core a partir das service requests confirmadas.',
    kicker: 'Converted flow'
  },
  '/contacts': {
    title: 'Contacts',
    subtitle: 'Base operacional de pessoas atendidas pelo core e pelos bots futuros.',
    kicker: 'Relationship layer'
  },
  '/projects': {
    title: 'Projects',
    subtitle: 'Projetos e ambientes que estruturam a expansão para múltiplos contextos.',
    kicker: 'Core scope'
  },
  '/project-connections': {
    title: 'Project Connections',
    subtitle: 'Integrações externas por projeto para o core evoluir como orquestrador.',
    kicker: 'External orchestration'
  },
  '/settings': {
    title: 'Settings',
    subtitle: 'Área reservada para autenticação, perfis e controles futuros do painel.',
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
