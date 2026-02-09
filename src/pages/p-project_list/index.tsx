import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppShell from '../../components/AppShell';
import { Select } from '../../components/ui/select';
import { Project, ProjectStatus } from '../../domain/project';
import { deleteProject, listProjects } from '../../lib/projectsStore';

type StatusOption = {
  value: ProjectStatus | 'all';
  label: string;
};

function formatDateTime(ms: number): string {
  const date = new Date(ms);
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

function getStatusBadge(status: ProjectStatus, t: (key: string) => string): { text: string; className: string } {
  switch (status) {
  case 'draft':
    return { text: t('project_list.filter_draft'), className: 'bg-bg-secondary text-text-secondary' };
  case 'generating':
    return { text: t('project_list.filter_generating'), className: 'bg-info bg-opacity-10 text-info' };
  case 'in_progress':
    return { text: t('project_list.filter_in_progress'), className: 'bg-warning bg-opacity-10 text-warning' };
  case 'completed':
    return { text: t('project_list.filter_completed'), className: 'bg-success bg-opacity-10 text-success' };
  case 'archived':
    return { text: t('project_list.filter_archived'), className: 'bg-border-primary text-text-secondary' };
  default:
    return { text: status, className: 'bg-bg-secondary text-text-secondary' };
  }
}

function matchesQuery(project: Project, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) {
    return true;
  }
  return (
    project.name.toLowerCase().includes(q) ||
    project.description.toLowerCase().includes(q) ||
    project.requirementsText.toLowerCase().includes(q)
  );
}

const ProjectListPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<ProjectStatus | 'all'>('all');
  const [, setRefreshToken] = useState(0);

  const STATUS_OPTIONS: readonly StatusOption[] = [
    { value: 'all', label: t('project_list.filter_all_status') },
    { value: 'draft', label: t('project_list.filter_draft') },
    { value: 'generating', label: t('project_list.filter_generating') },
    { value: 'in_progress', label: t('project_list.filter_in_progress') },
    { value: 'completed', label: t('project_list.filter_completed') },
    { value: 'archived', label: t('project_list.filter_archived') },
  ];

  const allProjects = listProjects();
  const projects = allProjects
    .filter((p) => (status === 'all' ? true : p.status === status))
    .filter((p) => matchesQuery(p, query));

  const handleDelete = (projectId: string) => {
    if (!confirm(t('project_list.confirm_delete'))) {
      return;
    }
    deleteProject(projectId);
    setRefreshToken((v) => v + 1);
  };

  return (
    <AppShell pageTitle={t('project_list.page_title')} breadcrumb={[t('project_list.breadcrumb_home'), t('project_list.breadcrumb_projects')]}>
      <div className="bg-white rounded-2xl shadow-card">
        <div className="p-6 border-b border-border-primary flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative w-full md:w-80">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('project_list.search_placeholder')}
                className="w-full pl-10 pr-4 py-2 border border-border-primary rounded-lg bg-bg-secondary text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-30"
              />
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary"></i>
            </div>
            <div className="w-40">
              <Select
                value={status}
                onChange={(value: string) => setStatus(value as ProjectStatus | 'all')}
                options={STATUS_OPTIONS.map((opt) => ({ label: opt.label, value: opt.value }))}
                placeholder={t('project_list.filter_all_status')}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/project-create')}
            className="bg-gradient-primary text-white px-6 py-3 rounded-lg font-medium hover:shadow-glow transition-all duration-300"
          >
            <i className="fas fa-plus mr-2"></i>
            {t('project_list.btn_create')}
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="p-10 text-center text-text-secondary">
            <div className="text-4xl mb-3">
              <i className="fas fa-folder-open"></i>
            </div>
            <div className="text-lg font-medium text-text-primary mb-1">{t('project_list.empty_title')}</div>
            <div className="text-sm">{t('project_list.empty_desc')}</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-bg-secondary">
                <tr>
                  <th className="text-left py-3 px-6 text-text-secondary font-medium">{t('project_list.table_project')}</th>
                  <th className="text-left py-3 px-6 text-text-secondary font-medium">{t('project_list.table_workflow')}</th>
                  <th className="text-left py-3 px-6 text-text-secondary font-medium">{t('project_list.table_status')}</th>
                  <th className="text-left py-3 px-6 text-text-secondary font-medium">{t('project_list.table_updated')}</th>
                  <th className="text-right py-3 px-6 text-text-secondary font-medium">{t('project_list.table_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary">
                {projects.map((p) => {
                  const badge = getStatusBadge(p.status, t);
                  return (
                    <tr key={p.id} className="hover:bg-bg-secondary transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-gradient-card rounded-xl flex items-center justify-center flex-shrink-0 border border-border-primary">
                            <i className="fas fa-microchip text-primary"></i>
                          </div>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => navigate(`/project-detail?projectId=${p.id}`)}
                              className="text-primary hover:text-secondary font-semibold text-left"
                            >
                              {p.name}
                            </button>
                            <div className="text-sm text-text-secondary truncate max-w-[38rem]">{p.description || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-text-secondary">
                        {t('project_list.workflow_info', { modules: p.workflow.nodes.length, connections: p.workflow.connections.length })}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.className}`}>
                          {badge.text}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-text-secondary text-sm">{formatDateTime(p.updatedAtMs)}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end space-x-3">
                          <button
                            type="button"
                            onClick={() => navigate(`/project-detail?projectId=${p.id}`)}
                            className="text-primary hover:text-secondary transition-colors"
                            aria-label={t('project_list.action_view')}
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/project-create?projectId=${p.id}`)}
                            className="text-text-secondary hover:text-primary transition-colors"
                            aria-label={t('project_list.action_edit')}
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id)}
                            className="text-text-secondary hover:text-danger transition-colors"
                            aria-label={t('project_list.action_delete')}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default ProjectListPage;
