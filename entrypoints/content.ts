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
      } else if (msg?.type === 'LIST_IMAGES') {
        sendResponse({ ok: true, images: listImages() });
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
      siteName: parsed.siteName || '',
      dir: parsed.dir || '',
      lang: parsed.lang || document.documentElement.lang || '',
      publishedTime: parsed.publishedTime || '',
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

// Collect meaningful images on the page (skip tiny icons/spacers, dedupe by src).
function listImages() {
  const seen = new Set<string>();
  const out: { src: string; alt: string; w: number; h: number }[] = [];
  for (const img of Array.from(document.images)) {
    const src = img.currentSrc || img.src;
    if (!src || src.startsWith('data:image/svg')) continue;
    if (img.naturalWidth < 64 || img.naturalHeight < 64) continue;
    if (seen.has(src)) continue;
    seen.add(src);
    out.push({ src, alt: img.alt || '', w: img.naturalWidth, h: img.naturalHeight });
    if (out.length >= 60) break;
  }
  return out;
}
