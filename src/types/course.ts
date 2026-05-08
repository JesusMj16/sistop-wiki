export type NoteKind =
  | 'lectura'
  | 'concepto'
  | 'referencia'
  | 'ejercicio'
  | 'diagrama'
  | 'sintesis'
  | 'siguiente';

export type CalloutTone = 'idea' | 'warn';

export interface ParagraphBlock {
  type: 'p';
  text: string;
}

export interface TitleBlock {
  type: 'title';
  text: string;
  level?: 2 | 3 | 4;
}

export interface ListBlock {
  type: 'list';
  items: string[];
}

export interface QuoteBlock {
  type: 'quote';
  text: string;
  attribution?: string;
}

export interface CalloutBlock {
  type: 'callout';
  tone?: CalloutTone;
  title: string;
  text: string;
}

export interface TableBlock {
  type: 'table';
  headers: string[];
  rows: string[][];
}

export interface ThinkerItem {
  name: string;
  years: string;
  arche: string;
  note: string;
}

export interface ThinkersBlock {
  type: 'thinkers';
  items: ThinkerItem[];
}

export type DiagramKind = 'linea-dividida';

export interface DiagramBlock {
  type: 'diagram';
  kind: DiagramKind;
}

export type Block =
  | ParagraphBlock
  | TitleBlock
  | ListBlock
  | QuoteBlock
  | CalloutBlock
  | TableBlock
  | ThinkersBlock
  | DiagramBlock;

export interface Note {
  id: string;
  title: string;
  kind: NoteKind;
  body: Block[];
}

export interface Section {
  id: string;
  number: string;
  title: string;
  summary: string;
  duration: string;
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
  activeSection: string;
  activeNote: string;
}
