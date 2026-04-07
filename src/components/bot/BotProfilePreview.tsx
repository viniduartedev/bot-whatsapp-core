import { StatusBadge, type StatusBadgeTone } from '../common/StatusBadge';
import type { BotProfileDraft } from '../../types/botProfile';

interface BotProfilePreviewProps {
  profile: BotProfileDraft;
}

function getToneBadgeTone(tone: BotProfileDraft['tone']): StatusBadgeTone {
  switch (tone) {
    case 'professional':
      return 'info';
    case 'friendly':
      return 'success';
    case 'neutral':
      return 'neutral';
  }
}

export function BotProfilePreview({ profile }: BotProfilePreviewProps) {
  const enabledMenuOptions = profile.menuOptions.filter((option) => option.enabled);

  return (
    <div className="bot-preview">
      <div className="bot-preview__device">
        <div className="bot-preview__topbar">
          <div>
            <strong>{profile.businessName || 'Seu negócio'}</strong>
            <span>{profile.assistantName || 'Assistente virtual'}</span>
          </div>
          <div className="bot-preview__badges">
            <StatusBadge
              label={profile.active ? 'active' : 'inactive'}
              tone={profile.active ? 'success' : 'neutral'}
            />
            <StatusBadge label={profile.tone} tone={getToneBadgeTone(profile.tone)} />
          </div>
        </div>

        <div className="bot-preview__chat">
          <div className="bot-bubble bot-bubble--assistant">
            <span className="bot-bubble__author">{profile.assistantName || 'Assistente'}</span>
            <p>{profile.welcomeMessage || 'Mensagem de boas-vindas ainda não configurada.'}</p>
          </div>

          <div className="bot-bubble bot-bubble--menu">
            <span className="bot-bubble__author">Menu principal</span>

            {enabledMenuOptions.length === 0 ? (
              <p>Nenhuma opção ativa no menu no momento.</p>
            ) : (
              <ul className="bot-preview__menu-list">
                {enabledMenuOptions.map((option, index) => (
                  <li key={option.key}>
                    <span>{index + 1}</span>
                    <strong>{option.label}</strong>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bot-bubble bot-bubble--assistant bot-bubble--closing">
            <span className="bot-bubble__author">{profile.assistantName || 'Assistente'}</span>
            <p>{profile.closingMessage || 'Mensagem final ainda não configurada.'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
