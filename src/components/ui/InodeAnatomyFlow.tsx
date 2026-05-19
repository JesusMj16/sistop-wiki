import { useEffect, useRef, useState } from 'react';
import './prose.css';

/**
 * Animación. Anatomía de un inodo.
 * Muestra cómo open + stat caminan desde el nombre del archivo en un
 * directorio hasta el inodo y de ahí a los bloques de datos.
 */

type Step = {
  title: string;
  /** Qué resaltar en la lista de campos del inodo. */
  hot?: string[];
  /** Bandera visible. directorio recorrido, inodo leído, datos accedidos. */
  stage: 'dir' | 'inode' | 'data' | 'stat' | 'done';
  badge?: string;
  desc: string;
};

const INODE_FIELDS = [
  { key: 'mode',   label: 'st_mode',   value: '0100644 (regular)' },
  { key: 'uid',    label: 'st_uid',    value: '1000  (gcgero)' },
  { key: 'gid',    label: 'st_gid',    value: '1000  (gcgero)' },
  { key: 'nlink',  label: 'st_nlink',  value: '1     (enlaces duros)' },
  { key: 'size',   label: 'st_size',   value: '12384 bytes' },
  { key: 'blocks', label: 'st_blocks', value: '24    (bloques 512B)' },
  { key: 'atime',  label: 'st_atime',  value: '2026-05-17 18:42:11' },
  { key: 'mtime',  label: 'st_mtime',  value: '2026-05-17 17:01:09' },
  { key: 'ctime',  label: 'st_ctime',  value: '2026-05-17 17:01:09' },
  { key: 'ptrs',   label: 'block ptrs',value: '→ [4711, 4712, 4713, ...]' },
];

