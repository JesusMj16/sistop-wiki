import { useCourse } from '../../context/CourseContext';
import { ArrowIcon } from '../Icons/Icons';
import './NavRow.css';

export default function NavRow() {
  const { prev, next, goToNote } = useCourse();

  return (
    <div className="navrow">
      <button
        className="nav-btn nav-prev"
        disabled={!prev}
        onClick={() => prev && goToNote(prev.sec, prev.n)}
      >
        {prev ? (
          <>
            <span className="nav-dir">
              <ArrowIcon style={{ transform: 'rotate(180deg)' }} /> Anterior
            </span>
            <span className="nav-title">{prev.n.title}</span>
            <span className="nav-sec">{prev.sec.number} · {prev.sec.title}</span>
          </>
        ) : <span className="nav-dir"> Inicio del curso</span>}
      </button>
      <button
        className="nav-btn nav-next"
        disabled={!next}
        onClick={() => next && goToNote(next.sec, next.n)}
      >
        {next ? (
          <>
            <span className="nav-dir">Siguiente <ArrowIcon /></span>
            <span className="nav-title">{next.n.title}</span>
            <span className="nav-sec">{next.sec.number} · {next.sec.title}</span>
          </>
        ) : <span className="nav-dir">Fin del curso —</span>}
      </button>
    </div>
  );
}
