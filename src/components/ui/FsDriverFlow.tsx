import { useEffect, useRef, useState } from 'react';
import './prose.css';

/**
 * Animación. Traducción de una petición lógica del kernel a posición física
 * en el disco. Muestra cómo el número MAYOR selecciona el driver y el número
 * MENOR selecciona el sub-dispositivo.
 */

type Layer = 'user' | 'vfs' | 'fs' | 'table' | 'driver' | 'hw' | 'done';

type Step = {
  title: string;
  active: Layer;
  desc: string;
  /** Texto del "paquete" que viaja por la pila. */
  payload?: string;
  /** Fila resaltada en la tabla de drivers. */
  hotMajor?: number;
  /** Partición resaltada dentro del driver. */
  hotMinor?: number;
  /** Coordenadas físicas finales que se muestran al final. */
  physical?: { plate: number; track: number; sector: number; offset: number };
};

const DRIVER_TABLE = [
  { major: 1,  driver: 'mem',    note: '/dev/mem, /dev/null, /dev/zero' },
  { major: 4,  driver: 'tty',    note: 'terminales virtuales' },
  { major: 7,  driver: 'loop',   note: 'dispositivos de bucle' },
  { major: 8,  driver: 'sd',     note: 'SCSI/SATA/USB block storage' },
  { major: 11, driver: 'sr',     note: 'CD/DVD-ROM' },
  { major: 254,driver: 'nvme',   note: 'NVMe SSDs' },
];

const STEPS: Step[] = [
  {
    title: 'Paso 1. Un proceso de usuario llama read',
    active: 'user',
    payload: 'read(fd, buf, 1024)',
    desc: 'Un proceso cualquiera de espacio de usuario invoca la llamada al sistema read pidiendo 1024 bytes de un descriptor de archivo. El proceso no sabe en qué disco vive el archivo, ni en qué tipo de hardware. Solo sabe el descriptor que open le devolvió antes. La syscall cruza la frontera kernel.',
  },
  {
    title: 'Paso 2. La VFS recibe la petición',
    active: 'vfs',
    payload: 'leer 1024 bytes',
    desc: 'La Virtual File System Switch es la capa de abstracción que unifica todos los sistemas de archivos. Recibe la petición del proceso y descubre, a través de la tabla de archivos abiertos, que el descriptor fd está respaldado por un inodo en una partición formateada como ext4. Despacha la operación a ese sistema de archivos concreto.',
  },
  {
    title: 'Paso 3. ext4 traduce a bloque lógico',
    active: 'fs',
    payload: 'bloque lógico 4711',
    desc: 'El módulo ext4 mira el inodo del archivo, calcula a qué bloque lógico del filesystem corresponde el offset solicitado, y descubre que es el bloque 4711. Pero ese bloque lógico todavía no es una posición física en el plato. ext4 también sabe en qué dispositivo de bloque vive su partición. Los identificadores son número mayor igual a 8 y número menor igual a 1.',
  },
  {
    title: 'Paso 4. Tabla de drivers indexada por NÚMERO MAYOR',
    active: 'table',
    payload: 'busca major = 8',
    hotMajor: 8,
    desc: 'El kernel mantiene una tabla global donde cada entrada asocia un número mayor con un driver. El sistema entra a la tabla, busca la fila con major igual a 8, y encuentra el driver sd. Ese driver es el que maneja todos los dispositivos de bloque SCSI, SATA y USB. La selección del driver es directa, en tiempo constante.',
  },
  {
    title: 'Paso 5. El driver sd recibe la petición',
    active: 'driver',
    payload: 'leer bloque 4711, minor = 1',
    hotMajor: 8,
    hotMinor: 1,
    desc: 'El driver sd recibe la petición. Ahora usa el NÚMERO MENOR para decidir cuál de los dispositivos que maneja es el destino real. Minor igual a 1 corresponde a /dev/sda1, la primera partición del primer disco SATA. El driver consulta su tabla interna de geometría y traduce el bloque lógico 4711 a coordenadas físicas reales.',
  },
  {
    title: 'Paso 6. Aterrizaje en el hardware',
    active: 'hw',
    payload: 'plato 0 / pista 12345 / sector 67',
    hotMajor: 8,
    hotMinor: 1,
    physical: { plate: 0, track: 12345, sector: 67, offset: 0 },
    desc: 'El driver envía comandos al controlador físico del disco. Plato 0, pista 12345, sector 67, offset 0. El cabezal se mueve, el plato gira, los bytes se leen. Si fuera un SSD, esto sería una dirección de página dentro de un chip NAND. Si fuera USB, sería una transferencia de bloque por el bus. La beauty está en que la capa superior nunca se entera del cambio. Solo el driver.',
  },
  {
    title: 'Paso 7. Los bytes regresan por el mismo camino',
    active: 'done',
    payload: '1024 bytes leídos',
    hotMajor: 8,
    hotMinor: 1,
    desc: 'El driver entrega los bytes al filesystem ext4. ext4 los entrega a la VFS. La VFS los copia al buffer del proceso usuario. La syscall read retorna el número de bytes leídos. Para el proceso fue una sola línea de C. Para el kernel fue un viaje completo por seis capas y dos índices, mayor y menor, que separaron limpiamente la abstracción lógica del hardware físico.',
  },
];

