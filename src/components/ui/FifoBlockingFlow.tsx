import { useEffect, useRef, useState } from 'react';
import './prose.css';

/**
 * Animación paso a paso del rendezvous bloqueante de un FIFO con nombre.
 * Muestra cómo open() bloquea hasta que el otro extremo aparezca,
 * cómo los bytes fluyen por el buffer del kernel, y cómo el close() libera.
 *
 * Reutiliza el chrome .zf-* y .wt-* del resto de visualizaciones brutalistas
 * para mantener consistencia. Añade lane específica .fbf-pipe que dibuja
 * la tubería del kernel y los bytes que viajan dentro.
 */

type EndState = 'absent' | 'blocked' | 'open' | 'closing' | 'closed';

type Step = {
  title: string;
  writer: EndState;
  reader: EndState;
  /** Bytes visibles dentro del buffer del kernel (0..PIPE_BUF). */
  buffer: string[];
  /** Indica si los bytes se mueven hacia el lector (flujo activo). */
  flowing: boolean;
  /** Líneas del snippet C destacadas en este paso. */
  highlight: number[];
  desc: string;
};

const STEPS: Step[] = [
  {
    title: 'Paso 1 — Plantamos el buzón con mkfifo()',
    writer: 'absent',
    reader: 'absent',
    buffer: [],
    flowing: false,
    highlight: [4],
    desc: 'El programa llama mkfifo("namepipe", 0666) y el kernel crea un archivo nuevo de tipo p (pipe) en el sistema de archivos. Imagínalo como instalar un buzón vacío en la entrada del edificio: existe, tiene dirección, pero todavía nadie lo está usando. El tubo del kernel está reservado, dormido, esperando inquilinos.',
  },
  {
    title: 'Paso 2 — El escritor toca la puerta y se queda esperando',
    writer: 'blocked',
    reader: 'absent',
    buffer: [],
    flowing: false,
    highlight: [6],
    desc: 'El proceso escritor ejecuta open("namepipe", O_WRONLY) pidiendo el extremo de escritura. El kernel mira si hay alguien leyendo del otro lado; como no hay nadie, lo manda a dormir. La barra rayada amarilla simboliza ese estado: el proceso existe, pero está congelado dentro de open(), no avanza una línea más de código hasta que aparezca un lector. Es como apretar el botón de hablar de un walkie-talkie sin que nadie tenga el suyo encendido.',
  },
  {
    title: 'Paso 3 — Llega el lector y se produce el RENDEZVOUS',
    writer: 'open',
    reader: 'open',
    buffer: [],
    flowing: false,
    highlight: [10],
    desc: 'En este momento el proceso lector ejecuta open("namepipe", O_RDONLY). El kernel detecta el par completo (escritor + lector) y libera a los dos open() al mismo tiempo. Ambas barras pasan de amarillo a verde: los dos procesos despiertan en el mismo instante con sus descriptores listos. A esa sincronización exacta se le llama rendezvous — los dos lados acuerdan estar abiertos antes de que fluya un solo byte.',
  },
  {
    title: 'Paso 4 — El escritor mete los bytes con write()',
    writer: 'open',
    reader: 'open',
    buffer: ['H', 'O', 'L', 'A'],
    flowing: false,
    highlight: [7],
    desc: 'Con el canal abierto en ambos extremos, el escritor llama write(fd, "HOLA", 4). El kernel copia esos 4 bytes desde la memoria del proceso escritor a su buffer interno (la zona azulada del centro). Los cuadros con letras H-O-L-A son cada byte en su lugar dentro del buffer. Importante: los datos viven en RAM del kernel, no en disco; el archivo en /tmp solo es la dirección.',
  },
  {
    title: 'Paso 5 — El lector drena el buffer con read()',
    writer: 'open',
    reader: 'open',
    buffer: ['H', 'O', 'L', 'A'],
    flowing: true,
    highlight: [11],
    desc: 'El lector llama read(fd, buf, 4). Ves los bytes deslizarse hacia la derecha y las flechas verdes parpadeando: es el kernel copiando los datos del buffer interno al buffer del proceso lector. Llegan exactamente en el orden H-O-L-A — eso es lo que significa FIFO. Si el buffer estuviera vacío y el escritor todavía abierto, read() también bloquearía esperando datos.',
  },
  {
    title: 'Paso 6 — El escritor cierra; el lector verá EOF',
    writer: 'closing',
    reader: 'open',
    buffer: [],
    flowing: false,
    highlight: [8],
    desc: 'El escritor termina su trabajo y llama close(fd). La barra del escritor se pone roja: ese extremo ya no existe. El kernel marca la tubería como "sin escritores". La próxima vez que el lector llame read() y el buffer esté vacío, recibirá 0 bytes — la señal POSIX clásica de fin de archivo (EOF). El lector así sabe que no van a venir más datos.',
  },
  {
    title: 'Paso 7 — El lector también cierra; canal libre',
    writer: 'closed',
    reader: 'closed',
    buffer: [],
    flowing: false,
    highlight: [12],
    desc: 'El lector llama close(fd) y libera su descriptor. Ya nadie tiene la tubería abierta: el contador de referencias del kernel llega a cero, los buffers internos se descartan. El archivo "namepipe" sigue ahí en el FS (visible con ls -l), listo para reutilizarse en otra corrida; si llamas unlink("namepipe") desaparece también del directorio. Fin del ciclo de vida.',
  },
];

