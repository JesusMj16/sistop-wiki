import { useState } from 'react';
import './prose.css';

/**
 * Animación del ordenamiento lineal de recursos (Figura 4-2).
 *
 * Recursos R1..R8 numerados. Un proceso solo puede pedir recursos con
 * número mayor que el último que tomó. Cualquier petición "hacia abajo"
 * cerraría un ciclo, así que se prohíbe por diseño.
 *
 * Pasos: P1 toma R3, R4, R5, R7. Luego pide R8 (válido, arriba). Luego
 * intenta pedir R2 (inválido, abajo). Comparativa con espera circular.
 */

const RES = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8'];

type Step = {
  title: string;
  held: string[];      // recursos retenidos por P1
  request?: string;    // recurso solicitado
  valid?: boolean;     // ¿la solicitud respeta el ordenamiento?
  desc: string;
};

const STEPS: Step[] = [
  {
    title: 'Regla: las flechas suben',
    held: [],
    desc: 'Cada recurso tiene un número. Cuando un proceso ya retiene un recurso, solo puede pedir recursos con número mayor. Las flechas de solicitud siempre apuntan hacia arriba.',
  },
  {
    title: 'P1 toma R3, R4, R5 y R7',
    held: ['R3', 'R4', 'R5', 'R7'],
    desc: 'P1 fue pidiendo recursos en orden creciente. En cada paso, el siguiente recurso tenía un número mayor. Hasta aquí todo respeta la regla.',
  },
  {
    title: 'P1 pide R8 — válido, flecha hacia arriba',
    held: ['R3', 'R4', 'R5', 'R7'],
    request: 'R8', valid: true,
    desc: 'R8 está por encima de R7, así que la solicitud va hacia arriba en el orden. El sistema acepta. P1 tomará R8 y seguirá adelante.',
  },
  {
    title: 'P1 intenta pedir R2 — bloqueado',
    held: ['R3', 'R4', 'R5', 'R7'],
    request: 'R2', valid: false,
    desc: 'R2 está por debajo de los recursos que P1 ya retiene. Esa flecha apuntaría hacia abajo. El sistema rechaza la solicitud porque permitirla podría formar un ciclo con otro proceso.',
  },
  {
    title: 'Por qué evita la espera circular',
    held: ['R3', 'R4', 'R5', 'R7'],
    desc: 'Si todas las flechas suben, jamás puede formarse un círculo. Para que exista un ciclo haría falta al menos una flecha bajando, y esa la prohibimos por construcción. Espera circular eliminada de raíz.',
  },
];

export function LinearOrdering() {
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  function goTo(s: number) {
    setStep(Math.max(0, Math.min(STEPS.length - 1, s)));
  }

  const heldSet = new Set(current.held);
  // Coordenadas para SVG: cada recurso es un círculo apilado verticalmente.
  // R1 abajo, R8 arriba.
  const cx = 110;
  const radius = 22;
  const gap = 56;
  const baseY = 50; // y para R8
  const yOf = (idx: number) => baseY + (RES.length - 1 - idx) * gap;
  // idx: 0=R1 ... 7=R8

  // Flechas de retención: la primera retención no tiene flecha entrante; las
  // siguientes muestran "subió" de la anterior. Para visualizar la cadena,
  // dibujamos flechas entre recursos consecutivos retenidos.
  const heldIdx = current.held
    .map(r => RES.indexOf(r))
    .sort((a, b) => a - b);

  const requestIdx = current.request ? RES.indexOf(current.request) : -1;
  // Último retenido = el más alto que ya tiene P1
  const lastHeldIdx = heldIdx.length ? heldIdx[heldIdx.length - 1] : -1;

  const svgHeight = baseY * 2 + (RES.length - 1) * gap;

  return (
    <div className="zf-wrap lo-wrap">
      <div className="zf-head">
        <span className="zf-step-num">{step + 1}<small>/{STEPS.length}</small></span>
        <h4 className="zf-step-title">{current.title}</h4>
      </div>

      <div className="lo-stage">
        <svg className="lo-svg" viewBox={`0 0 220 ${svgHeight}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="lo-arrow-up" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L10,5 L0,10 Z" className="lo-arrow-head-ok" />
            </marker>
            <marker id="lo-arrow-bad" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L10,5 L0,10 Z" className="lo-arrow-head-bad" />
            </marker>
          </defs>

          {/* línea guía vertical */}
          <line x1={cx} y1={baseY - radius} x2={cx} y2={baseY + (RES.length - 1) * gap + radius} className="lo-axis" />

          {/* círculos recurso */}
          {RES.map((r, i) => {
            const y = yOf(i);
            const held = heldSet.has(r);
            const isReq = requestIdx === i;
            const reqGood = isReq && current.valid;
            const reqBad  = isReq && current.valid === false;
            return (
              <g key={r}>
                <circle
                  cx={cx} cy={y} r={radius}
                  className={`lo-res ${held ? 'lo-res-held' : ''} ${reqGood ? 'lo-res-req-ok' : ''} ${reqBad ? 'lo-res-req-bad' : ''}`}
                />
                <text x={cx} y={y + 5} textAnchor="middle" className="lo-res-label">{r}</text>
              </g>
            );
          })}

          {/* flechas de retención entre consecutivos retenidos: van hacia arriba */}
          {heldIdx.slice(1).map((idx, k) => {
            const prev = heldIdx[k];
            return (
              <line
                key={`hold-${idx}`}
                x1={cx + radius + 6} y1={yOf(prev) - 2}
                x2={cx + radius + 6} y2={yOf(idx) + radius + 6}
                className="lo-edge lo-edge-ok"
                markerEnd="url(#lo-arrow-up)"
              />
            );
          })}

          {/* flecha de la solicitud */}
          {requestIdx >= 0 && lastHeldIdx >= 0 && (
            <line
              x1={cx + radius + 18}
              y1={yOf(lastHeldIdx) - 2}
              x2={cx + radius + 18}
              y2={yOf(requestIdx) + (current.valid ? radius + 6 : -radius - 6)}
              className={`lo-edge ${current.valid ? 'lo-edge-ok' : 'lo-edge-bad'}`}
              strokeDasharray={current.valid ? '0' : '6 4'}
              markerEnd={current.valid ? 'url(#lo-arrow-up)' : 'url(#lo-arrow-bad)'}
            />
          )}
        </svg>

        <div className="lo-legend">
          <span className="lo-legend-item"><span className="lo-legend-swatch lo-legend-held" />Retenido por P1</span>
          <span className="lo-legend-item"><span className="lo-legend-swatch lo-legend-ok" />Solicitud válida</span>
          <span className="lo-legend-item"><span className="lo-legend-swatch lo-legend-bad" />Solicitud bloqueada</span>
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
