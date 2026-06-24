// Persistent extension settings (token + base URL + preferred model).
// Stored in chrome.storage.local (NOT sync) so the API token never traverses
// Google account sync.

export interface Settings {
  baseUrl: string;
  token: string;
  model: string;
  summaryStyle: SummaryStyle;
}

export type SummaryStyle = 'tldr' | 'bullets' | 'eli5' | 'takeaways';

export const DEFAULTS: Settings = {
  baseUrl: 'https://api.inference.club',
  token: '',
  model: '',
  summaryStyle: 'bullets',
};

export async function getSettings(): Promise<Settings> {
  const stored = await chrome.storage.local.get(DEFAULTS as unknown as Record<string, unknown>);
  return { ...DEFAULTS, ...stored } as Settings;
}

export async function setSettings(patch: Partial<Settings>): Promise<void> {
  await chrome.storage.local.set(patch);
}

export async function clearCredentials(): Promise<void> {
  await chrome.storage.local.set({ token: '' });
}
