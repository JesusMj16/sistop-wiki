import { useCourse } from '../../context/CourseContext';
import './CourseMinimap.css';

export default function CourseMinimap() {
  const { course, completed, activeNote, setActiveNote } = useCourse();
  return (
    <div className="minimap" role="navigation" aria-label="Mapa del curso">
      {course.sections.map(sec => (
        <div key={sec.id} className="mm-sec" title={`${sec.number} · ${sec.title}`}>
          {sec.notes.map(n => {
            const done = !!completed[n.id];
            const curr = activeNote.id === n.id;
            const cls = ['mm-dot'];
            if (done) cls.push('done');
            if (curr) cls.push('curr');
            return (
              <button
                key={n.id}
                className={cls.join(' ')}
                aria-label={n.title}
                title={n.title}
                onClick={() => setActiveNote(sec.id, n.id)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
