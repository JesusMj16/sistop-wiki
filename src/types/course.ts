export type NoteKind =
  | 'lectura'
  | 'concepto'
  | 'referencia'
  | 'ejercicio'
  | 'diagrama'
  | 'sintesis'
  | 'siguiente';

export interface Note {
  id: string;
  title: string;
  kind: NoteKind;
  path: string;
}

export interface Section {
  id: string;
  number: string;
  title: string;
  summary: string;
  duration: string;
  path: string;
  notes: Note[];
}

export interface Course {
  title: string;
  subtitle: string;
  author: string;
  semester: string;
  sections: Section[];
}

export interface PersistedState {
  completed: Record<string, boolean>;
  bookmarks: Record<string, boolean>;
  notesOwn: Record<string, string>;
  highlights: Record<string, unknown>;
}
