import { useEffect, useRef, useState } from 'react';
import './prose.css';

/**
 * Animación del ciclo de vida de un segmento de memoria compartida System V.
 * Muestra dos procesos, el kernel reservando el segmento, ambos haciendo
 * shmat, escritura, lectura, shmdt y por fin IPC_RMID.
 */

type ProcState = 'idle' | 'attached-rw' | 'attached-ro' | 'detached' | 'done';
type ShmState  = 'absent' | 'allocated' | 'mapped' | 'marked-rmid' | 'destroyed';

type Step = {
  title: string;
  procA: ProcState;
  procB: ProcState;
  shm: ShmState;
  /** Contenido visible en el segmento: arreglo de strings. Vacío = aún sin datos. */
  cells: string[];
  /** Marca cuántos procesos están "atados". 0, 1 o 2. */
  attachCount: number;
  highlight: number[];
  desc: string;
};

const EMPTY: string[] = ['·', '·', '·', '·', '·', '·', '·', '·'];

const STEPS: Step[] = [
  {
    title: 'Paso 1. Proceso A pide el segmento con shmget',
    procA: 'idle',
    procB: 'idle',
    shm: 'absent',
    cells: EMPTY,
    attachCount: 0,
    highlight: [1, 2],
    desc: 'El proceso A calculó la llave con ftok y ahora llama shmget. Le pide al kernel un segmento del tamaño que necesita y le pasa la bandera IPC_CREAT junto con permisos 0660. El kernel todavía no ha hecho nada visible para el programa, solo recibió la solicitud.',
  },
  {
    title: 'Paso 2. Kernel reserva la región física',
    procA: 'idle',
    procB: 'idle',
    shm: 'allocated',
    cells: EMPTY,
    attachCount: 0,
    highlight: [2],
    desc: 'El kernel separa una porción de páginas físicas del tamaño pedido, redondeando al alza al tamaño de página. Crea una estructura interna shmid_ds para llevar la contabilidad. Devuelve un entero llamado shmid al proceso A. Ese shmid es el manejador real, no es un puntero todavía. El segmento existe pero no está mapeado en ningún proceso.',
  },
  {
    title: 'Paso 3. Proceso A hace shmat y consigue un puntero',
    procA: 'attached-rw',
    procB: 'idle',
    shm: 'mapped',
    cells: EMPTY,
    attachCount: 1,
    highlight: [3, 4],
    desc: 'El proceso A llama shmat con su shmid. El kernel busca un hueco libre en el espacio de direcciones virtuales de A y mapea las páginas físicas del segmento en ese hueco. shmat devuelve el puntero void* al inicio de esa zona. Desde aquí, escribir en ese puntero es como escribir en cualquier variable del proceso, pero los bytes viven en el segmento del kernel.',
  },
  {
    title: 'Paso 4. Proceso A escribe datos en el segmento',
    procA: 'attached-rw',
    procB: 'idle',
    shm: 'mapped',
    cells: ['H', 'O', 'L', 'A', '!', '·', '·', '·'],
    attachCount: 1,
    highlight: [5],
    desc: 'El proceso A simplemente asigna valores como si fuera memoria local. Por ejemplo *region = H, *(region+1) = O y así sucesivamente. No hay syscall, no hay copia al kernel. Los bytes ya están físicamente en las páginas que el kernel reservó y mapeó. Velocidad máxima.',
  },
  {
    title: 'Paso 5. Proceso B llega y también hace shmat',
    procA: 'attached-rw',
    procB: 'attached-rw',
    shm: 'mapped',
    cells: ['H', 'O', 'L', 'A', '!', '·', '·', '·'],
    attachCount: 2,
    highlight: [3, 4],
    desc: 'El proceso B, que arrancó por separado en otra terminal, calcula la misma llave con ftok, obtiene el mismo shmid con shmget sin IPC_CREAT, y llama shmat. El kernel mapea las MISMAS páginas físicas en el espacio virtual de B. El puntero que B recibe es distinto al de A en valor numérico, pero apunta a la misma memoria física. Por eso al leer ve HOLA al instante.',
  },
  {
    title: 'Paso 6. Proceso B lee y modifica el segmento',
    procA: 'attached-rw',
    procB: 'attached-rw',
    shm: 'mapped',
    cells: ['H', 'O', 'L', 'A', '!', '!', '!', '!'],
    attachCount: 2,
    highlight: [5],
    desc: 'B lee el contenido y le agrega exclamaciones. Como las páginas son las mismas, si A volviera a leer su puntero, vería también los nuevos signos. Esto es lo que hace a la memoria compartida tan poderosa y tan peligrosa. Sin sincronización con semáforos, ambos pueden escribir al mismo byte y producir basura.',
  },
  {
    title: 'Paso 7. shmdt en cada proceso. Desacoplamiento',
    procA: 'detached',
    procB: 'detached',
    shm: 'mapped',
    cells: ['H', 'O', 'L', 'A', '!', '!', '!', '!'],
    attachCount: 0,
    highlight: [6],
    desc: 'Ambos procesos terminan su trabajo y llaman shmdt con sus respectivos punteros. El kernel saca el mapeo del espacio virtual de cada uno. shm_nattach baja a cero. IMPORTANTE. shmdt no destruye el segmento. Solo desacopla. Las páginas físicas siguen vivas con los datos intactos esperando que alguien las vuelva a mapear.',
  },
  {
    title: 'Paso 8. shmctl con IPC_RMID destruye el segmento',
    procA: 'done',
    procB: 'done',
    shm: 'destroyed',
    cells: EMPTY,
    attachCount: 0,
    highlight: [7],
    desc: 'Uno de los dos llama shmctl con IPC_RMID. El kernel marca el segmento para borrado. Como shm_nattach ya es cero, lo destruye inmediatamente y libera las páginas físicas. Si alguien todavía estuviera atado, el segmento sobreviviría hasta el último shmdt. Si te olvidas de IPC_RMID, el segmento queda visible en ipcs hasta el siguiente reinicio.',
  },
];

