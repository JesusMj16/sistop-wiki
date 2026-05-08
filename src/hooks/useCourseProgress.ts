import { useMemo } from 'react';
import type { Course } from '../types/course';

export function useCourseProgress(course: Course, completed: Record<string, boolean>) {
  return useMemo(() => {
    const totalNotes = course.sections.reduce((a, s) => a + s.notes.length, 0);
    const doneCount = Object.values(completed).filter(Boolean).length;
    const pct = totalNotes > 0 ? Math.round((doneCount / totalNotes) * 100) : 0;
    return { totalNotes, doneCount, pct };
  }, [course, completed]);
}
