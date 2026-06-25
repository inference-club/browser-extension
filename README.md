# inference.club browser extension ("Clip")

A reading copilot for your browser. Open the side panel on any article and
**summarize, ask, research, narrate, and illustrate** it using your own
[inference.club](https://inference.club) cluster — no copy-pasting.

It's a thin client of the inference.club OpenAI-compatible API. Page content is
extracted locally (Mozilla Readability, the Reader Mode engine) and only leaves
your browser when you click an action, going only to your configured base URL,
authenticated with your API token.

The panel auto-follows the active tab (re-reads the page when you switch tabs or
navigate), so it always reflects what you're looking at.

> Design plan & roadmap: `docs/prd/16-browser-extension.md` in the
> [inference.club](https://github.com/inference-club/inference.club) repo.

## Stack

- [WXT](https://wxt.dev) (Manifest V3, Vite) + Vue 3 + TypeScript + Tailwind v4
- `@mozilla/readability` for article extraction
- `marked` + `dompurify` for rendering AI responses as sanitized markdown
- Surfaces: a **side panel** (primary) and a toolbar **popup** (quick actions)

## Develop

```bash
npm install
npm run dev          # launches Chrome with the extension loaded + HMR
```

Or load it manually:

```bash
npm run build        # outputs to .output/chrome-mv3
```

Then in Chrome: `chrome://extensions` → enable **Developer mode** → **Load
unpacked** → select `.output/chrome-mv3`.

## Connect

1. Click the toolbar icon → **Connect account** (opens the side panel).
2. Paste your API token from your inference.club account settings.
3. The base URL defaults to `https://api.inference.club` — change it to
   `http://localhost:8000` for local dev, or your own self-host.

## Features

- **Summarize** the page (TL;DR / bullets / takeaways / ELI5) and **Ask** follow-up
  questions in a persistent, multi-turn thread. Answers render as markdown.
- **Speed reader** — immersive one-word-at-a-time (RSVP) reading of the article or any
  AI answer, with adjustable speed, font, size, color, and context words.
- **History** — conversations are saved per page URL, grouped by site, filterable, with
  links back to the source page.
- **Themes** — light/dark color palettes (Daylight, Paper, Mist, Midnight, Nord,
  Dracula, Solarized, Gruvbox, Forest, Rosé) with live previews, or match system.
- **Advanced mode** — per-response timings, token usage, finish reason, and page
  metadata.
- **Auto-follow** the active tab as you browse.

## Status

See the PRD for the V1–V3 roadmap (research via the Agent, narration, illustrate,
Firefox + store).

## Commands

| Command | Does |
|---|---|
| `npm run dev` | Chrome dev with HMR |
| `npm run dev:firefox` | Firefox dev |
| `npm run build` | Production build (`.output/chrome-mv3`) |
| `npm run zip` | Zip for store submission |
| `npm run compile` | Type-check with `vue-tsc` |
