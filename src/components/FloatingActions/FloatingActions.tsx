import { useCourse } from '../../context/CourseContext';
import { useUI } from '../../context/UIContext';
import { BookmarkIcon, BookmarkOIcon, CheckIcon, CircleIcon, PencilIcon } from '../Icons/Icons';
import './FloatingActions.css';

export default function FloatingActions() {
  const { activeNote, completed, bookmarks, notesOwn, toggleCompleted, toggleBookmark } = useCourse();
  const { setNotesPanelOpen } = useUI();

  const isDone = !!completed[activeNote.id];
  const isBookmarked = !!bookmarks[activeNote.id];
  const hasOwnNote = !!(notesOwn[activeNote.id] || '').trim();

  return (
    <div className="fab-rail" aria-label="Acciones rápidas">
      <button
        className={`fab ${isDone ? 'fab-done' : ''}`}
        onClick={() => toggleCompleted(activeNote.id)}
        title={isDone ? 'Marcada como leída' : 'Marcar como leída'}
      >
        {isDone ? <CheckIcon /> : <CircleIcon />}
      </button>
      <button
        className={`fab ${isBookmarked ? 'fab-mark' : ''}`}
        onClick={() => toggleBookmark(activeNote.id)}
        title="Bookmark"
      >
        {isBookmarked ? <BookmarkIcon /> : <BookmarkOIcon />}
      </button>
      <button
        className={`fab ${hasOwnNote ? 'fab-has' : ''}`}
        onClick={() => setNotesPanelOpen(true)}
        title="Mis apuntes"
      >
        <PencilIcon />
        {hasOwnNote && <span className="fab-pip" />}
      </button>
    </div>
  );
}
