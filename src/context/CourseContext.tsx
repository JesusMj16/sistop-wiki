import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Course, Note, Section } from '../types/course';
import { COURSE, notePath } from '../data/courseData';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useCourseProgress } from '../hooks/useCourseProgress';

interface FlatItem { sec: Section; n: Note }

interface CourseContextValue {
  course: Course;
  activeSection: Section;
  activeNote: Note;
  activeNoteIdx: number;
  prev: FlatItem | undefined;
  next: FlatItem | undefined;
  completed: Record<string, boolean>;
  bookmarks: Record<string, boolean>;
  notesOwn: Record<string, string>;
  totalNotes: number;
  doneCount: number;
  pct: number;
  goToNote: (sec: Section, n: Note) => void;
  toggleCompleted: (id: string) => void;
  toggleBookmark: (id: string) => void;
  setOwnNote: (id: string, text: string) => void;
  searchResults: (query: string) => FlatItem[];
}

const CourseContext = createContext<CourseContextValue | null>(null);

export function CourseProvider({ children, course = COURSE }: { children: ReactNode; course?: Course }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [completed, setCompleted] = useLocalStorage<Record<string, boolean>>('wikinotes.completed.v1', {});
  const [bookmarks, setBookmarks] = useLocalStorage<Record<string, boolean>>('wikinotes.bookmarks.v1', {});
  const [notesOwn, setNotesOwn] = useLocalStorage<Record<string, string>>('wikinotes.notesOwn.v1', {});

  const [secPath, nPath] = location.pathname.split('/').filter(Boolean);
  const matchedSection = course.sections.find(s => s.path === secPath);
  const activeSection = matchedSection ?? course.sections[0];
  const matchedNote = matchedSection?.notes.find(n => n.path === nPath);
  const activeNote = matchedNote ?? activeSection.notes[0];
  const activeNoteIdx = activeSection.notes.findIndex(n => n.id === activeNote.id);

  const flat = useMemo<FlatItem[]>(() => {
    const arr: FlatItem[] = [];
    course.sections.forEach(sec => sec.notes.forEach(n => arr.push({ sec, n })));
    return arr;
  }, [course]);
  const flatIdx = flat.findIndex(x => x.n.id === activeNote.id);
  const prev = flat[flatIdx - 1];
  const next = flat[flatIdx + 1];

  const { totalNotes, doneCount, pct } = useCourseProgress(course, completed);

  const goToNote = useCallback((sec: Section, n: Note) => {
    navigate(notePath(sec.path, n.path));
  }, [navigate]);

  const toggleCompleted = useCallback((id: string) => {
    setCompleted(c => ({ ...c, [id]: !c[id] }));
  }, [setCompleted]);

  const toggleBookmark = useCallback((id: string) => {
    setBookmarks(b => ({ ...b, [id]: !b[id] }));
  }, [setBookmarks]);

  const setOwnNote = useCallback((id: string, text: string) => {
    setNotesOwn(n => ({ ...n, [id]: text }));
  }, [setNotesOwn]);

  const searchResults = useCallback((query: string): FlatItem[] => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return flat.filter(({ sec, n }) => {
      const hay = (n.title + ' ' + sec.title).toLowerCase();
      return hay.includes(q);
    });
  }, [flat]);

  const value: CourseContextValue = {
    course,
    activeSection,
    activeNote,
    activeNoteIdx,
    prev,
    next,
    completed,
    bookmarks,
    notesOwn,
    totalNotes,
    doneCount,
    pct,
    goToNote,
    toggleCompleted,
    toggleBookmark,
    setOwnNote,
    searchResults,
  };

  return <CourseContext.Provider value={value}>{children}</CourseContext.Provider>;
}

export function useCourse(): CourseContextValue {
  const ctx = useContext(CourseContext);
  if (!ctx) throw new Error('useCourse must be used within CourseProvider');
  return ctx;
}
