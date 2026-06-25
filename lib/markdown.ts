// Render LLM responses as sanitized HTML. We parse GitHub-flavored markdown
// with `marked`, then sanitize with DOMPurify before the UI injects it via
// v-html — the model's output is untrusted, so never render it raw.

import { marked } from 'marked';
import DOMPurify from 'dompurify';

marked.setOptions({ gfm: true, breaks: true });

export function renderMarkdown(src: string): string {
  if (!src) return '';
  const html = marked.parse(src, { async: false }) as string;
  return DOMPurify.sanitize(html);
}
