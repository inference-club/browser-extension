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

// Inject the extraction content script into the active tab on demand. This
// relies on `activeTab` (granted when the user invokes the extension) + the
// `scripting` permission — no broad host permissions needed.
async function ensureInjected(tabId: number): Promise<void> {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['content-scripts/content.js'],
  });
}

export async function captureActiveTab(): Promise<Article> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return { ok: false, error: 'No active tab.' };
  try {
    await ensureInjected(tab.id);
    return await chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_ARTICLE' });
  } catch {
    // chrome:// pages, the web store, PDFs, or activeTab not granted for this tab.
    return {
      ok: false,
      error: 'Can’t read this page. Open a normal article tab, then click the extension icon.',
    };
  }
}

export async function captureSelection(): Promise<string> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return '';
  try {
    await ensureInjected(tab.id);
    const res = await chrome.tabs.sendMessage(tab.id, { type: 'GET_SELECTION' });
    return res?.text ?? '';
  } catch {
    return '';
  }
}
