import { useEffect, useRef, useState } from 'react';
import './prose.css';

/**
 * Animation comparing the two classic memory tracking schemes from Tanenbaum.
 * Bitmap: scan bits looking for k consecutive zeros.
 * Linked list: traverse nodes H (hueco) and P (proceso) jumping by address+length.
 */

type Cell = 'P' | 'H';                 // P = process, H = hole
type Region = { kind: Cell; start: number; len: number; label?: string };

type Node = Region & { id: number };

type Step = {
  title: string;
  // Memory layout for top diagram (label slots A B C D E with holes)
  topMap: Region[];
  // Bitmap rows (each row 8 bits)
  bitmap: number[][];
  // Index pointer scanning the bitmap (linear bit index across rows)
  scanIdx?: number;
  // Linked list nodes (in order by address)
  list: Node[];
  // Highlighted node id while traversing
  hotNodeId?: number;
  desc: string;
};

/* layout. Memory of 32 units, 8 per row, 4 rows.
   Regions:  A 0..4  hole 4..6  B 6..13  C 13..19  hole 19..21  D 21..27  E 27..30  hole 30..32 */
const TOP: Region[] = [
  { kind: 'P', start: 0,  len: 4,  label: 'A' },
  { kind: 'H', start: 4,  len: 2 },
  { kind: 'P', start: 6,  len: 7,  label: 'B' },
  { kind: 'P', start: 13, len: 6,  label: 'C' },
  { kind: 'H', start: 19, len: 2 },
  { kind: 'P', start: 21, len: 6,  label: 'D' },
  { kind: 'P', start: 27, len: 3,  label: 'E' },
  { kind: 'H', start: 30, len: 2 },
];

/* bitmap mirror. 1 = ocupado, 0 = libre. 32 bits exactos. */
const BITS = '11110011' + '11111100' + '11111000' + '11111100';
/*            0..7         8..15        16..23       24..31 */
const ROWS = [
  BITS.slice(0,  8).split('').map(Number),
  BITS.slice(8, 16).split('').map(Number),
  BITS.slice(16,24).split('').map(Number),
  BITS.slice(24,32).split('').map(Number),
];

const LIST: Node[] = TOP.map((r, i) => ({ id: i + 1, ...r }));

const STEPS: Step[] = [
  {
    title: 'Punto de partida. La misma memoria vista de tres formas',
    topMap: TOP,
    bitmap: ROWS,
    list: LIST,
    desc: 'Arriba ves un bloque continuo de memoria con cinco procesos cargados, A B C D E, y tres huecos entre ellos. Esa misma realidad la representa el kernel de dos maneras alternativas. Como mapa de bits, donde cada bit cuenta una unidad de asignación. Como lista enlazada, donde cada nodo describe una región con bandera, dirección de inicio y longitud.',
  },
  {
    title: 'Mapa de bits. Escaneo bit por bit buscando 3 ceros seguidos',
    topMap: TOP,
    bitmap: ROWS,
    scanIdx: 4,
    list: LIST,
    desc: 'Llega un proceso nuevo de tamaño 3. El kernel debe encontrar 3 ceros consecutivos. Empieza a leer bits desde la posición cero. En el bit 4 encuentra el primer cero, pero solo hay 2 ceros seguidos. Sigue. En el bit 19 hay 2 ceros. Sigue. En el bit 30 quedan solo 2 antes del fin. Resultado. No cabe. Tendría que esperar o intercambiar a disco. El defecto del mapa de bits queda expuesto. Buscar cadenas largas de ceros es lento porque hay que examinar bit por bit.',
  },
  {
    title: 'Lista enlazada. Saltos de nodo en nodo, sin examinar interior',
    topMap: TOP,
    bitmap: ROWS,
    list: LIST,
    hotNodeId: 1,
    desc: 'La lista enlazada cambia el modelo. En vez de un bit por unidad, hay un nodo por región. Cada nodo dice si es Proceso o Hueco, dónde empieza, cuánto mide, y apunta al siguiente. El kernel empieza por el nodo 1.',
  },
  {
    title: 'Avanza al nodo 2. Primer hueco encontrado',
    topMap: TOP,
    bitmap: ROWS,
    list: LIST,
    hotNodeId: 2,
    desc: 'El nodo 1 es Proceso A. Salta al siguiente. El nodo 2 es Hueco de longitud 2. No alcanza para el proceso de 3 unidades que pedimos. El kernel ni siquiera tuvo que mirar las celdas internas. La bandera H y la longitud le bastaron para descartar el hueco al instante.',
  },
  {
    title: 'Recorre nodos hasta el siguiente hueco',
    topMap: TOP,
    bitmap: ROWS,
    list: LIST,
    hotNodeId: 5,
    desc: 'Los nodos 3 y 4 son Procesos B y C, así que los salta. Llega al nodo 5, otro Hueco. Su longitud es 2. Tampoco alcanza. Descartado. Avanza al siguiente. La lista permite saltar regiones completas con una sola comparación, en lugar de leer cada bit.',
  },
  {
    title: 'Llega al último hueco. Aún no cabe',
    topMap: TOP,
    bitmap: ROWS,
    list: LIST,
    hotNodeId: 8,
    desc: 'Salta los Procesos D y E. Llega al nodo 8. Hueco de longitud 2. Otra vez no alcanza. La lista terminó. No hay espacio para 3 unidades contiguas. El kernel tendría que esperar liberación, intercambiar un proceso a disco o aplicar compactación de memoria. La conclusión clave. La lista enlazada llegó a la misma respuesta que el mapa de bits pero examinando solo 8 nodos en vez de 32 bits.',
  },
];

