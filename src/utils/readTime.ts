import type { Note } from '../types/course';

export function estimateReadMinutes(note: Note): number {
  const text = JSON.stringify(note.body || '');
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}
