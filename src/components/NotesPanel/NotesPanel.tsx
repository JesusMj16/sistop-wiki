import { useCourse } from '../../context/CourseContext';
import { useUI } from '../../context/UIContext';
import './NotesPanel.css';

export default function NotesPanel() {
  const { activeNote, notesOwn, setOwnNote } = useCourse();
  const { notesPanelOpen, setNotesPanelOpen } = useUI();

  if (!notesPanelOpen) return null;
  const value = notesOwn[activeNote.id] || '';
  const count = value.length;

  return (
    <aside className="notes-panel">
      <header className="notes-head">
        <div>
          <div className="notes-eyebrow">Tus apuntes sobre</div>
          <div className="notes-on">{activeNote.title}</div>
        </div>
        <button className="icon-btn" onClick={() => setNotesPanelOpen(false)} aria-label="Cerrar apuntes">✕</button>
      </header>
      <textarea
        className="notes-area"
        placeholder="Escribe lo que quieras recordar..."
        value={value}
        onChange={(e) => setOwnNote(activeNote.id, e.target.value)}
      />
      <div className="notes-foot">
        <span>{count} caracteres</span>
        <span className="dot-faint" />
        <span>Guardado automáticamente</span>
      </div>
    </aside>
  );
}
