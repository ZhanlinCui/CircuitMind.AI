import { Project, ProjectCreateInput, ProjectStatus, ProjectSolution } from '../domain/project';
import { createId, createEmptyWorkflow } from '../domain/workflow';
import { loadFromLocalStorage, saveToLocalStorage } from './storage';

const PROJECTS_STORAGE_KEY = 'pcbtool.projects.v1';

interface ProjectsSnapshotV1 {
  projects: Project[];
}

function createEmptySnapshot(): ProjectsSnapshotV1 {
  return { projects: [] };
}

function normalizeStatus(status: string): ProjectStatus {
  if (
    status === 'draft' ||
    status === 'generating' ||
    status === 'in_progress' ||
    status === 'completed' ||
    status === 'archived'
  ) {
    return status;
  }
  return 'draft';
}

export function listProjects(): Project[] {
  const snapshot = loadFromLocalStorage<ProjectsSnapshotV1>(PROJECTS_STORAGE_KEY) ?? createEmptySnapshot();
  return snapshot.projects
    .map((p) => ({
      ...p,
      status: normalizeStatus(p.status),
      workflow: p.workflow ?? createEmptyWorkflow(),
      components: p.components ?? [],
      solutions: p.solutions ?? [],
      solutionsUpdatedAtMs: p.solutionsUpdatedAtMs ?? p.updatedAtMs,
    }))
    .sort((a, b) => b.updatedAtMs - a.updatedAtMs);
}

export function getProjectById(projectId: string): Project | undefined {
  return listProjects().find((p) => p.id === projectId);
}

export function upsertProjectFromCreateInput(input: ProjectCreateInput, projectId?: string): Project {
  const now = Date.now();
  const snapshot = loadFromLocalStorage<ProjectsSnapshotV1>(PROJECTS_STORAGE_KEY) ?? createEmptySnapshot();
  const existingIndex = projectId ? snapshot.projects.findIndex((p) => p.id === projectId) : -1;

  const nextProject: Project = {
    id: projectId ?? createId('proj'),
    name: input.name,
    description: input.description,
    requirementsText: input.requirementsText,
    coverImageDataUrl: input.coverImageDataUrl,
    workflow: input.workflow,
    components:
      input.components ??
      (existingIndex >= 0 ? snapshot.projects[existingIndex].components ?? [] : []),
    solutions: existingIndex >= 0 ? snapshot.projects[existingIndex].solutions ?? [] : [],
    solutionsUpdatedAtMs: existingIndex >= 0 ? snapshot.projects[existingIndex].solutionsUpdatedAtMs : undefined,
    status: existingIndex >= 0 ? snapshot.projects[existingIndex].status : 'draft',
    createdAtMs: existingIndex >= 0 ? snapshot.projects[existingIndex].createdAtMs : now,
    updatedAtMs: now,
  };

  if (existingIndex >= 0) {
    snapshot.projects = snapshot.projects.map((p) => (p.id === nextProject.id ? nextProject : p));
  } else {
    snapshot.projects = [nextProject, ...snapshot.projects];
  }

  saveToLocalStorage(PROJECTS_STORAGE_KEY, snapshot);
  return nextProject;
}

export function setProjectStatus(projectId: string, status: ProjectStatus): void {
  const snapshot = loadFromLocalStorage<ProjectsSnapshotV1>(PROJECTS_STORAGE_KEY) ?? createEmptySnapshot();
  snapshot.projects = snapshot.projects.map((p) =>
    p.id === projectId ? { ...p, status, updatedAtMs: Date.now() } : p,
  );
  saveToLocalStorage(PROJECTS_STORAGE_KEY, snapshot);
}

export function deleteProject(projectId: string): void {
  const snapshot = loadFromLocalStorage<ProjectsSnapshotV1>(PROJECTS_STORAGE_KEY) ?? createEmptySnapshot();
  snapshot.projects = snapshot.projects.filter((p) => p.id !== projectId);
  saveToLocalStorage(PROJECTS_STORAGE_KEY, snapshot);
}

export function setProjectSolutions(projectId: string, solutions: ProjectSolution[]): void {
  const snapshot = loadFromLocalStorage<ProjectsSnapshotV1>(PROJECTS_STORAGE_KEY) ?? createEmptySnapshot();
  snapshot.projects = snapshot.projects.map((p) =>
    p.id === projectId
      ? {
        ...p,
        solutions,
        solutionsUpdatedAtMs: Date.now(),
        updatedAtMs: Date.now(),
      }
      : p,
  );
  saveToLocalStorage(PROJECTS_STORAGE_KEY, snapshot);
}
