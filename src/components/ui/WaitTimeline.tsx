import { useState } from 'react';
import './prose.css';

type WaitStep = {
  label: string;
  title: string;
  parentState: 'running' | 'blocked' | 'reading' | 'done';
  childState: 'none' | 'running' | 'exiting' | 'zombie' | 'reaped';
  highlight: number[];
  desc: string;
  takeaway: string;
};

const WAIT_STEPS: WaitStep[] = [
  {
    label: 'PASO 1 DE 6',
    title: 'PADRE LLAMA fork(), NACE EL HIJO',
    parentState: 'running',
    childState: 'running',
    highlight: [6, 7],
    desc: 'El padre invoca fork() y el kernel crea al hijo como copia. Justo después de la llamada hay dos procesos vivos, cada uno con su propio espacio de direcciones y su propio descriptor en la tabla de procesos del kernel. Ambos avanzan en paralelo: el planificador decide cuándo le da CPU a cada uno.',
    takeaway: 'Dos procesos concurrentes, sin ningún tipo de sincronización por defecto.',
  },
  {
    label: 'PASO 2 DE 6',
    title: 'PADRE LLAMA wait(), SE DUERME',
    parentState: 'blocked',
    childState: 'running',
    highlight: [12],
    desc: 'El padre ejecuta wait(&status). El kernel marca al padre como BLOCKED y lo saca de la cola de procesos listos. Mientras tanto, el hijo sigue ejecutándose normalmente, consumiendo CPU. El padre NO consume CPU mientras está bloqueado: queda dormido a la espera de una notificación del kernel sobre la terminación de cualquier hijo.',
    takeaway: 'wait() es bloqueante. El padre se duerme, libera CPU.',
  },
  {
    label: 'PASO 3 DE 6',
    title: 'EL HIJO TERMINA, exit(42)',
    parentState: 'blocked',
    childState: 'exiting',
    highlight: [],
    desc: 'El hijo invoca exit(42) o retorna desde main con el valor 42. El kernel libera la memoria de usuario del hijo, cierra sus descriptores de archivo y demás recursos, pero NO destruye aún su entrada en la tabla de procesos. Conserva el descriptor mínimo necesario para que el padre pueda recoger el código de salida más tarde.',
    takeaway: 'exit() libera casi todo, salvo la metainformación de terminación.',
  },
  {
    label: 'PASO 4 DE 6',
    title: 'EL HIJO QUEDA EN ESTADO ZOMBIE',
    parentState: 'blocked',
    childState: 'zombie',
    highlight: [],
    desc: 'Durante un instante (potencialmente largo si nadie llama wait()) el hijo existe como ZOMBIE: aparece con la letra Z en la salida de ps. No está vivo, no ejecuta nada, pero el kernel todavía guarda su PID, su PPID, el código de salida y un poco de contabilidad de tiempos de CPU. Esa entrada vive ahí hasta que su padre la recoja.',
    takeaway: 'Zombie no es un bug, es el contrato del kernel para entregar el código de salida.',
  },
  {
    label: 'PASO 5 DE 6',
    title: 'KERNEL DESPIERTA AL PADRE',
    parentState: 'reading',
    childState: 'zombie',
    highlight: [12, 13, 14, 15],
    desc: 'El kernel envía SIGCHLD al padre y lo regresa a la cola de procesos listos. wait() retorna: deja en el entero status apuntado por el parámetro la información codificada de terminación, y devuelve el PID del hijo recogido. Ahora el padre puede usar macros como WIFEXITED(status) y WEXITSTATUS(status) para decodificar qué pasó.',
    takeaway: 'wait() devuelve PID + estado. El padre ya sabe quién murió y cómo.',
  },
  {
    label: 'PASO 6 DE 6',
    title: 'KERNEL LIMPIA AL HIJO ZOMBIE',
    parentState: 'done',
    childState: 'reaped',
    highlight: [13, 14, 15, 16],
    desc: 'Una vez que wait() recogió el estado, el kernel borra la entrada del hijo de la tabla de procesos. El PID queda libre y puede reutilizarse para un proceso futuro. El padre continúa su ejecución normalmente, ya con el conocimiento de cómo terminó su hijo. Si hubiera más hijos pendientes, debe llamar wait() de nuevo, una vez por cada uno.',
    takeaway: 'Por cada fork() responsable hay un wait() que limpia.',
  },
];

const WAIT_CODE = [
  '#include <sys/types.h>',
  '#include <sys/wait.h>',
  '#include <unistd.h>',
  '#include <stdio.h>',
  'int main(void) {',
  '    pid_t hijo = fork();',
  '    if (hijo == 0) {',
  '        /* HIJO */',
  '        return 42;',
  '    }',
  '    int status;',
  '    pid_t pid = wait(&status);',
  '    if (WIFEXITED(status)) {',
  '        printf("Hijo %d salio con %d\\n",',
  '               pid, WEXITSTATUS(status));',
  '    }',
  '    return 0;',
  '}',
];

