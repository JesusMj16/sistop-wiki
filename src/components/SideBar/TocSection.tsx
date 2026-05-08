import { useEffect, useState } from 'react';
import type { Section } from '../../types/course';
import { useCourse } from '../../context/CourseContext';
import { ArrowIcon, BookmarkIcon, CheckIcon, CircleIcon } from '../Icons/Icons';
import { KIND_LABEL } from '../../data/noteKindMeta';

interface Props {
  section: Section;
}

export default function TocSection({ section }: Props) {
  const { activeSection, activeNote, completed, bookmarks, setActiveNote, toggleCompleted } = useCourse();
  const isActive = activeSection.id === section.id;
  const [open, setOpen] = useState(isActive);

  useEffect(() => { if (isActive) setOpen(true); }, [isActive]);

  const done = section.notes.filter(n => completed[n.id]).length;
  const total = section.notes.length;
  const allDone = done === total;

  const cls = ['toc-sec'];
  if (isActive) cls.push('is-active');
  if (open) cls.push('is-open');

  return (
    <div className={cls.join(' ')}>
      <button className="toc-sec-head" onClick={() => setOpen(o => !o)}>
        <span className="toc-num">{section.number}</span>
        <span className="toc-title">{section.title}</span>
        <span className={`toc-count ${allDone ? 'done' : ''}`}>{done}/{total}</span>
        <ArrowIcon className={`toc-chev ${open ? 'open' : ''}`} />
      </button>
      {open && (
        <ul className="toc-notes">
          {section.notes.map(n => {
            const isDone = !!completed[n.id];
            const isCurr = activeNote.id === n.id;
            const isMark = !!bookmarks[n.id];
            return (
              <li key={n.id} className={`toc-note ${isCurr ? 'current' : ''}`}>
                <button
                  className="toc-tick"
                  aria-label={isDone ? 'Marcar como no leída' : 'Marcar como leída'}
                  onClick={(e) => { e.stopPropagation(); toggleCompleted(n.id); }}
                >
                  {isDone ? <CheckIcon /> : <CircleIcon />}
                </button>
                <button className="toc-note-btn" onClick={() => setActiveNote(section.id, n.id)}>
                  <span className="toc-note-title">{n.title}</span>
                  <span className="toc-note-kind">{KIND_LABEL[n.kind]}</span>
                </button>
                {isMark && <BookmarkIcon className="toc-mark" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
