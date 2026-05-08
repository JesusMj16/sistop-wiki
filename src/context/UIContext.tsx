import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

interface UIContextValue {
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  focusMode: boolean;
  setFocusMode: (v: boolean) => void;
  notesPanelOpen: boolean;
  setNotesPanelOpen: (v: boolean) => void;
  search: string;
  setSearch: (v: string) => void;
}

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpenState] = useState(true);
  const [focusMode, setFocusModeState] = useState(false);
  const [notesPanelOpen, setNotesPanelOpenState] = useState(false);
  const [search, setSearchState] = useState('');

  const value: UIContextValue = {
    sidebarOpen,
    setSidebarOpen: useCallback((v: boolean) => setSidebarOpenState(v), []),
    focusMode,
    setFocusMode: useCallback((v: boolean) => setFocusModeState(v), []),
    notesPanelOpen,
    setNotesPanelOpen: useCallback((v: boolean) => setNotesPanelOpenState(v), []),
    search,
    setSearch: useCallback((v: string) => setSearchState(v), []),
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
}