const AUTO_MS = 3000;

export function MemoryTrackingFlow() {
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
    <div className="zf-wrap mtf-wrap">
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

      {/* Top: memory strip */}
      <div className="mtf-block mtf-strip-wrap">
        <div className="mtf-block-tag">(a) Memoria continua</div>
        <div className="mtf-strip">
          {current.topMap.map((r, i) => (
            <div
              key={i}
              className={`mtf-region mtf-region-${r.kind === 'P' ? 'p' : 'h'}`}
              style={{ ['--w' as string]: r.len } as React.CSSProperties}
            >
              {r.label || (r.kind === 'H' ? '◌' : '')}
            </div>
          ))}
        </div>
        <div className="mtf-ruler">
          {[0, 8, 16, 24, 32].map(n => <span key={n}>{n}</span>)}
        </div>
      </div>

      {/* Bitmap */}
      <div className="mtf-block mtf-bm-wrap">
        <div className="mtf-block-tag">(b) Mapa de bits. 1 = ocupado, 0 = libre</div>
        <div className="mtf-bm">
          {current.bitmap.map((row, ri) => (
            <div key={ri} className="mtf-bm-row">
              {row.map((b, ci) => {
                const flat = ri * 8 + ci;
                const hot = current.scanIdx !== undefined && flat === current.scanIdx;
                return (
                  <span key={ci} className={`mtf-bit mtf-bit-${b} ${hot ? 'mtf-bit-hot' : ''}`}>{b}</span>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Linked list */}
      <div className="mtf-block mtf-list-wrap">
        <div className="mtf-block-tag">(c) Lista enlazada. nodos {`[bandera | inicio | longitud]`}</div>
        <div className="mtf-list">
          {current.list.map((n, i) => (
            <span key={n.id} className="mtf-list-item">
              <span className={`mtf-node mtf-node-${n.kind === 'P' ? 'p' : 'h'} ${current.hotNodeId === n.id ? 'mtf-node-hot' : ''}`}>
                <span className="mtf-node-flag">{n.kind}</span>
                <span className="mtf-node-fld">{n.start}</span>
                <span className="mtf-node-fld">{n.len}</span>
              </span>
              {i < current.list.length - 1 && <span className="mtf-arrow">→</span>}
            </span>
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
