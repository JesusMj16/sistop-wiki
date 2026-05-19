import { useEffect, useRef, useState } from 'react';
import './prose.css';

/**
 * Visualizes the classic Tanenbaum fixed-partition problem.
 * Mode A: each partition has its own queue. Smaller queues stall while bigger ones starve.
 * Mode B: single shared queue. Scheduler dispatches each job to the smallest fitting partition.
 */

type Job = { id: string; size: number };          // size in GB
type Slot = { id: string; size: number };          // partition size in GB

const PARTITIONS: Slot[] = [
  { id: 'P1', size: 2 },
  { id: 'P2', size: 3 },
  { id: 'P3', size: 5 },
  { id: 'P4', size: 8 },
];

type Step = {
  title: string;
  mode: 'multi' | 'single';
  /** per partition: queue of waiting jobs */
  perQ?: Record<string, Job[]>;
  /** single shared queue */
  oneQ?: Job[];
  /** which jobs are currently loaded in each partition. undefined = empty */
  loaded: Record<string, Job | undefined>;
  desc: string;
  flash?: string;     // visual hint message
};

const J = (id: string, size: number): Job => ({ id, size });

const STEPS: Step[] = [
  /* ===== Modo A. Colas independientes ===== */
  {
    title: 'Modo A · Paso 1. Cuatro colas independientes con trabajo distinto',
    mode: 'multi',
    perQ: {
      P1: [J('a1', 2), J('a2', 1)],
      P2: [],
      P3: [J('c1', 5)],
      P4: [J('d1', 7)],
    },
    loaded: { P1: undefined, P2: undefined, P3: undefined, P4: undefined },
    desc: 'Cada partición fija tiene su propia cola de entrada. Llegan trabajos clasificados por tamaño. Dos trabajos pequeños esperan en la cola de P1. La cola de P2 está vacía. Un trabajo de 5 GB espera en P3. Un trabajo de 7 GB espera en P4.',
  },
  {
    title: 'Modo A · Paso 2. Despacho. Cada cola alimenta su partición',
    mode: 'multi',
    perQ: {
      P1: [J('a2', 1)],
      P2: [],
      P3: [],
      P4: [],
    },
    loaded: {
      P1: J('a1', 2),
      P2: undefined,
      P3: J('c1', 5),
      P4: J('d1', 7),
    },
    flash: 'P2 ociosa. Nadie le envía trabajo',
    desc: 'El primer trabajo de cada cola se carga en su partición. Pero la partición P2 de 3 GB queda ociosa porque su cola está vacía. Mientras tanto, en la cola de P1 todavía espera un trabajo de 1 GB. P2 está libre, podría ejecutar ese trabajo perfectamente, pero las reglas del esquema multi cola lo prohíben. Resultado. Memoria desperdiciada.',
  },
  {
    title: 'Modo A · Paso 3. Llegan más trabajos. El desbalance empeora',
    mode: 'multi',
    perQ: {
      P1: [J('a2', 1), J('a3', 2), J('a4', 1)],
      P2: [],
      P3: [J('c2', 4)],
      P4: [],
    },
    loaded: {
      P1: J('a1', 2),
      P2: undefined,
      P3: J('c1', 5),
      P4: J('d1', 7),
    },
    flash: 'fila de P1 explota. P2 sigue muerta',
    desc: 'Aún cuando llegan tres trabajos nuevos pequeños, todos van a la cola de P1 porque encajan en su tamaño nominal. P2 sigue completamente desperdiciada. La métrica de utilización de memoria es baja a pesar de tener trabajo pendiente. Este es el problema clásico de Tanenbaum.',
  },

  /* ===== Modo B. Cola única ===== */
  {
    title: 'Modo B · Paso 1. Una sola cola central recibe todo',
    mode: 'single',
    oneQ: [J('a1', 2), J('a2', 1), J('c1', 5), J('d1', 7), J('a3', 2), J('c2', 4), J('a4', 1)],
    loaded: { P1: undefined, P2: undefined, P3: undefined, P4: undefined },
    desc: 'Cambiamos la regla del juego. Todos los trabajos llegan a la misma cola, sin importar su tamaño. El planificador decide a qué partición despachar cada uno según el espacio disponible y la política elegida, típicamente la menor partición que entre.',
  },
  {
    title: 'Modo B · Paso 2. Dispatch. Cada trabajo va a la partición que mejor calza',
    mode: 'single',
    oneQ: [J('a3', 2), J('c2', 4), J('a4', 1)],
    loaded: {
      P1: J('a2', 1),
      P2: J('a1', 2),
      P3: J('c1', 5),
      P4: J('d1', 7),
    },
    flash: 'cero particiones ociosas',
    desc: 'a2 de 1 GB se envía a P1. a1 de 2 GB ahora cabe en P2 que estaba vacía. c1 va a P3. d1 va a P4. Ninguna partición queda muerta. La cola central balancea sola la carga, exprimiendo la utilización al máximo.',
  },
  {
    title: 'Modo B · Paso 3. Conforme se liberan particiones, la cola alimenta de nuevo',
    mode: 'single',
    oneQ: [J('c2', 4)],
    loaded: {
      P1: J('a4', 1),
      P2: J('a3', 2),
      P3: J('c1', 5),
      P4: J('d1', 7),
    },
    flash: 'memoria fluye, nada se desperdicia',
    desc: 'a1 y a2 terminaron. El planificador toma los siguientes de la cola y los reparte donde haya hueco. a4 de 1 GB encaja en P1. a3 de 2 GB en P2. c2 de 4 GB queda esperando porque ninguna partición libre lo aloja sin desperdiciar mucho. Pero ningún recurso queda muerto mientras hay trabajo.',
  },
];

