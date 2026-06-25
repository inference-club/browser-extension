<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getSettings } from '../../lib/settings';

const hasToken = ref(false);

onMounted(async () => {
  const s = await getSettings();
  hasToken.value = !!s.token;
});

// Open the side panel, optionally queuing an action for it to run on load.
async function openPanel(action?: 'summarize' | 'ask' | 'history') {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (action) await chrome.storage.local.set({ pendingAction: action });
  if (tab?.windowId != null) {
    await chrome.sidePanel.open({ windowId: tab.windowId });
  }
  window.close();
}
</script>

<template>
  <div class="w-64 p-3 text-sm bg-app text-content">
    <div class="flex items-center gap-2 mb-3">
      <div class="h-6 w-6 rounded bg-accent text-on-accent grid place-items-center text-xs font-bold">ic</div>
      <span class="font-semibold">inference.club</span>
    </div>

    <template v-if="hasToken">
      <button
        class="w-full mb-2 rounded-md bg-accent hover:bg-accent-hover text-on-accent py-2 font-medium"
        @click="openPanel('summarize')"
      >
        Summarize this page
      </button>
      <button
        class="w-full mb-2 rounded-md border border-line py-2 hover:bg-surface"
        @click="openPanel('ask')"
      >
        Ask about this page
      </button>
      <button
        class="w-full mb-2 rounded-md border border-line py-2 hover:bg-surface"
        @click="openPanel('history')"
      >
        History
      </button>
      <button
        class="w-full rounded-md border border-line py-2 hover:bg-surface"
        @click="openPanel()"
      >
        Open panel
      </button>
    </template>

    <template v-else>
      <p class="text-muted mb-3">
        Connect your inference.club account to get started.
      </p>
      <button
        class="w-full rounded-md bg-accent hover:bg-accent-hover text-on-accent py-2 font-medium"
        @click="openPanel()"
      >
        Connect account
      </button>
    </template>
  </div>
</template>
