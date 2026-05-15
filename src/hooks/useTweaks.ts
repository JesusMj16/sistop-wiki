import { useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { applyPalette, DEFAULT_PALETTE_ID, getPalette, PALETTES } from './palettes';

export type FontPair = 'fraunces' | 'chewy' | 'patrick-hand';

export interface Tweaks {
  /** Palette id from `palettes.ts`. Legacy tuple values are migrated on load. */
  paletteId: string;
  fontPair: FontPair;
  density: 'compact' | 'regular' | 'comfy';
  fontSize: number;
}

const LEGACY_FONT_PAIR_MAP: Record<string, FontPair> = {
  'serif-classic': 'fraunces',
  'humanist':      'fraunces',
  'modern-sans':   'chewy',
  'editorial':     'fraunces',
};

function normaliseFontPair(v: unknown): FontPair {
  if (v === 'fraunces' || v === 'chewy' || v === 'patrick-hand') return v;
  if (typeof v === 'string' && v in LEGACY_FONT_PAIR_MAP) return LEGACY_FONT_PAIR_MAP[v];
  return 'fraunces';
}

export const TWEAK_DEFAULTS: Tweaks = {
  paletteId: DEFAULT_PALETTE_ID,
  fontPair: 'fraunces',
  density: 'regular',
  fontSize: 25,
};

type LegacyTweaks = Partial<Tweaks> & { palette?: [string, string, string] };

function migrate(raw: unknown): Tweaks {
  if (!raw || typeof raw !== 'object') return TWEAK_DEFAULTS;
  const t = raw as LegacyTweaks;
  // Legacy: palette was `[accent, ink, paper]`. Map back to a palette id by
  // matching the accent hex; fall back to default otherwise.
  let paletteId = t.paletteId;
  if (!paletteId && Array.isArray(t.palette)) {
    const accent = t.palette[0]?.toLowerCase();
    paletteId = PALETTES.find(p => p.accent.toLowerCase() === accent)?.id ?? DEFAULT_PALETTE_ID;
  }
  return {
    paletteId: paletteId ?? DEFAULT_PALETTE_ID,
    fontPair:  normaliseFontPair(t.fontPair),
    density:   t.density   ?? TWEAK_DEFAULTS.density,
    fontSize:  t.fontSize  ?? TWEAK_DEFAULTS.fontSize,
  };
}

export function useTweaks() {
  const [rawTweaks, setTweaks] = useLocalStorage<Tweaks>('wikinotes.tweaks.v1', TWEAK_DEFAULTS);
  const tweaks = migrate(rawTweaks);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.density = tweaks.density;
    root.dataset.fontpair = tweaks.fontPair;
    root.style.setProperty('--reader-fs', tweaks.fontSize + 'px');
    applyPalette(getPalette(tweaks.paletteId), root);
  }, [tweaks]);

  const setTweak = <K extends keyof Tweaks>(key: K, value: Tweaks[K]) => {
    setTweaks((t) => ({ ...migrate(t), [key]: value }));
  };

  return { tweaks, setTweak };
}
