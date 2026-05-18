import { useEffect, useRef, useState } from 'react';
import './prose.css';

/**
 * Animación. Sincronización del superbloque entre RAM y disco.
 * Muestra qué pasa cuando el kernel modifica metadatos del FS en su
 * copia en memoria, cómo los hilos writeback los bajan al disco, y por
 * qué sync/syncfs/shutdown son necesarios.
 */

type Step = {
  title: string;
  /** Valor "free blocks" visible en la copia RAM. */
  ramFree: number;
  /** Valor en disco. */
  diskFree: number;
  /** Flag dirty (modificado pero no escrito). */
  dirty: boolean;
  /** Quién está actuando: kernel, writeback, sync, shutdown, mount, umount. */
  actor: 'idle' | 'kernel' | 'writeback' | 'sync' | 'shutdown' | 'mount' | 'umount';
  /** Mensaje corto sobre la pantalla. */
  badge?: string;
  desc: string;
};

const STEPS: Step[] = [
  {
    title: 'Paso 1. Sistema arranca. Kernel carga superbloque a RAM',
    ramFree: 8421,
    diskFree: 8421,
    dirty: false,
    actor: 'mount',
    badge: 'mount("/dev/sda1", "/", "ext4", 0, NULL)',
    desc: 'Al montar el sistema de archivos, el kernel lee el superbloque del disco y lo coloca en RAM como caché. Ambas copias son idénticas. El programa de usuario invoca mount con privilegios CAP_SYS_ADMIN. A partir de aquí toda consulta de metadatos pasa por la copia en memoria, no por el disco. Diez veces más rápido.',
  },
  {
    title: 'Paso 2. Se crea un archivo. La copia en RAM se modifica',
    ramFree: 8419,
    diskFree: 8421,
    dirty: true,
    actor: 'kernel',
    badge: 'creat("nuevo.txt", 0644)',
    desc: 'Un proceso crea un archivo nuevo. El kernel reserva 2 bloques del área de datos. La copia del superbloque en RAM resta esos bloques de su contador de libres. Pero la copia en disco sigue sin enterarse. El kernel activa la bandera dirty que dice este superbloque tiene cambios pendientes de escribir.',
  },
  {
    title: 'Paso 3. Más cambios se acumulan en RAM',
    ramFree: 8403,
    diskFree: 8421,
    dirty: true,
    actor: 'kernel',
    badge: '16 bloques más reservados',
    desc: 'Más procesos escriben. Más metadatos cambian. La RAM acumula docenas de operaciones pendientes sin que el disco se entere. Si en este momento se va la luz, todos esos cambios se pierden. Esta ventana de inconsistencia es el precio que se paga por la velocidad del caching agresivo.',
  },
  {
    title: 'Paso 4. Hilo writeback del kernel despierta y baja datos',
    ramFree: 8403,
    diskFree: 8403,
    dirty: false,
    actor: 'writeback',
    badge: 'sync_supers / sync_filesystems',
    desc: 'El kernel mantiene hilos internos como sync_supers y sync_filesystems que despiertan periódicamente. Toman los superbloques dirty, los escriben al disco, y limpian la bandera. Es la red de seguridad que evita perder demasiado en un crash. Tras este paso, RAM y disco vuelven a coincidir.',
  },
  {
    title: 'Paso 5. Más operaciones. RAM se vuelve a desincronizar',
    ramFree: 8395,
    diskFree: 8403,
    dirty: true,
    actor: 'kernel',
    badge: '8 bloques más reservados',
    desc: 'El ciclo se repite. Nuevas operaciones. RAM dirty otra vez. El disco queda 8 unidades atrás. Si un programa de usuario quiere forzar la bajada inmediata sin esperar al próximo writeback, tiene tres herramientas a su disposición. sync, syncfs y shutdown.',
  },
  {
    title: 'Paso 6. Programa usuario llama sync para forzar la bajada',
    ramFree: 8395,
    diskFree: 8395,
    dirty: false,
    actor: 'sync',
    badge: 'sync() / syncfs(fd)',
    desc: 'La llamada sync baja TODOS los metadatos y datos cacheados al disco. La llamada syncfs hace lo mismo pero solo para el sistema de archivos que contiene el descriptor fd. Después de cualquiera de las dos, RAM y disco están en sincronía absoluta. sync nunca falla. syncfs puede fallar si fd no es válido y deja la causa en errno.',
  },
  {
    title: 'Paso 7. shutdown ordenado. Última sincronización antes de apagar',
    ramFree: 8395,
    diskFree: 8395,
    dirty: false,
    actor: 'shutdown',
    badge: 'shutdown ejecutado',
    desc: 'El programa shutdown del sistema operativo se encarga de hacer la sincronización final antes de apagar. Recorre todos los sistemas de archivos montados, baja sus superbloques y tablas de inodos al disco, y solo entonces permite cortar la energía. Esto garantiza que al siguiente arranque no haya inconsistencias.',
  },
  {
    title: 'Paso 8. umount desmonta limpiamente',
    ramFree: 0,
    diskFree: 8395,
    dirty: false,
    actor: 'umount',
    badge: 'umount("/dev/sda1")',
    desc: 'Para retirar un sistema de archivos en caliente se usa umount o umount2. El kernel hace una sincronización final, escribe el superbloque definitivo al disco, libera la copia en RAM y suelta el dispositivo. Después de esto el disco puede desconectarse físicamente sin riesgo de corrupción.',
  },
];

