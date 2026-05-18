import type { ReactNode } from 'react';
import { BulbIcon, WarnIcon, CircleIcon, CheckIcon } from '../Icons/Icons';
import './prose.css';

export { CowAnimation } from './CowAnimation';
export { ProcessFanAnimation } from './ProcessFanAnimation';
export { WaitTimeline } from './WaitTimeline';
export { WaitpidMatrix } from './WaitpidMatrix';
export { ZombieFlow } from './ZombieFlow';
export { ThreadsFlow } from './ThreadsFlow';
export { CircularWait } from './CircularWait';
export { LinearOrdering } from './LinearOrdering';
export { MemoryLayout } from './MemoryLayout';
export { FifoBlockingFlow } from './FifoBlockingFlow';
export { IpcKeyFlow } from './IpcKeyFlow';
export { SemaphoreFlow } from './SemaphoreFlow';
export { SharedMemoryFlow } from './SharedMemoryFlow';
export { MessageQueueFlow } from './MessageQueueFlow';
export { PartitionQueueFlow } from './PartitionQueueFlow';
export { MemoryTrackingFlow } from './MemoryTrackingFlow';
export { FsDriverFlow } from './FsDriverFlow';
export { SuperblockSyncFlow } from './SuperblockSyncFlow';
export { InodeAnatomyFlow } from './InodeAnatomyFlow';
export { DiskLayoutFlow } from './DiskLayoutFlow';
export { FileTypesFlow } from './FileTypesFlow';
export { IoDeviceFlow } from './IoDeviceFlow';
export { DiskGeometryFlow } from './DiskGeometryFlow';
export { SignalsFlow } from './SignalsFlow';
export { SignalCatalog } from './SignalCatalog';

export type CalloutTone = 'idea' | 'warn' | 'info' | 'success' | 'danger';

export function P({ children }: { children: ReactNode }) {
  return <p className="prose-p">{children}</p>;
}

