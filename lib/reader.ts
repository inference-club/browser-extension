// RSVP (Rapid Serial Visual Presentation) helpers for the speed reader.
// Pure functions: tokenization, the Optimal Recognition Point (ORP) pivot, and
// per-word dwell timing. The component (SpeedReader.vue) owns the playback loop.

export interface Token {
  text: string;
  pivot: number; // index of the ORP character within `text`
}

/**
 * Split text into display tokens. Whitespace-delimited; very long words are
 * chunked so they don't blow past the display width, and we keep trailing
 * punctuation attached for natural dwell timing.
 */
export function tokenize(text: string, maxLen = 13): Token[] {
  const words = (text ?? '').trim().split(/\s+/).filter(Boolean);
  const tokens: Token[] = [];
  for (const w of words) {
    if (w.length <= maxLen) {
      tokens.push({ text: w, pivot: orpIndex(w) });
    } else {
      // Hyphenate-chunk overly long words across multiple frames.
      for (let i = 0; i < w.length; i += maxLen) {
        const part = w.slice(i, i + maxLen);
        const chunk = i + maxLen < w.length ? part + '-' : part;
        tokens.push({ text: chunk, pivot: orpIndex(chunk) });
      }
    }
  }
  return tokens;
}

/**
 * Optimal Recognition Point: the character the eye should fixate on. Roughly
 * the 35% mark, which keeps the pivot stable as word length grows.
 */
export function orpIndex(word: string): number {
  const n = word.length;
  if (n <= 1) return 0;
  if (n <= 5) return 1;
  if (n <= 9) return 2;
  if (n <= 13) return 3;
  return 4;
}

/**
 * Dwell time (ms) for one token at the given WPM. Longer words and tokens
 * ending in sentence/clause punctuation get extra time so reading feels natural.
 */
export function dwellMs(token: Token, wpm: number): number {
  const base = 60000 / Math.max(60, wpm);
  let factor = 1;
  if (token.text.length > 8) factor += 0.4;
  if (/[.!?]["')\]]?$/.test(token.text)) factor += 1.2;
  else if (/[,;:—]["')\]]?$/.test(token.text)) factor += 0.6;
  return Math.round(base * factor);
}
