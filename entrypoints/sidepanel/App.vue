<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import Onboarding from './Onboarding.vue';
import SpeedReader from './SpeedReader.vue';
import HistoryView from './HistoryView.vue';
import {
  getSettings,
  setSettings,
  clearCredentials,
  type Settings,
  type SummaryStyle,
  type ReaderPrefs,
} from '../../lib/settings';
import { applyTheme } from '../../lib/theme';
import { listModels } from '../../lib/api';
import { captureActiveTab, type Article } from '../../lib/extract';
import { streamChat, type ChatMessage } from '../../lib/chat';
import { summarizeMessages, askMessages, SUMMARY_STYLES, MAX_CHARS } from '../../lib/prompts';
import {
  type Conversation,
  type StoredMessage,
  type MessageMeta,
  normalizeUrl,
  findConversationByUrl,
  makeConversation,
  upsertConversation,
  getConversation,
  storageStats,
  newId,
} from '../../lib/conversations';

type View = 'loading' | 'onboarding' | 'main' | 'settings' | 'reader' | 'history';

const view = ref<View>('loading');
const settings = ref<Settings | null>(null);
const article = ref<Article | null>(null);
const conv = ref<Conversation | null>(null);

const running = ref(false);
const error = ref('');
const question = ref('');
const models = ref<string[]>([]);
const expanded = ref<Record<string, boolean>>({}); // advanced meta toggles per message
const stats = ref<{ bytes: number; threads: number; messages: number } | null>(null);

// Speed reader source.
const readerText = ref('');
const readerTitle = ref('');

const outputEl = ref<HTMLElement | null>(null);
let abort: AbortController | null = null;

const messages = computed(() => conv.value?.messages ?? []);
const wordCount = computed(() =>
  article.value?.text ? article.value.text.trim().split(/\s+/).length : 0,
);
const truncated = computed(() => (article.value?.text?.length ?? 0) > MAX_CHARS);

onMounted(init);

async function init() {
  settings.value = await getSettings();
  if (!settings.value.token) {
    view.value = 'onboarding';
    return;
  }
  view.value = 'main';
  await Promise.all([capture(), loadModels()]);
  await runPendingAction();
}

async function onConnected() {
  settings.value = await getSettings();
  view.value = 'main';
  await Promise.all([capture(), loadModels()]);
}

async function loadModels() {
  try {
    models.value = await listModels();
    if (settings.value && !settings.value.model && models.value.length) {
      await updateSetting('model', models.value[0]);
    }
  } catch {
    /* model list is best-effort */
  }
}

async function capture() {
  error.value = '';
  article.value = await captureActiveTab();
  if (!article.value.ok) {
    error.value = article.value.error ?? 'Could not read the page.';
    return;
  }
  // Resolve the thread for this page. Keep the current thread if we're just
  // re-extracting the same URL (so an unsaved in-progress thread isn't lost).
  const norm = normalizeUrl(article.value.url ?? '');
  if (conv.value && conv.value.url === norm) return;
  const existing = await findConversationByUrl(article.value.url ?? '');
  conv.value =
    existing ??
    makeConversation({
      url: article.value.url ?? '',
      title: article.value.title ?? '',
      byline: article.value.byline,
      now: Date.now(),
    });
}

async function runPendingAction() {
  const { pendingAction } = await chrome.storage.local.get('pendingAction');
  if (!pendingAction) return;
  await chrome.storage.local.remove('pendingAction');
  if (pendingAction === 'summarize') summarize();
  else if (pendingAction === 'history') view.value = 'history';
  // 'ask' just focuses the panel; the user types a question.
}

async function updateSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
  if (!settings.value) return;
  settings.value = { ...settings.value, [key]: value };
  await setSettings({ [key]: value } as Partial<Settings>);
  if (key === 'theme') applyTheme(value as Settings['theme']);
}

