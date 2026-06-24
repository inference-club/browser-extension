<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getSettings } from '../../lib/settings';

const hasToken = ref(false);

onMounted(async () => {
  const s = await getSettings();
  hasToken.value = !!s.token;
});

// Open the side panel, optionally queuing an action for it to run on load.
async function openPanel(action?: 'summarize' | 'ask') {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (action) await chrome.storage.local.set({ pendingAction: action });
  if (tab?.windowId != null) {
    await chrome.sidePanel.open({ windowId: tab.windowId });
  }
  window.close();
}
</script>

<template>
  <div class="w-64 p-3 text-sm bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100">
    <div class="flex items-center gap-2 mb-3">
      <div class="h-6 w-6 rounded bg-indigo-600 text-white grid place-items-center text-xs font-bold">ic</div>
      <span class="font-semibold">inference.club</span>
    </div>

    <template v-if="hasToken">
      <button
        class="w-full mb-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white py-2 font-medium"
        @click="openPanel('summarize')"
      >
        Summarize this page
      </button>
      <button
        class="w-full mb-2 rounded-md border border-neutral-300 dark:border-neutral-700 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800"
        @click="openPanel('ask')"
      >
        Ask about this page
      </button>
      <button
        class="w-full rounded-md border border-neutral-300 dark:border-neutral-700 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800"
        @click="openPanel()"
      >
        Open panel
      </button>
    </template>

    <template v-else>
      <p class="text-neutral-600 dark:text-neutral-400 mb-3">
        Connect your inference.club account to get started.
      </p>
      <button
        class="w-full rounded-md bg-indigo-600 hover:bg-indigo-500 text-white py-2 font-medium"
        @click="openPanel()"
      >
        Connect account
      </button>
    </template>
  </div>
</template>
