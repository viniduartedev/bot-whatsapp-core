import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import type { Project } from '../core/entities';
import { getProjects } from '../services/firestore/projects';

interface ProjectContextValue {
  projects: Project[];
  activeProject: Project | null;
  activeProjectId: string;
  loading: boolean;
  error: string | null;
  setActiveProjectId: (projectId: string) => void;
  refetchProjects: () => Promise<void>;
}

const ACTIVE_PROJECT_STORAGE_KEY = 'core.activeProjectId';

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

function getStoredProjectId(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.localStorage.getItem(ACTIVE_PROJECT_STORAGE_KEY) ?? '';
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectIdState] = useState<string>(getStoredProjectId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setActiveProjectId = useCallback((projectId: string) => {
    setActiveProjectIdState(projectId);

    if (typeof window !== 'undefined') {
      if (projectId) {
        window.localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, projectId);
      } else {
        window.localStorage.removeItem(ACTIVE_PROJECT_STORAGE_KEY);
      }
    }
  }, []);

  const refetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await getProjects();
      setProjects(items);
      setActiveProjectIdState((current) => {
        const currentStillExists = items.some((project) => project.id === current);

        if (currentStillExists) {
          return current;
        }

        const nextProjectId =
          items.find((project) => project.status === 'active')?.id ?? items[0]?.id ?? '';

        if (typeof window !== 'undefined') {
          if (nextProjectId) {
            window.localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, nextProjectId);
          } else {
            window.localStorage.removeItem(ACTIVE_PROJECT_STORAGE_KEY);
          }
        }

        return nextProjectId;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar projetos.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetchProjects();
  }, [refetchProjects]);

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? null,
    [activeProjectId, projects]
  );

  const value = useMemo<ProjectContextValue>(
    () => ({
      projects,
      activeProject,
      activeProjectId,
      loading,
      error,
      setActiveProjectId,
      refetchProjects
    }),
    [activeProject, activeProjectId, error, loading, projects, refetchProjects, setActiveProjectId]
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProjectContext(): ProjectContextValue {
  const context = useContext(ProjectContext);

  if (!context) {
    throw new Error('useProjectContext deve ser usado dentro de ProjectProvider.');
  }

  return context;
}
