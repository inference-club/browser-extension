<script setup lang="ts">
import { ref } from 'vue';
import { setSettings, DEFAULTS } from '../../lib/settings';
import { verifyConnection } from '../../lib/api';

const emit = defineEmits<{ connected: [] }>();

const baseUrl = ref(DEFAULTS.baseUrl);
const token = ref('');
const checking = ref(false);
const error = ref('');

async function connect() {
  error.value = '';
  if (!token.value.trim()) {
    error.value = 'Paste your API token.';
    return;
  }
  checking.value = true;
  // Persist first so verifyConnection() reads the new values.
  await setSettings({ baseUrl: baseUrl.value.trim(), token: token.value.trim() });
  const res = await verifyConnection();
  checking.value = false;
  if (res.ok) {
    // Default the model to the first available one if unset.
    if (res.models?.length) await setSettings({ model: res.models[0] });
    emit('connected');
  } else {
    error.value = `Could not connect: ${res.error}`;
  }
}
</script>

<template>
  <div class="p-5 max-w-md mx-auto">
    <div class="flex items-center gap-2 mb-4">
      <div class="h-7 w-7 rounded bg-accent text-on-accent grid place-items-center text-sm font-bold">ic</div>
      <h1 class="text-lg font-semibold">Connect inference.club</h1>
    </div>

    <p class="text-sm text-muted mb-4">
      Paste your API token. Find it in your
      <a
        class="text-accent underline"
        href="https://inference.club/dashboard/settings"
        target="_blank"
        rel="noopener"
        >account settings</a
      >. It’s stored only in this browser.
    </p>

    <label class="block text-xs font-medium mb-1 text-content">API token</label>
    <input
      v-model="token"
      type="password"
      placeholder="paste your token"
      class="w-full mb-3 rounded-md border border-line bg-transparent px-3 py-2 text-sm"
      @keydown.enter="connect"
    />

    <label class="block text-xs font-medium mb-1 text-content">Base URL</label>
    <input
      v-model="baseUrl"
      type="text"
      class="w-full mb-4 rounded-md border border-line bg-transparent px-3 py-2 text-sm"
    />

    <p v-if="error" class="text-sm text-red-500 mb-3">{{ error }}</p>

    <button
      :disabled="checking"
      class="w-full rounded-md bg-accent hover:bg-accent-hover disabled:opacity-50 text-on-accent py-2 font-medium"
      @click="connect"
    >
      {{ checking ? 'Connecting…' : 'Connect' }}
    </button>
  </div>
</template>
