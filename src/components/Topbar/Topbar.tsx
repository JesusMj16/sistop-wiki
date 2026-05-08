import { useCourse } from '../../context/CourseContext';
import { useUI } from '../../context/UIContext';
import { MenuIcon, PencilIcon } from '../Icons/Icons';
import CourseMinimap from '../CourseMinimap/CourseMinimap';
import './Topbar.css';

export default function Topbar() {
  const { activeSection, activeNote } = useCourse();
  const { sidebarOpen, setSidebarOpen, focusMode, setFocusMode, notesPanelOpen, setNotesPanelOpen } = useUI();

  return (
    <header className="topbar">
      <div className="topbar-left">
        {!sidebarOpen && (
          <button className="icon-btn" onClick={() => setSidebarOpen(true)} aria-label="Mostrar sidebar">
            <MenuIcon />
          </button>
        )}
        <div className="crumbs">
          <span className="crumb-num">{activeSection.number}</span>
          <span className="crumb-sec">{activeSection.title}</span>
          <span className="crumb-sep">/</span>
          <span className="crumb-note">{activeNote.title}</span>
        </div>
      </div>

      <CourseMinimap />

      <div className="topbar-right">
        <button
          className={`btn-ghost ${notesPanelOpen ? 'active' : ''}`}
          onClick={() => setNotesPanelOpen(!notesPanelOpen)}
        >
          <PencilIcon /> Apuntes
        </button>
        <button
          className={`btn-ghost ${focusMode ? 'active' : ''}`}
          onClick={() => setFocusMode(!focusMode)}
        >
          {focusMode ? 'Salir' : 'Lectura'}
        </button>
      </div>
    </header>
  );
}
