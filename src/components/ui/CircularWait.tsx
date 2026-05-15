import { useState } from 'react';
import './prose.css';

/**
 * Animación de la espera circular (Figura 4-1).
 *
 * Dos procesos, dos recursos. Cada proceso retiene uno y pide el otro.
 * Pasos: estado inicial sin conflicto → P1 retiene A → P2 retiene B →
 * cada uno pide el del otro → diagnóstico de deadlock → ruptura del ciclo.
 *
 * Comparte el chrome .zf-* para mantener coherencia visual.
 */

type Holder = 'p1' | 'p2' | null;
type Want   = 'p1' | 'p2' | null;

type Step = {
  title: string;
  holderA: Holder;     // quién retiene Recurso A
  holderB: Holder;
  wantA: Want;         // quién pide Recurso A
  wantB: Want;
  deadlock: boolean;
  broken: boolean;
  desc: string;
};

const STEPS: Step[] = [
  {
    title: 'Punto de partida: sin nadie reteniendo',
    holderA: null, holderB: null, wantA: null, wantB: null,
    deadlock: false, broken: false,
    desc: 'Dos procesos P1 y P2 viven en paz. Ningún recurso está retenido todavía. Aquí todo es posible.',
  },
  {
    title: 'P1 toma el Recurso A',
    holderA: 'p1', holderB: null, wantA: null, wantB: null,
    deadlock: false, broken: false,
    desc: 'P1 solicita y obtiene el Recurso A. Nadie más lo puede tocar porque hay exclusión mutua.',
  },
  {
    title: 'P2 toma el Recurso B',
    holderA: 'p1', holderB: 'p2', wantA: null, wantB: null,
    deadlock: false, broken: false,
    desc: 'P2 hace lo mismo con el Recurso B. Cada proceso tiene uno. Hasta aquí no hay problema.',
  },
  {
    title: 'P1 pide el Recurso B sin soltar A',
    holderA: 'p1', holderB: 'p2', wantA: null, wantB: 'p1',
    deadlock: false, broken: false,
    desc: 'P1 necesita también el Recurso B para continuar, pero lo tiene P2. P1 espera, sin soltar A. Aparece la retención y espera.',
  },
  {
    title: 'P2 pide el Recurso A sin soltar B',
    holderA: 'p1', holderB: 'p2', wantA: 'p2', wantB: 'p1',
    deadlock: true, broken: false,
    desc: 'P2 también necesita el otro recurso. La cadena se cierra: P1 espera a P2 y P2 espera a P1. Esto es la espera circular. Ninguno avanza.',
  },
  {
    title: 'Rompemos el ciclo: P2 libera B',
    holderA: 'p1', holderB: null, wantA: 'p2', wantB: null,
    deadlock: false, broken: true,
    desc: 'Si un proceso suelta su recurso o el sistema lo apropia, la cadena se rompe. P1 obtiene B, completa su trabajo, libera A y P2 finalmente puede continuar.',
  },
];

export function CircularWait() {
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  function goTo(s: number) {
    setStep(Math.max(0, Math.min(STEPS.length - 1, s)));
  }

  return (
    <div className="zf-wrap cw-wrap">
      <div className="zf-head">
        <span className="zf-step-num">{step + 1}<small>/{STEPS.length}</small></span>
        <h4 className="zf-step-title">{current.title}</h4>
      </div>

      <div className="cw-stage">
        <svg className="cw-svg" viewBox="0 0 520 280" preserveAspectRatio="xMidYMid meet">
          {/* Recurso A arriba */}
          <g transform="translate(180, 30)">
            <rect width="160" height="50" rx="0" className={`cw-res ${current.holderA ? 'cw-res-held' : ''}`} />
            <text x="80" y="32" textAnchor="middle" className="cw-res-label">Recurso A</text>
          </g>
          {/* Recurso B abajo */}
          <g transform="translate(180, 200)">
            <rect width="160" height="50" rx="0" className={`cw-res ${current.holderB ? 'cw-res-held' : ''}`} />
            <text x="80" y="32" textAnchor="middle" className="cw-res-label">Recurso B</text>
          </g>

          {/* P1 izquierda */}
          <g transform="translate(40, 115)">
            <circle cx="35" cy="35" r="35" className={`cw-proc ${current.deadlock ? 'cw-proc-stuck' : ''}`} />
            <text x="35" y="42" textAnchor="middle" className="cw-proc-label">P1</text>
          </g>
          {/* P2 derecha */}
          <g transform="translate(410, 115)">
            <circle cx="35" cy="35" r="35" className={`cw-proc ${current.deadlock ? 'cw-proc-stuck' : ''}`} />
            <text x="35" y="42" textAnchor="middle" className="cw-proc-label">P2</text>
          </g>

          {/* defs flecha */}
          <defs>
            <marker id="cw-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L10,5 L0,10 Z" className="cw-arrow-head" />
            </marker>
            <marker id="cw-arrow-want" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L10,5 L0,10 Z" className="cw-arrow-head-want" />
            </marker>
          </defs>

          {/* A retenido por P1: A -> P1 */}
          {current.holderA === 'p1' && (
            <line x1="180" y1="55" x2="110" y2="135" className="cw-edge cw-edge-hold" markerEnd="url(#cw-arrow)" />
          )}
          {/* B retenido por P2: B -> P2 */}
          {current.holderB === 'p2' && (
            <line x1="340" y1="225" x2="430" y2="170" className="cw-edge cw-edge-hold" markerEnd="url(#cw-arrow)" />
          )}
          {/* P1 pide B: P1 -> B */}
          {current.wantB === 'p1' && (
            <line x1="110" y1="160" x2="195" y2="220" className="cw-edge cw-edge-want" markerEnd="url(#cw-arrow-want)" />
          )}
          {/* P2 pide A: P2 -> A */}
          {current.wantA === 'p2' && (
            <line x1="430" y1="130" x2="345" y2="70" className="cw-edge cw-edge-want" markerEnd="url(#cw-arrow-want)" />
          )}
        </svg>

        <div className="cw-legend">
          <span className="cw-legend-item"><span className="cw-legend-swatch cw-legend-hold" />Retenido por</span>
          <span className="cw-legend-item"><span className="cw-legend-swatch cw-legend-want" />Solicitud pendiente</span>
          {current.deadlock && <span className="cw-badge cw-badge-bad">ESPERA CIRCULAR</span>}
          {current.broken && <span className="cw-badge cw-badge-ok">CICLO ROTO</span>}
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
