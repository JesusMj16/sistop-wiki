import { useCourse } from '../../context/CourseContext';
import { useUI } from '../../context/UIContext';
import { MenuIcon, SearchIcon } from '../Icons/Icons';
import TocSection from './TocSection';
import './SideBar.css';

export default function SideBar() {
  const { course, pct, doneCount, totalNotes, goToNote, searchResults } = useCourse();
  const { setSidebarOpen, search, setSearch } = useUI();
  const filtered = search.trim() ? searchResults(search) : null;

  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <div className="brand">
          <div className="brand-meta">
            <div className="brand-title">Notas</div>
            <div className="brand-sub">Guía de estudio</div>
          </div>
        </div>
        <button className="icon-btn" onClick={() => setSidebarOpen(false)} aria-label="Ocultar sidebar">
          <MenuIcon />
        </button>
      </div>

      <div className="course-card">
        <div className="course-eyebrow">Curso  {course.semester}</div>
        <h1 className="course-title">{course.title}</h1>
        <div className="course-author">{course.author}</div>
        <div className="progress">
          <div className="progress-track"><div className="progress-fill" style={{ width: pct + '%' }} /></div>
          <div className="progress-meta">
            <span><strong>{pct}%</strong> completado</span>
            <span>{doneCount}/{totalNotes} notas</span>
          </div>
        </div>
      </div>

      <div className="search">
        <SearchIcon className="search-ic" />
        <input
          type="text"
          placeholder="Buscar en el curso..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <nav className="toc">
        {filtered ? (
          <div className="toc-search-results">
            <div className="toc-eyebrow">{filtered.length} resultados</div>
            {filtered.map(({ sec, n }) => (
              <button
                key={n.id}
                className="toc-result"
                onClick={() => { goToNote(sec, n); setSearch(''); }}
              >
                <div className="toc-result-sec">{sec.number} · {sec.title}</div>
                <div className="toc-result-note">{n.title}</div>
              </button>
            ))}
            {!filtered.length && <div className="toc-empty">Nada por aquí.</div>}
          </div>
        ) : (
          course.sections.map(sec => <TocSection key={sec.id} section={sec} />)
        )}
      </nav>

      <div className="sidebar-foot">
        <span className="dot" /> Tu progreso se guarda automáticamente
      </div>
    </aside>
  );
}
