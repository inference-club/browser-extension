# Chrome Web Store listing — copy/paste fields

Upload `.output/inference-club-extension-0.0.1-chrome.zip` at
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
Summarize, ask about, and (soon) narrate any web page using your own inference.club cluster. Your AI, your data.
```

**Detailed description**
```
inference.club is a reading copilot that connects your browser to your own
inference.club cluster — so you can understand what you read without copy-pasting
into another tab.

Open the side panel on any article and:

• Summarize — TL;DR, bullet points, key takeaways, or a plain-language explainer.
• Ask — chat with the page: "what does this say about X?", "is this claim supported?"

The page is read locally in your browser (using the same article-extraction engine
as Reader Mode), so it works on the articles you actually read — including pages
behind a login. Nothing leaves your browser until you click an action, and then it
goes only to your own inference.club account over HTTPS, authenticated with your
API token.

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

- **activeTab**
```
Used to access the page the user is actively viewing — only after they click an
action in the extension — so we can read its article text to summarize or answer
questions about it.
```

- **storage**
```
Stores the user's inference.club base URL, API token, and UI preferences locally so
they don't have to re-enter them. Nothing is synced off the device.
```

- **sidePanel**
```
The extension's main interface is a Chrome side panel docked next to the page, where
the summary, answers, and controls are shown.
```

- **Host permission: https://inference.club/***
```
The extension sends the page text and the user's prompts to the user's own
inference.club account at this origin to generate summaries and answers. This is the
only server the extension talks to.
```

- **Host permission: http://localhost:8000/***
```
Optional. Lets advanced users point the extension at a locally-running or self-hosted
inference.club backend during development. Editable in the extension's settings.
```

- **Content script on all sites (host access)**
```
The extension injects a small, read-only content script that extracts the readable
article text from the page the user chooses to summarize. It only reads text and
the current selection; it never modifies pages, and it runs only to fulfill a user
action.
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
