interface Segment {
  label: string;
  k: string;
  w: number;
  tone: 'a' | 'b' | 'c' | 'd';
}

const SEGMENTS: Segment[] = [
  { label: 'Imágenes / sombras', k: 'Imaginación (eikasía)', w: 14, tone: 'a' },
  { label: 'Cosas sensibles',     k: 'Creencia (pístis)',     w: 22, tone: 'b' },
  { label: 'Objetos matemáticos', k: 'Pensamiento (diánoia)', w: 28, tone: 'c' },
  { label: 'Ideas / Formas',      k: 'Inteligencia (nóesis)', w: 36, tone: 'd' },
];

export default function LineaDividida() {
  return (
    <div className="diagram diagram-linea">
      <div className="diagram-axis">
        <span>← mundo sensible</span>
        <span>mundo inteligible →</span>
      </div>
      <div className="diagram-bar">
        {SEGMENTS.map((s, i) => (
          <div key={i} className={`diag-seg diag-${s.tone}`} style={{ flexGrow: s.w }}>
            <div className="diag-label">{s.label}</div>
            <div className="diag-sub">{s.k}</div>
          </div>
        ))}
      </div>
      <div className="diagram-foot">— grado de realidad y conocimiento —</div>
    </div>
  );
}
