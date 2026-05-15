import { useState } from 'react';
import './prose.css';

/**
 * Animación del estado zombi.
 *
 * Comparte el lenguaje visual de WaitTimeline (lanes, code-card, dots) pero
 * elimina capas redundantes: sin intro card, sin "CLAVE" duplicado, sin
 * progress-tick + dots a la vez, sin kernel-row dentro del stage. El objetivo
 * es que el lector vea de un golpe: modo, título del paso, lo que pasa, el
 * código, y la explicación. Nada más.
 */

type ParentState = 'running' | 'blocked' | 'reading' | 'done';
type ChildState  = 'none' | 'running' | 'exiting' | 'zombie' | 'reaped';

type Step = {
  title: string;
  parent: ParentState;
  child: ChildState;
  highlight: number[];
  desc: string;
};

const SIN_WAIT: Step[] = [
  {
    title: 'Padre y hijo nacen con fork',
    parent: 'running', child: 'running', highlight: [7],
    desc: 'El padre crea al hijo con fork. Los dos quedan corriendo en paralelo, sin sincronizarse.',
  },
  {
    title: 'El hijo termina con exit',
    parent: 'running', child: 'exiting', highlight: [11],
    desc: 'El hijo cumple su trabajo y termina. El kernel libera su memoria pero guarda la entrada en la tabla de procesos para el padre.',
  },
  {
    title: 'Aparece el zombi',
    parent: 'running', child: 'zombie', highlight: [],
    desc: 'El hijo queda como zombi. No ejecuta nada, pero su entrada sigue ahí. En otra terminal se ve con ps -el | grep Z.',
  },
  {
    title: 'El padre duerme, nunca llama a wait',
    parent: 'running', child: 'zombie', highlight: [14],
    desc: 'Mientras el padre no recoja, el zombi persiste. Si pasara con muchos hijos, llenaríamos la tabla del kernel.',
  },
  {
    title: 'Init adopta y limpia',
    parent: 'done', child: 'reaped', highlight: [16],
    desc: 'Cuando el padre termina, el hijo zombi queda huérfano. PID 1 lo adopta y le hace wait. El sistema queda limpio.',
  },
];

const SIN_WAIT_CODE = [
  '#include <stdio.h>',
  '#include <stdlib.h>',
  '#include <sys/types.h>',
  '#include <unistd.h>',
  'int main(void) {',
  '    pid_t pid;',
  '    pid = fork();',
  '    if (pid == 0) {',
  '        printf("Hijo\\n");',
  '        exit(EXIT_SUCCESS);',
  '    } else {',
  '        sleep(30);',
  '        /* sin wait */',
  '    }',
  '    return EXIT_SUCCESS;',
  '}',
];

const CON_WAIT: Step[] = [
  {
    title: 'Padre y hijo nacen con fork',
    parent: 'running', child: 'running', highlight: [8],
    desc: 'Mismo arranque que el otro caso. La diferencia llegará en el paso del padre.',
  },
  {
    title: 'El hijo termina con exit',
    parent: 'running', child: 'exiting', highlight: [11],
    desc: 'El hijo termina. El kernel le guarda la metainformación de salida hasta que alguien la pida.',
  },
  {
    title: 'El padre llama a wait y se duerme',
    parent: 'blocked', child: 'exiting', highlight: [13],
    desc: 'wait bloquea al padre. Mientras espera, no consume CPU. Está solo disponible para recibir la noticia.',
  },
  {
    title: 'El kernel despierta al padre',
    parent: 'reading', child: 'zombie', highlight: [13, 14],
    desc: 'El kernel envía SIGCHLD. wait retorna con el PID del hijo y deja en status su código de salida.',
  },
  {
    title: 'Sin zombi, todo limpio',
    parent: 'done', child: 'reaped', highlight: [14],
    desc: 'El kernel borra la entrada del hijo. Si ahora hacemos ps, no aparece. No quedó zombi, no quedó huérfano.',
  },
];