function newChat() {
  if (!article.value?.ok) return;
  conv.value = makeConversation({
    url: article.value.url ?? '',
    title: article.value.title ?? '',
    byline: article.value.byline,
    now: Date.now(),
  });
  error.value = '';
}

function stop() {
  abort?.abort();
  abort = null;
  running.value = false;
}

function scrollToBottom() {
  nextTick(() => {
    if (outputEl.value) outputEl.value.scrollTop = outputEl.value.scrollHeight;
  });
}

// Core streaming: appends an assistant message and fills it from the stream,
// recording timing/usage/finish metadata for advanced mode, then persists.
async function runCompletion(
  reqMessages: ChatMessage[],
  meta: Pick<MessageMeta, 'kind' | 'summaryStyle'>,
) {
  if (!settings.value?.model) {
    error.value = 'No model selected (open settings).';
    return;
  }
  if (!conv.value) return;
  error.value = '';
  running.value = true;
  abort = new AbortController();

  const requestChars = reqMessages.reduce((n, m) => n + m.content.length, 0);
  const assistant: StoredMessage = {
    id: newId(),
    role: 'assistant',
    content: '',
    ts: Date.now(),
    meta: {
      model: settings.value.model,
      kind: meta.kind,
      summaryStyle: meta.summaryStyle,
      requestChars,
      truncated: truncated.value,
    },
  };
  conv.value.messages.push(assistant);
  scrollToBottom();

  const start = performance.now();
  let firstAt: number | undefined;
  let finishReason: string | undefined;
  let usage: MessageMeta['usage'];
  let aborted = false;

  try {
    for await (const chunk of streamChat({
      model: settings.value.model,
      messages: reqMessages,
      signal: abort.signal,
    })) {
      if (chunk.delta) {
        if (firstAt === undefined) firstAt = performance.now() - start;
        assistant.content += chunk.delta;
      }
      if (chunk.finishReason) finishReason = chunk.finishReason;
      if (chunk.usage) usage = chunk.usage;
    }
  } catch (e) {
    if ((e as Error).name === 'AbortError') aborted = true;
    else error.value = e instanceof Error ? e.message : String(e);
  } finally {
    running.value = false;
    abort = null;
    assistant.meta = {
      ...assistant.meta,
      msToFirstToken: firstAt,
      msTotal: performance.now() - start,
      finishReason: finishReason ?? (aborted ? 'aborted' : undefined),
      usage,
    };
    conv.value.updatedAt = Date.now();
    await upsertConversation(JSON.parse(JSON.stringify(conv.value)));
    scrollToBottom();
  }
}

function summarize() {
  if (!article.value?.ok || running.value) return;
  const style = settings.value!.summaryStyle;
  const label = SUMMARY_STYLES.find((s) => s.value === style)?.label ?? style;
  conv.value?.messages.push({
    id: newId(),
    role: 'user',
    content: `Summarize this page (${label})`,
    ts: Date.now(),
  });
  scrollToBottom();
  runCompletion(summarizeMessages(article.value, style), { kind: 'summary', summaryStyle: style });
}

function ask() {
  if (!article.value?.ok || running.value || !question.value.trim()) return;
  const q = question.value.trim();
  question.value = '';
  // Multi-turn: prior thread turns become history (capped to bound tokens).
  const history: ChatMessage[] = messages.value
    .filter((m) => m.content)
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.content }));
  conv.value?.messages.push({ id: newId(), role: 'user', content: q, ts: Date.now() });
  scrollToBottom();
  runCompletion(askMessages(article.value, q, history), { kind: 'ask' });
}

function openReader(text: string, title: string) {
  if (!text.trim()) return;
  readerText.value = text;
  readerTitle.value = title;
  view.value = 'reader';
}

function readArticle() {
  if (!article.value?.ok || !article.value.text) return;
  openReader(article.value.text, article.value.title || 'Article');
}

async function loadThread(id: string) {
  const c = await getConversation(id);
  if (!c) return;
  conv.value = c;
  view.value = 'main';
}