const AUTO_MS = 3000;

export function FsDriverFlow() {
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

  function isActive(layer: Layer) {
    return current.active === layer || (current.active === 'done' && layer !== 'user');
  }
  function isPast(layer: Layer) {
    const order: Layer[] = ['user', 'vfs', 'fs', 'table', 'driver', 'hw', 'done'];
    return order.indexOf(layer) < order.indexOf(current.active);
  }

  function Layer({ id, title, sub }: { id: Layer; title: string; sub?: string }) {
    const active = isActive(id);
    const past = isPast(id);
    return (
      <div className={`fdf-layer ${active ? 'fdf-layer-on' : past ? 'fdf-layer-past' : ''}`}>
        <div className="fdf-layer-head">
          <span className="fdf-layer-tag">{id.toUpperCase()}</span>
          <span className="fdf-layer-title">{title}</span>
        </div>
        {sub && <div className="fdf-layer-sub">{sub}</div>}
        {active && current.payload && id === current.active && (
          <div className="fdf-payload">{current.payload}</div>
        )}
      </div>
    );
  }

  function Arrow({ to }: { to: Layer }) {
    const lit = isPast(to) || current.active === to;
    return <div className={`fdf-arrow ${lit ? 'fdf-arrow-on' : ''}`} aria-hidden="true">▼</div>;
  }

  return (
    <div className="zf-wrap fdf-wrap">
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

      <div className="fdf-board">
        <div className="fdf-stack">
          <Layer id="user"   title="Proceso usuario"  sub="syscall read()" />
          <Arrow to="vfs" />
          <Layer id="vfs"    title="VFS · Virtual File System" sub="capa de abstracción común" />
          <Arrow to="fs" />
          <Layer id="fs"     title="ext4 filesystem" sub="traduce inodo a bloque lógico" />
          <Arrow to="table" />
          <Layer id="table"  title="Tabla de drivers del kernel" sub="indexada por NÚMERO MAYOR" />
          <Arrow to="driver" />
          <Layer id="driver" title="Driver sd" sub="usa NÚMERO MENOR" />
          <Arrow to="hw" />
          <Layer id="hw"     title="Hardware físico" sub="plato, pista, sector" />
        </div>

        <div className="fdf-side">
          <div className={`fdf-card fdf-table ${current.active === 'table' || current.active === 'driver' || current.active === 'hw' || current.active === 'done' ? 'fdf-card-on' : ''}`}>
            <div className="fdf-card-tag">Tabla MAYOR → Driver</div>
            <div className="fdf-table-rows">
              {DRIVER_TABLE.map(row => (
                <div
                  key={row.major}
                  className={`fdf-table-row ${current.hotMajor === row.major ? 'fdf-table-row-hot' : ''}`}
                >
                  <span className="fdf-major">{row.major}</span>
                  <span className="fdf-drv">{row.driver}</span>
                  <span className="fdf-note">{row.note}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={`fdf-card fdf-minor ${current.active === 'driver' || current.active === 'hw' || current.active === 'done' ? 'fdf-card-on' : ''}`}>
            <div className="fdf-card-tag">Driver sd · MENOR → partición</div>
            <div className="fdf-minor-grid">
              {[0, 1, 2, 3].map(m => (
                <div
                  key={m}
                  className={`fdf-minor-cell ${current.hotMinor === m ? 'fdf-minor-cell-hot' : ''}`}
                >
                  <span className="fdf-minor-id">menor {m}</span>
                  <span className="fdf-minor-dev">/dev/sda{m === 0 ? '' : m}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={`fdf-card fdf-phys ${current.physical ? 'fdf-card-on' : ''}`}>
            <div className="fdf-card-tag">Disco físico</div>
            <div className="fdf-disk">
              <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet" className="fdf-disk-svg">
                <circle cx="100" cy="100" r="92" className="fdf-disk-platter" />
                <circle cx="100" cy="100" r="60" className="fdf-disk-track" />
                <circle cx="100" cy="100" r="36" className="fdf-disk-spindle" />
                {current.physical && (
                  <>
                    <line x1="100" y1="100" x2="160" y2="40" className="fdf-disk-arm" />
                    <circle cx="160" cy="40" r="6" className="fdf-disk-head" />
                    <circle cx="148" cy="52" r="4" className="fdf-disk-sector" />
                  </>
                )}
              </svg>
              {current.physical && (
                <div className="fdf-coords">
                  <span>plato {current.physical.plate}</span>
                  <span>pista {current.physical.track}</span>
                  <span>sector {current.physical.sector}</span>
                  <span>offset {current.physical.offset}</span>
                </div>
              )}
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
