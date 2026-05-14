import React, { useState } from 'react';
import './prose.css';

type FanStep = {
  label: string;
  title: string;
  iter: number;
  highlight: number[];
  desc: string;
  takeaway: string;
};

const FAN_N = 5;
const FAN_STEPS: FanStep[] = [
  {
    label: 'PASO 0 DE 5',
    title: 'ESTADO INICIAL, SOLO EL PADRE P0',
    iter: -1,
    highlight: [3, 4, 5, 6],
    desc: 'Antes de entrar al ciclo solo existe el proceso padre P0. Posee su propio PID, un PPID heredado del shell que lo lanzó, su tabla de páginas, sus descriptores de archivo estándar (stdin, stdout, stderr) y su contador i = 0. Aún no se ha invocado fork() ni una sola vez. El árbol genealógico contiene únicamente la raíz.',
    takeaway: 'Un solo proceso en memoria, listo para iterar.',
  },
  {
    label: 'PASO 1 DE 5',
    title: 'i = 0, fork() crea a P1',
    iter: 0,
    highlight: [9, 10, 11, 12],
    desc: 'El padre P0 ejecuta fork() en la primera iteración. El kernel duplica el proceso, asigna un PID nuevo (P1) y le pone como PPID el PID de P0. En P0, fork() retorna un entero positivo (el PID del hijo), por lo que la condición if (hijo == 0) es falsa y NO entra al break: el padre continúa el ciclo. En P1, fork() retorna 0, por lo que entra al break y abandona el bucle inmediatamente, sin volver a llamar a fork().',
    takeaway: 'P1 nace y se aparta. P0 conserva el control del ciclo.',
  },
  {
    label: 'PASO 2 DE 5',
    title: 'i = 1, fork() crea a P2',
    iter: 1,
    highlight: [9, 10, 11, 12],
    desc: 'Segunda iteración del padre. P0 vuelve a invocar fork(). Nuevamente el kernel duplica al padre, asigna otro PID fresco (P2) y le marca como PPID el de P0. Importante: P2 NACE DEL PADRE, NO DE P1. Esa es la diferencia esencial con una cadena de procesos: aquí los hijos jamás se ramifican. P2 también ejecuta el break y queda como hoja inerte. P1 sigue dormido en su break, ya fuera del bucle.',
    takeaway: 'Tres procesos vivos, dos hojas más una raíz iteradora.',
  },
  {
    label: 'PASO 3 DE 5',
    title: 'i = 2, fork() crea a P3',
    iter: 2,
    highlight: [9, 10, 11, 12],
    desc: 'Tercera iteración. Mismo patrón mecánico: P0 llama a fork(), nace P3 con PPID = PID de P0. P3 entra al break. Los hijos P1 y P2 jamás interactúan entre sí ni con sus hermanos posteriores; en la jerarquía del kernel son nodos terminales colgados de la misma raíz. Si en este momento listaras los procesos con pstree o ps -ef, verías a P0 con tres hijos colgando a su nivel.',
    takeaway: 'La estructura ya luce como un abanico, todos comparten padre.',
  },
  {
    label: 'PASO 4 DE 5',
    title: 'i = 3 y 4, fork() crea a P4 y P5',
    iter: 4,
    highlight: [7, 8, 9, 10, 11, 12, 13],
    desc: 'Cuarta y quinta iteración condensadas. Tras ellas el padre ya creó los n = 5 hijos requeridos. El for(i = 0; i < n; i++) termina su condición. Solo aquí cae la importancia de la línea fprintf(stderr, ...) FUERA del for: la imprime cada proceso una sola vez, después de salir del bucle (los hijos por break, el padre por agotar las iteraciones). Esto produce exactamente n + 1 líneas de salida, una por proceso.',
    takeaway: 'Padre fuera del for por condición, hijos por break. Misma salida después.',
  },
  {
    label: 'PASO 5 DE 5',
    title: 'ABANICO COMPLETO',
    iter: 5,
    highlight: [15, 16],
    desc: 'Estructura final: un solo padre P0 y n = 5 hojas P1..P5, todas con el mismo PPID. Topológicamente es una estrella o abanico, de ahí el nombre. Cada hoja imprimirá su propio PID y el PPID de P0 mediante fprintf(stderr,...). El orden de aparición en pantalla NO es determinista: depende de cómo el planificador del kernel intercale los procesos. Si P0 muere antes que sus hijos, el kernel los reasigna al proceso init/systemd (PID 1), que adoptará a los huérfanos.',
    takeaway: 'Profundidad 1, ancho n. El padre es punto único de creación.',
  },
];

const FAN_CODE = [
  '#include <stdio.h>',
  '#include <stdlib.h>',
  '#include <sys/types.h>',
  '#include <unistd.h>',
  '',
  'int main(void) {',
  '    pid_t hijo;',
  '    int n = 5;',
  '    for (int i = 0; i < n; i++) {',
  '        hijo = fork();',
  '        if (hijo == 0) {',
  '            break;',
  '        }',
  '    }',
  '    fprintf(stderr, "Proceso PID=%ld, PPID=%ld\\n",',
  '            (long)getpid(), (long)getppid());',
  '    return EXIT_SUCCESS;',
  '}',
];

