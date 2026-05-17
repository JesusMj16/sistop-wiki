import { useEffect, useRef, useState } from 'react';
import './prose.css';

/**
 * Animación de un conjunto de 2 semáforos coordinando ping-pong padre/hijo.
 * Visualiza el patrón P/V clásico. Cada paso muestra el valor de los dos
 * semáforos, cuál proceso está dormido, y qué línea del programa corre.
 */

type Who = 'padre' | 'hijo' | 'kernel';
type ProcState = 'idle' | 'running' | 'blocked' | 'awakened' | 'done';

type Step = {
  title: string;
  sem: [number, number];     // valores [SEM_HIJO, SEM_PADRE]
  padre: ProcState;
  hijo: ProcState;
  who: Who;                  // quien actua en este paso
  badge?: string;            // texto corto sobre la accion
  output: string[];          // lineas impresas
  highlight: number[];
  desc: string;
};

const STEPS: Step[] = [
  {
    title: 'Estado inicial. SEM_HIJO en 0, SEM_PADRE en 1',
    sem: [0, 1],
    padre: 'idle',
    hijo: 'idle',
    who: 'kernel',
    output: [],
    highlight: [2, 3],
    desc: 'El padre acaba de crear el conjunto con dos semáforos. Inicializó SEM_HIJO en 0 y SEM_PADRE en 1. Lo importante de esos valores. El cero significa cerrado, cualquiera que intente bajarlo se queda dormido. El uno significa abierto, el primero que llegue podrá pasar. Padre arranca con permiso para entrar, hijo arranca bloqueado.',
  },
  {
    title: 'Padre hace P en SEM_PADRE. Vale 1, lo baja y pasa',
    sem: [0, 0],
    padre: 'running',
    hijo: 'blocked',
    who: 'padre',
    badge: 'P(SEM_PADRE) toma su turno',
    output: [],
    highlight: [4],
    desc: 'El padre ejecuta semop con sem_op igual a menos uno sobre SEM_PADRE. Como el semáforo vale 1, el kernel resta 1, lo deja en 0 y el padre continúa sin bloquearse. El hijo intentó hacer P sobre SEM_HIJO antes pero como valía 0 se quedó dormido. El padre tiene el turno.',
  },
  {
    title: 'Padre imprime su número y baja el contador',
    sem: [0, 0],
    padre: 'running',
    hijo: 'blocked',
    who: 'padre',
    badge: 'sección de trabajo',
    output: ['Proceso padre: 1000000'],
    highlight: [5],
    desc: 'Dentro de su sección de trabajo el padre ejecuta printf y decrementa la variable i. Esta es la parte que queremos que ocurra sin que el hijo interfiera. Mientras el padre está aquí, el hijo sigue durmiendo en su propia P porque SEM_HIJO sigue en cero.',
  },
  {
    title: 'Padre hace V sobre SEM_HIJO. Pasa de 0 a 1',
    sem: [1, 0],
    padre: 'running',
    hijo: 'awakened',
    who: 'padre',
    badge: 'V(SEM_HIJO) despierta al hijo',
    output: ['Proceso padre: 1000000'],
    highlight: [6],
    desc: 'El padre termina su turno y llama semop con sem_op igual a más uno sobre SEM_HIJO. El kernel suma 1, ve que hay un proceso esperando, y en lugar de dejar el valor en 1 lo deja en 0 y despierta al hijo. Esa es la magia. La operación V es la señal explícita de pásame el turno.',
  },
  {
    title: 'Hijo despertó. Termina su P y entra a trabajar',
    sem: [0, 0],
    padre: 'blocked',
    hijo: 'running',
    who: 'hijo',
    badge: 'P(SEM_HIJO) completada',
    output: ['Proceso padre: 1000000'],
    highlight: [4],
    desc: 'El hijo sale del bloqueo. Su P sobre SEM_HIJO finalmente se completa con éxito. Mientras tanto, en cuanto el hijo arrancó su siguiente vuelta del while, el padre intentó P sobre SEM_PADRE. Como ese semáforo está en cero ahora, el padre quedó dormido. La pelota cambió de cancha.',
  },
  {
    title: 'Hijo imprime y baja su contador',
    sem: [0, 0],
    padre: 'blocked',
    hijo: 'running',
    who: 'hijo',
    badge: 'sección de trabajo',
    output: ['Proceso padre: 1000000', 'Proceso hijo: 999999'],
    highlight: [5],
    desc: 'El hijo hace su printf con i igual a 999999 y la decrementa. Igual que con el padre, el hijo tiene certeza de que el padre no va a meterse aquí porque está dormido. Esa garantía de exclusión es lo que hacen los semáforos cuando se usan así, en pareja, como banderas de turno.',
  },
  {
    title: 'Hijo hace V sobre SEM_PADRE. Despierta al padre',
    sem: [0, 1],
    padre: 'awakened',
    hijo: 'running',
    who: 'hijo',
    badge: 'V(SEM_PADRE) devuelve el turno',
    output: ['Proceso padre: 1000000', 'Proceso hijo: 999999'],
    highlight: [6],
    desc: 'El hijo cierra su iteración llamando semop con sem_op igual a más uno sobre SEM_PADRE. El kernel suma 1, ve al padre esperando, y lo despierta dejando el contador en cero. El padre ya puede entrar a su próxima vuelta. Estamos de regreso a un estado parecido al del paso 2 pero con los printf ya hechos.',
  },
  {
    title: 'El ciclo se repite hasta que i llega a 0',
    sem: [0, 0],
    padre: 'running',
    hijo: 'blocked',
    who: 'padre',
    badge: 'ping pong continúa',
    output: ['Proceso padre: 1000000', 'Proceso hijo: 999999', 'Proceso padre: 999998', '...'],
    highlight: [5, 6],
    desc: 'El padre vuelve a tomar el turno con P, imprime, decrementa, hace V y duerme. El hijo despierta, imprime, decrementa, hace V y duerme. Cada vuelta del while gasta una unidad de i. Las salidas se alternan estrictamente padre, hijo, padre, hijo. Ninguna de las dos líneas printf se mezcla con la otra porque los semáforos las separan en el tiempo.',
  },
  {
    title: 'Final. Uno de los dos llama IPC_RMID',
    sem: [0, 0],
    padre: 'done',
    hijo: 'done',
    who: 'kernel',
    badge: 'limpieza',
    output: ['... iteración final', 'IPC_RMID ejecutado'],
    highlight: [7],
    desc: 'Cuando i llega a cero, ambos procesos salen del while. Uno de los dos llama semctl con IPC_RMID, lo que elimina el conjunto entero de semáforos del kernel. Si te olvidas de este paso, los semáforos quedan visibles en el comando ipcs hasta el próximo reinicio o un ipcrm manual.',
  },
];

