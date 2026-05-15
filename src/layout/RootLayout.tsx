import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import SideBar from '../components/SideBar/SideBar';
import { CourseProvider, useCourse } from '../context/CourseContext';
import { UIProvider, useUI } from '../context/UIContext';
import { TweaksProvider } from '../context/TweaksContext';
import TweaksPanel from '../components/TweaksPanel/TweaksPanel';
import './Layout.css';

function useIsNarrow(query = '(max-width: 880px)') {
  const [match, setMatch] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatch(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);
  return match;
}

function Shell() {
  const { sidebarOpen, focusMode, setSidebarOpen } = useUI();
  const { activeNote } = useCourse();
  const isNarrow = useIsNarrow();
  const cls = ['app'];
  if (focusMode) cls.push('focus');
  if (!sidebarOpen) cls.push('sidebar-closed');

  useEffect(() => {
    if (isNarrow) setSidebarOpen(false);
  }, [activeNote.id, isNarrow, setSidebarOpen]);

  useEffect(() => {
    if (isNarrow) setSidebarOpen(false);
    else setSidebarOpen(true);
  }, [isNarrow, setSidebarOpen]);

  const showScrim = isNarrow && sidebarOpen && !focusMode;

  return (
    <div className={cls.join(' ')}>
      <SideBar />
      {showScrim && (
        <button
          className="app-scrim"
          aria-label="Cerrar menú"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Outlet />
      <TweaksPanel />
    </div>
  );
}

export default function RootLayout() {
  return (
    <TweaksProvider>
      <UIProvider>
        <CourseProvider>
          <Shell />
        </CourseProvider>
      </UIProvider>
    </TweaksProvider>
  );
}
