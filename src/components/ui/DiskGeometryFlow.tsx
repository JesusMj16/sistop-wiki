import { useEffect, useRef, useState } from 'react';
import './prose.css';

/**
 * Animación. Geometría del disco. Pistas, sectores, tiempo de búsqueda
 * (seek), retardo de giro (rotational latency), tiempo de acceso total.
 */

type Step = {
  title: string;
  /** Pista actual del cabezal. 0..3, donde 3 es la pista exterior. */
  track: number;
  /** Sector deseado en grados. 0..360. */
  sectorAngle: number;
  /** Etiqueta visible. */
  badge?: string;
  desc: string;
};

const STEPS: Step[] = [
  {
    title: 'Paso 0. Anatomía. Pistas concéntricas y sectores',
    track: 1,
    sectorAngle: 45,
    desc: 'El disco es un plato magnético que gira a velocidad constante. Sus datos viven en círculos concéntricos llamados pistas. Cada pista se divide en bloques curvos llamados sectores, típicamente de 512 bytes. Para leer cualquier bloque, el cabezal debe primero ponerse sobre la pista correcta y después esperar a que el sector deseado pase debajo suyo.',
  },
  {
    title: 'Paso 1. Tiempo de búsqueda. El cabezal cambia de pista',
    track: 3,
    sectorAngle: 45,
    badge: 'SEEK TIME',
    desc: 'El controlador necesita acceder a un sector que vive en una pista distinta de donde está ahora el cabezal. El brazo del disco se mueve mecánicamente hasta posicionarse sobre la pista correcta. A ese tiempo se le llama tiempo de búsqueda. Es el componente más caro porque involucra movimiento físico de masa. Típicamente entre 3 y 15 milisegundos.',
  },
  {
    title: 'Paso 2. Retardo de giro. Esperando al sector',
    track: 3,
    sectorAngle: 270,
    badge: 'ROTATIONAL LATENCY',
    desc: 'El cabezal ya está sobre la pista correcta pero el sector deseado todavía no pasa debajo. El plato continúa girando hasta que el inicio del sector se alinea con la cabeza. Ese tiempo de espera se llama retardo de giro o latencia rotacional. Para un disco a 7200 RPM el promedio es 4.16 ms.',
  },
  {
    title: 'Paso 3. Tiempo de acceso total. Lectura ocurre',
    track: 3,
    sectorAngle: 0,
    badge: 'ACCESS TIME = seek + latency',
    desc: 'El cabezal está en la pista correcta y el sector deseado por fin coincide con la cabeza. Se realiza la lectura o escritura. La suma del tiempo de búsqueda más el retardo de giro es lo que se llama tiempo de acceso total. Es la cifra realista que importa para medir el rendimiento de un disco mecánico. Los SSD eliminan ambos componentes por eso son varios órdenes de magnitud más rápidos.',
  },
];

const AUTO_MS = 3200;

