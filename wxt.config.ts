import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'inference.club',
    description:
      'Summarize, ask, research, narrate and illustrate the page you are reading — using your own inference.club cluster.',
    permissions: ['activeTab', 'scripting', 'storage', 'sidePanel'],
    // Broad host permissions so the side panel can read whatever tab you switch
    // to (auto-follow), inject the extractor on demand, and fetch the API
    // without CORS issues. This is the "read your data on all websites" grant.
    host_permissions: ['https://*/*', 'http://*/*'],
    action: {
      default_title: 'inference.club',
    },
  },
});
