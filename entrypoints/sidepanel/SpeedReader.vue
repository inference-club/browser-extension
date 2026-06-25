<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';
import { tokenize, dwellMs } from '../../lib/reader';
import type { ReaderPrefs } from '../../lib/settings';

const props = defineProps<{
  text: string;
  title: string;
  prefs: ReaderPrefs;
}>();

const emit = defineEmits<{
  exit: [];
  'update:prefs': [ReaderPrefs];
}>();

const tokens = computed(() => tokenize(props.text));
const total = computed(() => tokens.value.length);

const index = ref(0);
const playing = ref(false);
let timer: number | null = null;

const current = computed(() => tokens.value[Math.min(index.value, total.value - 1)] ?? null);
const progress = computed(() => (total.value ? Math.round((index.value / total.value) * 100) : 0));
const done = computed(() => index.value >= total.value);

const fontStack = computed(() => {
  switch (props.prefs.fontFamily) {
    case 'serif':
      return 'ui-serif, Georgia, Cambria, "Times New Roman", serif';
    case 'mono':
      return 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    default:
      return 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  }
});

const focusColor = computed(() => (props.prefs.useThemeColor ? 'inherit' : props.prefs.color));

// Context words shown dimmed around the focus word.
const contextBefore = computed(() => {
  const n = props.prefs.contextWords;
  if (n <= 0) return [];
  return tokens.value.slice(Math.max(0, index.value - n), index.value).map((t) => t.text);
});
const contextAfter = computed(() => {
  const n = props.prefs.contextWords;
  if (n <= 0) return [];
  return tokens.value.slice(index.value + 1, index.value + 1 + n).map((t) => t.text);
});

function clearTimer() {
  if (timer != null) {
    clearTimeout(timer);
    timer = null;
  }
}

function schedule() {
  clearTimer();
  const tok = tokens.value[index.value];
  if (!tok) {
    playing.value = false;
    return;
  }
  timer = setTimeout(() => {
    index.value += 1;
    if (index.value >= total.value) {
      playing.value = false;
      index.value = total.value; // park at end so progress reads 100%
      return;
    }
    if (playing.value) schedule();
  }, dwellMs(tok, props.prefs.wpm)) as unknown as number;
}

function play() {
  if (!total.value) return;
  if (done.value) index.value = 0;
  playing.value = true;
  schedule();
}

function pause() {
  playing.value = false;
  clearTimer();
}

function toggle() {
  playing.value ? pause() : play();
}

function stop() {
  pause();
  index.value = 0;
}

function step(delta: number) {
  pause();
  index.value = Math.min(Math.max(0, index.value + delta), Math.max(0, total.value - 1));
}

function onScrub(e: Event) {
  pause();
  index.value = Number((e.target as HTMLInputElement).value);
}

function patchPrefs(patch: Partial<ReaderPrefs>) {
  emit('update:prefs', { ...props.prefs, ...patch });
}

// If the source text changes (different message/article), reset to the top.
watch(
  () => props.text,
  () => {
    pause();
    index.value = 0;
  },
);

onUnmounted(clearTimer);
</script>

