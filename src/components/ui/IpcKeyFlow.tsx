import { useEffect, useRef, useState } from 'react';
import './prose.css';

/**
 * Animación del ciclo de vida de una llave IPC de System V.
 * Dos procesos sin parentesco llegan a la misma key_t vía ftok(),
 * la usan para obtener el mismo semid con semget(), operan, y limpian.
 */

type ProcState = 'idle' | 'computing' | 'hasKey' | 'hasId' | 'waiting' | 'signaled' | 'done';

type Step = {
  title: string;
  procA: ProcState;
  procB: ProcState;
  /** Texto en el slot de "llave" mostrado en pantalla. Vacío = aún no calculada. */
  keyValue: string;
  /** Texto en el slot del semid del kernel. Vacío = no creado. */
  semidValue: string;
  /** Valor actual del semáforo en el kernel. null = no existe. */
  semVal: number | null;
  /** Cuál de las dos pistas de "viaje" está activa: ftok, get, op, rmid. */
  activeBus: 'none' | 'ftok' | 'get' | 'op' | 'rmid';
  highlight: number[];
  desc: string;
};

const STEPS: Step[] = [
  {
    title: 'Paso 1. Dos procesos arrancan sin conocerse',
    procA: 'idle',
    procB: 'idle',
    keyValue: '—',
    semidValue: '—',
    semVal: null,
    activeBus: 'none',
    highlight: [],
    desc: 'Imagina dos terminales abiertas en la misma máquina. En una corre el escritor, en otra el lector. No comparten padre, no han hablado nunca, pero ambos saben que quieren coordinar usando un semáforo. Necesitan llegar al mismo objeto del kernel sin pasarse descriptores. El archivo /tmp/ipc.lock existe en disco y los dos lo pueden ver.',
  },
  {
    title: 'Paso 2. Ambos llaman ftok con la misma receta',
    procA: 'computing',
    procB: 'computing',
    keyValue: '...',
    semidValue: '—',
    semVal: null,
    activeBus: 'ftok',
    highlight: [3],
    desc: 'Los dos procesos ejecutan ftok("/tmp/ipc.lock", \'A\') de forma independiente. ftok toma el inodo del archivo y el caracter de proyecto, los mezcla con una fórmula determinista, y produce un entero key_t. La gracia es que la fórmula da el mismo resultado siempre que el archivo y el caracter sean los mismos. Ningún proceso le tuvo que pasar la llave al otro.',
  },
  {
    title: 'Paso 3. Ya tienen la misma llave',
    procA: 'hasKey',
    procB: 'hasKey',
    keyValue: '0x4101e3a7',
    semidValue: '—',
    semVal: null,
    activeBus: 'none',
    highlight: [3],
    desc: 'Ambos procesos ahora tienen el mismo número en su variable llave. Importante de notar. La llave no es el recurso. La llave es solo una etiqueta acordada. Piensa en ella como el número de una taquilla de gimnasio. Saber el número no te abre la taquilla. Necesitas pedirle al encargado que te dé la llave física para esa taquilla.',
  },
  {
    title: 'Paso 4. semget convierte la llave en un ID del kernel',
    procA: 'computing',
    procB: 'computing',
    keyValue: '0x4101e3a7',
    semidValue: '...',
    semVal: 0,
    activeBus: 'get',
    highlight: [4],
    desc: 'Los dos llaman semget(llave, 1, 0666 | IPC_CREAT). El primero que llega obliga al kernel a crear el conjunto de semáforos asociado a esa llave. El segundo ve que ya existe y solo recibe su ID. En ambos casos semget devuelve el mismo entero, el semid. Ese sí es el manejador real que vas a usar en las llamadas siguientes.',
  },
  {
    title: 'Paso 5. Mismo semid devuelto a los dos',
    procA: 'hasId',
    procB: 'hasId',
    keyValue: '0x4101e3a7',
    semidValue: '32768',
    semVal: 0,
    activeBus: 'none',
    highlight: [4],
    desc: 'Los dos procesos ya tienen el mismo semid en mano. A partir de aquí, todas las operaciones sobre el semáforo se hacen con ese ID, no con la llave. El semáforo vive dentro del kernel con valor inicial 0. Ese cero significa que cualquier proceso que intente bajarlo va a quedar bloqueado esperando.',
  },
  {
    title: 'Paso 6. Proceso A hace P y se duerme',
    procA: 'waiting',
    procB: 'hasId',
    keyValue: '0x4101e3a7',
    semidValue: '32768',
    semVal: 0,
    activeBus: 'op',
    highlight: [5],
    desc: 'El proceso A ejecuta semop con sem_op igual a menos uno. Eso es la operación P. El kernel intenta restar 1 al semáforo, pero como vale 0 no puede sin volverse negativo, así que duerme al proceso A. La barra roja punteada de A indica ese estado bloqueado. El proceso B sigue trabajando libremente en otra cosa.',
  },
  {
    title: 'Paso 7. Proceso B hace V y despierta a A',
    procA: 'signaled',
    procB: 'hasId',
    keyValue: '0x4101e3a7',
    semidValue: '32768',
    semVal: 0,
    activeBus: 'op',
    highlight: [6],
    desc: 'El proceso B ejecuta semop con sem_op igual a más uno. Eso es la operación V. El kernel suma 1 al semáforo, ve que hay un proceso esperando, y en lugar de dejar el contador en 1 lo deja en 0 y despierta al proceso A. A sale de su bloqueo y continúa con su trabajo. Acabas de ver una sincronización entre dos procesos sin parentesco usando solo una llave compartida.',
  },
  {
    title: 'Paso 8. IPC_RMID limpia el recurso',
    procA: 'done',
    procB: 'done',
    keyValue: '0x4101e3a7',
    semidValue: '—',
    semVal: null,
    activeBus: 'rmid',
    highlight: [7],
    desc: 'Uno de los dos procesos llama semctl(semid, 0, IPC_RMID). El kernel borra el conjunto de semáforos de su tabla interna. La llave sigue siendo válida si alguien volviera a llamar semget con IPC_CREAT, pero el ID anterior queda invalidado. Si nadie hace IPC_RMID, el semáforo sobrevive a tu programa y queda visible en ipcs hasta el próximo reinicio o un ipcrm manual.',
  },
];

