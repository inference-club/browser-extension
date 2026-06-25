# Chrome Web Store listing — copy/paste fields

Upload `.output/inference-club-extension-0.0.6-chrome.zip` at
https://chrome.google.com/webstore/devconsole → **New item**, then fill the
fields below. Assets to upload are in this `store/` folder.

---

## Store listing tab

**Item title** (≤ 75 chars)
```
inference.club — Read with your own AI
```

**Summary** (short description, ≤ 132 chars)
```
Summarize, ask about, and speed-read any web page using your own inference.club cluster. Your AI, your data.
```

**Detailed description**
```
inference.club is a reading copilot that connects your browser to your own
inference.club cluster — so you can understand what you read without copy-pasting
into another tab.

Open the side panel on any article and:

• Summarize — TL;DR, bullet points, key takeaways, or a plain-language explainer.
• Ask — chat with the page in a real back-and-forth; answers render as formatted
  markdown.
• Speed-read — an immersive one-word-at-a-time (RSVP) reader for the article or any
  AI answer, with adjustable speed, size, font, color, and context.
• Remember — conversations are saved per page and browsable in a History view,
  grouped by site, with links back to the source.
• Personalize — pick from a set of light and dark color themes that are easy on the
  eyes, and turn on Advanced mode to see timings, token usage, and page metadata.

The panel follows you as you browse: switch tabs and it re-reads the page in front
of you. Pages are read locally in your browser (using the same article-extraction
engine as Reader Mode), including pages behind a login. Nothing leaves your browser
until you click an action, and then it goes only to your own inference.club account
over HTTPS, authenticated with your API token.

This is a thin, open client for the inference.club API. You bring your own account
and token; the extension adds no servers of its own and includes no analytics or
trackers.

Coming soon: research (web-search + synthesize via the agent), narration (listen to
an article or a summary), and illustrations.

Requires an inference.club account and API token.
```

**Category:** Productivity

**Language:** English

**Screenshots:** upload `store/screenshot-1280x800.png` (1280×800). Add more later.

**Store icon:** `store/store-icon-128.png` (128×128). (The extension icons ship in
the zip.)

**Small promo tile (440×280):** optional — skip for now, or generate later.

---

## Privacy tab

**Single purpose** (required)
```
This extension lets the user understand the web page they are currently viewing by
summarizing it and answering questions about it, using the user's own inference.club
account.
```

**Permission justifications**

- **scripting**
```
Used to inject a small, read-only extraction script into the page the user is viewing
that pulls out the readable article text to summarize or answer questions about.
```

- **activeTab**
```
Grants access to the current tab when the user invokes the extension, so it can read
the page they are viewing.
```

- **storage**
```
Stores the user's inference.club base URL, API token, UI preferences (theme, model,
speed-reader settings), and their chat history locally on the device. Nothing is
synced off the device.
```

- **sidePanel**
```
The extension's main interface is a Chrome side panel docked next to the page, where
the summary, answers, speed reader, history, and controls are shown.
```

- **Host permissions: https://*/* and http://*/***
```
The side panel reads the readable article text of the tab the user is viewing and
follows them as they switch tabs, so access to the pages they browse (all sites) is
required to extract that text locally. The extracted text is only used to populate the
panel; it is transmitted only to the user's own configured inference.club API origin,
and only when the user clicks an action (Summarize/Ask). That inference.club origin is
the only remote server the extension contacts.
```

- **Remote code:** No — the extension executes no remotely-hosted code. All logic
  ships in the package.

**Data usage — declare in the form:**

- **Personally identifiable information:** No.
- **Authentication information:** YES — the user's inference.club API token, stored
  locally on the device and sent only to the user's configured inference.club origin.
- **Website content:** YES — the text of the page the user chooses to act on is sent
  to the user's inference.club account to produce the summary/answer.
- **We do NOT:** sell or transfer data to third parties; use data for purposes
  unrelated to the single purpose; use data for creditworthiness/lending.

Check all three certification boxes (single-purpose use; no unauthorized transfer;
no creditworthiness use).

**Privacy policy URL:**
```
https://github.com/inference-club/browser-extension/blob/main/store/PRIVACY.md
```

---

## Distribution tab

**Visibility:** Unlisted (recommended for the initial trial — installs from a direct
link, faster review, not shown in search). Switch to Public later.

**Regions:** All.

**Pricing:** Free.
