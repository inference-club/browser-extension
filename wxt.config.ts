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
    // `activeTab` + `scripting` let us read the current tab ONLY on a user
    // gesture (no broad host permissions). `contextMenus` returns in V1.
    permissions: ['activeTab', 'scripting', 'storage', 'sidePanel'],
    // Extension-context fetches (side panel) to these hosts bypass CORS thanks
    // to host_permissions — no server change needed. The API lives on the
    // `api.` subdomain; localhost (any port) covers local dev.
    host_permissions: [
      'https://api.inference.club/*',
      'https://inference.club/*',
      'http://localhost/*',
      'http://127.0.0.1/*',
    ],
    action: {
      default_title: 'inference.club',
    },
  },
});
