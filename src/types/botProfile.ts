import type { BotProfileTone } from '../core/constants/domain';
import { cloneDefaultBotMenuOptions, type BotMenuOption } from './botMenuOption';

export interface BotProfileDraft {
  assistantName: string;
  businessName: string;
  welcomeMessage: string;
  closingMessage: string;
  tone: BotProfileTone;
  active: boolean;
  menuOptions: BotMenuOption[];
}

// `BotProfile` é a configuração principal do bot por projeto nesta etapa.
// O foco agora é permitir personalizar identidade, mensagens e menu principal
// sem criar um builder dinâmico completo; fluxos mais avançados vêm depois.
export interface BotProfile extends BotProfileDraft {
  id: string;
  projectId: string;
  createdAt: unknown;
  updatedAt: unknown;
}

export function buildDefaultBotProfileDraft(
  businessName = 'Seu negócio',
  assistantName = 'Clara'
): BotProfileDraft {
  const normalizedBusinessName = businessName.trim() || 'Seu negócio';
  const normalizedAssistantName = assistantName.trim() || 'Clara';

  return {
    assistantName: normalizedAssistantName,
    businessName: normalizedBusinessName,
    welcomeMessage:
      `Olá! Aqui é a ${normalizedAssistantName}, assistente virtual da ` +
      `${normalizedBusinessName}. Como posso te ajudar hoje?`,
    closingMessage: 'Nossa equipe vai continuar seu atendimento em breve.',
    tone: 'professional',
    active: true,
    menuOptions: cloneDefaultBotMenuOptions()
  };
}
