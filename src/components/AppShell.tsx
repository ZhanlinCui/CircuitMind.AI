import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AiConfig, loadAiConfig } from '../lib/storage';
import { cn } from '../lib/utils';
import {
  LayoutDashboard,
  FolderOpen,
  BookOpen,
  Search,
  Layers,
  Settings,
  Menu,
  Bell,
  ChevronDown,
  CircuitBoard,
  Cpu,
} from 'lucide-react';
import { Button } from './ui/button';
import { LanguageSwitcher } from './LanguageSwitcher';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './ui/breadcrumb';

type NavItem = {
  to: string;
  labelKey: string;
  icon: React.ElementType;
};

const LEGACY_LABEL_TO_I18N_KEY: Record<string, string> = {
  工作台: 'app.dashboard',
  项目管理: 'app.projects',
  资源中心: 'app.resources',
  知识库: 'app.resources',
  元器件库: 'app.component_db',
  元器件数据库: 'app.component_db',
  电路案例: 'app.cases',
  电路案例库: 'app.cases',
  用户设置: 'app.profile',
  个人中心: 'app.profile',
  项目详情: 'app.project_detail',
  创建新项目: 'app.create_project',
  编辑项目: 'app.edit_project',
};

const NAV_ITEMS: readonly NavItem[] = [
  { to: '/dashboard', labelKey: 'app.dashboard', icon: LayoutDashboard },
  { to: '/project-list', labelKey: 'app.projects', icon: FolderOpen },
  { to: '/knowledge-base', labelKey: 'app.resources', icon: BookOpen },
  { to: '/component-db', labelKey: 'app.component_db', icon: Cpu },
  { to: '/circuit-cases', labelKey: 'app.cases', icon: Layers },
  { to: '/user-profile', labelKey: 'app.profile', icon: Settings },
];

export type AppShellProps = {
  pageTitle: string;
  breadcrumb?: readonly string[];
  children: React.ReactNode;
};

function isActivePath(currentPathname: string, itemTo: string): boolean {
  if (itemTo === '/dashboard') {
    return currentPathname === '/dashboard';
  }
  return currentPathname.startsWith(itemTo);
}