const CODE = [
  '#include <fcntl.h>',
  '#include <sys/stat.h>',
  '',
  '/* el creador */',
  'mkfifo("namepipe", 0666);',
  '/* el escritor */',
  'fd = open("namepipe", O_WRONLY);  /* bloquea */',
  'write(fd, "HOLA", 4);',
  'close(fd);',
  '/* el lector */',
  'fd = open("namepipe", O_RDONLY);  /* bloquea */',
  'read(fd, buf, 4);',
  'close(fd);',
];

const STATE_LABEL: Record<EndState, string> = {
  absent: '— sin abrir',
  blocked: 'BLOQUEADO en open()',
  open: 'open() OK',
  closing: 'close()',
  closed: 'cerrado',
};

const AUTO_MS = 2600;

export function FifoBlockingFlow() {
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

  const writerAlive = current.writer === 'open' || current.writer === 'closing';
  const readerAlive = current.reader === 'open';

  return (
    <div className="zf-wrap fbf-wrap">
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

      <div className="zf-grid fbf-grid">
        <div className="zf-stage fbf-stage">
          {/* Escritor */}
          <div className={`wt-lane fbf-end fbf-end-writer fbf-end-${current.writer}`}>
            <div className="wt-lane-head">
              <span className="wt-lane-name">escritor</span>
              <span className="wt-lane-pid">O_WRONLY</span>
            </div>
            <div className="wt-lane-track">
              <div className="wt-lane-bar" />
              <div className="wt-lane-state">{STATE_LABEL[current.writer]}</div>
              {current.writer === 'blocked' && <div className="wt-zzz">z z z</div>}
              {current.writer === 'closing' && <div className="fbf-x">✕</div>}
            </div>
          </div>

          {/* Tubería del kernel */}
          <div className={`fbf-pipe ${writerAlive && readerAlive ? 'fbf-pipe-live' : ''}`}>
            <div className="fbf-pipe-tag">KERNEL · /tmp/namepipe</div>
            <div className="fbf-pipe-body">
              <div className="fbf-pipe-cap fbf-pipe-cap-l" />
              <div className="fbf-pipe-tube">
                <div className={`fbf-buffer ${current.flowing ? 'fbf-buffer-flow' : ''}`}>
                  {current.buffer.length === 0 && (
                    <span className="fbf-buffer-empty">{readerAlive || writerAlive ? 'buffer vacío' : 'tubería dormida'}</span>
                  )}
                  {current.buffer.map((byte, i) => (
                    <span
                      key={`${step}-${i}`}
                      className="fbf-byte"
                      style={{ ['--i' as string]: i, ['--n' as string]: current.buffer.length } as React.CSSProperties}
                    >
                      {byte}
                    </span>
                  ))}
                </div>
                <div className={`fbf-arrow ${current.flowing ? 'fbf-arrow-on' : ''}`} aria-hidden="true">
                  <span>›</span><span>›</span><span>›</span>
                </div>
              </div>
              <div className="fbf-pipe-cap fbf-pipe-cap-r" />
            </div>
            <div className="fbf-pipe-legend">
              <span className={`fbf-leg fbf-leg-w ${writerAlive ? 'fbf-leg-on' : ''}`}>W</span>
              <span className="fbf-leg-line" />
              <span className={`fbf-leg fbf-leg-r ${readerAlive ? 'fbf-leg-on' : ''}`}>R</span>
            </div>
          </div>

          {/* Lector */}
          <div className={`wt-lane fbf-end fbf-end-reader fbf-end-${current.reader}`}>
            <div className="wt-lane-head">
              <span className="wt-lane-name">lector</span>
              <span className="wt-lane-pid">O_RDONLY</span>
            </div>
            <div className="wt-lane-track">
              <div className="wt-lane-bar" />
              <div className="wt-lane-state">{STATE_LABEL[current.reader]}</div>
              {current.reader === 'blocked' && <div className="wt-zzz">z z z</div>}
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
