import type { Block, ThinkerItem } from '../../types/course';
import { BulbIcon, WarnIcon } from '../Icons/Icons';
import RichText from './RichText';
import LineaDividida from './LineaDividida';
import './BlockRenderer.css';

export default function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case 'p':
      return <p className="prose-p"><RichText html={block.text} /></p>;
    case 'title': {
      const level = block.level ?? 2;
      const Tag = (`h${level}`) as 'h2' | 'h3' | 'h4';
      return <Tag className={`prose-title prose-title-h${level}`}><RichText html={block.text} /></Tag>;
    }
    case 'list':
      return (
        <ul className="prose-list">
          {block.items.map((it, i) => (
            <li key={i}><RichText html={it} /></li>
          ))}
        </ul>
      );

    case 'quote':
      return (
        <figure className="prose-quote">
          <div className="quote-mark" aria-hidden="true">"</div>
          <blockquote>{block.text}</blockquote>
          {block.attribution && <figcaption>{block.attribution}</figcaption>}
        </figure>
      );

    case 'callout': {
      const tone = block.tone || 'idea';
      const Ic = tone === 'warn' ? WarnIcon : BulbIcon;
      return (
        <aside className={`callout callout-${tone}`}>
          <div className="callout-ic"><Ic /></div>
          <div className="callout-content">
            <div className="callout-title">{block.title}</div>
            <div className="callout-body"><RichText html={block.text} /></div>
          </div>
        </aside>
      );
    }

    case 'table':
      return (
        <div className="prose-table-wrap">
          <table className="prose-table">
            <thead>
              <tr>{block.headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i}>{row.map((c, j) => <td key={j}>{c}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'thinkers':
      return (
        <div className="thinkers">
          {block.items.map((p: ThinkerItem, i) => (
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

    case 'diagram':
      if (block.kind === 'linea-dividida') return <LineaDividida />;
      return null;

    default:
      return null;
  }
}
