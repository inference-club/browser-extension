# Privacy Policy — inference.club browser extension

_Last updated: 2026-06-25_

The inference.club browser extension ("the extension") is a client for your own
inference.club account. This policy explains what it does with your data. In short:
**the extension has no servers of its own, collects no analytics, and sends your data
only to the inference.club account you configure.**

## What the extension stores

Locally on your device, via the browser's extension storage:

- Your inference.club **API token**.
- Your inference.club **base URL** (default `https://api.inference.club`).
- UI **preferences** — selected model, summary style, color palette/theme,
  advanced-mode toggle, and speed-reader settings.
- **Chat history** — the conversations you have (summaries and questions/answers),
  saved per page URL so you can resume and browse them later.

This information stays on your device. It is not synced to any account and is not
transmitted anywhere except as described below. You can delete your chat history from
the extension's History view (per-thread or "Clear all"), clear your credentials with
the "Disconnect" button, or remove everything by uninstalling the extension.

## What the extension reads, sends, and where

While the side panel is open, the extension reads the **readable text of the tab you
are currently viewing** (extracted locally in your browser using Mozilla Readability),
and re-reads it automatically when you switch tabs or navigate — so the panel reflects
the page in front of you. This reading and extraction happens entirely on your device.

Your page text and prompts are **sent over the network only when you take an action**
(e.g. "Summarize" or "Ask"). At that point the extension sends the extracted text and
your prompt to the inference.club server at the base URL you configured, authenticated
with your API token, over HTTPS.

That inference.club server is the only network destination the extension contacts. The
extension does not send your data to the extension's authors, to analytics services,
to advertisers, or to any other third party.

Your use of the inference.club service itself (how it processes and stores requests) is
governed by inference.club's own terms and privacy practices.

## What the extension does not do

- It does nothing when the side panel is closed; it does not run in the background
  reading your browsing.
- It does not modify the pages you visit (extraction is read-only).
- It does not transmit any page content until you click an action.
- It contains no analytics, telemetry, advertising, or third-party trackers.
- It does not sell or share your data with anyone.

## Permissions

- **Host access (all sites)** — so the side panel can read the article text of whatever
  tab you are viewing and follow you as you switch tabs, the extension requests access
  to all websites. Page text is only used to populate the panel and is only sent to your
  configured inference.club origin when you act on it.
- **scripting** — used to inject a small, read-only extraction script into the page you
  are viewing to pull out its readable article text.
- **activeTab** — access to the current tab on invocation.
- **storage** — save your token, base URL, preferences, and chat history locally.
- **sidePanel** — show the extension's interface beside the page.

## Contact

Questions: open an issue at the extension's repository, or contact the maintainer of
your inference.club instance.
