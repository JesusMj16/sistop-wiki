import { useEffect, useRef, useState } from 'react';
import './prose.css';

/**
 * Animación. Catálogo de señales agrupadas por categoría.
 * Cada paso ilumina una categoría y resalta sus señales en la cuadrícula.
 */

type Action = 'core' | 'term' | 'ignore' | 'stop';
type Group =
  | 'termination'
  | 'exception'
  | 'syscall'
  | 'userland'
  | 'terminal'
  | 'debug';

type Sig = {
  name: string;
  num: number;
  action: Action[];
  group: Group;
  desc: string;
};

const SIGNALS: Sig[] = [
  { name: 'SIGHUP',    num:  1, action: ['term'],           group: 'terminal',    desc: 'desconexión terminal' },
  { name: 'SIGINT',    num:  2, action: ['term'],           group: 'terminal',    desc: 'Ctrl+C' },
  { name: 'SIGQUIT',   num:  3, action: ['core', 'term'],   group: 'terminal',    desc: 'Ctrl+\\' },
  { name: 'SIGILL',    num:  4, action: ['core', 'term'],   group: 'exception',   desc: 'instrucción ilegal' },
  { name: 'SIGTRAP',   num:  5, action: ['core', 'term'],   group: 'debug',       desc: 'paso a paso' },
  { name: 'SIGIOT',    num:  6, action: ['core', 'term'],   group: 'exception',   desc: 'fallo hw' },
  { name: 'SIGEMT',    num:  7, action: ['core', 'term'],   group: 'exception',   desc: 'emulator trap' },
  { name: 'SIGFPE',    num:  8, action: ['core', 'term'],   group: 'exception',   desc: 'error coma flotante' },
  { name: 'SIGKILL',   num:  9, action: ['term'],           group: 'termination', desc: 'matar inmune' },
  { name: 'SIGBUS',    num: 10, action: ['core', 'term'],   group: 'exception',   desc: 'bus error' },
  { name: 'SIGSEGV',   num: 11, action: ['core', 'term'],   group: 'exception',   desc: 'violación segmento' },
  { name: 'SIGSYS',    num: 12, action: ['core', 'term'],   group: 'syscall',     desc: 'arg erróneo syscall' },
  { name: 'SIGPIPE',   num: 13, action: ['term'],           group: 'userland',    desc: 'pipe sin lector' },
  { name: 'SIGALRM',   num: 14, action: ['term'],           group: 'userland',    desc: 'alarma de reloj' },
  { name: 'SIGTERM',   num: 15, action: ['term'],           group: 'termination', desc: 'fin software' },
  { name: 'SIGUSR1',   num: 16, action: ['term'],           group: 'userland',    desc: 'usuario 1' },
  { name: 'SIGUSR2',   num: 17, action: ['term'],           group: 'userland',    desc: 'usuario 2' },
  { name: 'SIGCLD',    num: 18, action: ['ignore'],         group: 'userland',    desc: 'muerte de hijo' },
  { name: 'SIGPWR',    num: 19, action: ['ignore'],         group: 'exception',   desc: 'fallo alimentación' },
];

type Step = {
  title: string;
  highlight: Group | 'all';
  desc: string;
};

