import { Readability } from '@mozilla/readability';

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      if (msg?.type === 'EXTRACT_ARTICLE') {
        sendResponse(extractArticle());
      } else if (msg?.type === 'GET_SELECTION') {
        sendResponse({ text: window.getSelection()?.toString() ?? '' });
      }
      // synchronous response above; nothing async to keep open
      return false;
    });
  },
});

function extractArticle() {
  try {
    // Readability mutates the document, so parse a clone.
    const clone = document.cloneNode(true) as Document;
    const parsed = new Readability(clone).parse();
    if (!parsed || !parsed.textContent?.trim()) {
      return {
        ok: false,
        error: 'Couldn’t find readable article content on this page.',
      };
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
