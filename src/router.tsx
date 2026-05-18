import { createBrowserRouter, Navigate } from 'react-router-dom';
import RootLayout from './layout/RootLayout';
import Reader from './pages/Reader/Reader';
import IntroSO from './pages/notes/IntroSO';
import IntroProcesos from './pages/notes/IntroProcesos';
import CtrlProcesos from './pages/notes/CtrlProcesos';
import Systemcall from './pages/notes/Systemcall';
import IdentifyProcess from './pages/notes/IdentifyProcess';
import callWait from './pages/notes/callWait';
import Exit from './pages/notes/Exit';
import Zombies from './pages/notes/Zombies';
import Hilos from './pages/notes/Hilos';
import Inanicion from './pages/notes/Inanicion';
import Prevencion from './pages/notes/Prevencion';
import Banquero from './pages/notes/Banquero';
import Deteccion from './pages/notes/Deteccion';
import Prediccion from './pages/notes/Prediccion';
import MemoriaIntro from './pages/notes/MemoriaIntro';
import AdminMemoria from './pages/notes/AdminMemoria';
import IntroIPC from './pages/notes/IntroIPC';
import Pipes from './pages/notes/Pipes';
import Fifos from './pages/notes/Fifos';
import Llaves from './pages/notes/Llaves';
import SemaforosSysV from './pages/notes/SemaforosSysV';
import MemoriaCompartida from './pages/notes/MemoriaCompartida';
import ColaMensajes from './pages/notes/ColaMensajes';
import ComandosIPC from './pages/notes/ComandosIPC';
import MinishellIntro from './pages/notes/MinishellIntro';
import MinishellArquitectura from './pages/notes/MinishellArquitectura';
import MinishellComandosFS from './pages/notes/MinishellComandosFS';
import MinishellComandosSistema from './pages/notes/MinishellComandosSistema';
import ArquitecturaFS from './pages/notes/ArquitecturaFS';
import EstructuraLogicaFS from './pages/notes/EstructuraLogicaFS';
import InodosFS from './pages/notes/InodosFS';
import TiposArchivos from './pages/notes/TiposArchivos';
import DispositivosIO from './pages/notes/DispositivosIO';
import IoctlYDisco from './pages/notes/IoctlYDisco';
import Senales from './pages/notes/Senales';
import TiposSenales from './pages/notes/TiposSenales';



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
          { path: 'procesos/llamada-exit', Component: Exit },
          { path: 'procesos/zombies', Component: Zombies },
          { path: 'procesos/hilos', Component: Hilos },
          { path: 'interbloqueo/inanicion', Component: Inanicion },
          { path: 'interbloqueo/prevencion', Component: Prevencion },
          { path: 'interbloqueo/banquero', Component: Banquero },
          { path: 'interbloqueo/deteccion', Component: Deteccion },
          { path: 'interbloqueo/prediccion', Component: Prediccion },
          { path: 'memoria/intro', Component: MemoriaIntro },
          { path: 'memoria/admin', Component: AdminMemoria },
          { path: 'ipc/intro-ipc', Component: IntroIPC },
          { path: 'ipc/pipes', Component: Pipes },
          { path: 'ipc/fifos', Component: Fifos },
          { path: 'ipc/llaves', Component: Llaves },
          { path: 'ipc/semaforos-sysv', Component: SemaforosSysV },
          { path: 'ipc/memoria-compartida', Component: MemoriaCompartida },
          { path: 'ipc/cola-mensajes', Component: ColaMensajes },
          { path: 'ipc/comandos-ipc', Component: ComandosIPC },
          { path: 'proyecto-minishell/intro', Component: MinishellIntro },
          { path: 'proyecto-minishell/arquitectura', Component: MinishellArquitectura },
          { path: 'proyecto-minishell/comandos-fs', Component: MinishellComandosFS },
          { path: 'proyecto-minishell/comandos-sistema', Component: MinishellComandosSistema },
          { path: 'arquitectura/sistema-archivos', Component: ArquitecturaFS },
          { path: 'arquitectura/estructura-logica', Component: EstructuraLogicaFS },
          { path: 'arquitectura/inodos', Component: InodosFS },
          { path: 'arquitectura/tipos-archivos', Component: TiposArchivos },
          { path: 'arquitectura/dispositivos-io', Component: DispositivosIO },
          { path: 'arquitectura/ioctl-disco', Component: IoctlYDisco },
          { path: 'signal/introduction', Component: Senales },
          { path: 'signal/tipos-senales', Component: TiposSenales },
        ],
      },
    ],
  },
]);
