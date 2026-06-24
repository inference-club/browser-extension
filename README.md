# inference.club browser extension ("Clip")

A reading copilot for your browser. Open the side panel on any article and
**summarize, ask, research, narrate, and illustrate** it using your own
[inference.club](https://inference.club) cluster — no copy-pasting.

It's a thin client of the inference.club OpenAI-compatible API. Page content is
extracted locally (Mozilla Readability, the Reader Mode engine) and only leaves
your browser when you click an action, going only to your configured base URL,
authenticated with your API token.

> Design plan & roadmap: `docs/prd/16-browser-extension.md` in the
> [inference.club](https://github.com/inference-club/inference.club) repo.

## Stack

- [WXT](https://wxt.dev) (Manifest V3, Vite) + Vue 3 + TypeScript + Tailwind v4
- `@mozilla/readability` for article extraction
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
3. The base URL defaults to `https://inference.club` — change it to
   `http://localhost:8000` for local dev, or your own self-host.

## Status

V0: capture + **Summarize** + single-shot **Ask** (streamed). See the PRD for the
V1–V3 roadmap (research via the Agent, narration, illustrate, Firefox + store).

## Commands

| Command | Does |
|---|---|
| `npm run dev` | Chrome dev with HMR |
| `npm run dev:firefox` | Firefox dev |
| `npm run build` | Production build (`.output/chrome-mv3`) |
| `npm run zip` | Zip for store submission |
| `npm run compile` | Type-check with `vue-tsc` |
