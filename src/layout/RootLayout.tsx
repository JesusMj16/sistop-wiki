import { Outlet } from 'react-router-dom';
import SideBar from '../components/SideBar/SideBar';
import { CourseProvider } from '../context/CourseContext';
import { UIProvider, useUI } from '../context/UIContext';
import { TweaksProvider } from '../context/TweaksContext';
import TweaksPanel from '../components/TweaksPanel/TweaksPanel';
import './Layout.css';

function Shell() {
  const { sidebarOpen, focusMode } = useUI();
  const cls = ['app'];
  if (focusMode) cls.push('focus');
  if (!sidebarOpen) cls.push('sidebar-closed');

  return (
    <div className={cls.join(' ')}>
      <SideBar />
      <Outlet />
      {import.meta.env.DEV && <TweaksPanel />}
    </div>
  );
}

export default function RootLayout() {
  return (
    <TweaksProvider>
      <CourseProvider>
        <UIProvider>
          <Shell />
        </UIProvider>
      </CourseProvider>
    </TweaksProvider>
  );
}
