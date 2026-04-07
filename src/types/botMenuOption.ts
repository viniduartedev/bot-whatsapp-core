export const BOT_MENU_OPTION_KEYS = ['schedule', 'hours', 'address', 'human'] as const;
export type BotMenuOptionKey = (typeof BOT_MENU_OPTION_KEYS)[number];

export interface BotMenuOption {
  key: BotMenuOptionKey;
  label: string;
  enabled: boolean;
}

export const BOT_MENU_OPTION_META: Record<
  BotMenuOptionKey,
  { title: string; description: string }
> = {
  schedule: {
    title: 'Agendamento',
    description: 'Opção principal para solicitar atendimento ou agendamento.'
  },
  hours: {
    title: 'Horário',
    description: 'Mensagem com horário de atendimento do negócio.'
  },
  address: {
    title: 'Endereço',
    description: 'Mensagem com endereço ou localização principal.'
  },
  human: {
    title: 'Equipe',
    description: 'Canal para pedir retorno humano sem prometer atendimento imediato.'
  }
};

export const DEFAULT_BOT_MENU_OPTIONS: readonly BotMenuOption[] = [
  { key: 'schedule', label: 'Agendar atendimento', enabled: true },
  { key: 'hours', label: 'Horário de atendimento', enabled: true },
  { key: 'address', label: 'Endereço', enabled: true },
  { key: 'human', label: 'Falar com a equipe', enabled: true }
] as const;

export function cloneDefaultBotMenuOptions(): BotMenuOption[] {
  return DEFAULT_BOT_MENU_OPTIONS.map((option) => ({ ...option }));
}