<template>
  <div class="h-full flex flex-col bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100">
    <!-- Header -->
    <header class="flex items-center gap-2 px-3 py-2 border-b border-neutral-200 dark:border-neutral-800">
      <button
        class="rounded-md border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800"
        @click="emit('exit')"
      >← Exit</button>
      <span class="font-semibold flex-1 truncate text-sm">{{ title || 'Speed reader' }}</span>
      <span class="text-xs text-neutral-400 tabular-nums">{{ Math.min(index + 1, total) }}/{{ total }}</span>
    </header>

    <!-- Stage -->
    <div class="flex-1 flex flex-col items-center justify-center px-4 select-none">
      <!-- context before -->
      <div v-if="prefs.contextWords > 0" class="text-neutral-400 dark:text-neutral-500 text-center text-sm mb-3 leading-relaxed">
        {{ contextBefore.join(' ') }}
      </div>

      <!-- focus word with ORP pivot -->
      <div
        class="font-semibold leading-none text-center break-all"
        :style="{ fontFamily: fontStack, fontSize: prefs.fontSizePx + 'px', color: focusColor }"
      >
        <template v-if="current">
          <span>{{ current.text.slice(0, current.pivot) }}</span><span class="text-indigo-500">{{ current.text.charAt(current.pivot) }}</span><span>{{ current.text.slice(current.pivot + 1) }}</span>
        </template>
        <span v-else class="text-neutral-400 text-base font-normal">No text to read.</span>
      </div>

      <!-- context after -->
      <div v-if="prefs.contextWords > 0" class="text-neutral-400 dark:text-neutral-500 text-center text-sm mt-3 leading-relaxed">
        {{ contextAfter.join(' ') }}
      </div>
    </div>

    <!-- Scrubber -->
    <div class="px-4">
      <input
        type="range"
        min="0"
        :max="Math.max(0, total - 1)"
        :value="Math.min(index, Math.max(0, total - 1))"
        class="w-full accent-indigo-600"
        @input="onScrub"
      />
      <div class="flex justify-between text-[11px] text-neutral-400 -mt-1">
        <span>{{ progress }}%</span>
        <span>{{ prefs.wpm }} wpm</span>
      </div>
    </div>

    <!-- Transport controls -->
    <div class="flex items-center justify-center gap-2 px-4 py-3">
      <button class="rounded-md border border-neutral-300 dark:border-neutral-700 w-9 h-9 hover:bg-neutral-50 dark:hover:bg-neutral-800" title="Restart" @click="stop">⏮</button>
      <button class="rounded-md border border-neutral-300 dark:border-neutral-700 w-9 h-9 hover:bg-neutral-50 dark:hover:bg-neutral-800" title="Previous word" @click="step(-1)">◀</button>
      <button
        class="rounded-md bg-indigo-600 hover:bg-indigo-500 text-white w-14 h-9 font-medium"
        :disabled="!total"
        @click="toggle"
      >{{ playing ? 'Pause' : 'Play' }}</button>
      <button class="rounded-md border border-neutral-300 dark:border-neutral-700 w-9 h-9 hover:bg-neutral-50 dark:hover:bg-neutral-800" title="Next word" @click="step(1)">▶</button>
    </div>

    <!-- Live prefs -->
    <div class="px-4 pb-4 space-y-2 border-t border-neutral-100 dark:border-neutral-800 pt-3 text-xs">
      <label class="flex items-center gap-2">
        <span class="w-16 text-neutral-500">Speed</span>
        <input
          type="range" min="100" max="900" step="25" :value="prefs.wpm"
          class="flex-1 accent-indigo-600"
          @input="patchPrefs({ wpm: Number(($event.target as HTMLInputElement).value) })"
        />
        <span class="w-12 text-right tabular-nums">{{ prefs.wpm }}</span>
      </label>
      <label class="flex items-center gap-2">
        <span class="w-16 text-neutral-500">Size</span>
        <input
          type="range" min="24" max="96" step="2" :value="prefs.fontSizePx"
          class="flex-1 accent-indigo-600"
          @input="patchPrefs({ fontSizePx: Number(($event.target as HTMLInputElement).value) })"
        />
        <span class="w-12 text-right tabular-nums">{{ prefs.fontSizePx }}px</span>
      </label>
      <label class="flex items-center gap-2">
        <span class="w-16 text-neutral-500">Context</span>
        <input
          type="range" min="0" max="6" step="1" :value="prefs.contextWords"
          class="flex-1 accent-indigo-600"
          @input="patchPrefs({ contextWords: Number(($event.target as HTMLInputElement).value) })"
        />
        <span class="w-12 text-right tabular-nums">{{ prefs.contextWords }}</span>
      </label>
      <div class="flex items-center gap-2">
        <span class="w-16 text-neutral-500">Font</span>
        <select
          :value="prefs.fontFamily"
          class="flex-1 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-2 py-1"
          @change="patchPrefs({ fontFamily: ($event.target as HTMLSelectElement).value as ReaderPrefs['fontFamily'] })"
        >
          <option value="sans">Sans</option>
          <option value="serif">Serif</option>
          <option value="mono">Mono</option>
        </select>
        <input
          type="color"
          :value="prefs.color"
          :disabled="prefs.useThemeColor"
          class="h-7 w-9 rounded border border-neutral-300 dark:border-neutral-700 bg-transparent disabled:opacity-40"
          @input="patchPrefs({ color: ($event.target as HTMLInputElement).value })"
        />
        <label class="flex items-center gap-1 whitespace-nowrap">
          <input
            type="checkbox"
            :checked="prefs.useThemeColor"
            @change="patchPrefs({ useThemeColor: ($event.target as HTMLInputElement).checked })"
          />
          theme
        </label>
      </div>
    </div>
  </div>
</template>
