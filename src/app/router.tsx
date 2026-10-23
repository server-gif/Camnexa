import { lazy } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router';
import ClipsPage from '@/pages/ClipsPage';
import { RequireAge } from './guards';
import { RootLayout } from './RootLayout';
import { RouteError } from './RouteError';

// The clips grid ships in the main bundle as the landing screen; everything else is code-split.
const AgePage = lazy(() => import('@/pages/AgePage'));
const GenderPage = lazy(() => import('@/pages/GenderPage'));
const GirlFindPage = lazy(() => import('@/pages/GirlFindPage'));
const UserNotFoundPage = lazy(() => import('@/pages/UserNotFoundPage'));
const InfoPage = lazy(() => import('@/pages/InfoPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      { path: '/', element: <ClipsPage /> },
      { path: '/age', element: <AgePage /> },
      {
        path: '/gender',
        element: (
          <RequireAge>
            <GenderPage />
          </RequireAge>
        ),
      },
      { path: '/girl-find', element: <GirlFindPage /> },
      { path: '/connect', element: <UserNotFoundPage /> },
      { path: '/about', element: <InfoPage kind="about" /> },
      { path: '/privacy', element: <InfoPage kind="privacy" /> },
      { path: '/terms', element: <InfoPage kind="terms" /> },
      { path: '/contact', element: <InfoPage kind="contact" /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export function createAppRouter() {
  return createBrowserRouter(routes);
}
