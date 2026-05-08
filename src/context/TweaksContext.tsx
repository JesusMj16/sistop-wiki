import { createContext, useContext, type ReactNode } from 'react';
import { useTweaks, type Tweaks } from '../hooks/useTweaks';

interface TweaksContextValue {
  tweaks: Tweaks;
  setTweak: <K extends keyof Tweaks>(key: K, value: Tweaks[K]) => void;
}

const TweaksContext = createContext<TweaksContextValue | null>(null);

export function TweaksProvider({ children }: { children: ReactNode }) {
  const value = useTweaks();
  return <TweaksContext.Provider value={value}>{children}</TweaksContext.Provider>;
}

export function useTweaksCtx(): TweaksContextValue {
  const ctx = useContext(TweaksContext);
  if (!ctx) throw new Error('useTweaksCtx must be used within TweaksProvider');
  return ctx;
}
