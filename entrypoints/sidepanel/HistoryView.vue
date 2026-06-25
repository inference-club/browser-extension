<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  listConversations,
  groupByHost,
  deleteConversation,
  clearAll,
  type Conversation,
} from '../../lib/conversations';

const emit = defineEmits<{
  exit: [];
  open: [string]; // conversation id
}>();

const conversations = ref<Conversation[]>([]);
const filter = ref('');
const collapsed = ref<Record<string, boolean>>({});

onMounted(reload);

async function reload() {
  conversations.value = await listConversations();
}

const filtered = computed(() => {
  const q = filter.value.trim().toLowerCase();
  if (!q) return conversations.value;
  return conversations.value.filter((c) => {
    if (c.host.toLowerCase().includes(q)) return true;
    if (c.title.toLowerCase().includes(q)) return true;
    if (c.url.toLowerCase().includes(q)) return true;
    return c.messages.some((m) => m.content.toLowerCase().includes(q));
  });
});

const groups = computed(() => groupByHost(filtered.value));

function snippet(c: Conversation): string {
  const last = c.messages[c.messages.length - 1];
  return last ? last.content.replace(/\s+/g, ' ').slice(0, 120) : '';
}

function when(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
    ', ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function openPage(url: string) {
  chrome.tabs.create({ url });
}

async function remove(id: string) {
  await deleteConversation(id);
  await reload();
}

async function wipe() {
  if (!confirm('Delete all chat history? This cannot be undone.')) return;
  await clearAll();
  await reload();
}
</script>

<template>
  <div class="h-full flex flex-col bg-app text-content">
    <header class="flex items-center gap-2 px-3 py-2 border-b border-line">
      <button
        class="rounded-md border border-line px-2 py-1 text-xs hover:bg-surface"
        @click="emit('exit')"
      >← Back</button>
      <span class="font-semibold flex-1 text-sm">History</span>
      <button
        v-if="conversations.length"
        class="text-xs text-red-500 hover:underline"
        @click="wipe"
      >Clear all</button>
    </header>

    <div class="p-3 border-b border-line">
      <input
        v-model="filter"
        placeholder="Filter by site, title, or text…"
        class="w-full rounded-md border border-line bg-transparent px-3 py-1.5 text-sm"
      />
    </div>

    <div class="flex-1 overflow-y-auto">
      <p v-if="!groups.length" class="p-5 text-muted text-sm">
        {{ conversations.length ? 'No threads match your filter.' : 'No saved chats yet. Summarize or ask about a page to start a thread.' }}
      </p>

      <div v-for="g in groups" :key="g.host" class="border-b border-line">
        <button
          class="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface"
          @click="collapsed[g.host] = !collapsed[g.host]"
        >
          <span class="text-muted text-xs w-3">{{ collapsed[g.host] ? '▸' : '▾' }}</span>
          <span class="font-medium text-sm truncate flex-1">{{ g.host }}</span>
          <span class="text-xs text-muted">{{ g.items.length }}</span>
        </button>

        <ul v-show="!collapsed[g.host]">
          <li
            v-for="c in g.items"
            :key="c.id"
            class="px-3 py-2 pl-8 border-t border-line hover:bg-surface"
          >
            <div class="flex items-start gap-2">
              <button class="flex-1 text-left min-w-0" @click="emit('open', c.id)">
                <div class="text-sm font-medium truncate">{{ c.title }}</div>
                <div class="text-xs text-muted truncate">{{ snippet(c) }}</div>
                <div class="text-[11px] text-muted mt-0.5">
                  {{ when(c.updatedAt) }} · {{ c.messages.length }} msg
                </div>
              </button>
              <div class="flex flex-col gap-1 shrink-0">
                <button class="text-muted hover:text-accent" title="Open source page" @click="openPage(c.url)">↗</button>
                <button class="text-muted hover:text-red-500" title="Delete thread" @click="remove(c.id)">✕</button>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
