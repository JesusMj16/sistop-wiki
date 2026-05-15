import { useState } from 'react';
import { useCourse } from '../../context/CourseContext';
import { useUI } from '../../context/UIContext';
import { MenuIcon, SearchIcon, GithubIcon, ArrowIcon } from '../Icons/Icons';
import TocSection from './TocSection';
import './SideBar.css';

const AUTHORS = [
  { name: 'Dante Neil Martínez Jiménez', user: 'NeilDMJ',  url: 'https://github.com/NeilDMJ' },
  { name: 'Jesús Alfonso Morales Jaimes', user: 'JesusMj16', url: 'https://github.com/JesusMj16' },
];
const REPO_URL = 'https://github.com/JesusMj16/sistop-wiki';
const INSTITUTION = 'Universidad Tecnológica de la Mixteca';
const PROFESSOR = 'M.C. Gabriel Gerónimo Castillo';

export default function SideBar() {
  const { course, pct, doneCount, totalNotes, goToNote, searchResults } = useCourse();
  const { setSidebarOpen, search, setSearch } = useUI();
  const filtered = search.trim() ? searchResults(search) : null;
  const [infoOpen, setInfoOpen] = useState(false);


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

      <section className={`sidebar-info ${infoOpen ? 'is-open' : ''}`} aria-label="Información del proyecto">
        <button
          type="button"
          className="info-toggle"
          onClick={() => setInfoOpen(o => !o)}
          aria-expanded={infoOpen}
          aria-controls="sidebar-info-body"
        >
          <span className="info-toggle-label">Acerca de este proyecto</span>
          <ArrowIcon className={`info-toggle-chev ${infoOpen ? 'open' : ''}`} />
        </button>

        {infoOpen && (
          <div className="info-body" id="sidebar-info-body">
            <div className="info-block">
              <div className="info-eyebrow">Curso</div>
              <div className="info-course">{INSTITUTION}</div>
              <div className="info-prof">{PROFESSOR}</div>
            </div>

            <div className="info-block">
              <div className="info-eyebrow">Autores</div>
              <ul className="info-authors">
                {AUTHORS.map(a => (
                  <li key={a.user}>
                    <a
                      className="info-author-link"
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`GitHub de ${a.name}`}
                    >
                      <GithubIcon className="info-gh" />
                      <span className="info-author-meta">
                        <span className="info-author-name">{a.name}</span>
                        <span className="info-author-user">@{a.user}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <a
              className="info-repo"
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              title="Repositorio en GitHub"
            >
              <GithubIcon className="info-gh" />
              <span>Repositorio del proyecto</span>
            </a>
          </div>
        )}
      </section>
    </aside>
  );
}
