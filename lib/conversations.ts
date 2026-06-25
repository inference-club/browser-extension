// Persistent chat threads, keyed by URL. Stored in chrome.storage.local as a
// single map under `conversations` (Record<id, Conversation>). Threads are
// created lazily — only persisted once they have at least one message — so we
// never accumulate empty threads from merely opening the panel on a page.

import type { SummaryStyle } from './settings';

export interface MessageMeta {
  model?: string;
  kind?: 'summary' | 'ask';
  summaryStyle?: SummaryStyle;
  msToFirstToken?: number;
  msTotal?: number;
  finishReason?: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  requestChars?: number;
  truncated?: boolean;
}

export interface StoredMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  ts: number;
  meta?: MessageMeta;
}

export interface Conversation {
  id: string;
  url: string; // normalized: full URL minus #hash
  host: string; // hostname, for grouping/filtering in history
  title: string;
  byline?: string;
  createdAt: number;
  updatedAt: number;
  messages: StoredMessage[];
}

const KEY = 'conversations';

/** Normalize a URL for thread keying: drop the hash, keep path + query. */
export function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw);
    u.hash = '';
    return u.toString();
  } catch {
    return raw;
  }
}

export function hostOf(raw: string): string {
  try {
    return new URL(raw).hostname;
  } catch {
    return raw;
  }
}

export function newId(): string {
  return crypto.randomUUID();
}

async function readMap(): Promise<Record<string, Conversation>> {
  const { [KEY]: map } = await chrome.storage.local.get(KEY);
  return (map as Record<string, Conversation>) ?? {};
}

async function writeMap(map: Record<string, Conversation>): Promise<void> {
  await chrome.storage.local.set({ [KEY]: map });
}

/** All conversations, most-recently-updated first. */
export async function listConversations(): Promise<Conversation[]> {
  const map = await readMap();
  return Object.values(map).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getConversation(id: string): Promise<Conversation | null> {
  const map = await readMap();
  return map[id] ?? null;
}

/** The most recently updated stored thread for a (normalized) URL, if any. */
export async function findConversationByUrl(url: string): Promise<Conversation | null> {
  const norm = normalizeUrl(url);
  const matches = (await listConversations()).filter((c) => c.url === norm);
  return matches[0] ?? null;
}

/** Build a fresh, unsaved conversation for the given page. */
export function makeConversation(opts: {
  url: string;
  title: string;
  byline?: string;
  now: number;
}): Conversation {
  return {
    id: newId(),
    url: normalizeUrl(opts.url),
    host: hostOf(opts.url),
    title: opts.title || normalizeUrl(opts.url),
    byline: opts.byline,
    createdAt: opts.now,
    updatedAt: opts.now,
    messages: [],
  };
}

/** Insert or replace a conversation. */
export async function upsertConversation(conv: Conversation): Promise<void> {
  const map = await readMap();
  map[conv.id] = conv;
  await writeMap(map);
}

export async function deleteConversation(id: string): Promise<void> {
  const map = await readMap();
  delete map[id];
  await writeMap(map);
}

export async function clearAll(): Promise<void> {
  await chrome.storage.local.remove(KEY);
}

/** Group conversations by hostname for the history view. */
export function groupByHost(convs: Conversation[]): { host: string; items: Conversation[] }[] {
  const groups = new Map<string, Conversation[]>();
  for (const c of convs) {
    const arr = groups.get(c.host) ?? [];
    arr.push(c);
    groups.set(c.host, arr);
  }
  return [...groups.entries()]
    .map(([host, items]) => ({ host, items }))
    .sort((a, b) => (b.items[0]?.updatedAt ?? 0) - (a.items[0]?.updatedAt ?? 0));
}

export async function storageStats(): Promise<{ bytes: number; threads: number; messages: number }> {
  const [bytes, convs] = await Promise.all([
    chrome.storage.local.getBytesInUse(KEY),
    listConversations(),
  ]);
  return {
    bytes,
    threads: convs.length,
    messages: convs.reduce((n, c) => n + c.messages.length, 0),
  };
}
