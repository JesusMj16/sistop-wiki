import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import './prose.css';

type CowStep = {
  label: string;
  title: string;
  desc: string;
  takeaway: string;
};

const COW_STEPS: CowStep[] = [
  {
    label: 'PASO 1 DE 4',
    title: 'ANTES DE fork()',
    desc: 'Solo existe el proceso padre con tres páginas virtuales en su tabla de páginas. Cada entrada virtual está respaldada por una página física real en la RAM, propiedad exclusiva del padre. Aún no hay nada que compartir.',
    takeaway: 'Punto de partida, una sola tabla de páginas, tres páginas físicas vivas.',
  },
  {
    label: 'PASO 2 DE 4',
    title: 'fork(), copia lógica de la tabla',
    desc: 'El kernel duplica la tabla de páginas del padre dentro del nuevo proceso hijo. La RAM no se toca, ambas tablas apuntan a las mismas páginas físicas. El kernel marca esas páginas como solo lectura (RO) en las dos tablas, de modo que la MMU pueda detectar después cualquier intento de escritura.',
    takeaway: 'Cero copias en RAM, fork() retorna en microsegundos sin importar el tamaño del padre.',
  },
  {
    label: 'PASO 3 DE 4',
    title: 'El hijo escribe, se dispara COW',
    desc: 'El hijo intenta escribir en la Página 1. La MMU ve que la entrada está marcada RO y lanza un fallo de página (page fault) hacia el kernel. El kernel atrapa la falla, reserva una nueva página física, copia el contenido original ahí, actualiza la tabla del hijo para apuntar a la copia y la marca como RW. El proceso jamás se entera del rodeo.',
    takeaway: 'Solo la página tocada se duplica, el resto sigue compartido. Esa es la esencia de copy on write.',
  },
  {
    label: 'PASO 4 DE 4',
    title: 'Estado final estable',
    desc: 'La Página 1 vive ahora en dos direcciones físicas distintas, una por proceso. Las Páginas 2 y 3 siguen compartidas porque nadie las modificó. Si más tarde alguien escribe en ellas, el mecanismo se repite página por página. Esto es lo que permite que servidores como nginx, postgres o un shell creen cientos de hijos sin colapsar la RAM.',
    takeaway: 'La copia es perezosa, solo paga quien escribe, y siempre por la página justa.',
  },
];

type Pt = { x: number; y: number };
type CowLine = {
  id: string;
  from: Pt;
  to: Pt;
  kind: 'padre' | 'hijo';
  variant: 'shared' | 'cow' | 'owned';
};

