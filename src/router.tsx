import { createBrowserRouter, Navigate } from 'react-router-dom';
import RootLayout from './layout/RootLayout';
import Reader from './pages/Reader/Reader';
import IntroSO from './pages/notes/IntroSO';
import IntroProcesos from './pages/notes/IntroProcesos';
import CtrlProcesos from './pages/notes/CtrlProcesos';
import Systemcall from './pages/notes/Systemcall';
import IdentifyProcess from './pages/notes/IdentifyProcess';
import callWait from './pages/notes/callWait';
import IntroIPC from './pages/notes/IntroIPC';
import Pipes from './pages/notes/Pipes';
import Fifos from './pages/notes/Fifos';



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
          {path: 'procesos/control-procesos', Component:CtrlProcesos },
          {path: 'procesos/systemcall-procesos', Component: Systemcall},
          { path: 'procesos/identify-process', Component: IdentifyProcess},
          { path: 'procesos/llamada-wait', Component: callWait },
          { path: 'ipc/intro-ipc', Component: IntroIPC },
          { path: 'ipc/pipes', Component: Pipes },
          { path: 'ipc/fifos', Component: Fifos }
        ],
      },
    ],
  },
]);