export function ProcessFanAnimation() {
  const [step, setStep] = useState(0);
  const current = FAN_STEPS[step];

  const visibleChildren = Math.max(0, Math.min(FAN_N, current.iter + 1));

  function goTo(s: number) {
    setStep(Math.max(0, Math.min(FAN_STEPS.length - 1, s)));
  }

  return (
    <div className="fan-wrap">
      <div className="fan-intro">
        <span className="fan-intro-badge">VISUAL · ABANICO DE PROCESOS</span>
        <p className="fan-intro-text">
          En el patrón de <strong>abanico</strong>, un único padre engendra a todos los hijos dentro de un ciclo,
          y cada hijo abandona el bucle apenas nace usando <em>break</em>. El resultado es una jerarquía plana de
          profundidad uno: una raíz y muchas hojas. Avanza paso a paso para ver, iteración por iteración, cómo
          el árbol va abriéndose.
        </p>
      </div>

      <div className="fan-header">
        <span className="fan-step-badge">{current.label}</span>
        <span className="fan-step-label">{current.title}</span>
        <span className="fan-progress">
          {FAN_STEPS.map((_, i) => (
            <span key={i} className={`fan-progress-tick ${i <= step ? 'fan-progress-tick-on' : ''}`} />
          ))}
        </span>
      </div>

      <div className="fan-grid">
        <div className="fan-stage-card">
          <div className="fan-stage-tag">ESTRUCTURA DE PROCESOS</div>
          <div className="fan-stage">
            <svg className="fan-edges" viewBox="0 0 600 360" preserveAspectRatio="none" aria-hidden="true">
              {Array.from({ length: visibleChildren }).map((_, i) => {
                const total = FAN_N;
                const spread = 480;
                const startX = 300 - spread / 2;
                const stepX = total > 1 ? spread / (total - 1) : 0;
                const cx = startX + stepX * i;
                const cy = 300;
                const px = 300;
                const py = 80;
                const mx = (px + cx) / 2;
                const my = (py + cy) / 2 + 20;
                return (
                  <path
                    key={i}
                    d={`M ${px} ${py} Q ${mx} ${my}, ${cx} ${cy}`}
                    className="fan-edge"
                    style={{ animationDelay: `${i * 60}ms` }}
                  />
                );
              })}
            </svg>

            <div className="fan-node fan-node-parent">
              <div className="fan-node-tag">PADRE</div>
              <div className="fan-node-pid">P0</div>
              <div className="fan-node-meta">i = {current.iter < 0 ? 0 : Math.min(current.iter + 1, FAN_N)}</div>
            </div>

            <div className="fan-children">
              {Array.from({ length: FAN_N }).map((_, i) => {
                const visible = i < visibleChildren;
                const justBorn = i === current.iter;
                return (
                  <div
                    key={i}
                    className={`fan-node fan-node-child ${visible ? 'fan-node-on' : ''} ${justBorn ? 'fan-node-new' : ''}`}
                    style={{ ['--ci' as string]: i } as React.CSSProperties}
                  >
                    <div className="fan-node-tag">HIJO</div>
                    <div className="fan-node-pid">P{i + 1}</div>
                    <div className="fan-node-meta">PPID = P0</div>
                    {justBorn && <span className="fan-new-flag">NUEVO</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="fan-code-card">
          <div className="fan-code-tag">CÓDIGO EN EJECUCIÓN</div>
          <ol className="fan-code-list">
            {FAN_CODE.map((line, i) => {
              const ln = i + 1;
              const hot = current.highlight.includes(ln);
              return (
                <li key={i} className={`fan-code-line ${hot ? 'fan-code-line-hot' : ''}`}>
                  <span className="fan-code-num">{ln}</span>
                  <pre className="fan-code-text"><code>{line || ' '}</code></pre>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <div className="fan-desc">
        <p className="fan-desc-text">{current.desc}</p>
        <p className="fan-desc-take"><span className="fan-desc-tag">CLAVE</span>{current.takeaway}</p>
      </div>

      <div className="fan-controls">
        <button className="fan-btn" onClick={() => goTo(step - 1)} disabled={step === 0}>◀ Anterior</button>
        <div className="fan-dots">
          {FAN_STEPS.map((_, i) => (
            <button
              key={i}
              className={`fan-dot ${step === i ? 'fan-dot-active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Ir al paso ${i}`}
            >
              <span className="fan-dot-num">{i}</span>
            </button>
          ))}
        </div>
        <button className="fan-btn fan-btn-next" onClick={() => goTo(step + 1)} disabled={step === FAN_STEPS.length - 1}>Siguiente ▶</button>
      </div>
    </div>
  );
}