interface CodeProps {
  title?: string;
  children: string;
}
export function Code({ title = 'code', children }: CodeProps) {
  return (
    <div className="card-wrap">
    <div className="card">
      <div className="top">
        <div className="circle">
          <span className="red circle2"></span>
        </div>
        <div className="circle">
          <span className="yellow circle2"></span>
        </div>
        <div className="circle">
          <span className="green circle2"></span>
        </div>
        <div className="header">
          <span id="title2">{title}</span>
        </div>
      </div>
      <div className="code-container">
        <textarea id="code" readOnly value={children}></textarea>
      </div>
    </div>
    </div>
  );
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

export function Quote({ children, attribution, label = 'Quote of the month' }: { children: ReactNode; attribution?: string; label?: string }) {
  return (
    <div className="quote-card-wrap">
      <div className="quote-card">
        <div className="quote-card-name">{label}</div>
        <div className="quote-mark-svg" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 330 307" height="80" width="80">
            <path fill="currentColor" d="M302.258 176.221C320.678 176.221 329.889 185.432 329.889 203.853V278.764C329.889 297.185 320.678 306.395 302.258 306.395H231.031C212.61 306.395 203.399 297.185 203.399 278.764V203.853C203.399 160.871 207.902 123.415 216.908 91.4858C226.323 59.1472 244.539 30.902 271.556 6.75027C280.562 -1.02739 288.135 -2.05076 294.275 3.68014L321.906 29.4692C328.047 35.2001 326.614 42.1591 317.608 50.3461C303.69 62.6266 292.228 80.4334 283.223 103.766C274.626 126.69 270.328 150.842 270.328 176.221H302.258ZM99.629 176.221C118.05 176.221 127.26 185.432 127.26 203.853V278.764C127.26 297.185 118.05 306.395 99.629 306.395H28.402C9.98126 306.395 0.770874 297.185 0.770874 278.764V203.853C0.770874 160.871 5.27373 123.415 14.2794 91.4858C23.6945 59.1472 41.9106 30.902 68.9277 6.75027C77.9335 -1.02739 85.5064 -2.05076 91.6467 3.68014L119.278 29.4692C125.418 35.2001 123.985 42.1591 114.98 50.3461C101.062 62.6266 89.6 80.4334 80.5942 103.766C71.9979 126.69 67.6997 150.842 67.6997 176.221H99.629Z"></path>
          </svg>
        </div>
        <div className="quote-body-text">{children}</div>
        {attribution && <div className="quote-author">- {attribution}</div>}
      </div>
    </div>
  );
}

interface CalloutProps {
  tone?: CalloutTone;
  title: string;
  children: ReactNode;
}
export function Callout({ tone = 'idea', title, children }: CalloutProps) {
  const iconMap = {
    idea: BulbIcon,
    warn: WarnIcon,
    info: CircleIcon,
    success: CheckIcon,
    danger: WarnIcon,
  };
  const Ic = iconMap[tone];
  return (
    <div className="quote-card-wrap">
      <div className={`quote-card callout-card callout-card-${tone}`}>
        <div className="quote-card-name">{title}</div>
        <div className="quote-mark-svg callout-ic-svg" aria-hidden="true"><Ic /></div>
        <div className="quote-body-text">{children}</div>
      </div>
    </div>
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

export interface ProcessState {
  name: string;
  label: string;
  desc: string;
}
export function ProcessFan({ states }: { states: ProcessState[] }) {
  return (
    <div className="proc-fan">
      <div className="proc-fan-stage">
        {states.map((s, i) => (
          <div
            key={s.name}
            className="proc-chip"
            style={{
              ['--i' as string]: i,
              ['--n' as string]: states.length,
            } as React.CSSProperties}
          >
            <div className="proc-chip-tag">{s.name}</div>
            <div className="proc-chip-label">{s.label}</div>
            <div className="proc-chip-desc">{s.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ForkTree() {
  return (
    <div className="fork-tree">
      <div className="fork-tree-stage">
        <svg
          className="fork-edges"
          viewBox="0 0 800 480"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M 400 110 C 400 220, 220 240, 220 360"
            className="fork-edge fork-edge-left"
          />
          <path
            d="M 400 110 C 400 220, 580 240, 580 360"
            className="fork-edge fork-edge-right"
          />
          <circle cx="400" cy="200" r="14" className="fork-pivot" />
          <text x="400" y="205" className="fork-pivot-text" textAnchor="middle">fork()</text>
        </svg>

        <div className="fork-node fork-parent fork-pos-parent">
          <div className="fork-node-pid">PID 1042</div>
          <div className="fork-node-label">Padre</div>
          <div className="fork-node-ret">fork() = ?</div>
        </div>

        <div className="fork-node fork-child fork-parent-after fork-pos-left">
          <div className="fork-node-pid">PID 1042</div>
          <div className="fork-node-label">Padre</div>
          <div className="fork-node-ret">retorno &gt; 0</div>
          <div className="fork-node-note">if (pid != 0)</div>
        </div>

        <div className="fork-node fork-child fork-child-new fork-pos-right">
          <div className="fork-node-pid">PID 1043</div>
          <div className="fork-node-label">Hijo</div>
          <div className="fork-node-ret">retorno = 0</div>
          <div className="fork-node-note">if (pid == 0)</div>
        </div>
      </div>
    </div>
  );
}

export interface CodeLine {
  code: string;
  note?: string;
}
export function CodeExplain({ title = 'codigo.c', lines }: { title?: string; lines: CodeLine[] }) {
  return (
    <div className="code-explain">
      <div className="code-explain-head">{title}</div>
      <ol className="code-explain-list">
        {lines.map((l, i) => (
          <li key={i} className="code-explain-line">
            <pre className="code-explain-code"><code>{l.code}</code></pre>
            {l.note && <div className="code-explain-note">{l.note}</div>}
          </li>
        ))}
      </ol>
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
