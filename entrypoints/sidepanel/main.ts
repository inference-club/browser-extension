import { createApp } from 'vue';
import App from './App.vue';
import { initTheme } from '../../lib/theme';
import '../../lib/style.css';

// Apply the saved theme before mounting to avoid a flash of the wrong colors.
initTheme().finally(() => createApp(App).mount('#app'));