const CODE = [
  '/* dentro del while de cada proceso */',
  'op.sem_num = MIO;',
  'op.sem_op  = -1;          /* P, espera turno */',
  'op.sem_flg = 0;',
  'semop(semid, &op, 1);     /* duerme si MIO=0 */',
  'printf(...);              /* sección protegida */',
  'op.sem_op  = 1;           /* V, cede turno */',
  'semop(semid, &op, 1);     /* despierta al otro */',
];

const STATE_LABEL: Record<ProcState, string> = {
  idle: 'esperando inicio',
  running: 'EJECUTANDO',
  blocked: 'BLOQUEADO en P',
  awakened: 'despertando...',
  done: 'terminado',
};

const AUTO_MS = 2800;

export function SemaphoreFlow() {
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

  function SemBox({ idx, label, value }: { idx: number; label: string; value: number }) {
    const open = value > 0;
    return (
      <div className={`smf-sem ${open ? 'smf-sem-open' : 'smf-sem-closed'}`}>
        <div className="smf-sem-head">
          <span className="smf-sem-idx">[{idx}]</span>
          <span className="smf-sem-name">{label}</span>
        </div>
        <div className="smf-sem-val">{value}</div>
        <div className="smf-sem-state">{open ? 'ABIERTO' : 'CERRADO'}</div>
      </div>
    );
  }

  function ProcLane({ name, role, state, side }: { name: string; role: string; state: ProcState; side: 'l' | 'r' }) {
    return (
      <div className={`smf-proc smf-proc-${side} smf-proc-${state}`}>
        <div className="smf-proc-head">
          <span className="smf-proc-name">{name}</span>
          <span className="smf-proc-role">{role}</span>
        </div>
        <div className="smf-proc-state">{STATE_LABEL[state]}</div>
        {state === 'blocked' && <div className="wt-zzz">z z z</div>}
      </div>
    );
  }

  return (
    <div className="zf-wrap smf-wrap">
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

      <div className="zf-grid smf-grid">
        <div className="zf-stage smf-stage">
          <div className="smf-arena">
            <ProcLane name="proceso padre" role="turno par" state={current.padre} side="l" />

            <div className={`smf-kernel smf-actor-${current.who}`}>
              <div className="smf-kernel-tag">KERNEL · semid 32768</div>
              <div className="smf-sem-row">
                <SemBox idx={0} label="SEM_HIJO" value={current.sem[0]} />
                <SemBox idx={1} label="SEM_PADRE" value={current.sem[1]} />
              </div>
              {current.badge && (
                <div className={`smf-badge smf-badge-${current.who}`}>{current.badge}</div>
              )}
            </div>

            <ProcLane name="proceso hijo" role="turno impar" state={current.hijo} side="r" />
          </div>

          <div className="smf-output">
            <div className="smf-output-tag">stdout</div>
            <pre className="smf-output-body">
              {current.output.length === 0 ? '— sin salida aún —' : current.output.join('\n')}
            </pre>
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