const AUTO_MS = 3000;

export function SuperblockSyncFlow() {
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

  const inSync = current.ramFree === current.diskFree;

  return (
    <div className="zf-wrap ssf-wrap">
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

      <div className="ssf-board">
        <div className={`ssf-side ssf-ram ${current.actor === 'kernel' ? 'ssf-side-hot' : ''}`}>
          <div className="ssf-side-tag">RAM · copia caché del superbloque</div>
          <div className={`ssf-block ${current.dirty ? 'ssf-block-dirty' : 'ssf-block-clean'}`}>
            <div className="ssf-field"><span>tamaño FS</span><span>500 GB</span></div>
            <div className="ssf-field"><span>bloques libres</span><span className="ssf-hot">{current.ramFree}</span></div>
            <div className="ssf-field"><span>inodos libres</span><span>120384</span></div>
            <div className="ssf-flag">
              flag dirty: <span className={current.dirty ? 'ssf-on' : 'ssf-off'}>{current.dirty ? 'TRUE' : 'false'}</span>
            </div>
          </div>
          {current.actor === 'kernel' && current.ramFree === 0 ? null : (
            <div className="ssf-side-foot">
              {current.actor === 'umount' && current.ramFree === 0 ? 'caché liberado' : 'modificable al instante'}
            </div>
          )}
        </div>

        <div className={`ssf-bridge ssf-bridge-${current.actor}`}>
          <div className="ssf-bridge-tag">{current.badge || '—'}</div>
          <div className="ssf-bridge-pipe">
            {current.actor === 'writeback' || current.actor === 'sync' || current.actor === 'shutdown' || current.actor === 'umount' ? (
              <span className="ssf-bridge-flow">▼▼▼ writeback ▼▼▼</span>
            ) : current.actor === 'mount' ? (
              <span className="ssf-bridge-flow ssf-bridge-up">▲▲▲ load to RAM ▲▲▲</span>
            ) : (
              <span className="ssf-bridge-idle">{inSync ? 'sincronizado' : 'desincronizado'}</span>
            )}
          </div>
          <div className={`ssf-bridge-status ${inSync ? 'ssf-status-ok' : 'ssf-status-bad'}`}>
            Δ libres = {Math.abs(current.ramFree - current.diskFree)}
          </div>
        </div>

        <div className={`ssf-side ssf-disk ${current.actor === 'writeback' || current.actor === 'sync' || current.actor === 'shutdown' || current.actor === 'umount' ? 'ssf-side-hot' : ''}`}>
          <div className="ssf-side-tag">DISCO · superbloque persistente</div>
          <div className="ssf-block ssf-block-disk">
            <div className="ssf-field"><span>tamaño FS</span><span>500 GB</span></div>
            <div className="ssf-field"><span>bloques libres</span><span className="ssf-hot">{current.diskFree}</span></div>
            <div className="ssf-field"><span>inodos libres</span><span>120384</span></div>
            <div className="ssf-flag">
              respaldo: <span className="ssf-on">3 copias</span>
            </div>
          </div>
          <div className="ssf-side-foot">verdad persistente</div>
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
