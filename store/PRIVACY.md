# Privacy Policy — inference.club browser extension

_Last updated: 2026-06-24_

The inference.club browser extension ("the extension") is a client for your own
inference.club account. This policy explains what it does with your data. In short:
**the extension has no servers of its own, collects no analytics, and sends your data
only to the inference.club account you configure.**

## What the extension stores

Locally on your device, via the browser's extension storage:

- Your inference.club **API token**.
- Your inference.club **base URL** (default `https://inference.club`).
- UI **preferences** (e.g. selected model, summary style).

This information stays on your device. It is not synced to any account and is not
transmitted anywhere except as described below. You can clear it at any time with the
"Disconnect" button in the extension, or by removing the extension.

## What the extension sends, and where

When — and only when — you click an action (e.g. "Summarize" or "Ask"), the extension:

1. Reads the readable text of the page you are currently viewing (extracted locally in
   your browser).
2. Sends that text, along with your prompt, to the inference.club server at the base
   URL you configured, authenticated with your API token, over HTTPS.

That inference.club server is the only network destination the extension contacts. The
extension does not send your data to the extension's authors, to analytics services,
to advertisers, or to any other third party.

Your use of the inference.club service itself (how it processes and stores requests) is
governed by inference.club's own terms and privacy practices.

## What the extension does not do

- It does not run in the background or read pages you have not asked it to act on.
- It does not modify the pages you visit.
- It contains no analytics, telemetry, advertising, or third-party trackers.
- It does not sell or share your data with anyone.

## Permissions

- **activeTab** — read the page you are actively viewing, only after you click an action.
- **storage** — save your token, base URL, and preferences locally.
- **sidePanel** — show the extension's interface beside the page.
- **Host access** — read article text from pages you choose to act on, and send requests
  to your configured inference.club origin.

## Contact

Questions: open an issue at the extension's repository, or contact the maintainer of
your inference.club instance.
