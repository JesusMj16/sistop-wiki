import { useEffect, useRef, useState } from 'react';
import './prose.css';

/**
 * Layout físico del disco UNIX. Cuatro zonas alineadas como cinta.
 * Animación recorre el flujo de lectura. Kernel ya tiene superbloque en RAM,
 * busca inodo, sigue puntero al área de datos, devuelve bytes.
 */

type Zone = 'boot' | 'super' | 'inodes' | 'data';

type Step = {
  title: string;
  active?: Zone;
  inodeIdx?: number;     // 0..7 dentro de la lista de inodos
  dataIdx?: number;      // 0..15 dentro del área de datos
  desc: string;
};

const STEPS: Step[] = [
  {
    title: 'Paso 0. Layout físico completo del disco',
    desc: 'Las cuatro zonas se acomodan consecutivamente. Boot ocupa el primer sector. Superbloque ocupa el siguiente. La lista de inodos toma un número fijo de bloques pequeño. El área de datos absorbe el resto del disco. Esta cinta horizontal representa la totalidad de la partición. Cada celda es un bloque.',
  },
  {
    title: 'Paso 1. El kernel ya tiene el superbloque en RAM',
    active: 'super',
    desc: 'Al montar el FS, el kernel leyó el superbloque del disco y lo dejó en RAM. Conoce el tamaño, las listas de bloques libres, el origen y tamaño de la lista de inodos. No necesita volver a leerlo en cada operación. La zona del superbloque queda iluminada como referencia, pero la lectura real ocurre en memoria.',
  },
  {
    title: 'Paso 2. El proceso pide leer un archivo. Buscamos su inodo',
    active: 'inodes',
    inodeIdx: 4,
    desc: 'El proceso de usuario llamó open seguido de read sobre un archivo. El kernel ya tradujo el path hasta encontrar el número de inodo. Ahora salta a la zona de lista de inodos del disco para cargar esa estructura completa. Aquí está el inodo número 4 con todos los campos del archivo. Permisos, dueño, tamaño, punteros.',
  },
  {
    title: 'Paso 3. El inodo apunta a un bloque del área de datos',
    active: 'inodes',
    inodeIdx: 4,
    dataIdx: 9,
    desc: 'Dentro del inodo número 4 hay un campo con apuntadores directos a bloques de datos. Uno de esos punteros señala al bloque 9 del área de datos. El kernel toma esa dirección y la mantiene lista para la siguiente lectura. La lista de inodos sigue iluminada porque la información viene de ahí.',
  },
  {
    title: 'Paso 4. Lectura de los bytes desde el área de datos',
    active: 'data',
    dataIdx: 9,
    desc: 'El kernel pide al driver del dispositivo el contenido del bloque 9. Los bytes viajan del disco a un buffer en RAM. De ahí se copian al buffer que el proceso pasó como argumento de read. La syscall retorna el número de bytes leídos. Para el proceso fue una línea de C. Para el kernel fue un viaje completo por las cuatro zonas.',
  },
];

const AUTO_MS = 2800;

export function DiskLayoutFlow() {
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

  function zoneClass(z: Zone) {
    return `dlf-zone dlf-zone-${z} ${current.active === z ? 'dlf-zone-on' : ''}`;
  }

  return (
    <div className="zf-wrap dlf-wrap">
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

      <div className="dlf-board">
        {/* The ribbon of four zones */}
        <div className="dlf-ribbon">
          <div className={zoneClass('boot')}>
            <span className="dlf-zone-tag">BOOT</span>
            <span className="dlf-zone-sub">1 sector</span>
          </div>
          <div className={zoneClass('super')}>
            <span className="dlf-zone-tag">SUPERBLOQUE</span>
            <span className="dlf-zone-sub">1 bloque</span>
          </div>
          <div className={zoneClass('inodes')}>
            <span className="dlf-zone-tag">LISTA DE INODOS</span>
            <div className="dlf-mini-cells">
              {Array.from({ length: 8 }).map((_, i) => (
                <span
                  key={i}
                  className={`dlf-cell ${current.inodeIdx === i ? 'dlf-cell-hot' : ''}`}
                >{i}</span>
              ))}
            </div>
          </div>
          <div className={zoneClass('data')}>
            <span className="dlf-zone-tag">ÁREA DE DATOS</span>
            <div className="dlf-mini-cells dlf-mini-cells-wide">
              {Array.from({ length: 16 }).map((_, i) => (
                <span
                  key={i}
                  className={`dlf-cell ${current.dataIdx === i ? 'dlf-cell-hot' : ''}`}
                >{i}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Flying pointer from inode to data block */}
        {current.inodeIdx !== undefined && current.dataIdx !== undefined && (
          <div className="dlf-pointer">
            inodo #{current.inodeIdx} → bloque de datos #{current.dataIdx}
          </div>
        )}
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
