

import React, { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppShell from '../../components/AppShell';
import { listProjects } from '../../lib/projectsStore';
import { loadAiConfig } from '../../lib/storage';
// lucide icons available if needed
import styles from './styles.module.css';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const projects = useMemo(() => listProjects(), []);
  const aiConfig = useMemo(() => loadAiConfig(), []);
  const isAiConfigured = Boolean(aiConfig?.apiKey && aiConfig?.model);

  const totalProjects = projects.length;
  const inProgress = projects.filter(p => p.status === 'in_progress').length;
  const completed = projects.filter(p => p.status === 'completed').length;
  const totalSolutions = projects.reduce((sum, p) => sum + (p.solutions?.length ?? 0), 0);
  const recentProjects = projects.slice(0, 5);

  useEffect(() => {
    const originalTitle = document.title;
    document.title = `${t('app.dashboard')} - PCBTool.AI`;
    return () => { document.title = originalTitle; };
  }, [t]);

  const handleQuickActionCreate = () => {
    navigate('/project-create');
  };

  const handleQuickActionHistory = () => {
    navigate('/project-list');
  };

  const handleQuickActionKnowledge = () => {
    navigate('/knowledge-base');
  };

  const handleQuickActionComponents = () => {
    navigate('/component-db');
  };

  const handleCreateProjectClick = () => {
    navigate('/project-create');
  };

  const handleProjectView = (projectId: string) => {
    navigate(`/project-detail?projectId=${projectId}`);
  };

  const handleProjectEdit = (projectId: string) => {
    navigate(`/project-create?projectId=${projectId}`);
  };

  // handleProjectDownload and handleProjectStatus removed — not used in dynamic table

  return (
    <AppShell pageTitle='app.dashboard' breadcrumb={['app.dashboard']}>
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-1 md:mb-2">{t('dashboard.welcome')}</h2>
          </div>
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <button
              onClick={handleCreateProjectClick}
              className="w-full md:w-auto bg-gradient-primary text-white px-6 py-3 rounded-lg font-medium hover:shadow-glow transition-all duration-300 flex items-center justify-center"
            >
              <i className="fas fa-plus mr-2"></i>
              {t('dashboard.create_project')}
            </button>
          </div>
        </div>
      </div>

      <section className="mb-6 md:mb-8">
        <h3 className="text-lg md:text-xl font-semibold text-text-primary mb-4">{t('dashboard.quick_access')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div
            onClick={handleQuickActionCreate}
            className={`bg-gradient-card rounded-2xl p-4 md:p-6 shadow-card ${styles.cardHover} cursor-pointer`}
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                <i className="fas fa-plus text-white text-xl"></i>
              </div>
              <div>
                <h4 className="font-semibold text-text-primary">{t('dashboard.quick.create_title')}</h4>
                <p className="text-sm text-text-secondary">{t('dashboard.quick.create_desc')}</p>
              </div>
            </div>
          </div>

          <div
            onClick={handleQuickActionHistory}
            className={`bg-gradient-card rounded-2xl p-4 md:p-6 shadow-card ${styles.cardHover} cursor-pointer`}
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-secondary rounded-xl flex items-center justify-center flex-shrink-0">
                <i className="fas fa-history text-white text-xl"></i>
              </div>
              <div>
                <h4 className="font-semibold text-text-primary">{t('dashboard.quick.history_title')}</h4>
                <p className="text-sm text-text-secondary">{t('dashboard.quick.history_desc')}</p>
              </div>
            </div>
          </div>

          <div
            onClick={handleQuickActionKnowledge}
            className={`bg-gradient-card rounded-2xl p-4 md:p-6 shadow-card ${styles.cardHover} cursor-pointer`}
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-warning rounded-xl flex items-center justify-center flex-shrink-0">
                <i className="fas fa-book text-white text-xl"></i>
              </div>
              <div>
                <h4 className="font-semibold text-text-primary">{t('dashboard.quick.knowledge_title')}</h4>
                <p className="text-sm text-text-secondary">{t('dashboard.quick.knowledge_desc')}</p>
              </div>
            </div>
          </div>

          <div
            onClick={handleQuickActionComponents}
            className={`bg-gradient-card rounded-2xl p-4 md:p-6 shadow-card ${styles.cardHover} cursor-pointer`}
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-tertiary rounded-xl flex items-center justify-center flex-shrink-0">
                <i className="fas fa-search text-white text-xl"></i>
              </div>
              <div>
                <h4 className="font-semibold text-text-primary">{t('dashboard.quick.components_title')}</h4>
                <p className="text-sm text-text-secondary">{t('dashboard.quick.components_desc')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-6 md:mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg md:text-xl font-semibold text-text-primary">{t('dashboard.overview.title')}</h3>
          <Link to="/project-list" className="text-primary hover:text-secondary transition-colors font-medium text-sm md:text-base">
            {t('dashboard.overview.view_all')} <i className="fas fa-arrow-right ml-1"></i>
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-xs md:text-sm">{t('dashboard.overview.total_projects')}</p>
                <p className="text-2xl md:text-3xl font-bold text-text-primary mt-1">{totalProjects}</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-primary bg-opacity-10 rounded-xl flex items-center justify-center flex-shrink-0">
                <i className="fas fa-folder text-primary text-lg md:text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-xs md:text-sm">{t('dashboard.overview.in_progress')}</p>
                <p className="text-2xl md:text-3xl font-bold text-warning mt-1">{inProgress}</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-warning bg-opacity-10 rounded-xl flex items-center justify-center flex-shrink-0">
                <i className="fas fa-play text-warning text-lg md:text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-xs md:text-sm">{t('dashboard.overview.completed')}</p>
                <p className="text-2xl md:text-3xl font-bold text-success mt-1">{completed}</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-success bg-opacity-10 rounded-xl flex items-center justify-center flex-shrink-0">
                <i className="fas fa-check text-success text-lg md:text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-xs md:text-sm">{t('dashboard.overview.ai_generated')}</p>
                <p className="text-2xl md:text-3xl font-bold text-secondary mt-1">{totalSolutions}</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-secondary bg-opacity-10 rounded-xl flex items-center justify-center flex-shrink-0">
                <i className="fas fa-robot text-secondary text-lg md:text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card">
          <div className="p-4 md:p-6 border-b border-border-primary">
            <h4 className="font-semibold text-text-primary">{t('dashboard.recent.title')}</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-bg-secondary">
                <tr>
                  <th className="text-left py-3 px-4 md:px-6 text-text-secondary font-medium whitespace-nowrap">{t('dashboard.recent.project_name')}</th>
                  <th className="text-left py-3 px-4 md:px-6 text-text-secondary font-medium whitespace-nowrap">{t('dashboard.recent.status')}</th>
                  <th className="text-left py-3 px-4 md:px-6 text-text-secondary font-medium whitespace-nowrap hidden md:table-cell">{t('dashboard.recent.created_at')}</th>
                  <th className="text-left py-3 px-4 md:px-6 text-text-secondary font-medium whitespace-nowrap">{t('dashboard.recent.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary">
                {recentProjects.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center">
                      <div className="text-text-secondary">
                        <i className="fas fa-folder-open text-4xl mb-3 opacity-30"></i>
                        <p className="font-medium mb-2">No projects yet</p>
                        <p className="text-sm mb-4">Create your first circuit design project to get started</p>
                        <button
                          onClick={handleCreateProjectClick}
                          className="px-4 py-2 bg-gradient-primary text-white rounded-lg text-sm font-medium"
                        >
                          <i className="fas fa-plus mr-2"></i>Create Project
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  recentProjects.map((proj) => {
                    const statusColors: Record<string, string> = {
                      draft: 'bg-slate-100 text-slate-600',
                      generating: 'bg-blue-100 text-blue-600',
                      in_progress: 'bg-amber-100 text-amber-700',
                      completed: 'bg-emerald-100 text-emerald-700',
                      archived: 'bg-slate-100 text-slate-500',
                    };
                    const date = new Date(proj.updatedAtMs);
                    const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
                    return (
                      <tr key={proj.id} className="hover:bg-bg-secondary transition-colors">
                        <td className="py-4 px-4 md:px-6">
                          <button
                            onClick={() => handleProjectView(proj.id)}
                            className="text-primary hover:text-secondary font-medium text-left truncate max-w-[200px] block"
                          >
                            {proj.name}
                          </button>
                        </td>
                        <td className="py-4 px-4 md:px-6">
                          <span className={`px-3 py-1 rounded-full text-xs md:text-sm font-medium whitespace-nowrap ${statusColors[proj.status] ?? statusColors.draft}`}>
                            {proj.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 md:px-6 text-text-secondary hidden md:table-cell whitespace-nowrap">{dateStr}</td>
                        <td className="py-4 px-4 md:px-6">
                          <div className="flex items-center space-x-2">
                            <button onClick={() => handleProjectView(proj.id)} className="text-primary hover:text-secondary transition-colors p-1"><i className="fas fa-eye"></i></button>
                            <button onClick={() => handleProjectEdit(proj.id)} className="text-text-secondary hover:text-primary transition-colors p-1"><i className="fas fa-edit"></i></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-xl font-semibold text-text-primary mb-4">{t('dashboard.system.title')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-text-primary">{t('dashboard.system.ai_model')}</h4>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 bg-success rounded-full ${styles.statusIndicator}`}></div>
                <span className="text-success font-medium text-sm">{t('dashboard.system.normal')}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Provider</span>
                <span className="text-text-primary font-medium">{aiConfig?.provider === 'gemini' ? 'Google Gemini' : aiConfig?.provider ?? 'Not set'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Model</span>
                <span className="text-text-primary font-medium">{aiConfig?.model ?? 'Not configured'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Status</span>
                <span className={`font-medium ${isAiConfigured ? 'text-success' : 'text-warning'}`}>{isAiConfigured ? 'Ready' : 'Needs API Key'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-text-primary">{t('dashboard.system.knowledge_base')}</h4>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 bg-success rounded-full ${styles.statusIndicator}`}></div>
                <span className="text-success font-medium text-sm">{t('dashboard.system.normal')}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">{t('dashboard.system.components_count')}</span>
                <span className="text-text-primary font-medium">1,245,678</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">{t('dashboard.system.case_count')}</span>
                <span className="text-text-primary font-medium">12,345</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">{t('dashboard.system.last_update')}</span>
                <span className="text-text-primary font-medium">2024-01-15</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-text-primary">{t('dashboard.system.performance')}</h4>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 bg-success rounded-full ${styles.statusIndicator}`}></div>
                <span className="text-success font-medium text-sm">{t('dashboard.system.normal')}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">{t('dashboard.system.cpu_usage')}</span>
                <span className="text-text-primary font-medium">45%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">{t('dashboard.system.memory_usage')}</span>
                <span className="text-text-primary font-medium">68%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">{t('dashboard.system.online_users')}</span>
                <span className="text-text-primary font-medium">234</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
};

export default Dashboard;
