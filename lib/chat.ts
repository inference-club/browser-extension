// Streaming chat against /v1/chat/completions (OpenAI SSE shape).

import { apiFetch } from './api';

// Message content is either plain text or, for vision input, an array of parts
// (OpenAI-compatible multimodal format).
export type TextPart = { type: 'text'; text: string };
export type ImagePart = { type: 'image_url'; image_url: { url: string } };
export type MessageContent = string | Array<TextPart | ImagePart>;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: MessageContent;
}

export interface Usage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

// One streamed event: a content delta, and/or end-of-stream metadata. Most
// frames carry only `delta`; the final frame(s) may carry finishReason/usage.
export interface ChatChunk {
  delta?: string;
  finishReason?: string;
  usage?: Usage;
}

// Async generator that yields content deltas (plus trailing metadata) as they
// stream in.
export async function* streamChat(opts: {
  model: string;
  messages: ChatMessage[];
  signal?: AbortSignal;
}): AsyncGenerator<ChatChunk> {
  const res = await apiFetch('/v1/chat/completions', {
    method: 'POST',
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      stream: true,
      // Ask OpenAI-compatible servers to emit a final usage frame. Servers that
      // don't support it ignore the field; the caller falls back to estimates.
      stream_options: { include_usage: true },
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
        const chunk: ChatChunk = {};
        const delta: string | undefined = json?.choices?.[0]?.delta?.content;
        if (delta) chunk.delta = delta;
        const finish: string | undefined = json?.choices?.[0]?.finish_reason;
        if (finish) chunk.finishReason = finish;
        // The usage frame typically has an empty `choices` array.
        if (json?.usage) chunk.usage = json.usage as Usage;
        if (chunk.delta || chunk.finishReason || chunk.usage) yield chunk;
      } catch {
        // keep-alive / non-JSON frame — ignore
      }
    }
  }
}

// Non-streaming completion: returns the whole reply at once. Used when the user
// turns streaming off in settings.
export async function completeChat(opts: {
  model: string;
  messages: ChatMessage[];
  signal?: AbortSignal;
}): Promise<{ content: string; finishReason?: string; usage?: Usage }> {
  const res = await apiFetch('/v1/chat/completions', {
    method: 'POST',
    body: JSON.stringify({ model: opts.model, messages: opts.messages, stream: false }),
    signal: opts.signal,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`chat/completions → ${res.status} ${text.slice(0, 300)}`);
  }
  const json = await res.json();
  return {
    content: json?.choices?.[0]?.message?.content ?? '',
    finishReason: json?.choices?.[0]?.finish_reason,
    usage: json?.usage as Usage | undefined,
  };
}