export function WaitTimeline() {
  const [step, setStep] = useState(0);
  const current = WAIT_STEPS[step];

  function goTo(s: number) {
    setStep(Math.max(0, Math.min(WAIT_STEPS.length - 1, s)));
  }

  const parentLabel: Record<WaitStep['parentState'], string> = {
    running: 'EJECUTANDO',
    blocked: 'BLOQUEADO',
    reading: 'LEE STATUS',
    done: 'TERMINADO',
  };
  const childLabel: Record<WaitStep['childState'], string> = {
    none: 'NO EXISTE',
    running: 'EJECUTANDO',
    exiting: 'exit()',
    zombie: 'ZOMBIE',
    reaped: 'LIMPIADO',
  };

  return (
    <div className="wt-wrap">
      <div className="wt-intro">
        <span className="wt-intro-badge">VISUAL · wait() PASO A PASO</span>
        <p className="wt-intro-text">
          Aquí ves cómo el padre y el hijo se sincronizan a través de <strong>wait()</strong>. Avanza por los seis
          pasos para entender qué hace el kernel internamente: cuándo el padre se duerme, cuándo el hijo queda como
          zombie y cuándo finalmente se entrega el código de salida.
        </p>
      </div>

      <div className="wt-header">
        <span className="wt-step-badge">{current.label}</span>
        <span className="wt-step-label">{current.title}</span>
        <span className="wt-progress">
          {WAIT_STEPS.map((_, i) => (
            <span key={i} className={`wt-progress-tick ${i <= step ? 'wt-progress-tick-on' : ''}`} />
          ))}
        </span>
      </div>

      <div className="wt-grid">
        <div className="wt-stage-card">
          <div className="wt-stage-tag">LÍNEAS DE TIEMPO</div>
          <div className="wt-stage">
            <div className={`wt-lane wt-lane-parent wt-state-${current.parentState}`}>
              <div className="wt-lane-head">
                <span className="wt-lane-name">PADRE</span>
                <span className="wt-lane-pid">PID 1042</span>
              </div>
              <div className="wt-lane-track">
                <div className="wt-lane-bar" />
                <div className="wt-lane-state">{parentLabel[current.parentState]}</div>
                {current.parentState === 'blocked' && <div className="wt-zzz">z z z</div>}
                {current.parentState === 'reading' && <div className="wt-flash">SIGCHLD</div>}
              </div>
            </div>

            <div className={`wt-lane wt-lane-child wt-cstate-${current.childState}`}>
              <div className="wt-lane-head">
                <span className="wt-lane-name">HIJO</span>
                <span className="wt-lane-pid">PID 1043</span>
              </div>
              <div className="wt-lane-track">
                <div className="wt-lane-bar" />
                <div className="wt-lane-state">{childLabel[current.childState]}</div>
                {current.childState === 'zombie' && <div className="wt-skull">Z</div>}
                {current.childState === 'exiting' && <div className="wt-exit">exit(42)</div>}
              </div>
            </div>

            <div className="wt-kernel">
              <span className="wt-kernel-tag">KERNEL</span>
              <span className="wt-kernel-msg">
                {current.parentState === 'blocked' && current.childState === 'running' && 'Padre dormido en cola wait_queue. Hijo en RUN.'}
                {current.parentState === 'blocked' && current.childState === 'exiting' && 'Hijo libera memoria. Reserva entrada en tabla de procesos.'}
                {current.parentState === 'blocked' && current.childState === 'zombie' && 'Hijo = ZOMBIE. Esperando wait() del padre.'}
                {current.parentState === 'reading' && 'Envía SIGCHLD. Despierta al padre. Entrega status.'}
                {current.parentState === 'done' && 'Borra entrada del hijo. PID libre para reutilizar.'}
                {current.parentState === 'running' && current.childState === 'running' && 'Ambos procesos en cola RUNNABLE.'}
              </span>
            </div>
          </div>
        </div>

        <div className="wt-code-card">
          <div className="wt-code-tag">CÓDIGO EN EJECUCIÓN</div>
          <ol className="wt-code-list">
            {WAIT_CODE.map((line, i) => {
              const ln = i + 1;
              const hot = current.highlight.includes(ln);
              return (
                <li key={i} className={`wt-code-line ${hot ? 'wt-code-line-hot' : ''}`}>
                  <span className="wt-code-num">{ln}</span>
                  <pre className="wt-code-text"><code>{line || ' '}</code></pre>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <div className="wt-desc">
        <p className="wt-desc-text">{current.desc}</p>
        <p className="wt-desc-take"><span className="wt-desc-tag">CLAVE</span>{current.takeaway}</p>
      </div>

      <div className="wt-controls">
        <button className="wt-btn" onClick={() => goTo(step - 1)} disabled={step === 0}>◀ Anterior</button>
        <div className="wt-dots">
          {WAIT_STEPS.map((_, i) => (
            <button
              key={i}
              className={`wt-dot ${step === i ? 'wt-dot-active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Ir al paso ${i + 1}`}
            >
              <span className="wt-dot-num">{i + 1}</span>
            </button>
          ))}
        </div>
        <button className="wt-btn wt-btn-next" onClick={() => goTo(step + 1)} disabled={step === WAIT_STEPS.length - 1}>Siguiente ▶</button>
      </div>
    </div>
  );
}
