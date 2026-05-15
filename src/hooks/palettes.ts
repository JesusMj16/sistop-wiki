

export interface Palette {
  id: string;
  label: string;
  accent: string;       // brand / link / drop-cap
  ink: string;          // body text + chunky frame in light mode
  paper: string;        // page background
  accent2: string;      // secondary brand tint (lists, hover wash)
  hiAmber: string;      // warn highlight + h2 title strip
  hiAmberInk: string;   // legible ink color on hiAmber
  hiCobalt: string;     // info highlight + h4 title strip
  hiEmerald: string;    // success highlight
  hiRose: string;       // danger highlight
  hiGrape: string;      // special / quote highlight
}

export const PALETTES: Palette[] = [
  {
    id: 'terracotta',
    label: 'Terracota',
    accent:     '#c2603a',
    ink:        '#1f1d1a',
    paper:      '#f6f1e8',
    accent2:    '#a84a28',
    hiAmber:    '#e8b04a',
    hiAmberInk: '#2b1d05',
    hiCobalt:   '#4a7a8c',
    hiEmerald:  '#6b8e4e',
    hiRose:     '#b8443a',
    hiGrape:    '#8c5a6b',
  },
  {
    id: 'forest',
    label: 'Bosque',
    accent:     '#3a6a4f',
    ink:        '#1d201d',
    paper:      '#eef2ea',
    accent2:    '#2a5238',
    hiAmber:    '#d4a93a',
    hiAmberInk: '#1d1602',
    hiCobalt:   '#3d6b78',
    hiEmerald:  '#5a8a3a',
    hiRose:     '#a84838',
    hiGrape:    '#7a5a8c',
  },
  {
    id: 'cobalt',
    label: 'Cobalto',
    accent:     '#3b5fa3',
    ink:        '#13192a',
    paper:      '#eef1f7',
    accent2:    '#284a8c',
    hiAmber:    '#d49c3a',
    hiAmberInk: '#1a1102',
    hiCobalt:   '#3b5fa3',
    hiEmerald:  '#4a8a6e',
    hiRose:     '#b54a4a',
    hiGrape:    '#6b4a9c',
  },
  {
    id: 'plum',
    label: 'Ciruela',
    accent:     '#7a4ca8',
    ink:        '#1c1a23',
    paper:      '#f1edf6',
    accent2:    '#5e3a85',
    hiAmber:    '#c98e58',
    hiAmberInk: '#211404',
    hiCobalt:   '#5a6b9c',
    hiEmerald:  '#6b8a6e',
    hiRose:     '#a8487a',
    hiGrape:    '#7a4ca8',
  },
  {
    id: 'bronze',
    label: 'Bronce',
    accent:     '#a8804b',
    ink:        '#221c14',
    paper:      '#f3ece1',
    accent2:    '#8a6432',
    hiAmber:    '#d4a35a',
    hiAmberInk: '#231604',
    hiCobalt:   '#5a7a85',
    hiEmerald:  '#7a8a4e',
    hiRose:     '#b25238',
    hiGrape:    '#8c5a7a',
  },
];

export const DEFAULT_PALETTE_ID = 'terracotta';

export function getPalette(id: string): Palette {
  return PALETTES.find(p => p.id === id) ?? PALETTES[0];
}

/** Apply a palette to the document root as CSS custom properties. */
export function applyPalette(p: Palette, root: HTMLElement = document.documentElement): void {
  root.style.setProperty('--accent', p.accent);
  root.style.setProperty('--accent-2', p.accent2);
  root.style.setProperty('--ink', p.ink);
  root.style.setProperty('--paper', p.paper);
  root.style.setProperty('--hi-amber', p.hiAmber);
  root.style.setProperty('--hi-amber-ink', p.hiAmberInk);
  root.style.setProperty('--hi-cobalt', p.hiCobalt);
  root.style.setProperty('--hi-emerald', p.hiEmerald);
  root.style.setProperty('--hi-rose', p.hiRose);
  root.style.setProperty('--hi-grape', p.hiGrape);
  root.dataset.palette = p.id;
}
