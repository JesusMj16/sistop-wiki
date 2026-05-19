import { useEffect, useRef, useState } from 'react';
import './prose.css';

/**
 * Animación. Compara cómo viajan los datos por un dispositivo de BLOQUE
 * (con buffer caché del kernel) vs un dispositivo de CARÁCTER (sin caché).
 */

type Mode = 'block' | 'char';

type Step = {
  title: string;
  focus: Mode;
  /** indica si el byte/buffer viajan en este paso */
  active: boolean;
  /** indica si la caché se usó */
  cacheHit?: boolean;
  desc: string;
};

const STEPS: Step[] = [
  {
    title: 'Paso 0. Dos caminos lado a lado',
    focus: 'block',
    active: false,
    desc: 'Linux clasifica los dispositivos en dos sabores. Modo bloque trabaja con paquetes fijos de 512 bytes mínimo y usa un buffer caché del kernel. Modo carácter trabaja byte por byte sin caché. Discos y memorias USB son de bloque. Teclados, terminales, impresoras y tarjetas de red son de carácter. La diferencia decide la velocidad y la complejidad.',
  },
  {
    title: 'Paso 1. Modo BLOQUE. Lectura entra al buffer caché',
    focus: 'block',
    active: true,
    cacheHit: false,
    desc: 'Un proceso pide leer un sector del disco. El kernel revisa primero su buffer caché. La primera vez no está, así que baja al driver, lee el sector entero del hardware, lo guarda en caché y entrega los bytes al proceso. Una transferencia física por bloque completo.',
  },
  {
    title: 'Paso 2. Modo BLOQUE. Segunda lectura. Cache hit instantáneo',
    focus: 'block',
    active: true,
    cacheHit: true,
    desc: 'El mismo proceso, o cualquier otro, vuelve a pedir el mismo sector. El kernel encuentra los bytes ya en caché. Entrega inmediato sin tocar el hardware. Esa es la magia del buffer caché. Lectura en RAM en lugar de disco. Diez veces más rápido.',
  },
  {
    title: 'Paso 3. Modo CARÁCTER. Byte por byte sin caché',
    focus: 'char',
    active: true,
    desc: 'Un proceso lee de la terminal. Cada pulsación del teclado es un byte que el kernel pasa directo al proceso. No hay caché que tenga sentido aquí. Cada byte es único en el tiempo, no se va a repetir. La velocidad es baja pero la latencia también, no hay intermediario. Mismo modelo para impresoras, sockets, puertos serie.',
  },
];

const AUTO_MS = 3000;

export function IoDeviceFlow() {
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

  const blockOn = current.focus === 'block' && current.active;
  const charOn  = current.focus === 'char'  && current.active;

  return (
    <div className="zf-wrap iof-wrap">
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

      <div className="iof-board">
        {/* BLOCK lane */}
        <div className={`iof-lane iof-lane-block ${blockOn ? 'iof-lane-on' : ''}`}>
          <div className="iof-lane-tag">MODO BLOQUE · /dev/sda</div>
          <div className="iof-pipeline">
            <div className="iof-node iof-proc">proceso</div>
            <span className={`iof-flow ${blockOn ? 'iof-flow-on' : ''}`}>▶</span>
            <div className={`iof-node iof-cache ${current.cacheHit === true ? 'iof-cache-hit' : current.cacheHit === false ? 'iof-cache-miss' : ''}`}>
              buffer caché
              {current.cacheHit === true && <span className="iof-tag-hit">HIT</span>}
              {current.cacheHit === false && <span className="iof-tag-miss">MISS</span>}
            </div>
            <span className={`iof-flow ${blockOn && current.cacheHit === false ? 'iof-flow-on' : 'iof-flow-dim'}`}>▶</span>
            <div className={`iof-node iof-hw iof-hw-block ${blockOn && current.cacheHit === false ? 'iof-hw-on' : ''}`}>disco físico</div>
          </div>
          <div className="iof-blocks">
            {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
              <span
                key={i}
                className={`iof-block-cell ${blockOn && i < 4 ? 'iof-block-on' : ''}`}
              >512B</span>
            ))}
          </div>
          <div className="iof-note">unidad mínima 512 bytes. transferencia por sectores</div>
        </div>

        {/* CHAR lane */}
        <div className={`iof-lane iof-lane-char ${charOn ? 'iof-lane-on' : ''}`}>
          <div className="iof-lane-tag">MODO CARÁCTER · /dev/tty1</div>
          <div className="iof-pipeline">
            <div className="iof-node iof-proc">proceso</div>
            <span className={`iof-flow ${charOn ? 'iof-flow-on' : ''}`}>▶</span>
            <div className="iof-node iof-nocache">sin caché</div>
            <span className={`iof-flow ${charOn ? 'iof-flow-on' : ''}`}>▶</span>
            <div className={`iof-node iof-hw iof-hw-char ${charOn ? 'iof-hw-on' : ''}`}>terminal / red</div>
          </div>
          <div className="iof-bytes">
            {'HOLA'.split('').map((b, i) => (
              <span key={i} className={`iof-byte ${charOn ? 'iof-byte-on' : ''}`}>{b}</span>
            ))}
          </div>
          <div className="iof-note">byte por byte. baja velocidad pero latencia mínima</div>
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
