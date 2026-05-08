import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import type { Course, Note, Section } from '../types/course';
import { COURSE } from '../data/courseData';
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
  setActiveNote: (sectionId: string, noteId: string) => void;
  toggleCompleted: (id: string) => void;
  toggleBookmark: (id: string) => void;
  setOwnNote: (id: string, text: string) => void;
  searchResults: (query: string) => FlatItem[];
}

const CourseContext = createContext<CourseContextValue | null>(null);

interface ActiveIds { sectionId: string; noteId: string }

export function CourseProvider({ children, course = COURSE }: { children: ReactNode; course?: Course }) {
  const firstSec = course.sections[0];
  const firstNote = firstSec.notes[0];

  const [active, setActive] = useLocalStorage<ActiveIds>('wikinotes.active.v1', {
    sectionId: firstSec.id,
    noteId: firstNote.id,
  });
  const [completed, setCompleted] = useLocalStorage<Record<string, boolean>>('wikinotes.completed.v1', {});
  const [bookmarks, setBookmarks] = useLocalStorage<Record<string, boolean>>('wikinotes.bookmarks.v1', {});
  const [notesOwn, setNotesOwn] = useLocalStorage<Record<string, string>>('wikinotes.notesOwn.v1', {});

  const activeSection = course.sections.find(s => s.id === active.sectionId) ?? firstSec;
  const activeNote = activeSection.notes.find(n => n.id === active.noteId) ?? activeSection.notes[0];
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

  const setActiveNote = useCallback((sectionId: string, noteId: string) => {
    setActive({ sectionId, noteId });
  }, [setActive]);

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
      const hay = (n.title + ' ' + sec.title + ' ' + JSON.stringify(n.body)).toLowerCase();
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
    setActiveNote,
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