const CODE = [
  '/* en ambos procesos */',
  'key_t llave;',
  'int   semid;',
  'llave = ftok("/tmp/ipc.lock", \'A\');',
  'semid = semget(llave, 1, 0666 | IPC_CREAT);',
  '/* A:  semop(semid, &p_op, 1);  P, baja */',
  '/* B:  semop(semid, &v_op, 1);  V, sube */',
  'semctl(semid, 0, IPC_RMID);',
];

const STATE_LABEL: Record<ProcState, string> = {
  idle: 'inactivo',
  computing: 'calculando',
  hasKey: 'tiene llave',
  hasId: 'tiene semid',
  waiting: 'BLOQUEADO en P',
  signaled: 'despertado por V',
  done: 'terminado',
};

const AUTO_MS = 3000;

export function IpcKeyFlow() {
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

  function ProcCard({ name, role, state }: { name: string; role: string; state: ProcState }) {
    return (
      <div className={`ikf-proc ikf-proc-${state}`}>
        <div className="ikf-proc-head">
          <span className="ikf-proc-name">{name}</span>
          <span className="ikf-proc-role">{role}</span>
        </div>
        <div className="ikf-proc-state">{STATE_LABEL[state]}</div>
        <div className="ikf-proc-slots">
          <div className="ikf-slot">
            <span className="ikf-slot-lbl">llave</span>
            <span className="ikf-slot-val">{current.keyValue}</span>
          </div>
          <div className="ikf-slot">
            <span className="ikf-slot-lbl">semid</span>
            <span className="ikf-slot-val">{current.semidValue}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="zf-wrap ikf-wrap">
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

      <div className="zf-grid ikf-grid">
        <div className="zf-stage ikf-stage">
          <ProcCard name="proceso A" role="escritor" state={current.procA} />

          <div className={`ikf-kernel ikf-bus-${current.activeBus}`}>
            <div className="ikf-kernel-tag">KERNEL · tabla IPC</div>

            <div className="ikf-file">
              <span className="ikf-file-ic">📄</span>
              <span className="ikf-file-path">/tmp/ipc.lock</span>
              <span className="ikf-file-proj">proj_id = 'A'</span>
            </div>

            <div className="ikf-hash">
              <span className="ikf-hash-lbl">ftok hash</span>
              <span className="ikf-hash-formula">inodo · dev · proj_id</span>
              <span className="ikf-arrow-down" aria-hidden="true">▼</span>
            </div>

            <div className={`ikf-key ${current.keyValue !== '—' && current.keyValue !== '...' ? 'ikf-key-on' : ''}`}>
              <span className="ikf-key-lbl">key_t</span>
              <span className="ikf-key-val">{current.keyValue}</span>
            </div>

            <div className="ikf-sem">
              <div className="ikf-sem-head">
                <span className="ikf-sem-lbl">conjunto de semáforos</span>
                <span className="ikf-sem-id">semid: {current.semidValue}</span>
              </div>
              <div className="ikf-sem-body">
                {current.semVal === null ? (
                  <span className="ikf-sem-empty">no creado</span>
                ) : (
                  <>
                    <span className="ikf-sem-val">valor = {current.semVal}</span>
                    <div className="ikf-sem-wait">
                      <span className="ikf-sem-wait-lbl">esperando</span>
                      <span className="ikf-sem-wait-count">
                        {current.procA === 'waiting' ? '1' : '0'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <ProcCard name="proceso B" role="señalizador" state={current.procB} />
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
