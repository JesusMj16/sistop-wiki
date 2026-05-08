import { useCourse } from '../../context/CourseContext';
import { ClockIcon } from '../Icons/Icons';
import './SectionHero.css';

export default function SectionHero() {
  const { activeSection, completed } = useCourse();
  const sectionDone = activeSection.notes.filter(n => completed[n.id]).length;
  const sectionTotal = activeSection.notes.length;
  const pct = Math.round((sectionDone / sectionTotal) * 100);

  return (
    <div className="hero">
      <div className="hero-bg" aria-hidden="true">
        <div className="hero-grid" />
        <div className="hero-glow" />
      </div>
      <div className="hero-num" aria-hidden="true">
        <span className="hero-num-bg">{activeSection.number}</span>
        <span className="hero-num-fg">{activeSection.number}</span>
      </div>
      <div className="hero-meta">
        <div className="hero-chips">
          <span className="chip chip-sec">Sección {activeSection.number}</span>
          <span className="chip chip-prog">
            <span className="chip-prog-track">
              <span className="chip-prog-fill" style={{ width: pct + '%' }} />
            </span>
            {sectionDone}/{sectionTotal}
          </span>
        </div>
        <h2 className="hero-title">{activeSection.title}</h2>
        <p className="hero-sum">{activeSection.summary}</p>
      </div>
    </div>
  );
}