const STEPS: Step[] = [
  {
    title: 'Paso 1. open("/home/gcgero/notas.txt", O_RDONLY)',
    stage: 'dir',
    badge: 'recorre directorios',
    desc: 'Un proceso pide abrir un archivo por su ruta. El kernel no busca el archivo por su nombre directamente. Recorre el path componente a componente. Empieza en la raíz, abre el directorio /home, busca dentro la entrada gcgero, baja a ese directorio, busca notas.txt. Cada directorio es solo una tabla que mapea nombre a número de inodo.',
  },
  {
    title: 'Paso 2. Encontró número de inodo. Va a la tabla de inodos',
    stage: 'inode',
    badge: 'inodo #4096 localizado',
    desc: 'La entrada notas.txt en el directorio gcgero apunta al inodo número 4096. El kernel calcula en qué bloque del disco vive ese inodo dentro de la lista de inodos, lee el inodo (o lo encuentra ya cacheado en la tabla de inodos en memoria) y carga la estructura completa.',
  },
  {
    title: 'Paso 3. Anatomía del inodo. Permisos y propietario',
    stage: 'inode',
    hot: ['mode', 'uid', 'gid'],
    badge: 'st_mode, st_uid, st_gid',
    desc: 'Aquí están los campos de control de acceso. st_mode codifica el tipo de archivo en los bits altos y los permisos en los bits bajos. st_uid y st_gid identifican al dueño individual y al grupo. El kernel verifica que el proceso que llamó open tenga los permisos adecuados antes de continuar.',
  },
  {
    title: 'Paso 4. Anatomía del inodo. Enlaces y tamaño',
    stage: 'inode',
    hot: ['nlink', 'size', 'blocks'],
    badge: 'st_nlink, st_size, st_blocks',
    desc: 'st_nlink cuenta cuántos nombres en el filesystem apuntan a este mismo inodo. Si llega a cero y nadie lo tiene abierto, el inodo y sus bloques se liberan. st_size es el tamaño lógico del archivo en bytes. st_blocks es el espacio físico ocupado en unidades de 512 bytes. Para un archivo con huecos, st_size puede ser mayor que st_blocks por 512.',
  },
  {
    title: 'Paso 5. Anatomía del inodo. Marcas de tiempo',
    stage: 'inode',
    hot: ['atime', 'mtime', 'ctime'],
    badge: 'st_atime, st_mtime, st_ctime',
    desc: 'Tres relojes distintos. atime se actualiza en cada lectura. mtime cambia cuando se modifica el contenido. ctime cambia cuando se modifica el inodo en sí, por ejemplo al cambiar permisos. La diferencia entre mtime y ctime es sutil pero importante. Cambiar el dueño actualiza ctime pero no mtime, porque no se tocó el contenido.',
  },
  {
    title: 'Paso 6. El inodo apunta a los bloques de datos',
    stage: 'data',
    hot: ['ptrs'],
    badge: 'apuntadores directos e indirectos',
    desc: 'El campo crítico del inodo es la lista de apuntadores a bloques de datos. Los primeros apuntadores son directos. Cada uno señala un bloque del archivo. Cuando el archivo crece más allá de cierto tamaño, aparecen apuntadores indirectos que señalan a bloques de índice llenos de más apuntadores. Es como una jerarquía de árboles. Acá viven los bytes reales del archivo.',
  },
  {
    title: 'Paso 7. stat() copia el inodo a la estructura del usuario',
    stage: 'stat',
    hot: ['mode', 'uid', 'gid', 'nlink', 'size', 'blocks', 'atime', 'mtime', 'ctime'],
    badge: 'stat(path, &sb) / fstat(fd, &sb)',
    desc: 'Cuando un programa quiere ver estos metadatos sin abrir el archivo para leer su contenido, llama stat, fstat o lstat. El kernel copia los campos del inodo dentro de la estructura struct stat que tú pasaste. Después puedes inspeccionar st_mode con macros como S_ISREG o S_ISDIR para saber qué tipo de archivo es.',
  },
  {
    title: 'Paso 8. close. Inodo permanece en la tabla por si vuelve',
    stage: 'done',
    badge: 'close(fd). refcount baja',
    desc: 'Cuando el proceso cierra el archivo, el contador interno de la tabla de inodos en memoria baja una unidad. Si nadie más lo tiene abierto y nadie lo está modificando, eventualmente el writeback baja los cambios al disco y el inodo puede salir de la caché. Pero si pronto alguien lo vuelve a abrir, el kernel lo encuentra todavía cacheado y ahorra la lectura del disco.',
  },
];

const AUTO_MS = 3000;

export function InodeAnatomyFlow() {
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

  return (
    <div className="zf-wrap iaf-wrap">
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

      <div className="iaf-board">
        <div className="iaf-pipeline">
          <div className={`iaf-pill ${current.stage === 'dir' ? 'iaf-pill-on' : ''}`}>
            <span className="iaf-pill-tag">/home/gcgero/</span>
            <span className="iaf-pill-sub">recorre directorios</span>
          </div>
          <span className="iaf-arrow">▶</span>
          <div className={`iaf-pill ${current.stage === 'inode' || current.stage === 'stat' ? 'iaf-pill-on' : ''}`}>
            <span className="iaf-pill-tag">inodo #4096</span>
            <span className="iaf-pill-sub">tabla de inodos</span>
          </div>
          <span className="iaf-arrow">▶</span>
          <div className={`iaf-pill ${current.stage === 'data' ? 'iaf-pill-on' : ''}`}>
            <span className="iaf-pill-tag">bloques de datos</span>
            <span className="iaf-pill-sub">bytes reales del archivo</span>
          </div>
        </div>

        <div className="iaf-card">
          <div className="iaf-card-tag">struct stat · contenido del inodo</div>
          <div className="iaf-fields">
            {INODE_FIELDS.map(f => (
              <div
                key={f.key}
                className={`iaf-field ${current.hot?.includes(f.key) ? 'iaf-field-hot' : ''}`}
              >
                <span className="iaf-field-key">{f.label}</span>
                <span className="iaf-field-val">{f.value}</span>
              </div>
            ))}
          </div>
          {current.badge && <div className="iaf-badge">{current.badge}</div>}
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
