// Color palettes. Each palette is a set of semantic color tokens that get
// applied as CSS custom properties on <html> (see lib/theme.ts). Tailwind v4
// maps `--color-*` utilities (bg-app, text-content, bg-accent, …) to these in
// lib/style.css, so switching a palette restyles the whole UI instantly.
//
// This file is the single source of truth: both the live theme and the palette
// picker previews read the same color values from here.

export interface PaletteColors {
  app: string; // window background
  surface: string; // header / cards / hover backgrounds
  surface2: string; // bubbles / nested panels
  content: string; // primary text
  muted: string; // secondary text
  line: string; // borders
  accent: string; // buttons, links, highlights
  accentHover: string; // accent hover state
  onAccent: string; // text/icon on top of accent
}

export interface Palette {
  id: string;
  name: string;
  dark: boolean;
  colors: PaletteColors;
}

export const PALETTES: Palette[] = [
  {
    id: 'daylight',
    name: 'Daylight',
    dark: false,
    colors: {
      app: '#ffffff', surface: '#f5f6f8', surface2: '#eceef2',
      content: '#1f2430', muted: '#6b7280', line: '#e2e5ea',
      accent: '#4f46e5', accentHover: '#6366f1', onAccent: '#ffffff',
    },
  },
  {
    id: 'paper',
    name: 'Paper',
    dark: false,
    colors: {
      app: '#f6f0e4', surface: '#efe7d6', surface2: '#e7dcc6',
      content: '#4b3f31', muted: '#8a7a63', line: '#ddd0b8',
      accent: '#b07a3c', accentHover: '#c98f4d', onAccent: '#fff8ee',
    },
  },
  {
    id: 'mist',
    name: 'Mist',
    dark: false,
    colors: {
      app: '#eef2f5', surface: '#e4eaef', surface2: '#d8e1e8',
      content: '#2c3a44', muted: '#5f7280', line: '#cdd8e0',
      accent: '#2f7d8c', accentHover: '#3a95a6', onAccent: '#ffffff',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    dark: true,
    colors: {
      app: '#1e2230', surface: '#272c3d', surface2: '#313749',
      content: '#d7dbe7', muted: '#8b93a7', line: '#353c50',
      accent: '#6d7cff', accentHover: '#8390ff', onAccent: '#f5f7ff',
    },
  },
  {
    id: 'nord',
    name: 'Nord',
    dark: true,
    colors: {
      app: '#2e3440', surface: '#3b4252', surface2: '#434c5e',
      content: '#e5e9f0', muted: '#9aa5b9', line: '#434c5e',
      accent: '#88c0d0', accentHover: '#8fbcbb', onAccent: '#2e3440',
    },
  },
  {
    id: 'dracula',
    name: 'Dracula',
    dark: true,
    colors: {
      app: '#282a36', surface: '#343746', surface2: '#3c4053',
      content: '#f8f8f2', muted: '#9ea3bf', line: '#3a3d4d',
      accent: '#bd93f9', accentHover: '#caa7fb', onAccent: '#282a36',
    },
  },
  {
    id: 'solarized',
    name: 'Solarized',
    dark: true,
    colors: {
      app: '#002b36', surface: '#073642', surface2: '#0a4250',
      content: '#b3c0c0', muted: '#6f8488', line: '#0a4250',
      accent: '#268bd2', accentHover: '#2f9bdf', onAccent: '#002b36',
    },
  },
  {
    id: 'gruvbox',
    name: 'Gruvbox',
    dark: true,
    colors: {
      app: '#282828', surface: '#32302f', surface2: '#3c3836',
      content: '#ebdbb2', muted: '#a89984', line: '#3c3836',
      accent: '#d79921', accentHover: '#fabd2f', onAccent: '#282828',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    dark: true,
    colors: {
      app: '#15201a', surface: '#1d2b22', surface2: '#25362b',
      content: '#d6e6d8', muted: '#8aa691', line: '#243a2c',
      accent: '#5fae7d', accentHover: '#74c693', onAccent: '#0f1712',
    },
  },
  {
    id: 'rose',
    name: 'Rosé',
    dark: true,
    colors: {
      app: '#191724', surface: '#1f1d2e', surface2: '#26233a',
      content: '#e0def4', muted: '#908caa', line: '#2a273f',
      accent: '#ebbcba', accentHover: '#f2cdcc', onAccent: '#191724',
    },
  },
];

export const DEFAULT_PALETTE = 'midnight';

export function getPalette(id: string): Palette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES.find((p) => p.id === DEFAULT_PALETTE)!;
}

/** Resolve the effective palette, expanding the special 'system' id. */
export function resolvePalette(id: string, prefersDark: boolean): Palette {
  if (id === 'system') return getPalette(prefersDark ? 'midnight' : 'daylight');
  return getPalette(id);
}
