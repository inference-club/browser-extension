// Persistent extension settings (token + base URL + preferred model).
// Stored in chrome.storage.local (NOT sync) so the API token never traverses
// Google account sync.

export type Theme = 'system' | 'light' | 'dark';

export interface ReaderPrefs {
  wpm: number; // words per minute
  fontSizePx: number; // focus-word size
  fontFamily: 'sans' | 'serif' | 'mono';
  color: string; // focus-word color when useThemeColor is false
  useThemeColor: boolean; // use the theme's accent/text color instead of `color`
  contextWords: number; // dimmed words shown before/after the focus word
}

export interface Settings {
  baseUrl: string;
  token: string;
  model: string;
  summaryStyle: SummaryStyle;
  theme: Theme;
  advancedMode: boolean;
  reader: ReaderPrefs;
}

export type SummaryStyle = 'tldr' | 'bullets' | 'eli5' | 'takeaways';

export const DEFAULTS: Settings = {
  baseUrl: 'https://api.inference.club',
  token: '',
  model: '',
  summaryStyle: 'bullets',
  theme: 'system',
  advancedMode: false,
  reader: {
    wpm: 350,
    fontSizePx: 48,
    fontFamily: 'sans',
    color: '#6366f1',
    useThemeColor: true,
    contextWords: 0,
  },
};

export async function getSettings(): Promise<Settings> {
  const stored = await chrome.storage.local.get(DEFAULTS as unknown as Record<string, unknown>);
  // Deep-merge `reader` so new nested prefs pick up defaults for older installs.
  return {
    ...DEFAULTS,
    ...stored,
    reader: { ...DEFAULTS.reader, ...(stored as Partial<Settings>).reader },
  } as Settings;
}

export async function setSettings(patch: Partial<Settings>): Promise<void> {
  await chrome.storage.local.set(patch);
}

export async function clearCredentials(): Promise<void> {
  await chrome.storage.local.set({ token: '' });
}