export function DiskGeometryFlow() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number | null>(null);
  const current = STEPS[step];

  useEffect(() => {
    if (!playing) {
      if (timer.current) { window.clearTimeout(timer.current); timer.current = null; }
      return;
    }
    timer.current = window.setTimeout(() => {
      setStep(s => (s + 1) % STEPS.length);
    }, AUTO_MS);
    return () => { if (timer.current) window.clearTimeout(timer.current); };
  }, [playing, step]);

  function goTo(s: number) {
    setPlaying(false);
    setStep(Math.max(0, Math.min(STEPS.length - 1, s)));
  }

  // Calculate arm tip position based on current track
  const trackRadii = [40, 55, 70, 85]; // inner to outer
  const r = trackRadii[current.track];
  const angleRad = (current.sectorAngle - 90) * Math.PI / 180;
  const headX = 100 + r * Math.cos(angleRad);
  const headY = 100 + r * Math.sin(angleRad);

  // Sector arc coordinates. Sector is 30deg wide centered at sectorAngle.
  const sectorStartRad = (current.sectorAngle - 90 - 15) * Math.PI / 180;
  const sectorEndRad   = (current.sectorAngle - 90 + 15) * Math.PI / 180;
  const sectorInner = r - 8;
  const sectorOuter = r + 8;
  const sx1 = 100 + sectorInner * Math.cos(sectorStartRad);
  const sy1 = 100 + sectorInner * Math.sin(sectorStartRad);
  const sx2 = 100 + sectorOuter * Math.cos(sectorStartRad);
  const sy2 = 100 + sectorOuter * Math.sin(sectorStartRad);
  const sx3 = 100 + sectorOuter * Math.cos(sectorEndRad);
  const sy3 = 100 + sectorOuter * Math.sin(sectorEndRad);
  const sx4 = 100 + sectorInner * Math.cos(sectorEndRad);
  const sy4 = 100 + sectorInner * Math.sin(sectorEndRad);
  const sectorPath = `M ${sx1} ${sy1} L ${sx2} ${sy2} A ${sectorOuter} ${sectorOuter} 0 0 1 ${sx3} ${sy3} L ${sx4} ${sy4} A ${sectorInner} ${sectorInner} 0 0 0 ${sx1} ${sy1} Z`;

  return (
    <div className="zf-wrap dgf-wrap">
      <div className="zf-head">
        <span className="zf-step-num">{step + 1}<small>/{STEPS.length}</small></span>
        <h4 className="zf-step-title">{current.title}</h4>
        <button
          className={`fbf-play ${playing ? 'fbf-play-on' : ''}`}
          onClick={() => setPlaying(p => !p)}
          aria-label={playing ? 'Pausar' : 'Reproducir'}
        >
          {playing ? '❚❚ PAUSA' : '▶ AUTO'}
        </button>
      </div>

      <div className="dgf-board">
        <div className="dgf-disk-wrap">
          <svg viewBox="0 0 200 200" className="dgf-svg">
            {/* platter */}
            <circle cx="100" cy="100" r="95" className="dgf-platter" />
            {/* tracks */}
            {trackRadii.map((tr, i) => (
              <circle
                key={i}
                cx="100" cy="100" r={tr}
                className={`dgf-track ${i === current.track ? 'dgf-track-on' : ''}`}
              />
            ))}
            {/* sector arcs every 30 degrees on outer track */}
            {Array.from({ length: 12 }).map((_, i) => {
              const a = (i * 30 - 90) * Math.PI / 180;
              const x1 = 100 + 35 * Math.cos(a);
              const y1 = 100 + 35 * Math.sin(a);
              const x2 = 100 + 92 * Math.cos(a);
              const y2 = 100 + 92 * Math.sin(a);
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className="dgf-sector-line" />;
            })}
            {/* target sector */}
            <path d={sectorPath} className="dgf-sector-target" />
            {/* spindle */}
            <circle cx="100" cy="100" r="14" className="dgf-spindle" />
            {/* arm + head */}
            <line x1="100" y1="100" x2={headX} y2={headY} className="dgf-arm" />
            <circle cx={headX} cy={headY} r="6" className="dgf-head" />
          </svg>
          {current.badge && <div className="dgf-badge">{current.badge}</div>}
        </div>

        <div className="dgf-legend">
          <div className="dgf-legend-item">
            <span className="dgf-sw dgf-sw-track" /> pista (track)
          </div>
          <div className="dgf-legend-item">
            <span className="dgf-sw dgf-sw-sector" /> sector deseado
          </div>
          <div className="dgf-legend-item">
            <span className="dgf-sw dgf-sw-head" /> cabezal de lectura
          </div>
          <div className="dgf-legend-item">
            <span className="dgf-sw dgf-sw-arm" /> brazo mecánico
          </div>
        </div>
      </div>

      <p className="zf-desc">{current.desc}</p>

      <div className="zf-nav">
        <button className="zf-nav-btn" onClick={() => goTo(step - 1)} disabled={step === 0} aria-label="Anterior">◀</button>
        <div className="zf-dots">
          {STEPS.map((_, i) => (
            <button
              key={i}
              className={`zf-dot ${step === i ? 'zf-dot-on' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Paso ${i + 1}`}
            />
          ))}
        </div>
        <button className="zf-nav-btn zf-nav-next" onClick={() => goTo(step + 1)} disabled={step === STEPS.length - 1} aria-label="Siguiente">▶</button>
      </div>
    </div>
  );
}
