import { useState } from 'react';
import { useTweaksCtx } from '../../context/TweaksContext';
import type { Tweaks } from '../../hooks/useTweaks';
import './TweaksPanel.css';

const PALETTES: Array<[string, string, string]> = [
  ['#c2603a', '#1f1d1a', '#f6f1e8'],
  ['#3a6a4f', '#1d201d', '#eef2ea'],
  ['#3b5fa3', '#13192a', '#eef1f7'],
  ['#7a4ca8', '#1c1a23', '#f1edf6'],
  ['#a8804b', '#221c14', '#f3ece1'],
];

const FONT_PAIRS: Array<{ value: Tweaks['fontPair']; label: string }> = [
  { value: 'serif-classic', label: 'Clásica' },
  { value: 'humanist', label: 'Humanista' },
  { value: 'modern-sans', label: 'Moderna' },
  { value: 'editorial', label: 'Editorial' },
];

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
          <span>Tweaks</span>
          <span className="twk-value">dev</span>
        </div>
        <div className="twk-panel-body">
          <div className="twk-section">Apariencia</div>

          <div className="twk-row">
            <div className="twk-label">Paleta</div>
            <div className="twk-chips" role="radiogroup">
              {PALETTES.map((p, i) => (
                <button
                  key={i}
                  className="twk-chip"
                  role="radio"
                  aria-checked={p.join(',') === tweaks.palette.join(',')}
                  style={{ background: `linear-gradient(90deg, ${p[0]} 0 60%, ${p[1]} 60% 80%, ${p[2]} 80% 100%)` }}
                  onClick={() => setTweak('palette', p)}
                  title={p.join(', ')}
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

          <div className="twk-section">Tipografía</div>

          <div className="twk-row">
            <div className="twk-label">Pareja tipográfica</div>
            <select
              className="twk-select"
              value={tweaks.fontPair}
              onChange={(e) => setTweak('fontPair', e.target.value as Tweaks['fontPair'])}
            >
              {FONT_PAIRS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="twk-row">
            <div className="twk-label">
              Tamaño de lectura <span className="twk-value">{tweaks.fontSize}px</span>
            </div>
            <input
              className="twk-slider"
              type="range"
              min={14}
              max={22}
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