export default function AppShell({
  pageTitle,
  breadcrumb,
  children,
}: AppShellProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpenOnMobile, setIsSidebarOpenOnMobile] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [aiConfig, setAiConfig] = useState<AiConfig | undefined>(() =>
    loadAiConfig(),
  );

  const normalizeLabel = useCallback(
    (label: string) => {
      if (label.startsWith('app.')) {
        return t(label);
      }
      const mappedKey = LEGACY_LABEL_TO_I18N_KEY[label];
      return mappedKey ? t(mappedKey) : label;
    },
    [t],
  );

  const displayPageTitle = normalizeLabel(pageTitle);
  const breadcrumbItems = useMemo(
    () =>
      (breadcrumb ?? ['工作台', pageTitle]).map((item) =>
        normalizeLabel(item),
      ),
    [breadcrumb, pageTitle, normalizeLabel],
  );

  useEffect(() => {
    setAiConfig(loadAiConfig());
  }, [location.pathname]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'pcbtool.aiConfig.v1') {
        setAiConfig(loadAiConfig());
      }
    };
    const handleAiConfigUpdated = () => {
      setAiConfig(loadAiConfig());
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('ai-config-updated', handleAiConfigUpdated);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('ai-config-updated', handleAiConfigUpdated);
    };
  }, []);

  const handleGlobalSearchKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key !== 'Enter') return;
    const query = globalSearch.trim();
    if (!query) return;
    console.log('Search:', query);
  };

  const isAiConfigured = Boolean(
    aiConfig?.baseUrl && aiConfig?.apiKey && aiConfig?.model,
  );
  const isAiConnected = Boolean(isAiConfigured && aiConfig?.lastTestOk);
  const aiStatusText = !isAiConfigured
    ? t('app.ai_not_configured')
    : isAiConnected
      ? t('app.ai_connected')
      : t('app.ai_disconnected');
  const aiDotClass = isAiConnected ? 'bg-emerald-500' : 'bg-rose-500';

  return (
    <div className='min-h-screen bg-slate-50 text-slate-900 font-sans'>
      <header className='fixed top-0 left-0 right-0 bg-white border-b border-slate-200 h-16 z-50 shadow-sm'>
        <div className='flex items-center justify-between h-full px-4 lg:px-6'>
          <div className='flex items-center space-x-4'>
            <Button
              variant='ghost'
              size='icon'
              className='md:hidden text-slate-500'
              onClick={() => setIsSidebarOpenOnMobile((v) => !v)}
              aria-label='Toggle Sidebar'
            >
              <Menu className='h-5 w-5' />
            </Button>
            <button
              type='button'
              className='flex items-center space-x-3 cursor-pointer'
              onClick={() => navigate('/dashboard')}
              aria-label={t('app.go_dashboard')}
            >
              <div className='w-8 h-8 bg-indigo-600 rounded-md flex items-center justify-center'>
                <CircuitBoard className='text-white h-5 w-5' />
              </div>
              <h1 className='text-lg font-bold text-slate-900 hidden sm:block tracking-tight'>
                {t('app.name')}
              </h1>
            </button>
          </div>

          <div className='hidden md:flex flex-1 max-w-md mx-8'>
            <div className='relative w-full'>
              <input
                type='text'
                placeholder={t(
                  'app.search_placeholder',
                  'Search projects, components...',
                )}
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                onKeyDown={handleGlobalSearchKeyDown}
                className='w-full pl-10 pr-4 py-2 border border-slate-200 rounded-md bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all'
              />
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4' />
            </div>
          </div>

          <div className='flex items-center space-x-2 lg:space-x-4'>
            <LanguageSwitcher />

            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors'
              onClick={() => navigate('/user-profile')}
              title={aiStatusText}
              aria-label={t('app.ai_status')}
            >
              <span
                className={`w-2 h-2 rounded-full animate-pulse ${aiDotClass}`}
              ></span>
              <span className='text-xs text-slate-500 font-medium'>
                {isAiConfigured ? aiConfig?.model : t('app.no_model')}
              </span>
            </Button>

            <Button
              variant='ghost'
              size='icon'
              className='text-slate-500 relative'
            >
              <Bell className='h-5 w-5' />
              <span className='absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-white'></span>
            </Button>

            <button
              type='button'
              className='flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity'
              onClick={() => navigate('/user-profile')}
              aria-label={t('app.profile')}
            >
              <img
                src='https://s.coze.cn/image/ZIbLDVaKweA/'
                alt='User Avatar'
                className='w-8 h-8 rounded-full border border-slate-200'
              />
              <span className='hidden lg:inline text-sm font-medium text-slate-700'>
                {t('app.engineer')}
              </span>
              <ChevronDown className='hidden lg:block h-4 w-4 text-slate-400' />
            </button>
          </div>
        </div>
      </header>

      <aside
        className={cn(
          'fixed left-0 top-16 bottom-0 w-64 bg-slate-900 text-slate-300 z-40 transition-transform duration-300 ease-in-out border-r border-slate-800',
          'md:translate-x-0',
          isSidebarOpenOnMobile ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <nav className='p-4 space-y-1'>
          {NAV_ITEMS.map((item) => {
            const active = isActivePath(location.pathname, item.to);
            const label = item.labelKey.startsWith('app.')
              ? t(item.labelKey)
              : item.labelKey;

            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setIsSidebarOpenOnMobile(false)}
                className={cn(
                  'flex items-center space-x-3 px-3 py-2 rounded-md transition-all duration-200 group',
                  active
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'hover:bg-slate-800 hover:text-white',
                )}
              >
                <item.icon
                  className={cn(
                    'h-5 w-5',
                    active
                      ? 'text-white'
                      : 'text-slate-400 group-hover:text-white',
                  )}
                />
                <span className='font-medium text-sm'>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className='absolute bottom-4 left-4 right-4 space-y-3'>
          <div className='p-3 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-lg border border-indigo-500/30'>
            <div className='flex items-center space-x-2 text-xs'>
              <svg className='h-4 w-4 text-indigo-400' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><path d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'/></svg>
              <span className='text-indigo-300 font-semibold'>Powered by Gemini 3</span>
            </div>
          </div>
          <div className='p-4 bg-slate-800 rounded-lg border border-slate-700'>
            <h4 className='text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2'>
              {t('app.system_status')}
            </h4>
            <div className='flex items-center justify-between text-xs text-slate-300 mb-1'>
              <span>AI Engine</span>
              <span className={isAiConnected ? 'text-emerald-400' : 'text-rose-400'}>
                {isAiConnected ? 'Connected' : 'Not configured'}
              </span>
            </div>
            <div className='flex items-center justify-between text-xs text-slate-300'>
              <span>{t('app.version')}</span>
              <span>v1.0.0</span>
            </div>
          </div>
        </div>
      </aside>

      {isSidebarOpenOnMobile && (
        <div
          className='fixed inset-0 bg-slate-900/50 z-30 md:hidden backdrop-blur-sm'
          onClick={() => setIsSidebarOpenOnMobile(false)}
        />
      )}

      <main className='pt-16 md:ml-64 min-h-screen transition-all duration-300'>
        <div className='p-4 md:p-6 lg:p-8 max-w-7xl mx-auto'>
          <div className='mb-6'>
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbItems.map((item, index) => {
                  const isLast = index === breadcrumbItems.length - 1;
                  // Assuming the first item is usually Dashboard or Home which we can link to
                  // For now, we only link if we have a way to know the path, but the current breadcrumb implementation
                  // passes only strings. To support links, we might need to change the API of AppShell or infer links.
                  // For this implementation, we will keep it as text for consistency with previous behavior, 
                  // but wrap in the new component structure. 
                  // If "Dashboard" or "工作台" is the first item, we can link it to /dashboard.
                  const isDashboard = item === t('app.dashboard') || item === 'Dashboard' || item === '工作台';
                  
                  return (
                    <React.Fragment key={index}>
                      <BreadcrumbItem>
                        {isLast ? (
                          <BreadcrumbPage>{item}</BreadcrumbPage>
                        ) : isDashboard ? (
                          <BreadcrumbLink to='/dashboard'>{item}</BreadcrumbLink>
                        ) : (
                          <span className='text-slate-500 hover:text-slate-700 transition-colors cursor-default'>
                            {item}
                          </span>
                        )}
                      </BreadcrumbItem>
                      {!isLast && <BreadcrumbSeparator />}
                    </React.Fragment>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className='flex items-center justify-between mb-8'>
            <h2 className='text-2xl font-bold text-slate-900 tracking-tight'>
              {displayPageTitle}
            </h2>
          </div>

          <div className='animate-in fade-in slide-in-from-bottom-4 duration-500'>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
