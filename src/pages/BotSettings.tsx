import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BotProfilePreview } from '../components/bot/BotProfilePreview';
import { EmptyState } from '../components/common/EmptyState';
import { SectionCard } from '../components/common/SectionCard';
import { StatusBadge, type StatusBadgeTone } from '../components/common/StatusBadge';
import { PageHeader } from '../components/layout/PageHeader';
import { useProjectContext } from '../context/ProjectContext';
import {
  getBotProfileByProject,
  upsertBotProfileByProject
} from '../services/firestore/botProfiles';
import {
  BOT_MENU_OPTION_KEYS,
  BOT_MENU_OPTION_META,
  type BotMenuOptionKey
} from '../types/botMenuOption';
import {
  buildDefaultBotProfileDraft,
  type BotProfile,
  type BotProfileDraft
} from '../types/botProfile';

interface ActionFeedback {
  tone: 'success' | 'error';
  message: string;
}

function cloneDraft(draft: BotProfileDraft): BotProfileDraft {
  return {
    ...draft,
    menuOptions: draft.menuOptions.map((option) => ({ ...option }))
  };
}

function toDraft(profile: BotProfile): BotProfileDraft {
  return cloneDraft({
    assistantName: profile.assistantName,
    businessName: profile.businessName,
    welcomeMessage: profile.welcomeMessage,
    closingMessage: profile.closingMessage,
    tone: profile.tone,
    active: profile.active,
    menuOptions: profile.menuOptions
  });
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

export function BotSettingsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    projects,
    activeProject,
    activeProjectId,
    loading: projectsLoading,
    error: projectsError,
    setActiveProjectId
  } = useProjectContext();

  const selectedProjectId = searchParams.get('projectId') ?? activeProjectId;
  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  const [profileExists, setProfileExists] = useState(false);
  const [savedState, setSavedState] = useState<BotProfileDraft | null>(null);
  const [formState, setFormState] = useState<BotProfileDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<ActionFeedback | null>(null);

  useEffect(() => {
    if (!selectedProjectId || selectedProjectId === activeProjectId) {
      return;
    }

    setActiveProjectId(selectedProjectId);
  }, [activeProjectId, selectedProjectId, setActiveProjectId]);

  useEffect(() => {
    let cancelled = false;

    async function loadBotProfile() {
      if (!selectedProjectId) {
        setProfileExists(false);
        setSavedState(null);
        setFormState(null);
        setError(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const profile = await getBotProfileByProject(selectedProjectId);
        const nextDraft = profile
          ? toDraft(profile)
          : buildDefaultBotProfileDraft(selectedProject?.name ?? activeProject?.name ?? '');

        if (cancelled) {
          return;
        }

        setProfileExists(Boolean(profile));
        setSavedState(cloneDraft(nextDraft));
        setFormState(cloneDraft(nextDraft));
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        const message =
          loadError instanceof Error
            ? loadError.message
            : 'Não foi possível carregar as configurações do bot.';

        setError(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadBotProfile();

    return () => {
      cancelled = true;
    };
  }, [activeProject?.name, selectedProject?.name, selectedProjectId]);

  const isDirty =
    formState && savedState ? JSON.stringify(formState) !== JSON.stringify(savedState) : false;

  function updateField<Key extends keyof BotProfileDraft>(
    key: Key,
    value: BotProfileDraft[Key]
  ) {
    setFormState((current) =>
      current
        ? {
            ...current,
            [key]: value
          }
        : current
    );
  }

  function updateMenuOption(
    key: BotMenuOptionKey,
    patch: Partial<BotProfileDraft['menuOptions'][number]>
  ) {
    setFormState((current) =>
      current
        ? {
            ...current,
            menuOptions: current.menuOptions.map((option) =>
              option.key === key ? { ...option, ...patch } : option
            )
          }
        : current
    );
  }

  function handleReset() {
    if (!savedState) {
      return;
    }

    setFormState(cloneDraft(savedState));
    setFeedback(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedProjectId || !formState) {
      setFeedback({
        tone: 'error',
        message: 'Selecione um projeto válido para salvar o BotProfile.'
      });
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);
      await upsertBotProfileByProject(selectedProjectId, formState);
      const persistedDraft = cloneDraft(formState);
      setSavedState(persistedDraft);
      setFormState(cloneDraft(persistedDraft));
      setProfileExists(true);
      setFeedback({
        tone: 'success',
        message:
          'BotProfile salvo com sucesso. O projeto agora tem uma configuração principal de bot pronta para ser lida pelo canal.'
      });
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : 'Não foi possível salvar as configurações do bot.';

      setFeedback({
        tone: 'error',
        message
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page-section">
      <PageHeader
        eyebrow="Configuração conversacional"
        title="Bot Settings"
        description={
          selectedProject
            ? `Configuração principal do bot para o projeto ${selectedProject.name}. Nesta fase o foco é identidade, mensagens e menu principal por tenant.`
            : 'Selecione um projeto para configurar o BotProfile principal do tenant.'
        }
        actions={
          <div className="page-header__actions">
            <button type="button" className="button-inline" onClick={() => navigate('/projects')}>
              Ver projetos
            </button>
            {selectedProject && (
              <button
                type="button"
                className="button-inline"
                onClick={() => setSearchParams({ projectId: selectedProject.id })}
              >
                Fixar projeto
              </button>
            )}
          </div>
        }
      />

      {feedback && (
        <p className={feedback.tone === 'success' ? 'state success' : 'state error'}>
          {feedback.message}
        </p>
      )}

      {isDirty && !saving && (
        <p className="state info">
          Existem alterações locais não salvas neste BotProfile.
        </p>
      )}

      {(projectsLoading || loading) && <p className="state">Carregando Bot Settings...</p>}

      {!projectsLoading && !loading && (projectsError || error) && (
        <p className="state error">Erro ao carregar dados: {projectsError ?? error}</p>
      )}

      {!projectsLoading && !loading && !projectsError && !error && !selectedProject && (
        <SectionCard
          title="Projeto obrigatório"
          description="BotProfile sempre nasce subordinado a um Project."
        >
          <EmptyState
            title="Selecione um projeto"
            description="Use o seletor do topo ou abra a tela Projects para criar/ativar um projeto antes de configurar o bot."
          />
        </SectionCard>
      )}

      {!projectsLoading && !loading && !projectsError && !error && selectedProject && formState && (
        <>
          <SectionCard
            title="Projeto alvo"
            description="`BotProfile` prepara o caminho para um bot configurável por cliente sem introduzir um builder complexo nesta etapa."
            aside={
              <div className="bot-settings-summary__badges">
                <StatusBadge
                  label={formState.active ? 'active' : 'inactive'}
                  tone={formState.active ? 'success' : 'neutral'}
                />
                <StatusBadge label={formState.tone} tone={getToneBadgeTone(formState.tone)} />
              </div>
            }
          >
            <div className="scope-summary">
              <strong>{selectedProject.name}</strong>
              <span>{selectedProject.slug}</span>
            </div>
            {!profileExists && (
              <p className="section-card__message">
                Ainda não existe um BotProfile salvo para este projeto. O formulário abaixo já
                começa com um default operacional para acelerar a configuração.
              </p>
            )}
          </SectionCard>

          <div className="bot-settings-layout">
            <SectionCard
              title="Configuração do bot"
              description="Ajuste identidade, tom, mensagens e opções principais. Fluxos mais ricos e variações avançadas entram depois."
            >
              <form className="form-grid bot-settings-form" onSubmit={handleSubmit}>
                <label className="form-field">
                  <span>assistantName</span>
                  <input
                    value={formState.assistantName}
                    onChange={(event) => updateField('assistantName', event.target.value)}
                    placeholder="Clara"
                  />
                </label>

                <label className="form-field">
                  <span>businessName</span>
                  <input
                    value={formState.businessName}
                    onChange={(event) => updateField('businessName', event.target.value)}
                    placeholder="Clínica Aurora"
                  />
                </label>

                <label className="form-field">
                  <span>tone</span>
                  <select
                    value={formState.tone}
                    onChange={(event) =>
                      updateField('tone', event.target.value as BotProfileDraft['tone'])
                    }
                  >
                    <option value="professional">professional</option>
                    <option value="friendly">friendly</option>
                    <option value="neutral">neutral</option>
                  </select>
                </label>

                <label className="checkbox-field">
                  <input
                    type="checkbox"
                    checked={formState.active}
                    onChange={(event) => updateField('active', event.target.checked)}
                  />
                  <div>
                    <strong>BotProfile ativo</strong>
                    <span>
                      Quando desligado, o projeto mantém a configuração salva, mas sinaliza que o
                      perfil não deve ser usado pelo bot.
                    </span>
                  </div>
                </label>

                <label className="form-field form-field--full">
                  <span>welcomeMessage</span>
                  <textarea
                    rows={5}
                    value={formState.welcomeMessage}
                    onChange={(event) => updateField('welcomeMessage', event.target.value)}
                    placeholder="Olá! Como posso te ajudar hoje?"
                  />
                </label>

                <label className="form-field form-field--full">
                  <span>closingMessage</span>
                  <textarea
                    rows={4}
                    value={formState.closingMessage}
                    onChange={(event) => updateField('closingMessage', event.target.value)}
                    placeholder="Nossa equipe vai continuar seu atendimento em breve."
                  />
                </label>

                <div className="form-field form-field--full">
                  <span>Menu principal</span>
                  <div className="bot-menu-editor">
                    {BOT_MENU_OPTION_KEYS.map((key) => {
                      const option = formState.menuOptions.find((menuOption) => menuOption.key === key);

                      if (!option) {
                        return null;
                      }

                      return (
                        <div className="bot-menu-row" key={key}>
                          <div className="bot-menu-row__meta">
                            <strong>{BOT_MENU_OPTION_META[key].title}</strong>
                            <small>{BOT_MENU_OPTION_META[key].description}</small>
                          </div>

                          <input
                            value={option.label}
                            onChange={(event) =>
                              updateMenuOption(key, { label: event.target.value })
                            }
                            placeholder={option.label}
                          />

                          <label className="checkbox-inline">
                            <input
                              type="checkbox"
                              checked={option.enabled}
                              onChange={(event) =>
                                updateMenuOption(key, { enabled: event.target.checked })
                              }
                            />
                            <span>enabled</span>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" disabled={saving || !isDirty}>
                    {saving
                      ? 'Salvando...'
                      : profileExists
                        ? 'Salvar alterações'
                        : 'Salvar BotProfile'}
                  </button>
                  <button type="button" className="button-inline" disabled={!isDirty || saving} onClick={handleReset}>
                    Resetar mudanças
                  </button>
                </div>
              </form>
            </SectionCard>

            <SectionCard
              title="Preview"
              description="Visual simples para entender como o perfil do bot vai aparecer no canal."
            >
              <BotProfilePreview profile={formState} />
            </SectionCard>
          </div>
        </>
      )}
    </section>
  );
}
