import { useState } from 'react';
import './prose.css';

/**
 * Visualización lado a lado de paginación vs segmentación.
 *
 * Reusa chrome .zf-* para mantener consistencia con las demás animaciones.
 * 4 pasos: memoria vacía → paginación con páginas iguales → segmentación
 * con segmentos variables → combinación segmentación + paginación.
 */

type Block = { label: string; size: number; color: string };

type Step = {
  title: string;
  mode: 'paging' | 'segmenting' | 'mixed';
  desc: string;
};

const STEPS: Step[] = [
  {
    title: 'Paginación: trozos iguales',
    mode: 'paging',
    desc: 'El sistema corta la memoria en piezas idénticas llamadas páginas. Cada proceso recibe las páginas que necesita, sin importar si quedan o no contiguas. La unidad mínima en x86 y x86-64 suele ser 4KB. Linux también soporta páginas grandes de 2MB o 1GB para reducir la carga del TLB.',
  },
  {
    title: 'Segmentación: trozos a la medida',
    mode: 'segmenting',
    desc: 'Aquí los pedazos tienen tamaño variable, según lo que pida cada proceso. La memoria se siente más natural para el programador porque cada segmento corresponde a una región lógica como código, datos o pila. La desventaja es que con el tiempo aparece fragmentación externa: huecos pequeños difíciles de aprovechar.',
  },
  {
    title: 'Combinación: segmentos hechos de páginas',
    mode: 'mixed',
    desc: 'Los sistemas modernos suelen combinar las dos ideas. Cada proceso ve segmentos lógicos, pero internamente cada segmento se asigna en páginas. Aprovechamos lo mejor de ambos mundos: claridad lógica de la segmentación y manejo flexible de la paginación.',
  },
];

const PAGED_BLOCKS: Block[] = [
  { label: 'P1', size: 1, color: 'hi-cobalt' },
  { label: 'P1', size: 1, color: 'hi-cobalt' },
  { label: 'P2', size: 1, color: 'hi-emerald' },
  { label: 'P1', size: 1, color: 'hi-cobalt' },
  { label: 'P3', size: 1, color: 'hi-rose' },
  { label: 'P2', size: 1, color: 'hi-emerald' },
  { label: 'P3', size: 1, color: 'hi-rose' },
  { label: '·',  size: 1, color: 'free' },
];

const SEGMENT_BLOCKS: Block[] = [
  { label: 'P1.code', size: 3, color: 'hi-cobalt' },
  { label: 'P2.data', size: 2, color: 'hi-emerald' },
  { label: 'libre',   size: 1, color: 'free' },
  { label: 'P3.heap', size: 2, color: 'hi-rose' },
];

const MIXED_BLOCKS: Block[] = [
  { label: 'P1.code', size: 2, color: 'hi-cobalt' },
  { label: 'P2.data', size: 1, color: 'hi-emerald' },
  { label: 'P1.code', size: 1, color: 'hi-cobalt' },
  { label: 'P3.heap', size: 2, color: 'hi-rose' },
  { label: 'P2.data', size: 1, color: 'hi-emerald' },
  { label: '·',       size: 1, color: 'free' },
];

function colorFor(c: string): string {
  if (c === 'free') return 'color-mix(in oklab, var(--ink) 6%, transparent)';
  return `color-mix(in oklab, var(--${c}) 55%, var(--bx-surface, #fff))`;
}

export function MemoryLayout() {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const blocks =
    current.mode === 'paging'    ? PAGED_BLOCKS    :
    current.mode === 'segmenting' ? SEGMENT_BLOCKS :
                                    MIXED_BLOCKS;
  const totalUnits = blocks.reduce((s, b) => s + b.size, 0);

  function goTo(s: number) {
    setStep(Math.max(0, Math.min(STEPS.length - 1, s)));
  }

  return (
    <div className="zf-wrap ml-wrap">
      <div className="zf-head">
        <span className="zf-step-num">{step + 1}<small>/{STEPS.length}</small></span>
        <h4 className="zf-step-title">{current.title}</h4>
      </div>

      <div className="ml-stage">
        <div className="ml-meta">
          <span className="ml-tag">MEMORIA PRINCIPAL</span>
          <span className="ml-mode">{
            current.mode === 'paging'     ? 'paginación' :
            current.mode === 'segmenting' ? 'segmentación' :
                                            'segmentación + paginación'
          }</span>
        </div>

        <div className="ml-bar" style={{ gridTemplateColumns: `repeat(${totalUnits}, 1fr)` }}>
          {blocks.map((b, i) => (
            <div
              key={i}
              className={`ml-block ${b.color === 'free' ? 'ml-block-free' : ''}`}
              style={{ gridColumn: `span ${b.size}`, background: colorFor(b.color) }}
            >
              <span className="ml-block-label">{b.label}</span>
              <span className="ml-block-size">
                {current.mode === 'paging' ? '4KB' : `${b.size * 4}KB`}
              </span>
            </div>
          ))}
        </div>

        <div className="ml-legend">
          <span className="ml-legend-item"><span className="ml-sw" style={{ background: colorFor('hi-cobalt') }} />Proceso 1</span>
          <span className="ml-legend-item"><span className="ml-sw" style={{ background: colorFor('hi-emerald') }} />Proceso 2</span>
          <span className="ml-legend-item"><span className="ml-sw" style={{ background: colorFor('hi-rose') }} />Proceso 3</span>
          <span className="ml-legend-item"><span className="ml-sw" style={{ background: colorFor('free') }} />Libre</span>
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
