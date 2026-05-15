import { useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

export interface Tweaks {
  palette: [string, string, string];
  fontPair: 'serif-classic' | 'humanist' | 'modern-sans' | 'editorial';
  density: 'compact' | 'regular' | 'comfy';
  fontSize: number;
}

export const TWEAK_DEFAULTS: Tweaks = {
  palette: ['#c2603a', '#1f1d1a', '#f6f1e8'],
  fontPair: 'serif-classic',
  density: 'regular',
  fontSize: 17,
};

export function useTweaks() {
  const [tweaks, setTweaks] = useLocalStorage<Tweaks>('wikinotes.tweaks.v1', TWEAK_DEFAULTS);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.density = tweaks.density;
    root.dataset.fontpair = tweaks.fontPair;
    root.style.setProperty('--accent', tweaks.palette[0]);
    root.style.setProperty('--ink', tweaks.palette[1]);
    root.style.setProperty('--paper', tweaks.palette[2]);
    root.style.setProperty('--reader-fs', tweaks.fontSize + 'px');
  }, [tweaks]);

  const setTweak = <K extends keyof Tweaks>(key: K, value: Tweaks[K]) => {
    setTweaks((t) => ({ ...t, [key]: value }));
  };

  return { tweaks, setTweak };
}
