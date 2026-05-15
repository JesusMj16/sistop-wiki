import { useState } from 'react';
import './prose.css';

/**
 * Animación del ciclo de vida de los hilos POSIX.
 *
 * Reutiliza el chrome .zf-* de ZombieFlow para mantener consistencia visual.
 * Añade el concepto clave de los hilos: la memoria compartida — todos los
 * hilos del proceso ven el mismo arreglo de datos.
 */

type LaneState = 'none' | 'running' | 'blocked' | 'working' | 'done' | 'reaped';

type Step = {
  title: string;
  main: LaneState;
  threads: LaneState[];
  shared: number[];   // valores que ven los hilos en la memoria compartida
  highlight: number[];
  desc: string;
};

const STEPS: Step[] = [
  {
    title: 'Solo el main, antes de crear hilos',
    main: 'running',
    threads: ['none', 'none', 'none', 'none'],
    shared: [0, 0, 0, 0],
    highlight: [9, 10],
    desc: 'El programa arranca con un solo hilo de ejecución, llamado main. Todavía no hay nadie con quien compartir nada. Existe ya una variable global que servirá de zona común.',
  },
  {
    title: 'pthread_create lanza al primer hilo',
    main: 'running',
    threads: ['running', 'none', 'none', 'none'],
    shared: [0, 0, 0, 0],
    highlight: [13, 14],
    desc: 'main invoca pthread_create. El kernel arranca un hilo nuevo que ejecuta la función pasada como argumento. Comparte la misma memoria que main: ve la variable global.',
  },
  {
    title: 'Más hilos en paralelo',
    main: 'running',
    threads: ['working', 'working', 'working', 'running'],
    shared: [1, 1, 1, 0],
    highlight: [13, 14],
    desc: 'Repetimos pthread_create en un bucle. Cada llamada crea un hilo independiente. Cuatro hilos corriendo al mismo tiempo, todos viendo la misma zona de memoria.',
  },
  {
    title: 'main llama a pthread_join y se duerme',
    main: 'blocked',
    threads: ['working', 'working', 'working', 'working'],
    shared: [2, 6, 24, 120],
    highlight: [17, 18],
    desc: 'main se bloquea esperando al primer hilo. Mientras tanto los hilos trabajadores siguen calculando. Cada uno escribe su propio resultado en su casilla del arreglo compartido.',
  },
  {
    title: 'Los hilos terminan con pthread_exit',
    main: 'blocked',
    threads: ['done', 'done', 'working', 'working'],
    shared: [2, 6, 24, 120],
    highlight: [22],
    desc: 'Los hilos van terminando uno a uno. Cada pthread_exit deja un valor de retorno disponible para el que esté esperando con pthread_join. main todavía no se entera porque está dormido.',
  },
  {
    title: 'main recoge y todo queda limpio',
    main: 'done',
    threads: ['reaped', 'reaped', 'reaped', 'reaped'],
    shared: [2, 6, 24, 120],
    highlight: [20, 21],
    desc: 'pthread_join despierta a main con el valor de retorno del hilo esperado. main repite la operación hasta cosechar a todos. Al terminar, lee los resultados de la memoria compartida e imprime el reporte.',
  },
];

const CODE = [
  '#include <pthread.h>',
  '#include <stdio.h>',
  '',
  'typedef struct {',
  '    int id;',
  '    long prod;',
  '} DHILOS;',
  '',
  'DHILOS pm[4];',
  'void *factorial(void *);',
  '',
  'int main() {',
  '    pthread_t tid[4];',
  '    for (int i = 0; i < 4; i++)',
  '        pthread_create(&tid[i], NULL,',
  '                       factorial, &pm[i]);',
  '',
  '    for (int i = 0; i < 4; i++)',
  '        pthread_join(tid[i], NULL);',
  '',
  '    for (int i = 0; i < 4; i++)',
  '        printf("%ld\\n", pm[i].prod);',
  '    /* fin */',
  '}',
];

const STATE_LABEL: Record<LaneState, string> = {
  none: '—',
  running: 'EJECUTANDO',
  blocked: 'BLOQUEADO',
  working: 'CALCULANDO',
  done: 'pthread_exit',
  reaped: 'JOIN OK',
};

export function ThreadsFlow() {
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  function goTo(s: number) {
    setStep(Math.max(0, Math.min(STEPS.length - 1, s)));
  }

  return (
    <div className="zf-wrap tf-wrap">
      <div className="zf-head">
        <span className="zf-step-num">{step + 1}<small>/{STEPS.length}</small></span>
        <h4 className="zf-step-title">{current.title}</h4>
      </div>

      <div className="zf-grid tf-grid">
        <div className="zf-stage tf-stage">
          {/* main */}
          <div className={`wt-lane wt-lane-parent wt-state-${
            current.main === 'working' ? 'running'
            : current.main === 'reaped' ? 'done'
            : current.main
          }`}>
            <div className="wt-lane-head">
              <span className="wt-lane-name">main</span>
              <span className="wt-lane-pid">PID 4001</span>
            </div>
            <div className="wt-lane-track">
              <div className="wt-lane-bar" />
              <div className="wt-lane-state">{STATE_LABEL[current.main]}</div>
              {current.main === 'blocked' && <div className="wt-zzz">z z z</div>}
            </div>
          </div>

          {/* hilos */}
          <div className="tf-threads">
            {current.threads.map((s, i) => (
              <div key={i} className={`tf-thread wt-cstate-${
                s === 'working' ? 'running'
                : s === 'reaped' ? 'reaped'
                : s === 'done' ? 'exiting'
                : s === 'none' ? 'none'
                : 'running'
              }`}>
                <div className="tf-thread-head">
                  <span className="tf-thread-name">hilo {i + 1}</span>
                  <span className="tf-thread-state">{STATE_LABEL[s]}</span>
                </div>
                <div className="tf-thread-bar"><div className="wt-lane-bar" /></div>
              </div>
            ))}
          </div>

          {/* memoria compartida */}
          <div className="tf-shared">
            <span className="tf-shared-tag">MEMORIA COMPARTIDA · pm[]</span>
            <div className="tf-shared-grid">
              {current.shared.map((v, i) => (
                <div key={i} className={`tf-cell ${v > 0 ? 'tf-cell-on' : ''}`}>
                  <span className="tf-cell-id">pm[{i}]</span>
                  <span className="tf-cell-val">{v}</span>
                </div>
              ))}
            </div>
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
