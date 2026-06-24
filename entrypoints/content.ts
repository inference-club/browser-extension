import { Readability } from '@mozilla/readability';

// Registered at "runtime", NOT in the manifest — so the extension declares no
// broad host permissions. We inject this file into the active tab on demand
// (see lib/extract.ts), which `activeTab` allows only after a user gesture.
// `matches` is required by the API but unused for our executeScript injection;
// we set it to a specific origin so WXT doesn't add a broad host permission.
export default defineContentScript({
  registration: 'runtime',
  matches: ['https://inference.club/*'],
  main() {
    const w = window as unknown as { __icReady?: boolean };
    if (w.__icReady) return; // re-injection guard (avoid duplicate listeners)
    w.__icReady = true;

    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      if (msg?.type === 'EXTRACT_ARTICLE') {
        sendResponse(extractArticle());
      } else if (msg?.type === 'GET_SELECTION') {
        sendResponse({ text: window.getSelection()?.toString() ?? '' });
      }
      return false; // synchronous response
    });
  },
});

function extractArticle() {
  try {
    const clone = document.cloneNode(true) as Document;
    const parsed = new Readability(clone).parse();
    if (!parsed || !parsed.textContent?.trim()) {
      return { ok: false, error: 'Couldn’t find readable article content on this page.' };
    }
    return {
      ok: true,
      title: parsed.title || document.title,
      byline: parsed.byline || '',
      url: location.href,
      text: parsed.textContent.trim(),
      excerpt: parsed.excerpt || '',
      length: parsed.length || 0,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
