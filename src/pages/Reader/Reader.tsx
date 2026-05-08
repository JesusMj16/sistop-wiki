import { useEffect, useRef, useState } from 'react';
import Topbar from '../../components/Topbar/Topbar';
import SectionHero from '../../components/SectionHero/SectionHero';
import NoteView from '../../components/NoteView/NoteView';
import NavRow from '../../components/NavRow/NavRow';
import FloatingActions from '../../components/FloatingActions/FloatingActions';
import NotesPanel from '../../components/NotesPanel/NotesPanel';
import { useReadingProgress } from '../../hooks/useReadingProgress';
import { useCourse } from '../../context/CourseContext';
import './Reader.css';

export default function Reader() {
  const readerRef = useRef<HTMLElement | null>(null);
  const scrollPct = useReadingProgress(readerRef);
  const { activeNote } = useCourse();
  const [transitionKey, setTransitionKey] = useState(0);

  useEffect(() => {
    setTransitionKey(k => k + 1);
    if (readerRef.current) readerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeNote.id]);

  return (
    <main className="reader" ref={readerRef}>
      <div className="read-progress" style={{ ['--p' as string]: scrollPct + '%' } as React.CSSProperties}>
        <div className="read-progress-bar" />
      </div>

      <Topbar />

      <article className="article" key={transitionKey}>
        <SectionHero />
        <NoteView />
        <NavRow />
      </article>

      <FloatingActions />
      <NotesPanel />
    </main>
  );
}