async function openSettings() {
  view.value = 'settings';
  stats.value = await storageStats();
}

async function disconnect() {
  await clearCredentials();
  settings.value = await getSettings();
  conv.value = null;
  view.value = 'onboarding';
}

function openSite() {
  // Dashboard lives on the site origin, not the api. subdomain.
  const base = settings.value?.baseUrl ?? 'https://api.inference.club';
  const site = base.replace(/\/+$/, '').replace('://api.', '://');
  chrome.tabs.create({ url: `${site}/dashboard` });
}

// Advanced-mode formatting helpers.
function tokenLabel(m: StoredMessage): string {
  const u = m.meta?.usage;
  if (u?.total_tokens != null) {
    return `${u.prompt_tokens ?? '?'}+${u.completion_tokens ?? '?'} = ${u.total_tokens} tok`;
  }
  return `~${Math.ceil((m.content.length || 0) / 4)} tok (est)`;
}
function ms(n?: number): string {
  return n == null ? '—' : `${(n / 1000).toFixed(2)}s`;
}
function bytesLabel(n: number): string {
  return n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(2)} MB`;
}

// Auto-scroll as the latest message streams in.
watch(() => messages.value.at(-1)?.content, scrollToBottom);
</script>

<template>
  <div class="h-full flex flex-col bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 text-sm">
    <Onboarding v-if="view === 'onboarding'" @connected="onConnected" />

    <div v-else-if="view === 'loading'" class="p-5 text-neutral-500">Loading…</div>

    <SpeedReader
      v-else-if="view === 'reader'"
      :text="readerText"
      :title="readerTitle"
      :prefs="settings!.reader"
      @exit="view = 'main'"
      @update:prefs="updateSetting('reader', $event)"
    />

    <HistoryView
      v-else-if="view === 'history'"
      @exit="view = 'main'"
      @open="loadThread"
    />

    <template v-else>
      <!-- Header -->
      <header class="flex items-center gap-2 px-3 py-2 border-b border-neutral-200 dark:border-neutral-800">
        <div class="h-6 w-6 rounded bg-indigo-600 text-white grid place-items-center text-xs font-bold">ic</div>
        <span class="font-semibold flex-1 truncate">{{ article?.title || 'inference.club' }}</span>
        <button class="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200" title="History" @click="view = 'history'">🕘</button>
        <button class="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200" title="Re-extract" @click="capture">⟳</button>
        <button
          class="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
          title="Settings"
          @click="view === 'settings' ? (view = 'main') : openSettings()"
        >⚙</button>
      </header>

      <!-- Settings -->
      <section v-if="view === 'settings'" class="flex-1 overflow-y-auto p-4 space-y-5">
        <div>
          <label class="block text-xs font-medium mb-1">Model</label>
          <select
            :value="settings?.model"
            class="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-2 py-1.5"
            @change="updateSetting('model', ($event.target as HTMLSelectElement).value)"
          >
            <option v-for="m in models" :key="m" :value="m">{{ m }}</option>
            <option v-if="!models.length" :value="settings?.model">{{ settings?.model || '(none)' }}</option>
          </select>
        </div>

        <!-- Appearance -->
        <div>
          <label class="block text-xs font-medium mb-1">Appearance</label>
          <div class="inline-flex rounded-md border border-neutral-300 dark:border-neutral-700 overflow-hidden">
            <button
              v-for="t in (['system', 'light', 'dark'] as const)"
              :key="t"
              class="px-3 py-1.5 capitalize"
              :class="settings?.theme === t ? 'bg-indigo-600 text-white' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800'"
              @click="updateSetting('theme', t)"
            >{{ t }}</button>
          </div>
        </div>

        <!-- Advanced mode -->
        <label class="flex items-center gap-2">
          <input
            type="checkbox"
            :checked="settings?.advancedMode"
            @change="updateSetting('advancedMode', ($event.target as HTMLInputElement).checked)"
          />
          <span class="text-xs font-medium">Advanced mode</span>
          <span class="text-xs text-neutral-400">— show timings, tokens & page metadata</span>
        </label>

        <!-- Reader defaults -->
        <div class="space-y-2">
          <label class="block text-xs font-medium">Speed reader defaults</label>
          <div class="flex items-center gap-2 text-xs">
            <span class="w-20 text-neutral-500">Speed</span>
            <input type="range" min="100" max="900" step="25" :value="settings?.reader.wpm" class="flex-1 accent-indigo-600"
              @input="updateSetting('reader', { ...settings!.reader, wpm: Number(($event.target as HTMLInputElement).value) })" />
            <span class="w-14 text-right tabular-nums">{{ settings?.reader.wpm }} wpm</span>
          </div>
          <div class="flex items-center gap-2 text-xs">
            <span class="w-20 text-neutral-500">Font size</span>
            <input type="range" min="24" max="96" step="2" :value="settings?.reader.fontSizePx" class="flex-1 accent-indigo-600"
              @input="updateSetting('reader', { ...settings!.reader, fontSizePx: Number(($event.target as HTMLInputElement).value) })" />
            <span class="w-14 text-right tabular-nums">{{ settings?.reader.fontSizePx }}px</span>
          </div>
          <div class="flex items-center gap-2 text-xs">
            <span class="w-20 text-neutral-500">Context</span>
            <input type="range" min="0" max="6" step="1" :value="settings?.reader.contextWords" class="flex-1 accent-indigo-600"
              @input="updateSetting('reader', { ...settings!.reader, contextWords: Number(($event.target as HTMLInputElement).value) })" />
            <span class="w-14 text-right tabular-nums">{{ settings?.reader.contextWords }} words</span>
          </div>
        </div>

        <!-- Data -->
        <div class="space-y-2">
          <label class="block text-xs font-medium">Data</label>
          <p v-if="stats" class="text-xs text-neutral-500">
            {{ stats.threads }} threads · {{ stats.messages }} messages · {{ bytesLabel(stats.bytes) }} stored
          </p>
        </div>

        <div class="flex gap-2">
          <button class="rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-800" @click="openSite">Open dashboard</button>
          <button class="rounded-md border border-red-300 text-red-600 px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950" @click="disconnect">Disconnect</button>
        </div>
      </section>

      <!-- Main -->
      <template v-else>
        <div class="px-3 py-2 text-xs text-neutral-500 flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800">
          <span v-if="article?.ok">{{ wordCount }} words</span>
          <span v-if="article?.byline" class="truncate">· {{ article.byline }}</span>
          <span class="ml-auto truncate">{{ settings?.model }}</span>
        </div>

        <!-- Actions -->
        <div class="p-3 flex flex-wrap items-center gap-2 border-b border-neutral-100 dark:border-neutral-800">
          <button
            class="rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-3 py-1.5 font-medium"
            :disabled="!article?.ok || running"
            @click="summarize"
          >Summarize</button>
          <select
            :value="settings?.summaryStyle"
            class="rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-2 py-1.5 text-xs"
            @change="updateSetting('summaryStyle', ($event.target as HTMLSelectElement).value as SummaryStyle)"
          >
            <option v-for="s in SUMMARY_STYLES" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>
          <button
            class="rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-1.5 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50"
            :disabled="!article?.ok"
            title="Speed read the article"
            @click="readArticle"
          >⚡ Read</button>
          <button
            v-if="messages.length"
            class="rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-1.5 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800"
            @click="newChat"
          >New chat</button>
          <button v-if="running" class="rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-1.5" @click="stop">Stop</button>
        </div>

        <!-- Page details (advanced) -->
        <details v-if="settings?.advancedMode && article?.ok" class="px-3 py-2 border-b border-neutral-100 dark:border-neutral-800 text-xs">
          <summary class="cursor-pointer text-neutral-500">Page details</summary>
          <dl class="mt-2 grid grid-cols-[7rem_1fr] gap-x-2 gap-y-1 text-neutral-500">
            <dt>URL</dt><dd class="truncate text-neutral-700 dark:text-neutral-300">{{ article.url }}</dd>
            <dt>Site</dt><dd class="truncate">{{ article.siteName || '—' }}</dd>
            <dt>Lang / dir</dt><dd>{{ article.lang || '—' }} / {{ article.dir || '—' }}</dd>
            <dt>Published</dt><dd>{{ article.publishedTime || '—' }}</dd>
            <dt>Readability len</dt><dd>{{ article.length ?? '—' }}</dd>
            <dt>Chars / words</dt><dd>{{ article.text?.length ?? 0 }} / {{ wordCount }}</dd>
            <dt>Truncated</dt><dd>{{ truncated ? `yes (capped at ${MAX_CHARS})` : 'no' }}</dd>
          </dl>
        </details>

        <!-- Thread -->
        <div ref="outputEl" class="flex-1 overflow-y-auto p-3 space-y-3">
          <p v-if="error" class="text-red-600">{{ error }}</p>
          <p v-if="!messages.length && !error" class="text-neutral-400">
            Summarize the page, or ask a question below.
          </p>

          <div v-for="m in messages" :key="m.id">
            <!-- User -->
            <div v-if="m.role === 'user'" class="flex justify-end">
              <div class="max-w-[85%] rounded-lg bg-indigo-600 text-white px-3 py-2 whitespace-pre-wrap">{{ m.content }}</div>
            </div>

            <!-- Assistant -->
            <div v-else class="space-y-1">
              <div class="rounded-lg bg-neutral-100 dark:bg-neutral-800 px-3 py-2 whitespace-pre-wrap leading-relaxed">{{ m.content || (running ? '…' : '') }}</div>
              <div class="flex items-center gap-3 px-1 text-[11px] text-neutral-400">
                <button class="hover:text-indigo-600" title="Speed read this answer" @click="openReader(m.content, 'AI response')">⚡ Speed read</button>
                <button v-if="settings?.advancedMode" class="hover:text-neutral-700 dark:hover:text-neutral-200" @click="expanded[m.id] = !expanded[m.id]">
                  {{ expanded[m.id] ? 'Hide details' : 'Details' }}
                </button>
              </div>
              <dl v-if="settings?.advancedMode && expanded[m.id]" class="mx-1 mb-1 grid grid-cols-[7rem_1fr] gap-x-2 gap-y-1 text-[11px] text-neutral-500 bg-neutral-50 dark:bg-neutral-800/50 rounded p-2">
                <dt>Model</dt><dd class="truncate">{{ m.meta?.model || '—' }}</dd>
                <dt>Action</dt><dd>{{ m.meta?.kind }}{{ m.meta?.summaryStyle ? ` · ${m.meta.summaryStyle}` : '' }}</dd>
                <dt>First token</dt><dd>{{ ms(m.meta?.msToFirstToken) }}</dd>
                <dt>Total</dt><dd>{{ ms(m.meta?.msTotal) }}</dd>
                <dt>Tokens</dt><dd>{{ tokenLabel(m) }}</dd>
                <dt>Request</dt><dd>{{ m.meta?.requestChars ?? '—' }} chars{{ m.meta?.truncated ? ' · truncated' : '' }}</dd>
                <dt>Finish</dt><dd>{{ m.meta?.finishReason || '—' }}</dd>
              </dl>
            </div>
          </div>
        </div>

        <!-- Ask -->
        <div class="p-3 border-t border-neutral-200 dark:border-neutral-800 flex gap-2">
          <input
            v-model="question"
            placeholder="Ask about this page…"
            class="flex-1 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2"
            :disabled="!article?.ok || running"
            @keydown.enter="ask"
          />
          <button
            class="rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-3 py-2"
            :disabled="!article?.ok || running || !question.trim()"
            @click="ask"
          >Ask</button>
        </div>
      </template>
    </template>
  </div>
</template>
