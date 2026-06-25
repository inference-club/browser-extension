// Render LLM responses as sanitized HTML. We parse GitHub-flavored markdown
// with `marked`, then sanitize with DOMPurify before the UI injects it via
// v-html — the model's output is untrusted, so never render it raw.

import { marked } from 'marked';
import DOMPurify from 'dompurify';

marked.setOptions({ gfm: true, breaks: true });

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function renderMarkdown(src: string): string {
  if (!src) return '';
  try {
    const html = marked.parse(src, { async: false }) as string;
    return DOMPurify.sanitize(html);
  } catch {
    // Never let a parse error (e.g. on partial input) break rendering.
    return `<p>${escapeHtml(src)}</p>`;
  }
}