const CODE = [
  '/* en cada proceso */',
  'key_t llave = ftok("/tmp/app", \'X\');',
  'int shmid   = shmget(llave, 4096, IPC_CREAT | 0660);',
  'void *region = shmat(shmid, NULL, 0);',
  '/* shmaddr=NULL deja que el kernel elija dirección */',
  'strcpy(region, "HOLA!");        /* uso normal */',
  'shmdt(region);                  /* desacopla */',
  'shmctl(shmid, IPC_RMID, NULL);  /* destruye */',
];

const STATE_LABEL: Record<ProcState, string> = {
  idle: 'esperando',
  'attached-rw': 'ATADO. lectura/escritura',
  'attached-ro': 'ATADO. solo lectura',
  detached: 'desacoplado',
  done: 'terminado',
};

const SHM_LABEL: Record<ShmState, string> = {
  absent: 'NO existe',
  allocated: 'reservado en kernel',
  mapped: 'mapeado en procesos',
  'marked-rmid': 'marcado para borrar',
  destroyed: 'DESTRUIDO',
};

const AUTO_MS = 3000;

export function SharedMemoryFlow() {
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

  function ProcCard({ name, role, state, side }: { name: string; role: string; state: ProcState; side: 'l' | 'r' }) {
    const attached = state === 'attached-rw' || state === 'attached-ro';
    return (
      <div className={`shm-proc shm-proc-${side} shm-proc-${state}`}>
        <div className="shm-proc-head">
          <span className="shm-proc-name">{name}</span>
          <span className="shm-proc-role">{role}</span>
        </div>
        <div className="shm-proc-vmem">
          <div className="shm-vmem-tag">espacio virtual</div>
          <div className="shm-vmem-body">
            {attached ? (
              <>
                <div className="shm-vmem-ptr">region → 0x{side === 'l' ? '7ffe...a000' : '7ff5...0000'}</div>
                <div className="shm-vmem-link">↓ shmat</div>
              </>
            ) : state === 'detached' ? (
              <div className="shm-vmem-empty">puntero liberado</div>
            ) : state === 'done' ? (
              <div className="shm-vmem-empty">proceso cerrado</div>
            ) : (
              <div className="shm-vmem-empty">sin mapeo</div>
            )}
          </div>
        </div>
        <div className="shm-proc-state">{STATE_LABEL[state]}</div>
      </div>
    );
  }

  return (
    <div className="zf-wrap shm-wrap">
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

      <div className="zf-grid shm-grid">
        <div className="zf-stage shm-stage">
          <div className="shm-arena">
            <ProcCard name="proceso A" role="creador" state={current.procA} side="l" />

            <div className={`shm-kernel shm-shm-${current.shm}`}>
              <div className="shm-kernel-tag">KERNEL · segmento shmid 65537</div>
              <div className="shm-kernel-state">{SHM_LABEL[current.shm]}</div>
              <div className="shm-pages">
                {current.cells.map((c, i) => (
                  <span
                    key={`${step}-${i}`}
                    className={`shm-cell ${c !== '·' ? 'shm-cell-on' : ''}`}
                    style={{ ['--i' as string]: i } as React.CSSProperties}
                  >
                    {c}
                  </span>
                ))}
              </div>
              <div className="shm-meta">
                <span className="shm-meta-lbl">shm_nattach</span>
                <span className="shm-meta-val">{current.attachCount}</span>
              </div>
            </div>

            <ProcCard name="proceso B" role="consumidor" state={current.procB} side="r" />
          </div>
        </div>

        <ol className="zf-code">
          {CODE.map((line, i) => {
            const ln = i + 1;
            const hot = current.highlight.includes(ln);
            return (
              <li key={i} className={`zf-code-line ${hot ? 'zf-code-line-hot' : ''}`}>
                <span className="zf-code-num">{ln}</span>
                <pre className="zf-code-text"><code>{line || ' '}</code></pre>
              </li>
            );
          })}
        </ol>
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
