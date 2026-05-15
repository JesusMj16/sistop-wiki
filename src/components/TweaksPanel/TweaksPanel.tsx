import { useState } from 'react';
import { useTweaksCtx } from '../../context/TweaksContext';
import type { Tweaks } from '../../hooks/useTweaks';
import { PALETTES } from '../../hooks/palettes';
import './TweaksPanel.css';

const DENSITIES: Array<Tweaks['density']> = ['compact', 'regular', 'comfy'];

export default function TweaksPanel() {
  const { tweaks, setTweak } = useTweaksCtx();
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        className="twk-toggle-btn"
        onClick={() => setOpen(true)}
        title="Abrir panel de ajustes"
        aria-label="Abrir tweaks"
      >
        ✦
      </button>
    );
  }

  return (
    <>
      <button
        className="twk-toggle-btn"
        onClick={() => setOpen(false)}
        title="Cerrar panel de ajustes"
        aria-label="Cerrar tweaks"
      >
        ✕
      </button>
      <div className="twk-panel" role="dialog" aria-label="Ajustes de tema">
        <div className="twk-panel-head">
          <span>Ajustes</span>
        </div>
        <div className="twk-panel-body">
          <div className="twk-section">Apariencia</div>

          <div className="twk-row">
            <div className="twk-label">Paleta</div>
            <div className="twk-chips" role="radiogroup">
              {PALETTES.map((p) => (
                <button
                  key={p.id}
                  className="twk-chip"
                  role="radio"
                  aria-checked={p.id === tweaks.paletteId}
                  aria-label={p.label}
                  style={{
                    background:
                      `linear-gradient(90deg,` +
                      ` ${p.accent} 0 40%,` +
                      ` ${p.hiAmber} 40% 55%,` +
                      ` ${p.hiCobalt} 55% 70%,` +
                      ` ${p.hiGrape} 70% 85%,` +
                      ` ${p.paper} 85% 100%)`,
                  }}
                  onClick={() => setTweak('paletteId', p.id)}
                  title={p.label}
                />
              ))}
            </div>
          </div>

          <div className="twk-row twk-row-h">
            <span className="twk-label">Modo oscuro</span>
            <button
              className="twk-toggle"
              data-on={tweaks.dark}
              role="switch"
              aria-checked={tweaks.dark}
              onClick={() => setTweak('dark', !tweaks.dark)}
            />
          </div>

          <div className="twk-section">Lectura</div>

          <div className="twk-row">
            <div className="twk-label">
              Tamaño de lectura <span className="twk-value">{tweaks.fontSize}px</span>
            </div>
            <input
              className="twk-slider"
              type="range"
              min={15}
              max={24}
              value={tweaks.fontSize}
              onChange={(e) => setTweak('fontSize', Number(e.target.value))}
            />
          </div>

          <div className="twk-section">Densidad</div>

          <div className="twk-seg" role="radiogroup">
            {DENSITIES.map(d => (
              <button
                key={d}
                role="radio"
                aria-checked={tweaks.density === d}
                onClick={() => setTweak('density', d)}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
