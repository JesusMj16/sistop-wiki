import { useEffect, useRef, useState } from 'react';
import './prose.css';

/**
 * Animación. Tres formas en que un proceso responde a una señal.
 * 1. Ignorar. 2. Rutina por defecto del kernel. 3. Handler propio.
 */

type Mode = 'ignore' | 'default' | 'custom';

type Step = {
  title: string;
  /** Cuál columna está iluminada. */
  mode?: Mode;
  /** Si se está enviando la señal en este paso. */
  flying?: boolean;
  desc: string;
};

const STEPS: Step[] = [
  {
    title: 'Paso 0. Tres caminos para una sola señal',
    desc: 'Una señal es una interrupción de software que el kernel u otro proceso le entregan a un proceso destino. Cuando llega, el proceso responde de una de tres maneras. Ignorarla. Dejar que actúe la rutina por defecto del kernel. O atenderla con un handler propio escrito por el programador. La animación muestra los tres caminos uno por uno.',
  },
  {
    title: 'Paso 1. Envío. kill(pid, SIGINT) viaja al destino',
    flying: true,
    desc: 'Un proceso ejecuta kill(pid, SIGINT) o el kernel decide entregar una señal por su cuenta. La señal viaja como un número entero positivo identificado con un nombre tipo SIGINT, SIGTERM, SIGKILL. El proceso destino la recibe en su siguiente cambio de contexto. Aquí empieza la bifurcación de comportamiento.',
  },
  {
    title: 'Paso 2. Camino 1. Ignorar la señal',
    mode: 'ignore',
    desc: 'El proceso puede ignorar la señal siempre y cuando tenga mayor prioridad que el proceso que la envía. En ese caso queda inmune a la misma. La señal llega, el kernel verifica las reglas, y descarta la entrega sin ningún efecto sobre el flujo de ejecución. SIGKILL y SIGSTOP son las excepciones absolutas. No se pueden ignorar nunca.',
  },
  {
    title: 'Paso 3. Camino 2. Rutina de tratamiento por defecto',
    mode: 'default',
    desc: 'Esta rutina la aporta el kernel. Según el tipo de señal, ejecuta una acción específica. La acción más común es terminar el proceso mediante una llamada a exit. Algunas señales además generan un archivo llamado core en el directorio actual con un volcado de memoria del contexto del proceso. Ese archivo es muy útil para depurar con gdb. SIGSEGV, SIGABRT y SIGFPE producen core dumps típicos.',
  },
  {
    title: 'Paso 4. Camino 3. Handler propio del programador',
    mode: 'custom',
    desc: 'El programador puede escribir su propia rutina de tratamiento y registrarla con signal o sigaction. Cuando llega la señal, el kernel suspende temporalmente el flujo normal del proceso, ejecuta el handler, y al regresar continúa donde se había quedado. Esto permite por ejemplo que SIGINT al hacer Ctrl-C no mate al programa sino que guarde su estado, libere recursos y salga limpio.',
  },
];

const AUTO_MS = 3200;

export function SignalsFlow() {
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

  function active(m: Mode) { return current.mode === m; }

  return (
    <div className="zf-wrap sgf-wrap">
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

      <div className="sgf-board">
        <div className="sgf-sender">
          <span className="sgf-tag">EMISOR</span>
          <span className="sgf-call">kill(pid, SIGINT)</span>
        </div>

        <div className={`sgf-pipe ${current.flying ? 'sgf-pipe-on' : ''}`}>
          {current.flying && (
            <span className="sgf-signal">⚡ SIGINT</span>
          )}
          {!current.flying && <span className="sgf-pipe-rest">señal pendiente</span>}
        </div>

        <div className="sgf-three">
          <div className={`sgf-card sgf-ignore ${active('ignore') ? 'sgf-card-on' : ''}`}>
            <div className="sgf-card-tag">1 · IGNORAR</div>
            <div className="sgf-card-body">
              <div className="sgf-proc">proceso destino</div>
              <div className="sgf-glyph">🛡️ × señal</div>
              <div className="sgf-note">sin efecto. flujo continúa</div>
            </div>
          </div>

          <div className={`sgf-card sgf-default ${active('default') ? 'sgf-card-on' : ''}`}>
            <div className="sgf-card-tag">2 · POR DEFECTO</div>
            <div className="sgf-card-body">
              <div className="sgf-proc">proceso destino</div>
              <div className="sgf-glyph">kernel → exit()</div>
              <div className="sgf-note">termina, opcional core dump</div>
            </div>
          </div>

          <div className={`sgf-card sgf-custom ${active('custom') ? 'sgf-card-on' : ''}`}>
            <div className="sgf-card-tag">3 · HANDLER PROPIO</div>
            <div className="sgf-card-body">
              <div className="sgf-proc">proceso destino</div>
              <div className="sgf-glyph">void handler(int s)</div>
              <div className="sgf-note">corre tu rutina y vuelve</div>
            </div>
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
