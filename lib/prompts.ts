// Prompt construction for the reading actions. Kept separate so prompts are
// easy to tune without touching UI or transport code.

import type { Article } from './extract';
import type { ChatMessage } from './chat';
import type { SummaryStyle } from './settings';

// Cap article text so we stay within typical context windows. The cluster's
// default tool model has a modest window (see PRD 14 §3); be conservative.
export const MAX_CHARS = 24000;

const STYLE_INSTRUCTION: Record<SummaryStyle, string> = {
  tldr: 'Write a concise 2–3 sentence TL;DR of the article.',
  bullets: 'Summarize the article as 5–8 tight, information-dense bullet points.',
  eli5: 'Explain what the article says simply, as if to a smart 12-year-old.',
  takeaways: 'List the key takeaways and any actionable insights from the article.',
};

export const SUMMARY_STYLES: { value: SummaryStyle; label: string }[] = [
  { value: 'bullets', label: 'Bullets' },
  { value: 'tldr', label: 'TL;DR' },
  { value: 'takeaways', label: 'Takeaways' },
  { value: 'eli5', label: 'ELI5' },
];

function articleBlock(article: Article): string {
  const text = (article.text ?? '').slice(0, MAX_CHARS);
  const truncated = (article.text?.length ?? 0) > MAX_CHARS ? '\n\n…(truncated)' : '';
  return `Title: ${article.title ?? ''}\nURL: ${article.url ?? ''}\n\nArticle:\n${text}${truncated}`;
}

export function summarizeMessages(article: Article, style: SummaryStyle): ChatMessage[] {
  return [
    {
      role: 'system',
      content:
        'You are a precise reading assistant. Base your answer only on the provided article text. If something is not present, say so rather than inventing it.',
    },
    {
      role: 'user',
      content: `${STYLE_INSTRUCTION[style]}\n\n${articleBlock(article)}`,
    },
  ];
}

export function askMessages(
  article: Article,
  question: string,
  history: ChatMessage[],
): ChatMessage[] {
  return [
    {
      role: 'system',
      content: `You are a reading assistant answering questions about the article below. Prefer the article; if you must go beyond it, say so.\n\n${articleBlock(article)}`,
    },
    ...history,
    { role: 'user', content: question },
  ];
}
