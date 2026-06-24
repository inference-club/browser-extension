// Capture the readable article from a tab by asking its content script.
// The actual Readability parse runs in the page context (content.ts).

export interface Article {
  ok: boolean;
  title?: string;
  byline?: string;
  url?: string;
  text?: string;
  excerpt?: string;
  length?: number;
  error?: string;
}

export async function captureActiveTab(): Promise<Article> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return { ok: false, error: 'No active tab.' };
  try {
    return await chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_ARTICLE' });
  } catch {
    // No content script here (chrome:// pages, the web store, PDFs, etc.)
    return {
      ok: false,
      error: 'Can’t read this page. Open a normal article tab and try again.',
    };
  }
}

export async function captureSelection(): Promise<string> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return '';
  try {
    const res = await chrome.tabs.sendMessage(tab.id, { type: 'GET_SELECTION' });
    return res?.text ?? '';
  } catch {
    return '';
  }
}