const CON_WAIT_CODE = [
  '#include <stdio.h>',
  '#include <stdlib.h>',
  '#include <sys/wait.h>',
  '#include <unistd.h>',
  'int main(void) {',
  '    pid_t pid;',
  '    int status;',
  '    pid = fork();',
  '    if (pid == 0) {',
  '        printf("Hijo\\n");',
  '        exit(EXIT_SUCCESS);',
  '    } else {',
  '        wait(&status);',
  '        printf("recolectado\\n");',
  '    }',
  '    return EXIT_SUCCESS;',
  '}',
];

type Scenario = 'sin' | 'con';

const PARENT_LABEL: Record<ParentState, string> = {
  running: 'EJECUTANDO',
  blocked: 'BLOQUEADO',
  reading: 'LEE STATUS',
  done: 'TERMINADO',
};
const CHILD_LABEL: Record<ChildState, string> = {
  none: '—',
  running: 'EJECUTANDO',
  exiting: 'exit()',
  zombie: 'ZOMBI',
  reaped: 'LIMPIADO',
};

export function ZombieFlow() {
  const [scenario, setScenario] = useState<Scenario>('sin');
  const [step, setStep] = useState(0);

  const steps = scenario === 'sin' ? SIN_WAIT : CON_WAIT;
  const code  = scenario === 'sin' ? SIN_WAIT_CODE : CON_WAIT_CODE;
  const current = steps[step];

  function pick(s: Scenario) {
    if (s === scenario) return;
    setScenario(s);
    setStep(0);
  }
  function goTo(s: number) {
    setStep(Math.max(0, Math.min(steps.length - 1, s)));
  }

  return (
    <div className="zf-wrap">
      <div className="zf-modes">
        <button
          className={`zf-mode ${scenario === 'sin' ? 'zf-mode-on' : ''}`}
          onClick={() => pick('sin')}
          aria-pressed={scenario === 'sin'}
        >
          Sin wait
          <span className="zf-mode-sub">aparece zombi</span>
        </button>
        <button
          className={`zf-mode ${scenario === 'con' ? 'zf-mode-on' : ''}`}
          onClick={() => pick('con')}
          aria-pressed={scenario === 'con'}
        >
          Con wait
          <span className="zf-mode-sub">sin zombi</span>
        </button>
      </div>

      <div className="zf-head">
        <span className="zf-step-num">{step + 1}<small>/{steps.length}</small></span>
        <h4 className="zf-step-title">{current.title}</h4>
      </div>

      <div className="zf-grid">
        <div className="zf-stage">
          <div className={`wt-lane wt-lane-parent wt-state-${current.parent}`}>
            <div className="wt-lane-head">
              <span className="wt-lane-name">Padre</span>
              <span className="wt-lane-pid">1042</span>
            </div>
            <div className="wt-lane-track">
              <div className="wt-lane-bar" />
              <div className="wt-lane-state">{PARENT_LABEL[current.parent]}</div>
              {current.parent === 'blocked' && <div className="wt-zzz">z z z</div>}
              {current.parent === 'reading' && <div className="wt-flash">SIGCHLD</div>}
            </div>
          </div>

          <div className={`wt-lane wt-lane-child wt-cstate-${current.child}`}>
            <div className="wt-lane-head">
              <span className="wt-lane-name">Hijo</span>
              <span className="wt-lane-pid">1043</span>
            </div>
            <div className="wt-lane-track">
              <div className="wt-lane-bar" />
              <div className="wt-lane-state">{CHILD_LABEL[current.child]}</div>
              {current.child === 'zombie' && <div className="wt-skull">Z</div>}
              {current.child === 'exiting' && <div className="wt-exit">exit(0)</div>}
            </div>
          </div>
        </div>

        <ol className="zf-code">
          {code.map((line, i) => {
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
          {steps.map((_, i) => (
            <button
              key={i}
              className={`zf-dot ${step === i ? 'zf-dot-on' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Paso ${i + 1}`}
            />
          ))}
        </div>
        <button className="zf-nav-btn zf-nav-next" onClick={() => goTo(step + 1)} disabled={step === steps.length - 1} aria-label="Siguiente">▶</button>
      </div>
    </div>
  );
}