const AUTO_MS = 3200;

export function PartitionQueueFlow() {
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

  function JobChip({ j }: { j: Job }) {
    return (
      <span className={`pqf-job pqf-job-s${Math.min(8, j.size)}`}>
        <span className="pqf-job-id">{j.id}</span>
        <span className="pqf-job-sz">{j.size}GB</span>
      </span>
    );
  }

  return (
    <div className="zf-wrap pqf-wrap">
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

      <div className="pqf-board">
        <div className="pqf-mode-tag">
          {current.mode === 'multi' ? '(a) MULTI COLA. una fila por partición' : '(b) COLA ÚNICA. una sola fila central'}
        </div>

        <div className="pqf-stage">
          {/* Queues column */}
          <div className="pqf-queues">
            {current.mode === 'multi' ? (
              PARTITIONS.slice().reverse().map(part => (
                <div key={part.id} className="pqf-row">
                  <div className="pqf-queue pqf-queue-row">
                    {(current.perQ?.[part.id] ?? []).length === 0 ? (
                      <span className="pqf-q-empty">vacía</span>
                    ) : (
                      current.perQ![part.id].map(j => <JobChip key={j.id} j={j} />)
                    )}
                  </div>
                  <span className="pqf-arrow">→</span>
                </div>
              ))
            ) : (
              <div className="pqf-row pqf-row-tall">
                <div className="pqf-queue pqf-queue-col">
                  {(current.oneQ ?? []).length === 0
                    ? <span className="pqf-q-empty">vacía</span>
                    : current.oneQ!.map(j => <JobChip key={j.id} j={j} />)}
                </div>
                <span className="pqf-arrow pqf-arrow-fan">↗↘</span>
              </div>
            )}
          </div>

          {/* Partition stack */}
          <div className="pqf-mem">
            {PARTITIONS.slice().reverse().map(part => {
              const loaded = current.loaded[part.id];
              const idle = !loaded;
              return (
                <div key={part.id} className={`pqf-part ${idle ? 'pqf-part-idle' : 'pqf-part-busy'}`}>
                  <div className="pqf-part-tag">{part.id} · {part.size} GB</div>
                  <div className="pqf-part-body">
                    {loaded ? <JobChip j={loaded} /> : <span className="pqf-part-empty">ociosa</span>}
                  </div>
                </div>
              );
            })}
            <div className="pqf-part pqf-part-os">
              <div className="pqf-part-tag">Sistema Operativo</div>
              <div className="pqf-part-body"><span className="pqf-part-empty">reservado</span></div>
            </div>
          </div>
        </div>

        {current.flash && <div className="pqf-flash">{current.flash}</div>}
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
