<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import Onboarding from './Onboarding.vue';
import { getSettings, setSettings, clearCredentials, type Settings, type SummaryStyle } from '../../lib/settings';
import { listModels } from '../../lib/api';
import { captureActiveTab, type Article } from '../../lib/extract';
import { streamChat, type ChatMessage } from '../../lib/chat';
import { summarizeMessages, askMessages, SUMMARY_STYLES } from '../../lib/prompts';

type View = 'loading' | 'onboarding' | 'main' | 'settings';

const view = ref<View>('loading');
const settings = ref<Settings | null>(null);
const article = ref<Article | null>(null);

const output = ref('');
const running = ref(false);
const error = ref('');
const question = ref('');
const models = ref<string[]>([]);

let abort: AbortController | null = null;

const wordCount = computed(() =>
  article.value?.text ? article.value.text.trim().split(/\s+/).length : 0,
);

onMounted(async () => {
  await init();
});

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
  if (!article.value.ok) error.value = article.value.error ?? 'Could not read the page.';
}

async function runPendingAction() {
  const { pendingAction } = await chrome.storage.local.get('pendingAction');
  if (!pendingAction) return;
  await chrome.storage.local.remove('pendingAction');
  if (pendingAction === 'summarize') summarize();
  // 'ask' just focuses the panel; the user types a question.
}

async function updateSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
  if (!settings.value) return;
  settings.value = { ...settings.value, [key]: value };
  await setSettings({ [key]: value } as Partial<Settings>);
}

function stop() {
  abort?.abort();
  abort = null;
  running.value = false;
}

async function stream(messages: ChatMessage[]) {
  if (!settings.value?.model) {
    error.value = 'No model selected (open settings).';
    return;
  }
  error.value = '';
  output.value = '';
  running.value = true;
  abort = new AbortController();
  try {
    for await (const delta of streamChat({
      model: settings.value.model,
      messages,
      signal: abort.signal,
    })) {
      output.value += delta;
    }
  } catch (e) {
    if ((e as Error).name !== 'AbortError') {
      error.value = e instanceof Error ? e.message : String(e);
    }
  } finally {
    running.value = false;
    abort = null;
  }
}

function summarize() {
  if (!article.value?.ok) return;
  stream(summarizeMessages(article.value, settings.value!.summaryStyle));
}

function ask() {
  if (!article.value?.ok || !question.value.trim()) return;
  const q = question.value.trim();
  question.value = '';
  stream(askMessages(article.value, q, []));
}

async function disconnect() {
  await clearCredentials();
  settings.value = await getSettings();
  view.value = 'onboarding';
}

function openSite() {
  chrome.tabs.create({ url: `${settings.value?.baseUrl ?? 'https://inference.club'}/dashboard` });
}
</script>

<template>
  <div class="h-full flex flex-col bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 text-sm">
    <Onboarding v-if="view === 'onboarding'" @connected="onConnected" />

    <div v-else-if="view === 'loading'" class="p-5 text-neutral-500">Loading…</div>

    <template v-else>
      <!-- Header -->
      <header class="flex items-center gap-2 px-3 py-2 border-b border-neutral-200 dark:border-neutral-800">
        <div class="h-6 w-6 rounded bg-indigo-600 text-white grid place-items-center text-xs font-bold">ic</div>
        <span class="font-semibold flex-1 truncate">{{ article?.title || 'inference.club' }}</span>
        <button class="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200" title="Re-extract" @click="capture">⟳</button>
        <button
          class="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
          title="Settings"
          @click="view = view === 'settings' ? 'main' : 'settings'"
        >⚙</button>
      </header>

      <!-- Settings -->
      <section v-if="view === 'settings'" class="p-4 space-y-4">
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
          <button v-if="running" class="rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-1.5" @click="stop">Stop</button>
        </div>

        <!-- Output -->
        <div class="flex-1 overflow-y-auto p-4">
          <p v-if="error" class="text-red-600">{{ error }}</p>
          <pre v-if="output" class="whitespace-pre-wrap font-sans leading-relaxed">{{ output }}</pre>
          <p v-else-if="!running && !error" class="text-neutral-400">
            Summarize the page, or ask a question below.
          </p>
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
