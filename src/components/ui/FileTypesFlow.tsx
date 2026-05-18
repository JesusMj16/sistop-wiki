import { useEffect, useRef, useState } from 'react';
import './prose.css';

/**
 * Animación. Los cuatro tipos de archivos en Linux con su comportamiento real.
 * Cada paso enfoca un tipo y muestra cómo se accede en miniatura.
 */

type Kind = 'regular' | 'directory' | 'device' | 'pipe';

type Step = {
  title: string;
  focus: Kind;
  desc: string;
};

const STEPS: Step[] = [
  {
    title: 'Paso 0. Los cuatro tipos lado a lado',
    focus: 'regular',
    desc: 'Linux clasifica cada archivo en uno de cuatro tipos. Ordinario o regular para datos. Directorio para organizar otros archivos. Dispositivo o especial para hablar con hardware. Pipe o tubería para comunicar procesos. Todos comparten la misma estructura de inodo pero el kernel los trata distinto según el tipo. Vamos uno por uno.',
  },
  {
    title: 'Paso 1. Archivo ordinario. Arreglo lineal de bytes',
    focus: 'regular',
    desc: 'Un archivo regular es un arreglo lineal de bytes. Puedes leer, escribir, añadir al final, truncar. No puedes insertar en medio ni borrar bytes sueltos. La etiqueta ls -l muestra un guión en la primera columna. El nombre no vive aquí, vive en el directorio que lo lista.',
  },
  {
    title: 'Paso 2. Directorio. Tabla nombre → inodo',
    focus: 'directory',
    desc: 'Un directorio es un archivo cuyo contenido es una tabla de pares. Cada entrada tiene un nombre humano y el número del inodo asociado. El permiso de lectura te deja listar nombres. El permiso de escritura te deja crear o borrar entradas. El permiso de ejecución te deja buscar dentro y atravesarlo. Solo el kernel modifica directamente estos datos vía mknod, creat, link, unlink.',
  },
  {
    title: 'Paso 3. Dispositivo. Inodo con número mayor y menor',
    focus: 'device',
    desc: 'Un archivo de dispositivo no guarda bytes. Su inodo guarda dos números. Major identifica el tipo de driver, por ejemplo sd para SCSI/SATA. Minor identifica la unidad específica, por ejemplo la partición sda1. El kernel usa esos dos números para buscar dentro de su tabla de drivers la rutina correcta. Hay dos sabores. Modo bloque con buffer caché. Modo carácter sin caché.',
  },
  {
    title: 'Paso 4. Pipe. Datos transitorios FIFO entre procesos',
    focus: 'pipe',
    desc: 'Un pipe es como un archivo ordinario pero los datos son transitorios. Un proceso lo abre para escribir, otro lo abre para leer. Los bytes salen en el mismo orden en que entraron. El kernel maneja la sincronización. Los datos viven solo mientras alguien los esté usando. Usa solo entradas directas del inodo para los bloques, no apuntadores indirectos.',
  },
];

const AUTO_MS = 3200;

export function FileTypesFlow() {
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

  const isAll = step === 0;
  const focus = current.focus;

  function active(k: Kind) {
    return !isAll && focus === k;
  }

  return (
    <div className="zf-wrap ftf-wrap">
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

      <div className="ftf-board">
        {/* Regular file */}
        <div className={`ftf-card ftf-regular ${active('regular') ? 'ftf-card-on' : ''}`}>
          <div className="ftf-card-head">
            <span className="ftf-glyph">—</span>
            <span className="ftf-name">ordinario</span>
          </div>
          <div className="ftf-card-body">
            <div className="ftf-bytes">
              {'HOLA MUNDO'.split('').map((b, i) => (
                <span key={i} className="ftf-byte">{b === ' ' ? '·' : b}</span>
              ))}
            </div>
            <div className="ftf-note">arreglo lineal de bytes</div>
          </div>
        </div>

        {/* Directory */}
        <div className={`ftf-card ftf-directory ${active('directory') ? 'ftf-card-on' : ''}`}>
          <div className="ftf-card-head">
            <span className="ftf-glyph">d</span>
            <span className="ftf-name">directorio</span>
          </div>
          <div className="ftf-card-body">
            <table className="ftf-dir-table">
              <thead>
                <tr><th>nombre</th><th>inodo</th></tr>
              </thead>
              <tbody>
                <tr><td>.</td><td>128</td></tr>
                <tr><td>..</td><td>2</td></tr>
                <tr><td>notas.txt</td><td>4096</td></tr>
                <tr><td>fotos</td><td>5102</td></tr>
              </tbody>
            </table>
            <div className="ftf-note">tabla nombre → inodo</div>
          </div>
        </div>

        {/* Device */}
        <div className={`ftf-card ftf-device ${active('device') ? 'ftf-card-on' : ''}`}>
          <div className="ftf-card-head">
            <span className="ftf-glyph">c/b</span>
            <span className="ftf-name">dispositivo</span>
          </div>
          <div className="ftf-card-body">
            <div className="ftf-devnums">
              <div className="ftf-devbox">
                <span className="ftf-devlbl">MAJOR</span>
                <span className="ftf-devval">8</span>
                <span className="ftf-devsub">driver sd</span>
              </div>
              <div className="ftf-devbox">
                <span className="ftf-devlbl">MINOR</span>
                <span className="ftf-devval">1</span>
                <span className="ftf-devsub">/dev/sda1</span>
              </div>
            </div>
            <div className="ftf-note">major + minor → driver</div>
          </div>
        </div>

        {/* Pipe */}
        <div className={`ftf-card ftf-pipe ${active('pipe') ? 'ftf-card-on' : ''}`}>
          <div className="ftf-card-head">
            <span className="ftf-glyph">p</span>
            <span className="ftf-name">pipe</span>
          </div>
          <div className="ftf-card-body">
            <div className="ftf-pipe-flow">
              <span className="ftf-proc">W</span>
              <span className={`ftf-tube ${active('pipe') ? 'ftf-tube-on' : ''}`}>
                <span className="ftf-tube-bit">A</span>
                <span className="ftf-tube-bit">B</span>
                <span className="ftf-tube-bit">C</span>
                <span className="ftf-tube-arrow">▶</span>
              </span>
              <span className="ftf-proc">R</span>
            </div>
            <div className="ftf-note">FIFO entre procesos</div>
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
