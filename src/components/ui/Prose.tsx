import type { ReactNode } from 'react';
import { BulbIcon, WarnIcon } from '../Icons/Icons';
import './prose.css';

export type CalloutTone = 'idea' | 'warn';

export function P({ children }: { children: ReactNode }) {
  return <p className="prose-p">{children}</p>;
}

export function H2({ children }: { children: ReactNode }) {
  return <h2 className="prose-title prose-title-h2">{children}</h2>;
}

export function H3({ children }: { children: ReactNode }) {
  return <h3 className="prose-title prose-title-h3">{children}</h3>;
}

export function H4({ children }: { children: ReactNode }) {
  return <h4 className="prose-title prose-title-h4">{children}</h4>;
}

export function List({ children }: { children: ReactNode }) {
  return <ul className="prose-list">{children}</ul>;
}

export function Quote({ children, attribution }: { children: ReactNode; attribution?: string }) {
  return (
    <figure className="prose-quote">
      <div className="quote-mark" aria-hidden="true">"</div>
      <blockquote>{children}</blockquote>
      {attribution && <figcaption>{attribution}</figcaption>}
    </figure>
  );
}

interface CalloutProps {
  tone?: CalloutTone;
  title: string;
  children: ReactNode;
}
export function Callout({ tone = 'idea', title, children }: CalloutProps) {
  const Ic = tone === 'warn' ? WarnIcon : BulbIcon;
  return (
    <aside className={`callout callout-${tone}`}>
      <div className="callout-ic"><Ic /></div>
      <div className="callout-content">
        <div className="callout-title">{title}</div>
        <div className="callout-body">{children}</div>
      </div>
    </aside>
  );
}

interface TableProps {
  headers: string[];
  rows: ReactNode[][];
}
export function Table({ headers, rows }: TableProps) {
  return (
    <div className="prose-table-wrap">
      <table className="prose-table">
        <thead>
          <tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>{row.map((c, j) => <td key={j}>{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export interface ThinkerItem {
  name: string;
  years: string;
  arche: string;
  note: string;
}
export function Thinkers({ items }: { items: ThinkerItem[] }) {
  return (
    <div className="thinkers">
      {items.map((p, i) => (
        <article key={i} className="thinker-card" style={{ ['--i' as string]: i } as React.CSSProperties}>
          <div className="thinker-portrait" aria-hidden="true">
            <span className="th-initial">{p.name[0]}</span>
            <span className="th-glyph" />
          </div>
          <div className="thinker-meta">
            <h4 className="th-name">{p.name}</h4>
            <div className="th-years">{p.years}</div>
            <div className="th-arche"><span className="arche-lbl">arché</span> {p.arche}</div>
            <p className="th-note">{p.note}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
