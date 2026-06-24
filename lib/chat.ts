// Streaming chat against /v1/chat/completions (OpenAI SSE shape).

import { apiFetch } from './api';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Async generator that yields content deltas as they stream in.
export async function* streamChat(opts: {
  model: string;
  messages: ChatMessage[];
  signal?: AbortSignal;
}): AsyncGenerator<string> {
  const res = await apiFetch('/v1/chat/completions', {
    method: 'POST',
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      stream: true,
    }),
    signal: opts.signal,
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => '');
    throw new Error(`chat/completions → ${res.status} ${text.slice(0, 300)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE frames are separated by blank lines; handle line-by-line `data:`.
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const raw of lines) {
      const line = raw.trim();
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (payload === '[DONE]') return;
      try {
        const json = JSON.parse(payload);
        const delta: string | undefined = json?.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch {
        // keep-alive / non-JSON frame — ignore
      }
    }
  }
}
