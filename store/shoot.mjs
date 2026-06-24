import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const here = dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
await page.goto('file://' + join(here, 'screenshot.html'));
await page.screenshot({ path: join(here, 'screenshot-1280x800.png') });
await browser.close();
console.log('wrote screenshot-1280x800.png');
