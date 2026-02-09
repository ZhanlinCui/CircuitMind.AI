import { createBrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from '../components/ErrorBoundary';

import P_login from '../pages/p-login';
import P_dashboard from '../pages/p-dashboard';
import P_project_list from '../pages/p-project_list';
import P_project_create from '../pages/p-project_create';
import P_project_detail from '../pages/p-project_detail';
import P_knowledge_base from '../pages/p-knowledge_base';
import P_component_db from '../pages/p-component_db';
import P_circuit_cases from '../pages/p-circuit_cases';
import P_user_profile from '../pages/p-user_profile';
import LandingPage from '../pages/LandingPage';
import NotFoundPage from './NotFoundPage';
import ErrorPage from './ErrorPage';
import RouteListener from './RouteListener';

// 使用 createBrowserRouter 创建路由实例
const router = createBrowserRouter([
  {
    path: '/',
    element: <RouteListener />,
    children: [
      {
        path: '/',
        element: (
          <ErrorBoundary>
            <LandingPage />
          </ErrorBoundary>
        ),
        errorElement: <ErrorPage />,
      },
      {
        path: '/login',
        element: (
          <ErrorBoundary>
            <P_login />
          </ErrorBoundary>
        ),
        errorElement: <ErrorPage />,
      },
      {
        path: '/dashboard',
        element: (
          <ErrorBoundary>
            <P_dashboard />
          </ErrorBoundary>
        ),
        errorElement: <ErrorPage />,
      },
      {
        path: '/project-list',
        element: (
          <ErrorBoundary>
            <P_project_list />
          </ErrorBoundary>
        ),
        errorElement: <ErrorPage />,
      },
      {
        path: '/project-create',
        element: (
          <ErrorBoundary>
            <P_project_create />
          </ErrorBoundary>
        ),
        errorElement: <ErrorPage />,
      },
      {
        path: '/project-detail',
        element: (
          <ErrorBoundary>
            <P_project_detail />
          </ErrorBoundary>
        ),
        errorElement: <ErrorPage />,
      },
      {
        path: '/knowledge-base',
        element: (
          <ErrorBoundary>
            <P_knowledge_base />
          </ErrorBoundary>
        ),
        errorElement: <ErrorPage />,
      },
      {
        path: '/component-db',
        element: (
          <ErrorBoundary>
            <P_component_db />
          </ErrorBoundary>
        ),
        errorElement: <ErrorPage />,
      },
      {
        path: '/circuit-cases',
        element: (
          <ErrorBoundary>
            <P_circuit_cases />
          </ErrorBoundary>
        ),
        errorElement: <ErrorPage />,
      },
      {
        path: '/user-profile',
        element: (
          <ErrorBoundary>
            <P_user_profile />
          </ErrorBoundary>
        ),
        errorElement: <ErrorPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);

export default router;
