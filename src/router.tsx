import { createBrowserRouter, Navigate } from 'react-router-dom';
import RootLayout from './layout/RootLayout';
import Reader from './pages/Reader/Reader';
import IntroSO from './pages/notes/IntroSO';
import IntroProcesos from './pages/notes/IntroProcesos';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      {
        Component: Reader,
        children: [
          { index: true, element: <Navigate to="/introduccion/sistemas-operativos" replace /> },
          { path: 'introduccion/sistemas-operativos', Component: IntroSO },
          { path: 'procesos/intro-procesos', Component: IntroProcesos },
        ],
      },
    ],
  },
]);
