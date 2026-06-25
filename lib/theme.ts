// Theme handling: applies a named color palette as CSS custom properties on
// <html>. Tailwind v4 utilities (bg-app, text-content, bg-accent, …) reference
// these variables (see lib/style.css), so setting them restyles everything.
//
// The special palette id 'system' tracks the OS light/dark preference live.

import { getSettings } from './settings';
import { resolvePalette, type Palette } from './palettes';

const mql = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null;
let systemListener: ((e: MediaQueryListEvent) => void) | null = null;

function setVars(p: Palette) {
  const root = document.documentElement;
  const c = p.colors;
  root.style.setProperty('--color-app', c.app);
  root.style.setProperty('--color-surface', c.surface);
  root.style.setProperty('--color-surface2', c.surface2);
  root.style.setProperty('--color-content', c.content);
  root.style.setProperty('--color-muted', c.muted);
  root.style.setProperty('--color-line', c.line);
  root.style.setProperty('--color-accent', c.accent);
  root.style.setProperty('--color-accent-hover', c.accentHover);
  root.style.setProperty('--color-on-accent', c.onAccent);
  // Drives native form controls, scrollbars, and the default canvas color.
  root.style.colorScheme = p.dark ? 'dark' : 'light';
  root.dataset.palette = p.id;
}

/** Apply a palette by id. For 'system', keeps the OS preference in sync live. */
export function applyPalette(id: string): void {
  if (systemListener && mql) {
    mql.removeEventListener('change', systemListener);
    systemListener = null;
  }

  setVars(resolvePalette(id, !!mql?.matches));

  if (id === 'system' && mql) {
    systemListener = (e) => setVars(resolvePalette('system', e.matches));
    mql.addEventListener('change', systemListener);
  }
}

/** Read the persisted palette and apply it. Call before mounting to avoid a flash. */
export async function initTheme(): Promise<void> {
  const { palette } = await getSettings();
  applyPalette(palette);
}
