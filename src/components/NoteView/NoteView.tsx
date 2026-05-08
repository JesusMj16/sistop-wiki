import { useCourse } from '../../context/CourseContext';
import { useUI } from '../../context/UIContext';
import { ArrowIcon, BookmarkIcon, BookmarkOIcon, CheckIcon, CircleIcon, PencilIcon } from '../Icons/Icons';
import { KIND_ICON, KIND_LABEL } from '../../data/noteKindMeta';
import BlockRenderer from '../BlockRenderer/BlockRenderer';
import './NoteView.css';

export default function NoteView() {
  const {
    activeSection, activeNote, activeNoteIdx,
    completed, bookmarks, notesOwn,
    toggleCompleted, toggleBookmark,
  } = useCourse();
  const { setNotesPanelOpen } = useUI();

  const isDone = !!completed[activeNote.id];
  const isBookmarked = !!bookmarks[activeNote.id];
  const ownNote = notesOwn[activeNote.id] || '';
  const KindIc = KIND_ICON[activeNote.kind];

  return (
    <section className={`note kind-${activeNote.kind}`}>
      <article className="note-card">
        <header className={`note-ribbon ribbon-${activeNote.kind}`}>
          <KindIc />
          <span>{KIND_LABEL[activeNote.kind]}</span>
        </header>
        <div className="note-head">
          <div className="note-counter">
            <span className="counter-num">{String(activeNoteIdx + 1).padStart(2, '0')}</span>
            <span className="counter-of">de {activeSection.notes.length}</span>
          </div>
          <h3 className="note-title">{activeNote.title}</h3>
          <div className="note-tools">
            <button
              className="tool-btn"
              onClick={() => toggleBookmark(activeNote.id)}
              aria-pressed={isBookmarked}
              title={isBookmarked ? 'Quitar bookmark' : 'Marcar'}
            >
              {isBookmarked ? <BookmarkIcon /> : <BookmarkOIcon />}
            </button>
            <button
              className={`tool-done ${isDone ? 'is-done' : ''}`}
              onClick={() => toggleCompleted(activeNote.id)}
            >
              {isDone ? <><CheckIcon /> Completada</> : <><CircleIcon /> Marcar como leída</>}
            </button>
          </div>
        </div>

        <article className="note-body">
          {activeNote.body.map((b, i) => <BlockRenderer key={i} block={b} />)}
        </article>

        <div className="note-foot">
          <button className="own-prompt" onClick={() => setNotesPanelOpen(true)}>
            <PencilIcon />
            <span>{ownNote ? 'Continúa tus apuntes sobre esta nota' : 'Toma tus propios apuntes sobre esta nota'}</span>
            <ArrowIcon />
          </button>
        </div>
      </article>
    </section>
  );
}
