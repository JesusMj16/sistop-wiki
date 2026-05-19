import { createBrowserRouter, Navigate } from 'react-router-dom';
import RootLayout from './layout/RootLayout';
import Reader from './pages/Reader/Reader';

const lazyPage = (loader: () => Promise<{ default: React.ComponentType }>) =>
  async () => {
    const { default: Component } = await loader();
    return { Component };
  };

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      {
        Component: Reader,
        children: [
          { index: true, element: <Navigate to="/introduccion/sistemas-operativos" replace /> },
          { path: 'introduccion/sistemas-operativos', lazy: lazyPage(() => import('./pages/notes/IntroSO')) },
          { path: 'procesos/intro-procesos', lazy: lazyPage(() => import('./pages/notes/IntroProcesos')) },
          { path: 'procesos/control-procesos', lazy: lazyPage(() => import('./pages/notes/CtrlProcesos')) },
          { path: 'procesos/systemcall-procesos', lazy: lazyPage(() => import('./pages/notes/Systemcall')) },
          { path: 'procesos/identify-process', lazy: lazyPage(() => import('./pages/notes/IdentifyProcess')) },
          { path: 'procesos/llamada-wait', lazy: lazyPage(() => import('./pages/notes/callWait')) },
          { path: 'procesos/llamada-exit', lazy: lazyPage(() => import('./pages/notes/Exit')) },
          { path: 'procesos/zombies', lazy: lazyPage(() => import('./pages/notes/Zombies')) },
          { path: 'procesos/hilos', lazy: lazyPage(() => import('./pages/notes/Hilos')) },
          { path: 'interbloqueo/inanicion', lazy: lazyPage(() => import('./pages/notes/Inanicion')) },
          { path: 'interbloqueo/prevencion', lazy: lazyPage(() => import('./pages/notes/Prevencion')) },
          { path: 'interbloqueo/banquero', lazy: lazyPage(() => import('./pages/notes/Banquero')) },
          { path: 'interbloqueo/deteccion', lazy: lazyPage(() => import('./pages/notes/Deteccion')) },
          { path: 'interbloqueo/prediccion', lazy: lazyPage(() => import('./pages/notes/Prediccion')) },
          { path: 'memoria/intro', lazy: lazyPage(() => import('./pages/notes/MemoriaIntro')) },
          { path: 'ipc/intro-ipc', lazy: lazyPage(() => import('./pages/notes/IntroIPC')) },
          { path: 'ipc/pipes', lazy: lazyPage(() => import('./pages/notes/Pipes')) },
          { path: 'ipc/fifos', lazy: lazyPage(() => import('./pages/notes/Fifos')) },
          { path: 'ipc/llaves', lazy: lazyPage(() => import('./pages/notes/Llaves')) },
          { path: 'ipc/semaforos-sysv', lazy: lazyPage(() => import('./pages/notes/SemaforosSysV')) },
          { path: 'ipc/memoria-compartida', lazy: lazyPage(() => import('./pages/notes/MemoriaCompartida')) },
          { path: 'ipc/cola-mensajes', lazy: lazyPage(() => import('./pages/notes/ColaMensajes')) },
          { path: 'ipc/comandos-ipc', lazy: lazyPage(() => import('./pages/notes/ComandosIPC')) },
          { path: 'proyecto-minishell/intro', lazy: lazyPage(() => import('./pages/notes/MinishellIntro')) },
          { path: 'proyecto-minishell/arquitectura', lazy: lazyPage(() => import('./pages/notes/MinishellArquitectura')) },
          { path: 'proyecto-minishell/comandos-fs', lazy: lazyPage(() => import('./pages/notes/MinishellComandosFS')) },
          { path: 'proyecto-minishell/comandos-sistema', lazy: lazyPage(() => import('./pages/notes/MinishellComandosSistema')) },
        ],
      },
    ],
  },
]);