export function CowAnimation() {
  const [step, setStep] = useState(0);
  const [cowFlash, setCowFlash] = useState(false);
  const [lines, setLines] = useState<CowLine[]>([]);
  const [stageBox, setStageBox] = useState({ w: 0, h: 0 });

  const stageRef = useRef<HTMLDivElement | null>(null);
  const padreRefs = useRef<(HTMLDivElement | null)[]>([null, null, null]);
  const hijoRefs = useRef<(HTMLDivElement | null)[]>([null, null, null]);
  const physRefs = useRef<(HTMLDivElement | null)[]>([null, null, null]);
  const physHijoCopyRef = useRef<HTMLDivElement | null>(null);

  function goTo(s: number) {
    if (s === 2 && step !== 2) {
      setCowFlash(true);
      window.setTimeout(() => setCowFlash(false), 900);
    } else {
      setCowFlash(false);
    }
    setStep(s);
  }

  const showChild = step >= 1;
  const cowTriggered = step >= 2;
  const finalState = step === 3;

  const recomputeLines = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const stageRect = stage.getBoundingClientRect();
    setStageBox({ w: stageRect.width, h: stageRect.height });

    const bottomCenter = (el: HTMLElement | null): Pt | null => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2 - stageRect.left, y: r.bottom - stageRect.top };
    };
    const topCenter = (el: HTMLElement | null): Pt | null => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2 - stageRect.left, y: r.top - stageRect.top };
    };

    const out: CowLine[] = [];

    for (let i = 0; i < 3; i++) {
      const from = bottomCenter(padreRefs.current[i]);
      let target: HTMLDivElement | null = physRefs.current[i];
      if (cowTriggered && i === 0) target = physRefs.current[0];
      const to = topCenter(target);
      if (from && to) {
        out.push({
          id: `padre-${i}`,
          from,
          to,
          kind: 'padre',
          variant: cowTriggered && i === 0 ? 'owned' : showChild && !cowTriggered ? 'shared' : showChild ? 'shared' : 'owned',
        });
      }
    }

    if (showChild) {
      for (let i = 0; i < 3; i++) {
        const from = bottomCenter(hijoRefs.current[i]);
        let toEl: HTMLElement | null = physRefs.current[i];
        if (cowTriggered && i === 0) {
          toEl = finalState ? physHijoCopyRef.current : physRefs.current[0];
        }
        const to = topCenter(toEl);
        if (from && to) {
          out.push({
            id: `hijo-${i}`,
            from,
            to,
            kind: 'hijo',
            variant:
              cowTriggered && i === 0 && !finalState ? 'cow' :
              cowTriggered && i === 0 && finalState ? 'owned' :
              'shared',
          });
        }
      }
    }

    setLines(out);
  }, [showChild, cowTriggered, finalState]);

  useLayoutEffect(() => {
    recomputeLines();
  }, [recomputeLines, step]);

  useEffect(() => {
    const handler = () => recomputeLines();
    window.addEventListener('resize', handler);
    const ro = new ResizeObserver(handler);
    if (stageRef.current) ro.observe(stageRef.current);
    return () => {
      window.removeEventListener('resize', handler);
      ro.disconnect();
    };
  }, [recomputeLines]);

  const current = COW_STEPS[step];

  function pathFor(line: CowLine): string {
    const dx = line.to.x - line.from.x;
    const dy = line.to.y - line.from.y;
    const c1x = line.from.x + dx * 0.2;
    const c1y = line.from.y + dy * 0.55;
    const c2x = line.from.x + dx * 0.8;
    const c2y = line.from.y + dy * 0.45;
    return `M ${line.from.x} ${line.from.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${line.to.x} ${line.to.y}`;
  }

  return (
    <div className="cow-wrap">
      <div className="cow-intro">
        <span className="cow-intro-badge">VISUAL · COPY ON WRITE</span>
        <p className="cow-intro-text">
          Copy on write es la optimización que vuelve a <strong>fork()</strong> barato. En vez de duplicar la RAM del padre,
          el kernel deja al hijo apuntar a las mismas páginas físicas y solo crea una copia real cuando alguno de los dos
          intenta escribir. Recorre los cuatro pasos y observa cómo las flechas siguen, en tiempo real, a qué página
          física apunta cada tabla de páginas.
        </p>
      </div>

      <div className="cow-header">
        <span className="cow-step-badge">{current.label}</span>
        <span className="cow-step-label">{current.title}</span>
        <span className="cow-progress">
          {COW_STEPS.map((_, i) => (
            <span key={i} className={`cow-progress-tick ${i <= step ? 'cow-progress-tick-on' : ''}`} />
          ))}
        </span>
      </div>

      <div className="cow-stage" ref={stageRef}>
        <div className="cow-grain" aria-hidden="true" />
        <div className="cow-processes">
          <div className="cow-proc cow-proc-padre">
            <div className="cow-proc-tag">PID 1042</div>
            <div className="cow-proc-name">PROCESO PADRE</div>
            <div className="cow-proc-sub">Tabla de páginas</div>
            <div className="cow-virt-pages">
              {[0, 1, 2].map(i => {
                const padreWrites = false;
                const isCowPage = cowTriggered && i === 0;
                const mode = isCowPage ? 'RW' : (showChild && !finalState ? 'RO' : (showChild && finalState && i === 0 ? 'RW' : (showChild ? 'RO' : 'RW')));
                return (
                  <div
                    key={i}
                    ref={el => { padreRefs.current[i] = el; }}
                    className={`cow-vpage ${padreWrites ? 'cow-vpage-writing' : ''}`}
                  >
                    <span className="cow-vpage-idx">V{i + 1}</span>
                    <span className="cow-vpage-label">Pág virtual {i + 1}</span>
                    <span className={`cow-vpage-mode ${mode === 'RO' ? 'cow-ro' : 'cow-rw'}`}>{mode}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`cow-proc cow-proc-hijo ${showChild ? 'cow-proc-visible' : ''}`}>
            <div className="cow-proc-tag">PID 1043</div>
            <div className="cow-proc-name">PROCESO HIJO</div>
            <div className="cow-proc-sub">Tabla de páginas (recién clonada)</div>
            <div className="cow-virt-pages">
              {[0, 1, 2].map(i => {
                const writing = cowTriggered && i === 0 && !finalState;
                const ownsCopy = finalState && i === 0;
                const mode = writing ? 'ESCRIBE' : (ownsCopy ? 'RW' : 'RO');
                return (
                  <div
                    key={i}
                    ref={el => { hijoRefs.current[i] = el; }}
                    className={`cow-vpage cow-vpage-child ${writing ? 'cow-vpage-writing' : ''}`}
                  >
                    <span className="cow-vpage-idx">V{i + 1}</span>
                    <span className="cow-vpage-label">Pág virtual {i + 1}</span>
                    <span className={`cow-vpage-mode ${writing ? 'cow-write-badge' : ownsCopy ? 'cow-rw' : 'cow-ro'}`}>{mode}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <svg
          className="cow-arrows"
          width={stageBox.w || '100%'}
          height={stageBox.h || '100%'}
          viewBox={`0 0 ${stageBox.w || 800} ${stageBox.h || 400}`}
          preserveAspectRatio="none"
        >
          <defs>
            <marker id="cow-arrow-head-padre" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 Z" fill="#1a6fcc" />
            </marker>
            <marker id="cow-arrow-head-hijo" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 Z" fill="#b8900a" />
            </marker>
            <marker id="cow-arrow-head-cow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 Z" fill="#c0182d" />
            </marker>
          </defs>

          {lines.map(l => {
            const d = pathFor(l);
            const isCow = l.variant === 'cow';
            const isShared = l.variant === 'shared';
            const colorClass =
              isCow ? 'cow-path-cow' :
              l.kind === 'padre' ? 'cow-path-padre' : 'cow-path-hijo';
            const marker =
              isCow ? 'url(#cow-arrow-head-cow)' :
              l.kind === 'padre' ? 'url(#cow-arrow-head-padre)' : 'url(#cow-arrow-head-hijo)';
            return (
              <g key={l.id}>
                <path d={d} className={`cow-path-shadow`} />
                <path
                  d={d}
                  className={`cow-path ${colorClass} ${isShared ? 'cow-path-dashed' : ''} ${isCow ? 'cow-path-zap' : ''}`}
                  markerEnd={marker}
                />
              </g>
            );
          })}

          {cowFlash && !finalState && stageBox.w > 0 && (
            <g className="cow-flash-group" transform={`translate(${stageBox.w / 2}, ${stageBox.h / 2})`}>
              <polygon
                points="-44,-22 -12,-22 -22,-2 8,-2 -10,28 -2,4 -28,4"
                className="cow-flash-bolt"
              />
              <text x="14" y="6" className="cow-flash-text">COW!</text>
            </g>
          )}
        </svg>

        <div className="cow-ram">
          <div className="cow-ram-header">
            <span className="cow-ram-dot" />
            <span className="cow-ram-label">RAM, MEMORIA FÍSICA</span>
            <span className="cow-ram-meta">páginas reales</span>
          </div>
          <div className="cow-phys-pages">
            <div
              ref={el => { physRefs.current[0] = el; }}
              className={`cow-ppage ${cowTriggered ? 'cow-ppage-split' : ''}`}
            >
              {!cowTriggered && (
                <div className="cow-ppage-inner">
                  <span className="cow-ppage-addr">0x4A00</span>
                  <span className="cow-ppage-name">Página 1</span>
                  {showChild && <span className="cow-ppage-shared">COMPARTIDA</span>}
                  {!showChild && <span className="cow-ppage-owner cow-ppage-owner-padre">PADRE</span>}
                </div>
              )}
              {cowTriggered && (
                <>
                  <div className="cow-ppage-inner cow-ppage-padre-copy">
                    <span className="cow-ppage-addr">0x4A00</span>
                    <span className="cow-ppage-name">Pág 1</span>
                    <span className="cow-ppage-owner cow-ppage-owner-padre">PADRE</span>
                  </div>
                  <div
                    ref={physHijoCopyRef}
                    className="cow-ppage-inner cow-ppage-hijo-copy"
                  >
                    <span className="cow-ppage-addr">0x7F00</span>
                    <span className="cow-ppage-name">Pág 1</span>
                    <span className="cow-ppage-owner cow-ppage-owner-hijo">HIJO</span>
                    <span className="cow-ppage-new-badge">NUEVA</span>
                  </div>
                </>
              )}
            </div>
            <div
              ref={el => { physRefs.current[1] = el; }}
              className="cow-ppage"
            >
              <div className="cow-ppage-inner">
                <span className="cow-ppage-addr">0x5B00</span>
                <span className="cow-ppage-name">Página 2</span>
                {showChild ? <span className="cow-ppage-shared">COMPARTIDA</span> : <span className="cow-ppage-owner cow-ppage-owner-padre">PADRE</span>}
              </div>
            </div>
            <div
              ref={el => { physRefs.current[2] = el; }}
              className="cow-ppage"
            >
              <div className="cow-ppage-inner">
                <span className="cow-ppage-addr">0x6C00</span>
                <span className="cow-ppage-name">Página 3</span>
                {showChild ? <span className="cow-ppage-shared">COMPARTIDA</span> : <span className="cow-ppage-owner cow-ppage-owner-padre">PADRE</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="cow-desc">
        <p className="cow-desc-text">{current.desc}</p>
        <p className="cow-desc-take"><span className="cow-desc-tag">CLAVE</span>{current.takeaway}</p>
      </div>

      <div className="cow-controls">
        <button className="cow-btn" onClick={() => goTo(Math.max(0, step - 1))} disabled={step === 0}>◀ Anterior</button>
        <div className="cow-dots">
          {[0, 1, 2, 3].map(i => (
            <button
              key={i}
              className={`cow-dot ${step === i ? 'cow-dot-active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Ir al paso ${i + 1}`}
            >
              <span className="cow-dot-num">{i + 1}</span>
            </button>
          ))}
        </div>
        <button className="cow-btn cow-btn-next" onClick={() => goTo(Math.min(3, step + 1))} disabled={step === 3}>Siguiente ▶</button>
      </div>
    </div>
  );
}
