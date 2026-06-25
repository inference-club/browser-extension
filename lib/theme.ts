// Theme handling: System / Light / Dark.
//
// Tailwind v4 is configured (in lib/style.css) so the `dark:` variant responds
// to a `.dark` class on <html> rather than only `prefers-color-scheme`. This
// lets the user force a theme. For `'system'` we mirror the OS preference and
// keep it live via a matchMedia listener.

import { getSettings, type Theme } from './settings';

const mql = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null;
let systemListener: ((e: MediaQueryListEvent) => void) | null = null;

function setDark(isDark: boolean) {
  const root = document.documentElement;
  root.classList.toggle('dark', isDark);
  // Drives native form controls, scrollbars, and the default canvas color.
  root.style.colorScheme = isDark ? 'dark' : 'light';
}

/**
 * Apply a theme to the current document. For `'system'`, subscribes to OS
 * changes so the UI updates live; other modes detach the listener.
 */
export function applyTheme(theme: Theme): void {
  if (systemListener && mql) {
    mql.removeEventListener('change', systemListener);
    systemListener = null;
  }

  if (theme === 'system') {
    const sync = (dark: boolean) => setDark(dark);
    sync(!!mql?.matches);
    if (mql) {
      systemListener = (e) => sync(e.matches);
      mql.addEventListener('change', systemListener);
    }
    return;
  }

  setDark(theme === 'dark');
}

/** Read the persisted theme and apply it. Call before mounting to avoid a flash. */
export async function initTheme(): Promise<void> {
  const { theme } = await getSettings();
  applyTheme(theme);
}