const STEPS: Step[] = [
  {
    title: 'Paso 0. Las 19 señales del catálogo System V',
    highlight: 'all',
    desc: 'UNIX System V define 19 señales numeradas del 1 al 19. Cada una con nombre simbólico que empieza por SIG y una acción por defecto que el kernel toma si el proceso no instala su propio handler. BSD 4.3 amplía a 30. Linux moderno llega más allá. Las clasificamos en seis grupos lógicos según su origen.',
  },
  {
    title: 'Paso 1. Terminación. SIGKILL y SIGTERM',
    highlight: 'termination',
    desc: 'Señales para acabar con un proceso. SIGTERM es la petición educada que se puede ignorar o manejar. SIGKILL es la orden absoluta que el kernel ejecuta sin pedir permiso. Ni siquiera el handler puede atraparla. Es la herramienta cuando un proceso queda colgado y nada más funciona.',
  },
  {
    title: 'Paso 2. Excepciones. Errores generados por el hardware',
    highlight: 'exception',
    desc: 'Estas señales viajan del hardware al proceso cuando se rompe alguna regla de la CPU. SIGSEGV por acceder fuera del segmento. SIGFPE por dividir entre cero o overflow en coma flotante. SIGBUS por dirección impar en arquitecturas que requieren alineación. SIGILL por intentar ejecutar bytes que no son una instrucción válida.',
  },
  {
    title: 'Paso 3. Syscalls. Errores irrecuperables del kernel',
    highlight: 'syscall',
    desc: 'Originadas por errores serios durante una llamada al sistema. SIGSYS indica argumento erróneo en una syscall. En Linux moderno este grupo es pequeño porque la mayoría de errores de syscall se reportan vía errno en lugar de señales.',
  },
  {
    title: 'Paso 4. Modo usuario. Procesos hablándose entre sí',
    highlight: 'userland',
    desc: 'Originadas desde un proceso ejecutándose en modo usuario. Un proceso llama kill para enviar SIGUSR1 o SIGUSR2 a otro. SIGALRM la dispara el kernel cuando expira un temporizador que el proceso configuró antes con alarm. SIGPIPE llega al escribir en un pipe sin lector. SIGCLD avisa al padre que un hijo terminó.',
  },
  {
    title: 'Paso 5. Terminal. Interacción con el shell',
    highlight: 'terminal',
    desc: 'Originadas por la interacción del usuario con la terminal. SIGHUP cuando la terminal se desconecta. SIGINT por Ctrl C. SIGQUIT por Ctrl \\. El shell también envía SIGHUP a todos los procesos de su grupo cuando el líder termina, lo que permite que cerrar una ventana cierre limpiamente todo lo que estaba corriendo dentro.',
  },
  {
    title: 'Paso 6. Debug. Para ejecutar paso a paso',
    highlight: 'debug',
    desc: 'SIGTRAP la usan los debuggers como gdb después de cada instrucción cuando estás ejecutando paso a paso. También se dispara al alcanzar un breakpoint. Su acción por defecto es generar core y terminar, pero los debuggers la capturan para inspeccionar el estado y seguir.',
  },
];

const AUTO_MS = 3000;

const GROUP_LABEL: Record<Group, string> = {
  termination: 'TERMINACIÓN',
  exception:   'EXCEPCIONES',
  syscall:     'SYSCALL',
  userland:    'MODO USUARIO',
  terminal:    'TERMINAL',
  debug:       'DEBUG',
};

export function SignalCatalog() {
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

  function hot(sig: Sig) {
    return current.highlight === 'all' || current.highlight === sig.group;
  }

  return (
    <div className="zf-wrap scf-wrap">
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

      <div className="scf-board">
        <div className="scf-grid">
          {SIGNALS.map(s => (
            <div
              key={s.num}
              className={`scf-cell scf-grp-${s.group} ${hot(s) ? 'scf-cell-on' : ''}`}
            >
              <span className="scf-num">{String(s.num).padStart(2, '0')}</span>
              <span className="scf-name">{s.name}</span>
              <span className="scf-desc">{s.desc}</span>
              <div className="scf-actions">
                {s.action.includes('core')   && <span className="scf-act scf-act-core">core</span>}
                {s.action.includes('term')   && <span className="scf-act scf-act-term">term</span>}
                {s.action.includes('ignore') && <span className="scf-act scf-act-ign">ignore</span>}
                {s.action.includes('stop')   && <span className="scf-act scf-act-stop">stop</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="scf-legend">
          {(Object.keys(GROUP_LABEL) as Group[]).map(g => (
            <div
              key={g}
              className={`scf-leg scf-grp-${g} ${current.highlight === g ? 'scf-leg-on' : ''}`}
            >
              {GROUP_LABEL[g]}
            </div>
          ))}
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
